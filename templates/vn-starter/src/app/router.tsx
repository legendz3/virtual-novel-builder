import { createBrowserRouter } from "react-router-dom";
import { AppLayout } from "@components/layout/AppLayout";
import { HomePage } from "@/pages/HomePage";
import { GamePage } from "@/pages/GamePage";
export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    errorElement: (
      <main className="page">
        <h1>Unable to open this page</h1>
        <a href="/">Return home</a>
      </main>
    ),
    children: [
      { path: "/", element: <HomePage /> },
      { path: "/game", element: <GamePage /> },
    ],
  },
]);
