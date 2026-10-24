import { Outlet } from "react-router-dom";
import { env } from "@app/env";
import { DebugPanel } from "@components/common/DebugPanel";
import { useSaves } from "@app/providers/saveContext";
export function AppLayout() {
  const { error, status } = useSaves();
  return (
    <>
      {error && (
        <p className="notice" role="alert">
          {error}
        </p>
      )}
      {status.local === "error" && !error && (
        <p className="notice" role="alert">
          Local save unavailable. Keep this page open and retry saving.
        </p>
      )}
      {status.cloud === "error" && (
        <p className="notice" role="status">
          Cloud is unavailable. Local progress remains usable; use Save locally to retry syncing.
        </p>
      )}
      <Outlet />
      {env.debug && <DebugPanel />}
    </>
  );
}
