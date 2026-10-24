export interface AudioOptions {
  playbackRate?: number;
  volume?: number;
}
export interface AudioPlayback {
  playMusic(url: string): Promise<void>;
  playSfx(url: string): Promise<void>;
  playAmbience(url: string): Promise<void>;
  stopAmbience(): void;
  setAmbienceVolume(volume: number): void;
  stopMusic(): void;
  stopSfx(): void;
  setMuted(muted: boolean): void;
  pauseAll(): void;
  resumeAll(): Promise<void>;
  stopAll(): void;
  playVoice(url: string, options?: AudioOptions): Promise<void>;
  stopVoice(): void;
  pauseVoice(): void;
  resumeVoice(): void;
  setVoiceVolume(volume: number): void;
  setMusicVolume(volume: number): void;
  setSfxVolume(volume: number): void;
}
