import { RouterProvider } from "react-router-dom";
import { Analytics } from "@vercel/analytics/react";
import { AuthProvider } from "@/auth/AuthProvider";
import { useAuth } from "@/auth/authContext";
import { SaveProvider } from "./providers/SaveProvider";
import { ErrorBoundary } from "@components/common/ErrorBoundary";
import { router } from "./router";
function AuthenticatedSaveScope() {
  const { user, loading } = useAuth();
  return (
    <SaveProvider key={loading ? "loading" : (user?.id ?? "guest")}>
      <RouterProvider router={router} />
    </SaveProvider>
  );
}
export function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AuthenticatedSaveScope />
      </AuthProvider>
      <Analytics />
    </ErrorBoundary>
  );
}
