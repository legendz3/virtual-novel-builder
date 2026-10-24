import { createClient, type Session } from "@supabase/supabase-js";
import { expect, it, vi } from "vitest";
import { CloudSaveProvider } from "./CloudSaveProvider";
import { serializeGameSave } from "./SaveManager";
import { initialGameState } from "@game/state/gameStore";
const ownerId = "00000000-0000-0000-0000-000000000001";
function session(): Session {
  return {
    access_token: "test-access",
    refresh_token: "test-refresh",
    expires_in: 3600,
    token_type: "bearer",
    user: {
      id: ownerId,
      app_metadata: {},
      user_metadata: {},
      aud: "authenticated",
      created_at: "2026-01-01T00:00:00Z",
    },
  };
}
it("CloudSaveProvider uses authenticated slot-zero filters and UPSERT through the Supabase client", async () => {
  const save = serializeGameSave(initialGameState());
  const fetch = vi.fn<typeof globalThis.fetch>(
    async (_input, init) =>
      new Response(
        init?.method === "POST" || init?.method === "DELETE"
          ? null
          : JSON.stringify({ save_data: save }),
        {
          status: init?.method === "POST" || init?.method === "DELETE" ? 204 : 200,
          headers: { "Content-Type": "application/json" },
        },
      ),
  );
  const client = createClient("https://test.supabase.co", "public-test-key", {
    global: { fetch },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  vi.spyOn(client.auth, "getSession").mockResolvedValue({
    data: { session: session() },
    error: null,
  });
  const provider = new CloudSaveProvider(client, ownerId);
  await provider.save(save);
  expect(await provider.load()).toEqual(save);
  await provider.delete();
  expect(fetch).toHaveBeenCalledTimes(3);
  const [url, options] = fetch.mock.calls[0]!;
  expect(String(url)).toContain("on_conflict=user_id%2Cslot");
  expect(options?.method).toBe("POST");
  expect(JSON.parse(String(options?.body))).toMatchObject({
    user_id: ownerId,
    slot: 0,
    save_data: JSON.parse(JSON.stringify(save)),
    save_version: 1,
  });
  expect(String(fetch.mock.calls[1]![0])).toContain(`user_id=eq.${ownerId}`);
  expect(String(fetch.mock.calls[1]![0])).toContain("slot=eq.0");
});
it("CloudSaveProvider rejects an account change before sending a request", async () => {
  const fetch = vi.fn<typeof globalThis.fetch>();
  const client = createClient("https://test.supabase.co", "public-test-key", {
    global: { fetch },
    auth: { persistSession: false },
  });
  vi.spyOn(client.auth, "getSession").mockResolvedValue({ data: { session: null }, error: null });
  await expect(
    new CloudSaveProvider(client, ownerId).save(serializeGameSave(initialGameState())),
  ).rejects.toThrow("account has changed");
  expect(fetch).not.toHaveBeenCalled();
});
