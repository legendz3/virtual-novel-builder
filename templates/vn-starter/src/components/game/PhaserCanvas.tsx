import { useEffect, useRef, useState } from "react";
import { phaserBridge, type SceneArtwork } from "@phaser/PhaserBridge";

export function PhaserCanvas({
  onReady,
  artwork,
}: {
  onReady: () => void;
  artwork: readonly SceneArtwork[];
}) {
  const parent = useRef<HTMLDivElement>(null);
  const [failure, setFailure] = useState<Error | null>(null);
  useEffect(() => {
    let cancelled = false;
    let destroy: (() => void) | undefined;
    void import("@phaser/PhaserGame")
      .then(({ mountPhaserGame }) => {
        if (cancelled || !parent.current) return;
        destroy = mountPhaserGame(
          parent.current,
          phaserBridge,
          () => {
            if (!cancelled) onReady();
          },
          (command) => {
            if (!parent.current) return;
            if (command.type === "background") parent.current.dataset.background = command.assetId;
            if (command.type === "show_character")
              parent.current.dataset.character = command.assetId;
            if (command.type === "hide_character") delete parent.current.dataset.character;
            if (command.type === "clear") {
              parent.current.dataset.background = "dark";
              delete parent.current.dataset.character;
            }
          },
          (error) => {
            if (!cancelled) setFailure(error);
          },
          artwork,
        );
      })
      .catch((error: unknown) => {
        if (!cancelled) setFailure(error instanceof Error ? error : new Error(String(error)));
      });
    return () => {
      cancelled = true;
      destroy?.();
    };
  }, [onReady, artwork]);
  if (failure) throw failure;
  return <div ref={parent} className="phaser-host" aria-hidden="true" />;
}
