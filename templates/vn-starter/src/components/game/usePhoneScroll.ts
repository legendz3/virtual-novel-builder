import { useLayoutEffect, useRef, useState, type RefObject } from "react";
import type { PhoneScrollCue } from "@game/story/phone.types";

export interface PhoneScrollGeometry {
  scrollTop: number;
  scrollHeight: number;
  clientHeight: number;
  targetTop: number;
  targetHeight: number;
}

/** Fit the whole target with trailing room; oversized content keeps its beginning reachable. */
export function phoneScrollTarget(geometry: PhoneScrollGeometry): number {
  const { scrollTop, scrollHeight, clientHeight, targetTop, targetHeight } = geometry;
  const maximum = Math.max(0, scrollHeight - clientHeight);
  if (maximum <= 2) return scrollTop;
  const bottom = targetTop + targetHeight;
  if (
    targetHeight <= clientHeight - 16 &&
    targetTop >= scrollTop &&
    bottom + 8 <= scrollTop + clientHeight
  )
    return scrollTop;
  const destination = targetHeight > clientHeight - 16 ? targetTop - 8 : bottom + 8 - clientHeight;
  return Math.max(0, Math.min(maximum, destination));
}

interface PhoneScrollOptions {
  phoneRef: RefObject<HTMLElement | null>;
  transcriptRef: RefObject<HTMLDivElement | null>;
  contentRef: RefObject<HTMLDivElement | null>;
  cue?: PhoneScrollCue;
  paused: boolean;
  detailOpen: boolean;
}

interface PhoneScrollState {
  overflow: boolean;
  moreBelow: boolean;
}

const navigationKeys = new Set([
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "PageUp",
  "PageDown",
  "Home",
  "End",
  " ",
  "Spacebar",
]);

/** One snapshot-local orientation cue; native reading intent always wins over scheduled motion. */
export function usePhoneScroll({
  phoneRef,
  transcriptRef,
  contentRef,
  cue,
  paused,
  detailOpen,
}: PhoneScrollOptions) {
  const [position, setPosition] = useState<PhoneScrollState>({ overflow: false, moreBelow: false });
  const consumed = useRef(false);
  const manualUsed = useRef(false);
  const lastOffset = useRef(0);
  const wasPaused = useRef(false);
  const actions = useRef<{ cancel: () => void; scroll: () => void } | null>(null);
  const kind = cue?.kind;
  const targetId = cue?.kind === "document-attachment" ? cue.attachmentId : cue?.messageId;

  useLayoutEffect(() => {
    if (paused) {
      consumed.current = true;
      wasPaused.current = true;
      return;
    }
    const phone = phoneRef.current;
    const transcript = transcriptRef.current;
    const content = contentRef.current;
    if (!phone || !transcript || !content) return;
    if (wasPaused.current) {
      transcript.scrollTop = lastOffset.current;
      wasPaused.current = false;
    }
    let frame = 0;
    let timer = 0;
    let disposed = false;
    let motion: { target: () => number; destination: number } | null = null;
    let previousSize = "";
    const preference = window.matchMedia?.("(prefers-reduced-motion: reduce)");

    const measure = () => {
      if (disposed || document.hidden || transcript.clientHeight <= 0) return;
      const maximum = Math.max(0, transcript.scrollHeight - transcript.clientHeight);
      transcript.scrollTop = Math.max(0, Math.min(maximum, transcript.scrollTop));
      lastOffset.current = transcript.scrollTop;
      const next = { overflow: maximum > 2, moreBelow: maximum - transcript.scrollTop > 2 };
      setPosition((old) =>
        old.overflow === next.overflow && old.moreBelow === next.moreBelow ? old : next,
      );
    };
    const stop = () => {
      window.clearTimeout(timer);
      window.cancelAnimationFrame(frame);
      timer = frame = 0;
      motion = null;
    };
    const cancel = () => {
      consumed.current = true;
      stop();
    };
    const writeOffset = (value: number) => {
      transcript.scrollTop = value;
      lastOffset.current = transcript.scrollTop;
      measure();
    };
    const cueTarget = (): number => {
      if (!kind || !targetId || detailOpen) return transcript.scrollTop;
      const attribute =
        kind === "document-attachment" ? "data-phone-attachment" : "data-phone-message";
      const target = [...content.querySelectorAll<HTMLElement>(`[${attribute}]`)].find(
        (element) => element.getAttribute(attribute) === targetId,
      );
      if (!target) return transcript.scrollTop;
      const targetBox = target.getBoundingClientRect();
      return phoneScrollTarget({
        scrollTop: transcript.scrollTop,
        scrollHeight: transcript.scrollHeight,
        clientHeight: transcript.clientHeight,
        targetTop: targetBox.top - transcript.getBoundingClientRect().top + transcript.scrollTop,
        targetHeight: targetBox.height,
      });
    };
    const animate = (target: () => number, duration: number) => {
      stop();
      if (disposed || document.hidden) return;
      const destination = target();
      const start = transcript.scrollTop;
      if (preference?.matches || Math.abs(destination - start) <= 1) {
        writeOffset(destination);
        return;
      }
      const startedAt = performance.now();
      motion = { target, destination };
      const tick = (now: number) => {
        if (disposed || !motion) return;
        const progress = Math.min(1, Math.max(0, (now - startedAt) / duration));
        writeOffset(start + (destination - start) * (1 - (1 - progress) ** 3));
        if (progress < 1) frame = window.requestAnimationFrame(tick);
        else {
          frame = 0;
          motion = null;
        }
      };
      frame = window.requestAnimationFrame(tick);
    };
    const scroll = () => {
      cancel();
      const maximum = Math.max(0, transcript.scrollHeight - transcript.clientHeight);
      const below = maximum - transcript.scrollTop > 2;
      const target = !manualUsed.current && below ? cueTarget() : transcript.scrollTop;
      manualUsed.current = true;
      const destination = !below
        ? 0
        : Math.abs(target - transcript.scrollTop) > 1
          ? target
          : Math.min(maximum, transcript.scrollTop + Math.max(1, transcript.clientHeight - 32));
      animate(() => destination, 350);
    };
    actions.current = { cancel, scroll };
    const keydown = (event: KeyboardEvent) => {
      if (navigationKeys.has(event.key)) cancel();
    };
    const visibility = () => {
      if (document.hidden) cancel();
      else measure();
    };
    const changedMotion = () => {
      if (!motion) return;
      const target = motion.target;
      stop();
      writeOffset(target());
    };
    const resize = () => {
      if (document.hidden || transcript.clientHeight <= 0) return;
      const size = `${transcript.clientWidth}:${transcript.clientHeight}:${transcript.scrollHeight}`;
      if (previousSize && previousSize !== size && motion) cancel();
      previousSize = size;
      measure();
    };
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(resize);
    observer?.observe(transcript);
    observer?.observe(content);
    window.addEventListener("resize", resize);
    transcript.addEventListener("scroll", measure, { passive: true });
    for (const event of ["wheel", "touchstart", "pointerdown", "focusin", "click"])
      phone.addEventListener(event, cancel, { capture: true, passive: true });
    phone.addEventListener("keydown", keydown, true);
    document.addEventListener("visibilitychange", visibility);
    preference?.addEventListener("change", changedMotion);
    let validFrames = 0;
    const ready = () => {
      if (disposed || document.hidden) {
        cancel();
        return;
      }
      if (transcript.clientWidth > 0 && transcript.clientHeight > 0) validFrames += 1;
      else validFrames = 0;
      if (validFrames < 2) {
        frame = window.requestAnimationFrame(ready);
        return;
      }
      frame = 0;
      resize();
      if (consumed.current || !kind || detailOpen) return;
      consumed.current = true;
      if (transcript.scrollHeight - transcript.clientHeight <= 2) return;
      timer = window.setTimeout(
        () => animate(cueTarget, kind === "document-attachment" ? 650 : 500),
        kind === "document-attachment" ? 6000 : 120,
      );
    };
    frame = window.requestAnimationFrame(ready);
    return () => {
      disposed = true;
      stop();
      actions.current = null;
      observer?.disconnect();
      window.removeEventListener("resize", resize);
      transcript.removeEventListener("scroll", measure);
      for (const event of ["wheel", "touchstart", "pointerdown", "focusin", "click"])
        phone.removeEventListener(event, cancel, true);
      phone.removeEventListener("keydown", keydown, true);
      document.removeEventListener("visibilitychange", visibility);
      preference?.removeEventListener("change", changedMotion);
    };
  }, [phoneRef, transcriptRef, contentRef, kind, targetId, paused, detailOpen]);

  return {
    ...position,
    cancelScroll: () => actions.current?.cancel(),
    scrollPhone: () => actions.current?.scroll(),
  };
}
