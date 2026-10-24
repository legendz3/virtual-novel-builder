import type { LanguageNote } from "@game/learning/mandarin.types";
import "@/styles/languageNotes.css";

/** Written support has no speech, reveal state or relationship to listening assistance. */
export function LanguageNotes({ notes }: { notes: readonly LanguageNote[] }) {
  return (
    <aside
      className="language-notes"
      aria-label={notes.length === 1 ? "Language note" : "Language notes"}
    >
      <p className="language-notes-label">
        {notes.length === 1 ? "Language note" : "Language notes"}
      </p>
      {notes.map((note, index) => (
        <div className="language-note" key={`${index}:${note.hanzi}`}>
          <p>
            <span lang="zh-Hans">{note.hanzi}</span>
            {" · "}
            <span lang="zh-Latn">{note.pinyin}</span>
            {" · "}
            <span lang="en">{note.meaning}</span>
          </p>
          {note.explanation && <p lang="en">{note.explanation}</p>}
        </div>
      ))}
    </aside>
  );
}
