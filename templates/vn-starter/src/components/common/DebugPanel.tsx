import { useLocation } from "react-router-dom";
import { useAuth } from "@/auth/authContext";
import { useSaves } from "@app/providers/saveContext";
import { useGameStore } from "@game/state/gameStore";
export function DebugPanel() {
  const { user } = useAuth();
  const { status } = useSaves();
  const location = useLocation();
  const state = useGameStore();
  return (
    <details className="debug-panel">
      <summary>Development diagnostics</summary>
      <dl>
        {Object.entries({
          "User ID": user?.id ?? "guest",
          Route: location.pathname,
          Chapter: state.chapterId ?? "none",
          Scene: state.sceneId ?? "none",
          "Event index": state.eventIndex,
          Dirty: String(state.isDirty),
          "Save version": state.saveVersion,
          "Local save": status.local,
          "Cloud save": status.cloud,
        }).map(([key, value]) => (
          <div key={key}>
            <dt>{key}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </details>
  );
}
