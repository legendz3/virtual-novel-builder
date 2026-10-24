import Phaser from "phaser";
import type { PhaserBridge, RenderCommand, SceneArtwork } from "@phaser/PhaserBridge";
import { GAME_WIDTH, GAME_HEIGHT } from "@phaser/config";
import { seatedFraming, dormRailPath } from "@phaser/seatedFraming";
import { cafeTableFraming } from "@phaser/cafeTableFraming";
import { renderCrossingMotion } from "@phaser/crossingMotion";
export class BaseScene extends Phaser.Scene {
  private background: Phaser.GameObjects.Image | null = null;
  private counterForeground: Phaser.GameObjects.Image | null = null;
  private characterShadow: Phaser.GameObjects.Ellipse | null = null;
  private characters = new Map<string, Phaser.GameObjects.Image>();
  private assetFailed = false;
  constructor(
    private readonly bridge: PhaserBridge,
    private readonly ready: () => void,
    private readonly applied: (command: RenderCommand) => void,
    private readonly failed: (error: Error) => void,
    private readonly artwork: readonly SceneArtwork[],
  ) {
    super("base");
  }
  preload(): void {
    this.load.on(Phaser.Loader.Events.FILE_LOAD_ERROR, () => {
      this.assetFailed = true;
      this.failed(new Error("Scene artwork could not load. Reload to retry."));
    });
    for (const { id, url } of this.artwork) this.load.image(id, url);
  }
  create(): void {
    if (this.assetFailed) return;
    this.cameras.main.setBackgroundColor("#000000");
    const detach = this.bridge.attach((command) => {
      if (command.type === "clear") {
        this.tweens.killAll();
        this.children.removeAll(true);
        this.background = null;
        this.counterForeground = null;
        this.characterShadow = null;
        this.characters.clear();
        this.cameras.main.setBackgroundColor("#000000");
      } else if (command.type === "background") {
        if (!this.textures.exists(command.assetId)) {
          this.failed(new Error(`Missing scene artwork: ${command.assetId}`));
          return;
        }
        if (!this.background)
          this.background = this.add
            .image(GAME_WIDTH / 2, GAME_HEIGHT / 2, command.assetId)
            .setDepth(0);
        else this.background.setTexture(command.assetId);
        this.background.setDisplaySize(GAME_WIDTH, GAME_HEIGHT);
      } else if (command.type === "show_character") {
        if (!this.textures.exists(command.assetId)) {
          this.failed(new Error(`Missing character artwork: ${command.assetId}`));
          return;
        }
        let character = this.characters.get(command.characterId);
        if (!character) {
          character = this.add.image(850, 18, command.assetId).setOrigin(0.5, 0).setDepth(1);
          this.characters.set(command.characterId, character);
        } else character.setTexture(command.assetId);
        this.counterForeground?.destroy();
        this.counterForeground = null;
        this.characterShadow?.destroy();
        this.characterShadow = null;
        if (command.framing && command.framing in seatedFraming) {
          const placement = seatedFraming[command.framing as keyof typeof seatedFraming];
          character
            .setPosition(placement.x, placement.y)
            .setScale(placement.height / character.height)
            .setCrop();
          if (command.framing === "courtyard-bench-seated") {
            // Keep a small contact shadow under the transparent sprite's shoes, behind its pixels.
            this.characterShadow = this.add
              .ellipse(795, 642, 240, 24, 0x24231e, 0.16)
              .setDepth(0.5);
          }
          if (placement.tableMask && this.background) {
            const top = Math.round(this.background.height * placement.tableMask);
            this.counterForeground = this.add
              .image(GAME_WIDTH / 2, GAME_HEIGHT / 2, this.background.texture.key)
              .setDisplaySize(GAME_WIDTH, GAME_HEIGHT)
              .setCrop(0, top, this.background.width, this.background.height - top)
              .setDepth(2);
          } else if (command.framing === "dorm-bed-seated" && this.background) {
            const key = "dorm-bed-safety-rail";
            if (!this.textures.exists(key)) {
              const texture = this.textures.createCanvas(key, GAME_WIDTH, GAME_HEIGHT);
              if (texture) {
                const context = texture.context;
                context.save();
                context.clip(new Path2D(dormRailPath));
                context.drawImage(
                  this.background.texture.getSourceImage() as HTMLImageElement,
                  0,
                  0,
                  GAME_WIDTH,
                  GAME_HEIGHT,
                );
                context.restore();
                texture.refresh();
              }
            }
            this.counterForeground = this.add
              .image(GAME_WIDTH / 2, GAME_HEIGHT / 2, key)
              .setDepth(2);
          }
        } else if (command.framing && command.framing in cafeTableFraming) {
          const framing = cafeTableFraming[command.framing as keyof typeof cafeTableFraming];
          character
            .setPosition(framing.x, framing.y)
            .setScale(framing.height / character.height)
            .setCrop();
          if (framing.tableMask && this.background) {
            const tableTop = Math.round(this.background.height * framing.tableMask);
            this.counterForeground = this.add
              .image(GAME_WIDTH / 2, GAME_HEIGHT / 2, this.background.texture.key)
              .setDisplaySize(GAME_WIDTH, GAME_HEIGHT)
              .setCrop(0, tableTop, this.background.width, this.background.height - tableTop)
              .setDepth(2);
          }
        } else if (
          (command.framing === "dinner-standing" ||
            command.framing === "dinner-seated-full" ||
            command.framing === "restaurant-counter") &&
          this.background
        ) {
          const placement = {
            "dinner-standing": { x: 940, y: 20, height: 840 },
            "dinner-seated-full": { x: 640, y: 20, height: 1280 },
            "restaurant-counter": { x: 380, y: 130, height: 400 },
          }[command.framing];
          character
            .setPosition(placement.x, placement.y)
            .setScale(placement.height / character.height)
            .setCrop();
          // Restore the near table above full-body art; seated Yichen keeps his separate .758 band.
          const tableTop = Math.round(this.background.height * 0.744);
          this.counterForeground = this.add
            .image(GAME_WIDTH / 2, GAME_HEIGHT / 2, this.background.texture.key)
            .setDisplaySize(GAME_WIDTH, GAME_HEIGHT)
            .setCrop(0, tableTop, this.background.width, this.background.height - tableTop)
            .setDepth(2);
        } else if (
          (command.framing === "behind-counter" ||
            command.framing === "counter-right" ||
            command.framing === "dinner-across") &&
          this.background
        ) {
          character
            .setPosition(command.framing === "counter-right" ? 940 : GAME_WIDTH / 2, 20)
            .setScale((command.framing === "dinner-across" ? 740 : 590) / character.height)
            .setCrop();
          // The exact background band occludes the café counter or opposite dinner seat.
          const counterTop = Math.round(this.background.height * 0.758);
          this.counterForeground = this.add
            .image(GAME_WIDTH / 2, GAME_HEIGHT / 2, this.background.texture.key)
            .setDisplaySize(GAME_WIDTH, GAME_HEIGHT)
            .setCrop(0, counterTop, this.background.width, this.background.height - counterTop)
            .setDepth(2);
        } else if (command.framing === "counter-side" || command.framing === "dinner-adjacent") {
          // A visitor stands beside Emma, in front of the counter, with no counter occlusion.
          character
            .setPosition(command.framing === "dinner-adjacent" ? 940 : GAME_WIDTH / 2, 20)
            .setScale(1120 / character.height)
            .setCrop();
        } else if (command.framing === "waist-up") {
          // Fill the right side from headroom to the background's bottom edge with an upper-body crop.
          const portraitTop = 40;
          const cropHeight = character.height * 0.49;
          character
            .setPosition(900, portraitTop)
            .setScale((GAME_HEIGHT - portraitTop) / cropHeight)
            .setCrop(0, 0, character.width, cropHeight);
        } else if (
          command.framing === "portrait" ||
          command.framing === "left-edge" ||
          command.framing === "close-up"
        ) {
          const close = command.framing === "close-up";
          character
            .setScale((close ? 940 : 840) / character.height)
            // Reaching poses end at the PNG edge; align that cut with the background's left edge.
            .setPosition(
              command.framing === "portrait" ? 850 : character.displayWidth / 2,
              close ? 0 : 20,
            )
            .setCrop();
        } else {
          // Airport portraits extend below the stage, keeping the face and sign readable.
          character
            .setPosition(850, 18)
            .setScale(1040 / character.height)
            .setCrop();
        }
      } else if (command.type === "hide_character") {
        this.characters.get(command.characterId)?.destroy();
        this.characters.delete(command.characterId);
        this.characterShadow?.destroy();
        this.characterShadow = null;
      } else if (command.type === "position") {
        const x = { left: 360, center: GAME_WIDTH / 2, right: 850 }[command.position];
        this.characters.get(command.characterId)?.setX(x);
      } else if (command.type === "crossing_motion") {
        const character = this.characters.get("li-wei");
        if (this.background && character)
          renderCrossingMotion(
            this,
            this.background,
            character,
            command.motion,
            command.animate,
            command.onComplete,
          );
        else command.onComplete();
      } else if (command.type === "pause_motion") {
        if (command.paused) this.tweens.pauseAll();
        else this.tweens.resumeAll();
      }
      // Separate facial-expression textures have not been authored; poses use showCharacter.
      this.applied(command);
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, detach);
    this.events.once(Phaser.Scenes.Events.DESTROY, detach);
    this.ready();
  }
}
