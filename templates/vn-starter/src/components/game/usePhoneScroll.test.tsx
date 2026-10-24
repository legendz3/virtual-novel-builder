import { StrictMode, useRef } from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { PhoneScrollCue } from "@game/story/phone.types";
import { phoneScrollTarget, usePhoneScroll } from "./usePhoneScroll";

let height = 200;
let total = 600;
let reduced = false;
let preferenceChange: (() => void) | undefined;
const cue: PhoneScrollCue = { kind: "outgoing-message", messageId: "reply" };
function Harness({
  paused = false,
  scrollCue = cue,
}: {
  paused?: boolean;
  scrollCue?: PhoneScrollCue | null;
}) {
  const phoneRef = useRef<HTMLElement>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const scroll = usePhoneScroll({
    phoneRef,
    transcriptRef,
    contentRef,
    cue: scrollCue ?? undefined,
    paused,
    detailOpen: false,
  });
  return (
    <section ref={phoneRef} hidden={paused}>
      <div data-testid="transcript" ref={transcriptRef}>
        <div ref={contentRef}>
          <div data-phone-message="reply" data-phone-attachment="map">
            Target
          </div>
        </div>
      </div>
      {scroll.overflow && (
        <button onClick={scroll.scrollPhone}>{scroll.moreBelow ? "More" : "Top"}</button>
      )}
    </section>
  );
}
const advance = (milliseconds: number) => act(() => vi.advanceTimersByTime(milliseconds));
const offset = () => screen.getByTestId("transcript").scrollTop;
beforeEach(() => {
  vi.useFakeTimers();
  height = 200;
  total = 600;
  reduced = false;
  vi.spyOn(HTMLElement.prototype, "clientHeight", "get").mockImplementation(() => height);
  vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(200);
  vi.spyOn(HTMLElement.prototype, "scrollHeight", "get").mockImplementation(() => total);
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (
    this: HTMLElement,
  ) {
    const top = this.hasAttribute("data-phone-message")
      ? 450 - (this.closest("[data-testid]")?.scrollTop ?? 0)
      : 0;
    return {
      top,
      height: 100,
      bottom: top + 100,
      left: 0,
      right: 200,
      width: 200,
      x: 0,
      y: top,
      toJSON() {},
    };
  });
  vi.stubGlobal("matchMedia", () => ({
    get matches() {
      return reduced;
    },
    addEventListener: (_: string, fn: () => void) => {
      preferenceChange = fn;
    },
    removeEventListener() {},
  }));
});
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("phoneScrollTarget", () => {
  const geometry = {
    scrollTop: 0,
    scrollHeight: 600,
    clientHeight: 200,
    targetTop: 450,
    targetHeight: 100,
  };
  it("fits whole targets, preserves visible targets and clamps oversized beginnings", () => {
    expect(phoneScrollTarget(geometry)).toBe(358);
    expect(phoneScrollTarget({ ...geometry, scrollTop: 358 })).toBe(358);
    expect(phoneScrollTarget({ ...geometry, targetHeight: 250 })).toBe(400);
    expect(phoneScrollTarget({ ...geometry, targetTop: 100, targetHeight: 250 })).toBe(92);
    expect(phoneScrollTarget({ ...geometry, scrollHeight: 202 })).toBe(0);
  });
});
describe("usePhoneScroll", () => {
  it.each([false, true])(
    "incoming messages use the same cue lifecycle, reduced motion=%s",
    (reduce) => {
      reduced = reduce;
      const incoming: PhoneScrollCue = { kind: "incoming-message", messageId: "reply" };
      const view = render(<Harness scrollCue={incoming} />);
      advance(140);
      expect(offset()).toBe(0);
      advance(700);
      expect(offset()).toBe(358);
      screen.getByTestId("transcript").scrollTop = 10;
      fireEvent.scroll(screen.getByTestId("transcript"));
      view.rerender(<Harness scrollCue={incoming} paused />);
      advance(1000);
      view.rerender(<Harness scrollCue={incoming} />);
      advance(1000);
      expect(offset()).toBe(10);
    },
  );
  it("incoming message cue yields permanently to manual interaction", () => {
    render(<Harness scrollCue={{ kind: "incoming-message", messageId: "reply" }} />);
    advance(40);
    fireEvent.touchStart(screen.getByTestId("transcript"));
    advance(1000);
    expect(offset()).toBe(0);
  });
  it("retains a cue through StrictMode setup cleanup and leaves omitted cues manual-only", () => {
    const view = render(
      <StrictMode>
        <Harness />
      </StrictMode>,
    );
    advance(1000);
    expect(offset()).toBe(358);
    view.unmount();
    reduced = true;
    render(<Harness scrollCue={null} />);
    advance(8000);
    expect(offset()).toBe(0);
    fireEvent.click(screen.getByRole("button"));
    expect(offset()).toBe(168);
  });

  it("waits for layout and cue delay, eases toward the full reply, and does not repeat", () => {
    const view = render(<Harness />);
    advance(140);
    expect(offset()).toBe(0);
    advance(250);
    expect(offset()).toBeGreaterThan(0);
    expect(offset()).toBeLessThan(358);
    advance(400);
    expect(offset()).toBe(358);
    view.rerender(<Harness />);
    advance(1000);
    expect(offset()).toBe(358);
  });
  it("leaves a document stationary for six seconds and honors reduced motion", () => {
    reduced = true;
    render(<Harness scrollCue={{ kind: "document-attachment", attachmentId: "map" }} />);
    advance(6000);
    expect(offset()).toBe(0);
    advance(50);
    expect(offset()).toBe(358);
  });
  it.each(["wheel", "touchStart", "pointerDown", "focusIn", "click", "keyDown"])(
    "cancels delayed motion on %s without rearming",
    (event) => {
      render(<Harness />);
      advance(40);
      const transcript = screen.getByTestId("transcript");
      if (event === "keyDown") fireEvent.keyDown(transcript, { key: "PageDown" });
      else fireEvent[event as "wheel"](transcript);
      advance(2000);
      expect(offset()).toBe(0);
    },
  );
  it("manual controls retain focus, cancel a cue, page after the first target and return to top", () => {
    reduced = true;
    render(<Harness />);
    advance(40);
    const button = screen.getByRole("button");
    button.focus();
    fireEvent.click(button);
    expect(offset()).toBe(358);
    expect(button).toHaveFocus();
    fireEvent.click(button);
    expect(offset()).toBe(400);
    fireEvent.click(button);
    expect(offset()).toBe(0);
    advance(1000);
    expect(offset()).toBe(0);
  });
  it("preserves interrupted travel across pause and stops on unmount", () => {
    const view = render(<Harness />);
    advance(300);
    const current = offset();
    expect(current).toBeGreaterThan(0);
    view.rerender(<Harness paused />);
    advance(1000);
    expect(offset()).toBe(current);
    view.rerender(<Harness />);
    advance(1000);
    expect(offset()).toBe(current);
    view.unmount();
    advance(1000);
    expect(vi.getTimerCount()).toBe(0);
  });
  it("consumes no-overflow activation and permits later manual reading", () => {
    total = 200;
    render(<Harness />);
    advance(40);
    expect(screen.queryByRole("button")).toBeNull();
    total = 600;
    fireEvent(window, new Event("resize"));
    advance(1000);
    expect(offset()).toBe(0);
    expect(screen.getByRole("button")).toBeVisible();
  });
  it("stops travel on resize and visibility loss, while a reduced-motion change finishes its valid target", () => {
    const view = render(<Harness />);
    advance(300);
    act(() => {
      reduced = true;
      preferenceChange?.();
    });
    expect(offset()).toBe(358);
    view.unmount();
    reduced = false;
    const next = render(<Harness />);
    advance(300);
    const current = offset();
    height = 220;
    fireEvent(window, new Event("resize"));
    advance(1000);
    expect(offset()).toBe(current);
    next.unmount();
    height = 200;
    render(<Harness />);
    advance(40);
    vi.spyOn(document, "hidden", "get").mockReturnValue(true);
    fireEvent(document, new Event("visibilitychange"));
    advance(1000);
    expect(offset()).toBe(0);
  });
});
