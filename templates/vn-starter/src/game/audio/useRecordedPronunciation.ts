import { useCallback, useEffect, useRef, useState } from "react";
import { getSpeechRecording } from "@content/speechRegistry";

export interface RecordedPronunciation {
  activeId: string | null;
  failed: boolean;
  play: (itemId: string, audioId: string) => void;
  stop: () => void;
}
/** One lazy recording belongs to the mounted panel; playback never touches learning or story state. */
export function useRecordedPronunciation(muted: boolean): RecordedPronunciation {
  const current = useRef<{ id: string; audio: HTMLAudioElement } | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const stop = useCallback(() => {
    const previous = current.current;
    current.current = null;
    if (previous) {
      previous.audio.onended = null;
      previous.audio.onerror = null;
      previous.audio.pause();
      previous.audio.removeAttribute("src");
      previous.audio.load();
    }
    setActiveId(null);
  }, []);
  useEffect(() => {
    const hidden = () => {
      if (document.hidden) stop();
    };
    document.addEventListener("visibilitychange", hidden);
    return () => {
      document.removeEventListener("visibilitychange", hidden);
      stop();
    };
  }, [muted, stop]);
  const play = (id: string, audioId: string): void => {
    if (muted) return;
    const same = current.current?.id === id;
    stop();
    setFailed(false);
    if (same) return;
    try {
      const audio = new Audio(getSpeechRecording(audioId).path);
      current.current = { id, audio };
      setActiveId(id);
      const fail = () => {
        if (current.current?.audio === audio) {
          stop();
          setFailed(true);
        }
      };
      audio.onended = () => {
        if (current.current?.audio === audio) stop();
      };
      audio.onerror = fail;
      void audio.play().catch(fail);
    } catch {
      stop();
      setFailed(true);
    }
  };
  return { activeId, failed, play, stop };
}
