/**
 * Modern Friendly Notification Sound Synthesizer using Web Audio API.
 * Designed with warm harmonic intervals (sine waves with smooth exponential decays)
 * for a delightful, non-intrusive sound experience without external audio files.
 */
class SoundService {
  private audioCtx: AudioContext | null = null;
  private muted: boolean = false;

  constructor() {
    try {
      const saved = localStorage.getItem('dama_sound_muted');
      if (saved !== null) {
        this.muted = saved === 'true';
      }
    } catch {
      this.muted = false;
    }
  }

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;

    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
      }
    }

    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }

    return this.audioCtx;
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public setMuted(muted: boolean): void {
    this.muted = muted;
    try {
      localStorage.setItem('dama_sound_muted', String(muted));
    } catch {
      // Ignore localStorage restrictions
    }
  }

  public toggleMute(): boolean {
    this.setMuted(!this.muted);
    return this.muted;
  }

  /**
   * Warm, friendly, marimba-like notification chime (F5 698.46 Hz -> A5 880 Hz)
   */
  public playMessageChime(): void {
    if (this.muted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const notes = [
        { freq: 698.46, start: 0, duration: 0.18, gain: 0.14 },
        { freq: 880.00, start: 0.08, duration: 0.32, gain: 0.16 },
      ];

      notes.forEach(({ freq, start, duration, gain }) => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + start);

        gainNode.gain.setValueAtTime(0.001, now + start);
        gainNode.gain.exponentialRampToValueAtTime(gain, now + start + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, now + start + duration);

        osc.connect(gainNode);
        gainNode.connect(ctx.destination);

        osc.start(now + start);
        osc.stop(now + start + duration);
      });
    } catch {
      // Audio playback silently fails if autoplay restricted before first user interaction
    }
  }

  /**
   * Cheerful success chime (C5 -> E5 -> G5)
   */
  public playSuccessChime(): void {
    if (this.muted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const chord = [
        { freq: 523.25, start: 0, duration: 0.14, gain: 0.12 },
        { freq: 659.25, start: 0.06, duration: 0.18, gain: 0.13 },
        { freq: 783.99, start: 0.12, duration: 0.32, gain: 0.15 },
      ];

      chord.forEach(({ freq, start, duration, gain }) => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + start);

        gainNode.gain.setValueAtTime(0.001, now + start);
        gainNode.gain.exponentialRampToValueAtTime(gain, now + start + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, now + start + duration);

        osc.connect(gainNode);
        gainNode.connect(ctx.destination);

        osc.start(now + start);
        osc.stop(now + start + duration);
      });
    } catch {
      // Handled gracefully
    }
  }

  /**
   * Warm, soft alert sound (gentle double tap)
   */
  public playAlertSound(): void {
    if (this.muted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const taps = [
        { freq: 440, start: 0, duration: 0.12, gain: 0.09 },
        { freq: 392, start: 0.09, duration: 0.22, gain: 0.09 },
      ];

      taps.forEach(({ freq, start, duration, gain }) => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + start);

        gainNode.gain.setValueAtTime(0.001, now + start);
        gainNode.gain.exponentialRampToValueAtTime(gain, now + start + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, now + start + duration);

        osc.connect(gainNode);
        gainNode.connect(ctx.destination);

        osc.start(now + start);
        osc.stop(now + start + duration);
      });
    } catch {
      // Handled gracefully
    }
  }

  /**
   * Subtle bubble pop sound
   */
  public playPopSound(): void {
    if (this.muted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(440, now + 0.08);
      gainNode.gain.setValueAtTime(0.08, now);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.08);
    } catch {}
  }

  /**
   * Action completion chime
   */
  public playCompleteSound(): void {
    this.playSuccessChime();
  }
}

export const soundService = new SoundService();
