import type { SupabaseClient } from "@supabase/supabase-js";
import { migrateSave, type GameSave, type SaveProvider } from "./save.types";
export class CloudSaveProvider implements SaveProvider {
  constructor(
    private readonly client: SupabaseClient,
    private readonly ownerId: string,
    private readonly slot = 0,
  ) {}
  private async userId(): Promise<string> {
    const { data, error } = await this.client.auth.getSession();
    if (error) throw error;
    if (!data.session || data.session.user.id !== this.ownerId)
      throw new Error("Save account has changed");
    // The session selects a row; server-side auth.uid() RLS is the authorization boundary.
    return data.session.user.id;
  }
  async load(): Promise<GameSave | null> {
    const { data, error } = await this.client
      .from("game_saves")
      .select("save_data")
      .eq("user_id", await this.userId())
      .eq("slot", this.slot)
      .abortSignal(AbortSignal.timeout(8000))
      .maybeSingle();
    if (error) throw error;
    return data ? migrateSave(data.save_data) : null;
  }
  async save(state: GameSave): Promise<void> {
    const save = migrateSave(state);
    const { error } = await this.client
      .from("game_saves")
      .upsert(
        {
          user_id: await this.userId(),
          slot: this.slot,
          save_data: save,
          save_version: save.version,
          chapter_id: save.chapterId ?? null,
          scene_id: save.sceneId ?? null,
        },
        { onConflict: "user_id,slot" },
      )
      .abortSignal(AbortSignal.timeout(8000));
    if (error) throw error;
  }
  async delete(): Promise<void> {
    const { error } = await this.client
      .from("game_saves")
      .delete()
      .eq("user_id", await this.userId())
      .eq("slot", this.slot)
      .abortSignal(AbortSignal.timeout(8000));
    if (error) throw error;
  }
}
