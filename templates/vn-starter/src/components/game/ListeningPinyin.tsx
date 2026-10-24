import type { ListeningPinyinControl } from "@game/learning/useListeningPinyin";

export function ListeningPinyin({ control }: { control: ListeningPinyinControl }) {
  return (
    <button
      type="button"
      className="listening-pinyin-toggle"
      disabled={!control.ready}
      onClick={() => control.setShown(!control.shown)}
    >
      {control.shown ? "Hide pinyin" : "Show pinyin"}
    </button>
  );
}
