import { logger } from "@services/logger";
import type { AudioOptions, AudioPlayback } from "./audio.types";
// Independent channels keep looping music alive when a one-shot effect or voice changes.
export class AudioManager implements AudioPlayback {
  private voice: HTMLAudioElement | null = null;
  private music: HTMLAudioElement | null = null;
  private sfx: HTMLAudioElement | null = null;
  private ambience: HTMLAudioElement | null = null;
  private muted = false;
  private volumes = { voice: 1, music: 1, sfx: 1, ambience: 1 };
  constructor(
    private readonly createAudio: (url: string) => HTMLAudioElement = (url) => new Audio(url),
  ) {}
  private volume(value: number): number {
    if (!Number.isFinite(value)) throw new Error("Volume must be finite");
    return Math.max(0, Math.min(1, value));
  }
  async playVoice(url: string, options: AudioOptions = {}): Promise<void> {
    const rate = options.playbackRate ?? 1;
    if (!Number.isFinite(rate) || rate <= 0) throw new Error("Playback rate must be positive");
    this.stopVoice();
    const voice = this.createAudio(url);
    this.voice = voice;
    voice.volume = this.volume(options.volume ?? this.volumes.voice);
    voice.muted = this.muted;
    voice.playbackRate = rate;
    // A rejected play promise is reported to the caller for a textual, user-gesture retry control.
    try {
      await voice.play();
    } catch (error) {
      logger.warn("Voice playback requires user interaction or a supported asset", error);
      throw error;
    }
  }
  stopVoice(): void {
    if (this.voice) {
      this.voice.pause();
      this.voice.removeAttribute("src");
      this.voice.load();
      this.voice = null;
    }
  }
  pauseVoice(): void {
    this.voice?.pause();
  }
  resumeVoice(): void {
    void this.voice?.play().catch((error) => logger.warn("Voice resume blocked", error));
  }
  setVoiceVolume(value: number): void {
    this.volumes.voice = this.volume(value);
    if (this.voice) this.voice.volume = this.volumes.voice;
  }
  setMusicVolume(value: number): void {
    this.volumes.music = this.volume(value);
    if (this.music) this.music.volume = this.volumes.music;
  }
  setSfxVolume(value: number): void {
    this.volumes.sfx = this.volume(value);
    if (this.sfx) this.sfx.volume = this.volumes.sfx;
  }
  setAmbienceVolume(value: number): void {
    this.volumes.ambience = this.volume(value);
    if (this.ambience) this.ambience.volume = this.volumes.ambience;
  }
  playAmbience(url: string): Promise<void> {
    this.stopAmbience();
    const ambience = this.createAudio(url);
    this.ambience = ambience;
    ambience.loop = true;
    ambience.volume = this.volumes.ambience;
    ambience.muted = this.muted;
    return ambience.play();
  }
  stopAmbience(): void {
    this.release(this.ambience);
    this.ambience = null;
  }
  playMusic(url: string): Promise<void> {
    this.stopMusic();
    const music = this.createAudio(url);
    this.music = music;
    music.loop = true;
    music.volume = this.volumes.music;
    music.muted = this.muted;
    return music.play();
  }
  playSfx(url: string): Promise<void> {
    this.stopSfx();
    const sfx = this.createAudio(url);
    this.sfx = sfx;
    sfx.loop = false;
    sfx.volume = this.volumes.sfx;
    sfx.muted = this.muted;
    return sfx.play();
  }
  private release(audio: HTMLAudioElement | null): void {
    if (!audio) return;
    audio.pause();
    audio.removeAttribute("src");
    audio.load();
  }
  stopMusic(): void {
    this.release(this.music);
    this.music = null;
  }
  stopSfx(): void {
    this.release(this.sfx);
    this.sfx = null;
  }
  setMuted(muted: boolean): void {
    this.muted = muted;
    for (const channel of [this.voice, this.music, this.sfx, this.ambience]) {
      if (channel) channel.muted = muted;
    }
  }
  pauseAll(): void {
    for (const channel of [this.voice, this.music, this.sfx, this.ambience]) channel?.pause();
  }
  async resumeAll(): Promise<void> {
    await Promise.all(
      [this.voice, this.music, this.sfx, this.ambience].map((channel) => {
        if (channel && !channel.ended) return channel.play();
      }),
    );
  }
  stopAll(): void {
    this.stopVoice();
    this.stopMusic();
    this.stopSfx();
    this.stopAmbience();
  }
}
export const audioManager = new AudioManager();
