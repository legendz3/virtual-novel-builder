import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@/styles/global.css";
const root = createRoot(document.getElementById("root")!);
// Dynamic bootstrap also catches invalid environment configuration before React mounts.
// Local phone review never mounts auth, saves or the game store's progression controller.
const localPhonePreview =
  ["127.0.0.1", "localhost", "[::1]"].includes(location.hostname) &&
  location.pathname === "/phone-preview";
const bootstrap = localPhonePreview
  ? import("@/preview/PhoneScenePreview").then(({ PhoneScenePreview }) => ({
      App: PhoneScenePreview,
    }))
  : import("@app/App");
void bootstrap
  .then(({ App }) =>
    root.render(
      <StrictMode>
        <App />
      </StrictMode>,
    ),
  )
  .catch(() =>
    root.render(
      <main className="page">
        <h1>Application configuration error</h1>
        <p>Check the environment variables described in README.md, then reload.</p>
      </main>,
    ),
  );
