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
  private uiCtx: AudioContext | null = null;
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

  private ensureUiCtx(): AudioContext | null {
    const AudioCtx = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return null;
    if (!this.uiCtx) this.uiCtx = new AudioCtx();
    return this.uiCtx;
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
    this.uiCtx?.resume().catch(() => {});
  }

  playUiCue(kind: 'correct' | 'wrong'): void {
    const ctx = this.ensureUiCtx();
    if (!ctx) return;

    const now = ctx.currentTime + 0.01;
    const gain = ctx.createGain();
    gain.connect(ctx.destination);
    gain.gain.setValueAtTime(0.0001, now);

    if (kind === 'correct') {
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      osc1.type = 'triangle';
      osc2.type = 'sine';
      osc1.frequency.setValueAtTime(523.25, now);
      osc1.frequency.exponentialRampToValueAtTime(783.99, now + 0.18);
      osc2.frequency.setValueAtTime(659.25, now);
      osc2.frequency.exponentialRampToValueAtTime(987.77, now + 0.18);
      gain.gain.exponentialRampToValueAtTime(0.08, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.26);
      osc1.connect(gain);
      osc2.connect(gain);
      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.28);
      osc2.stop(now + 0.28);
      return;
    }

    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.22);
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(900, now);
    filter.Q.value = 1;
    gain.gain.exponentialRampToValueAtTime(0.09, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.24);
    osc.connect(filter);
    filter.connect(gain);
    osc.start(now);
    osc.stop(now + 0.26);
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
      const cb = this.onSfxIdle;
      this.onSfxIdle = null;
      cb?.();
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
    this.onSfxIdle = null; // оборванная очередь не считается «доигравшей»
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
