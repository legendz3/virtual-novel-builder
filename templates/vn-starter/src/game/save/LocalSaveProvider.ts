import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import { migrateSave, type GameSave, type SaveProvider } from "./save.types";
interface SaveDatabase extends DBSchema {
  saves: { key: string; value: GameSave };
}
export class LocalSaveProvider implements SaveProvider {
  private database?: Promise<IDBPDatabase<SaveDatabase>>;
  private readonly key: string;
  constructor(
    ownerId = "guest",
    slot = 0,
    private readonly databaseName = "dating-sim",
  ) {
    this.key = `${ownerId}:${slot}`;
  }
  private open(): Promise<IDBPDatabase<SaveDatabase>> {
    return (this.database ??= openDB<SaveDatabase>(this.databaseName, 1, {
      upgrade(db) {
        db.createObjectStore("saves");
      },
    }));
  }
  async load(): Promise<GameSave | null> {
    const value = await (await this.open()).get("saves", this.key);
    return value === undefined ? null : migrateSave(value);
  }
  async save(state: GameSave): Promise<void> {
    await (await this.open()).put("saves", migrateSave(state), this.key);
  }
  async delete(): Promise<void> {
    await (await this.open()).delete("saves", this.key);
  }
  async close(): Promise<void> {
    const pending = this.database;
    this.database = undefined;
    // A failed open was already reported by load/save; teardown must not reject again.
    if (pending) (await pending.catch(() => null))?.close();
  }
}
