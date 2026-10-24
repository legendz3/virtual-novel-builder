import { assets } from "@content/assetManifest";
import type { ChapterDefinition } from "@content/content.types";
import type { StoryEvent } from "@game/story/story.types";
import type { AudioPlayback } from "./audio.types";

// The React controller enters beats inside user gestures; Phaser never controls story audio.
export class ArrivalAudio {
  private musicId?: string;
  private ambienceId?: string;
  private voiceId?: string;
  private entryKey?: string;
  private presentationSfxActive = false;
  constructor(private readonly playback: AudioPlayback) {}

  enter(chapter: ChapterDefinition, event: StoryEvent, restart = false): Promise<void> {
    const entryKey = `${chapter.id}/${event.id}`;
    const changedEntry = restart || this.entryKey !== entryKey;
    this.entryKey = entryKey;
    if (restart) {
      this.presentationSfxActive = false;
      this.playback.stopAll();
      this.musicId = undefined;
      this.ambienceId = undefined;
      this.voiceId = undefined;
    }
    const pending: Promise<void>[] = [];
    this.playback.setMusicVolume(event.presentation?.musicVolume ?? 0.25);
    const musicId = event.presentation?.musicId ?? chapter.musicId;
    if (this.musicId !== musicId) {
      this.musicId = musicId;
      if (this.musicId) pending.push(this.playback.playMusic(assets.getAudio(this.musicId)));
      else this.playback.stopMusic();
    }
    const voiceId = this.eventVoiceId(event);
    const ambienceVolume = event.presentation?.ambienceVolume ?? 0.32;
    this.playback.setAmbienceVolume(voiceId ? ambienceVolume * (0.12 / 0.32) : ambienceVolume);
    if (this.ambienceId !== event.presentation?.ambienceId) {
      this.ambienceId = event.presentation?.ambienceId;
      if (this.ambienceId)
        pending.push(this.playback.playAmbience(assets.getAudio(this.ambienceId)));
      else this.playback.stopAmbience();
    }
    // The spoken question continues into its comprehension panel without starting over.
    if (this.voiceId !== voiceId) {
      this.playback.stopVoice();
      this.voiceId = voiceId;
      if (voiceId) pending.push(this.playback.playVoice(assets.getAudio(voiceId)));
    }
    // Let the touchdown rumble sit beneath the captain, then release it at the window reveal.
    if (changedEntry) {
      if (this.presentationSfxActive || event.presentation?.view !== "dark")
        this.playback.stopSfx();
      this.presentationSfxActive = false;
      // Begin/restart restores text and voice, while only a live transition triggers a presentation cue.
      if (!restart && event.presentation?.sfx) {
        this.presentationSfxActive = true;
        this.playback.setSfxVolume(event.presentation.sfx.volume);
        pending.push(this.playback.playSfx(assets.getAudio(event.presentation.sfx.id)));
      }
    }
    if (event.type === "pause" && event.sfxId) {
      this.playback.setSfxVolume(0.8);
      pending.push(this.playback.playSfx(assets.getAudio(event.sfxId)));
    }
    return Promise.all(pending).then(() => undefined);
  }
  private eventVoiceId(event: StoryEvent): string | undefined {
    return event.type === "dialogue"
      ? event.mandarin
        ? event.mandarin.speech.mode === "recorded"
          ? event.mandarin.speech.audioId
          : undefined
        : event.audioId
      : event.type === "comprehension"
        ? event.exercise.audioId
        : undefined;
  }
  replayVoice(event: StoryEvent): Promise<void> {
    const voiceId = this.eventVoiceId(event);
    return voiceId ? this.playback.playVoice(assets.getAudio(voiceId)) : Promise.resolve();
  }
}
