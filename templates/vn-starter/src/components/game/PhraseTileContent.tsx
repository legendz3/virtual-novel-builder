import type { PhraseTile } from "@game/learning/phraseConstruction.types";

export function PhraseTileContent({
  tile,
  showMeanings,
}: {
  tile: PhraseTile;
  showMeanings: boolean;
}) {
  return (
    <>
      <span className="phrase-hanzi" lang="zh-Hans">
        {tile.text}
      </span>
      <span className="phrase-pinyin" lang="zh-Latn">
        {tile.pinyin}
      </span>
      {showMeanings && <span className="phrase-meaning">{tile.meaning}</span>}
    </>
  );
}
