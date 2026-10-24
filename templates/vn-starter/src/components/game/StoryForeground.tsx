import { assets } from "@content/assetManifest";
import type { StoryPresentation } from "@game/story/story.types";

// Foreground documents stay separate from the backdrop and retain accessible authored descriptions.
export function StoryForeground({
  foreground,
  showPinyin = true,
}: {
  foreground: NonNullable<StoryPresentation["foreground"]>;
  showPinyin?: boolean;
}) {
  if (foreground.kind === "document")
    return (
      <section
        className="story-document"
        aria-label={
          foreground.showMeanings === false
            ? foreground.rows[0]?.hanzi
            : foreground.rows[0]?.meaning
        }
        data-document={foreground.id}
      >
        {foreground.rows.map((row) => (
          <div className="document-row" key={row.hanzi}>
            <p lang="zh-Hans">{row.hanzi}</p>
            {showPinyin && <p lang="zh-Latn">{row.pinyin}</p>}
            {foreground.showMeanings !== false && <p>{row.meaning}</p>}
          </div>
        ))}
      </section>
    );
  if (foreground.kind === "collection") {
    const active = foreground.items.find((item) => item.id === foreground.activeId);
    return (
      <section
        className="story-print-collection"
        aria-label={foreground.accessibleLabel ?? "Photographs on the table"}
      >
        {active?.assetId && (
          <img
            className="story-print-active"
            src={assets.getProp(active.assetId)}
            alt={active.alt}
            draggable={false}
          />
        )}
        <ol className="story-print-strip">
          {foreground.items.map((item, index) => (
            <li
              key={item.id}
              data-print={item.id}
              data-face={item.assetId ? "up" : "down"}
              style={{ width: `${(item.physicalScale ?? 1) * 100}%` }}
            >
              {item.assetId ? (
                <img src={assets.getProp(item.assetId)} alt={item.alt} draggable={false} />
              ) : (
                <span
                  className="story-print-back"
                  role="img"
                  aria-label={`Face-down photograph ${index + 1}`}
                />
              )}
            </li>
          ))}
        </ol>
      </section>
    );
  }
  return (
    <img
      className="story-foreground"
      data-asset={foreground.assetId}
      src={assets.getProp(foreground.assetId)}
      alt={foreground.alt}
      draggable={false}
    />
  );
}
