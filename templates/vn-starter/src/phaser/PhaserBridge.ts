import type { CharacterFraming, CrossingMotion } from "@game/story/story.types";

export interface SceneArtwork {
  id: string;
  url: string;
}

export type CharacterPosition = "left" | "center" | "right";
export type RenderCommand =
  | { type: "background"; assetId: string }
  | {
      type: "show_character";
      characterId: string;
      assetId: string;
      framing?: CharacterFraming;
    }
  | { type: "hide_character"; characterId: string }
  | { type: "position"; characterId: string; position: CharacterPosition }
  | { type: "expression"; characterId: string; expression: string }
  | { type: "crossing_motion"; motion: CrossingMotion; animate: boolean; onComplete: () => void }
  | { type: "pause_motion"; paused: boolean }
  | { type: "clear" };
export class PhaserBridge {
  private receiver: ((command: RenderCommand) => void) | null = null;
  // No command buffering or persistent state: controllers issue render commands after scene readiness.
  attach(receiver: (command: RenderCommand) => void): () => void {
    this.receiver = receiver;
    return () => {
      if (this.receiver === receiver) this.receiver = null;
    };
  }
  setBackground(assetId: string): void {
    this.receiver?.({ type: "background", assetId });
  }
  showCharacter(characterId: string, assetId: string, framing?: CharacterFraming): void {
    this.receiver?.({ type: "show_character", characterId, assetId, framing });
  }
  hideCharacter(characterId: string): void {
    this.receiver?.({ type: "hide_character", characterId });
  }
  setCharacterPosition(characterId: string, position: CharacterPosition): void {
    this.receiver?.({ type: "position", characterId, position });
  }
  setCharacterExpression(characterId: string, expression: string): void {
    this.receiver?.({ type: "expression", characterId, expression });
  }
  playCrossingMotion(motion: CrossingMotion, animate: boolean, onComplete: () => void): void {
    this.receiver?.({ type: "crossing_motion", motion, animate, onComplete });
  }
  setMotionPaused(paused: boolean): void {
    this.receiver?.({ type: "pause_motion", paused });
  }
  clearScene(): void {
    this.receiver?.({ type: "clear" });
  }
}
export const phaserBridge = new PhaserBridge();
