import { expect, it } from "vitest";
import { LocalSaveProvider } from "./LocalSaveProvider";
import { serializeGameSave } from "./SaveManager";
import { initialGameState } from "@game/state/gameStore";
it("LocalSaveProvider persists, reopens, isolates accounts and deletes IndexedDB saves", async () => {
  const database = `test-${crypto.randomUUID()}`;
  const guest = new LocalSaveProvider("guest", 0, database);
  const account = new LocalSaveProvider("user", 0, database);
  const save = serializeGameSave(initialGameState());
  expect(await guest.load()).toBeNull();
  await guest.save(save);
  await guest.close();
  expect(await guest.load()).toEqual(save);
  expect(await account.load()).toBeNull();
  await guest.delete();
  expect(await guest.load()).toBeNull();
  await guest.close();
  await account.close();
});
