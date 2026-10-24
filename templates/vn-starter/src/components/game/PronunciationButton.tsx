interface PronunciationButtonProps {
  text: string;
  playing: boolean;
  muted: boolean;
  className: string;
  play: () => void;
  listenLabel: string;
  stopLabel: string;
  mutedLabel: string;
  itemId: string;
  location: "bank" | "slot" | "vocabulary";
}
export function PronunciationButton(props: PronunciationButtonProps) {
  return (
    <button
      type="button"
      className={props.className}
      data-pronunciation={props.itemId}
      data-pronunciation-location={props.location}
      data-playing={props.playing}
      data-speaking={props.playing}
      aria-label={props.playing ? props.stopLabel : props.listenLabel}
      title={props.muted ? props.mutedLabel : props.listenLabel}
      disabled={props.muted}
      onClick={props.play}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {props.playing ? (
          <rect x="6" y="6" width="12" height="12" fill="currentColor" stroke="none" />
        ) : (
          <>
            <path d="M11 4 6 8H3v8h3l5 4Z" />
            <path d="M15 8a6 6 0 0 1 0 8M18 5a10 10 0 0 1 0 14" />
          </>
        )}
      </svg>
    </button>
  );
}
