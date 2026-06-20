/**
 * Single owner of all audio playback for the visual novel.
 *
 * - Background music lives in one looping <audio> element that only swaps its
 *   source when the track actually changes, so it survives frame-to-frame.
 * - Sound effects play sequentially through a queue (one finishes before the
 *   next starts); only the background music plays independently/over them.
 * - A voice line is interruptible and is tied to the current musical "act":
 *   changing or stopping the music also stops the active voice.
 *
 * Browsers block audio until the first user gesture; play() promises are
 * swallowed and `resume()` is called on every click to start any pending music.
 */
class AudioController {
  private bg: HTMLAudioElement | null = null;
  private bgSrc: string | null = null;
  private voiceEl: HTMLAudioElement | null = null;
  private voiceSrc: string | null = null;
  private sfxQueue: (string | number)[] = [];
  private sfxEl: HTMLAudioElement | null = null;
  private sfxBusy = false;
  private sfxPauseTimer: number | null = null;
  /** Вызывается один раз, когда очередь звуков доиграла естественным образом. */
  onSfxIdle: (() => void) | null = null;

  /** Идёт ли сейчас воспроизведение очереди звуков (или пауза в ней). */
  get sfxActive(): boolean {
    return this.sfxBusy;
  }

  private ensureBg(): HTMLAudioElement {
    if (!this.bg) {
      this.bg = new Audio();
      this.bg.loop = true;
      this.bg.volume = 0.18;
    }
    return this.bg;
  }

  /** Apply a scene's `music` field. `undefined` keeps the current track. */
  setMusic(src: string | null | undefined): void {
    if (src === undefined) return;

    // An explicit music change (new track or silence) ends the current voice.
    this.stopVoice();

    if (src === null) {
      this.stopMusic();
      return;
    }

    if (src === this.bgSrc) {
      this.ensureBg().play().catch(() => {});
      return;
    }

    const el = this.ensureBg();
    this.bgSrc = src;
    el.src = src;
    el.currentTime = 0;
    el.play().catch(() => {});
  }

  stopMusic(): void {
    if (this.bg) {
      this.bg.pause();
      this.bg.currentTime = 0;
    }
    this.bgSrc = null;
  }

  /** Resume music paused by the browser's autoplay policy (call on user gesture). */
  resume(): void {
    if (this.bg && this.bg.paused && this.bgSrc) {
      this.bg.play().catch(() => {});
    }
  }

  /**
   * Поставить звук (или паузу) в очередь — играют строго по очереди, не накладываясь.
   * Число трактуется как пауза в миллисекундах перед следующим звуком.
   */
  playSfx(item: string | number): void {
    this.sfxQueue.push(item);
    if (!this.sfxBusy) this.playNextSfx();
  }

  private playNextSfx(): void {
    const next = this.sfxQueue.shift();
    if (next === undefined) {
      this.sfxBusy = false;
      this.sfxEl = null;
      return;
    }
    this.sfxBusy = true;

    if (typeof next === 'number') {
      this.sfxPauseTimer = window.setTimeout(() => {
        this.sfxPauseTimer = null;
        this.playNextSfx();
      }, next);
      return;
    }

    const a = new Audio(next);
    a.volume = 0.85;
    this.sfxEl = a;
    const advance = () => {
      this.sfxEl = null;
      this.playNextSfx();
    };
    a.onended = advance;
    a.onerror = advance;
    a.play().catch(advance);
  }

  /** Очистить очередь и оборвать текущий звук/паузу (при выходе в меню / прыжке по сценам). */
  clearSfx(): void {
    this.sfxQueue = [];
    this.sfxBusy = false;
    if (this.sfxPauseTimer !== null) {
      window.clearTimeout(this.sfxPauseTimer);
      this.sfxPauseTimer = null;
    }
    if (this.sfxEl) {
      this.sfxEl.pause();
      this.sfxEl = null;
    }
  }

  /** Play a voice line, skipping if the same line is already the active one. */
  playVoice(src: string): void {
    if (src === this.voiceSrc && this.voiceEl && !this.voiceEl.ended) return;
    this.stopVoice();
    const a = new Audio(src);
    a.volume = 1;
    this.voiceEl = a;
    this.voiceSrc = src;
    a.play().catch(() => {});
  }

  stopVoice(): void {
    if (this.voiceEl) {
      this.voiceEl.pause();
      this.voiceEl = null;
    }
    this.voiceSrc = null;
  }
}

export const audio = new AudioController();
