import { useCallback, useEffect, useMemo, useState } from "react";
import { chapterArtwork } from "@content/chapterArtwork";
import { loadChapter } from "@content/chapterLoader";
import { assets } from "@content/assetManifest";
import { StoryPhone } from "@components/game/StoryPhone";
import { StoryDialogue } from "@components/game/StoryDialogue";
import { PhaserCanvas } from "@components/game/PhaserCanvas";
import { phaserBridge } from "@phaser/PhaserBridge";
import type { StoryEvent } from "@game/story/story.types";
import "@/styles/arrivalScene.css";
import "@/styles/phoneScene.css";
import "./phonePreview.css";
const scenes = { reply: "ch6-emma-received-message", campus: "ch6-campus-result-card" } as const;
type PreviewScene = keyof typeof scenes;

/** Local review surface deliberately bypasses auth, game state, saves and story audio. */
export function PhoneScenePreview() {
  const [selection, setSelection] = useState<PreviewScene>(
    new URLSearchParams(location.search).get("scene") === "campus" ? "campus" : "reply",
  );
  const [events, setEvents] = useState<readonly StoryEvent[]>([]);
  const [ready, setReady] = useState(false);
  const [activation, setActivation] = useState(0);
  const [paused, setPaused] = useState(false);
  const rendererReady = useCallback(() => setReady(true), []);
  useEffect(() => {
    void loadChapter("chapter-six").then((chapter) => setEvents(chapter.events));
  }, []);
  const artwork = useMemo(
    () =>
      chapterArtwork(events.filter((event) => Object.values(scenes).some((id) => id === event.id))),
    [events],
  );
  const event = events.find((event) => event.id === scenes[selection]);
  const phone = event?.presentation?.phone;
  useEffect(() => {
    if (ready && event?.presentation?.backgroundId)
      phaserBridge.setBackground(event.presentation.backgroundId);
  }, [ready, event]);
  function select(scene: PreviewScene) {
    setSelection(scene);
    setActivation((value) => value + 1);
    setPaused(false);
    history.replaceState(null, "", `/phone-preview?scene=${scene}`);
  }
  return (
    <main className="arrival-page">
      <nav className="phone-preview-controls" aria-label="Phone preview controls">
        <a href="/">Home</a>
        <button onClick={() => select("reply")} aria-pressed={selection === "reply"}>
          Emma’s reply
        </button>
        <button onClick={() => select("campus")} aria-pressed={selection === "campus"}>
          Placement result + map
        </button>
        <button
          onClick={() => {
            setActivation((value) => value + 1);
            setPaused(false);
          }}
        >
          Replay this view
        </button>
        <button onClick={() => setPaused((value) => !value)}>
          {paused ? "Resume preview" : "Pause preview"}
        </button>
      </nav>
      <p className="phone-preview-note">
        Phone preview · Your saved story stays untouched. The placement map scrolls after six
        seconds.
      </p>
      <div
        className="game-viewport"
        data-phone={phone?.mode}
        data-view={event?.presentation?.view}
        data-event={event?.id}
      >
        {events.length > 0 && <PhaserCanvas artwork={artwork} onReady={rendererReady} />}
        {ready && phone && (
          <StoryPhone
            key={`${selection}:${activation}`}
            phone={phone}
            shellSrc={assets.getProp(phone.shellAssetId)}
            paused={paused}
          />
        )}
        {!paused && event && (event.type === "dialogue" || event.type === "narration") && (
          <StoryDialogue event={event} replayVoice={() => {}} />
        )}
        {paused && <p className="phone-preview-paused">Paused</p>}
      </div>
    </main>
  );
}
