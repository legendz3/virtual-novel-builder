import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { expect, it } from "vitest";
import { HomePage } from "./HomePage";
import { AuthProvider } from "@/auth/AuthProvider";
it("guest can enter the story using an accessible link", async () => {
  render(
    <AuthProvider>
      <MemoryRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/game" element={<h1>Renderer route</h1>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  );
  expect(screen.getByText(/Play as a guest/)).toBeInTheDocument();
  await userEvent.click(screen.getByRole("link", { name: "Enter the story" }));
  expect(screen.getByRole("heading", { name: "Renderer route" })).toBeInTheDocument();
});
