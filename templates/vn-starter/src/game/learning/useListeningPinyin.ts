import { useLayoutEffect, useRef, useState } from "react";

export interface ListeningPinyinControl {
  shown: boolean;
  ready: boolean;
  saveFailed: boolean;
  setShown: (shown: boolean) => void;
}

// Only failed writes need a visit-local fallback; never borrow another save owner's setting.
const unsavedPreferences = new Map<string, boolean>();
const preferenceKey = (ownerId: string) =>
  `beijing-heartbeat:preferences:listening-pinyin:${encodeURIComponent(ownerId)}`;
function readPreference(ownerId: string | undefined) {
  if (ownerId === undefined) return { ownerId, shown: false, saveFailed: false };
  const fallback = unsavedPreferences.get(ownerId);
  if (fallback !== undefined) return { ownerId, shown: fallback, saveFailed: true };
  try {
    return {
      ownerId,
      shown: localStorage.getItem(preferenceKey(ownerId)) === "true",
      saveFailed: false,
    };
  } catch {
    return { ownerId, shown: false, saveFailed: false };
  }
}

// Auth loading passes undefined. Hydration never writes defaults; only an active owner's gesture writes.
export function useListeningPinyin(ownerId: string | undefined): ListeningPinyinControl {
  const [state, setState] = useState(() => readPreference(ownerId));
  const activeOwner = useRef<string | undefined>(undefined);
  useLayoutEffect(() => {
    activeOwner.current = ownerId;
    return () => {
      activeOwner.current = undefined;
    };
  }, [ownerId]);
  if (state.ownerId !== ownerId) setState(readPreference(ownerId));
  return {
    shown: state.ownerId === ownerId && state.shown,
    ready: ownerId !== undefined,
    saveFailed: state.ownerId === ownerId && state.saveFailed,
    setShown: (shown) => {
      if (ownerId === undefined || activeOwner.current !== ownerId) return;
      let saveFailed = false;
      try {
        localStorage.setItem(preferenceKey(ownerId), String(shown));
        unsavedPreferences.delete(ownerId);
      } catch {
        unsavedPreferences.set(ownerId, shown);
        saveFailed = true;
      }
      setState({ ownerId, shown, saveFailed });
    },
  };
}
