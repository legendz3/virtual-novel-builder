import { useRef } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/auth/authContext";
import { assets } from "@content/assetManifest";
import { homeChapters, homePageCopy } from "@content/homePageCopy";
import "@/styles/homePage.css";

export function HomePage() {
  const { user, loading } = useAuth();
  const chapterPicker = useRef<HTMLDetailsElement>(null);
  const chapterToggle = useRef<HTMLElement>(null);

  return (
    <main className="home-page">
      <img
        className="home-backdrop"
        src={assets.getProp("kai-emma-sunset-memento-1")}
        alt=""
        fetchPriority="high"
        width="1672"
        height="941"
      />
      <div className="home-opening">
        <h1 className="home-title">
          <img
            src={assets.getUi("beijing-heartbeat-title")}
            alt={homePageCopy.title}
            width="1672"
            height="941"
          />
        </h1>
        <p className="home-description">{homePageCopy.description}</p>
        <p className="home-introduction">{homePageCopy.introduction}</p>
        <div className="home-actions">
          <Link className="button home-play" to="/game">
            {homePageCopy.enterStory} <span aria-hidden="true">→</span>
          </Link>
          <details
            className="home-chapter-picker"
            ref={chapterPicker}
            onKeyDown={(event) => {
              if (event.key === "Escape" && chapterPicker.current?.open) {
                event.preventDefault();
                chapterPicker.current.open = false;
                chapterToggle.current?.focus();
              }
            }}
          >
            <summary ref={chapterToggle}>
              {homePageCopy.chooseChapter}
              <span className="home-chapter-chevron" aria-hidden="true" />
            </summary>
            <nav className="home-chapter-list" aria-label={homePageCopy.chooseChapter}>
              <h2 className="home-season-title">{homePageCopy.seasonTitle}</h2>
              {homeChapters.map((chapter) => (
                <Link key={chapter.id} to={`/game?chapter=${chapter.id}&replay=1`}>
                  {chapter.label}
                </Link>
              ))}
            </nav>
          </details>
        </div>
      </div>
      <footer className="home-footer">
        <p>{homePageCopy.chapterAvailability}</p>
        {/* Account controls stay absent until the public sign-in experience is ready. */}
        <p>
          {loading
            ? homePageCopy.checkingSession
            : user
              ? homePageCopy.localProgress
              : homePageCopy.guestProgress}
        </p>
      </footer>
    </main>
  );
}
