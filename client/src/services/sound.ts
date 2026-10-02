/**
 * Granular Friendly Notification Sound Synthesizer using Web Audio API.
 * Designed with warm harmonic intervals for a delightful, non-intrusive sound experience.
 * Supports individual toggle preferences per sound category with DB/localStorage persistence.
 */

export interface SoundPreferences {
  action: boolean;
  success: boolean;
  error: boolean;
  navigation: boolean;
  dragDrop: boolean;
  clockIn: boolean;
  toggle: boolean;
  delete: boolean;
  chat: boolean;
  pop: boolean;
}

export const DEFAULT_SOUND_PREFERENCES: SoundPreferences = {
  action: true,
  success: true,
  error: true,
  navigation: true,
  dragDrop: true,
  clockIn: true,
  toggle: true,
  delete: true,
  chat: true,
  pop: true,
};

class SoundService {
  private audioCtx: AudioContext | null = null;
  private globalMuted: boolean = false;
  private soundPreferences: SoundPreferences = { ...DEFAULT_SOUND_PREFERENCES };

  constructor() {
    this.loadLocalPreferences();
  }

  private loadLocalPreferences(): void {
    try {
      const savedMuted = localStorage.getItem('dama_sound_muted');
      if (savedMuted !== null) {
        this.globalMuted = savedMuted === 'true';
      }
      const savedPrefs = localStorage.getItem('dama_sound_preferences');
      if (savedPrefs) {
        this.soundPreferences = { ...DEFAULT_SOUND_PREFERENCES, ...JSON.parse(savedPrefs) };
      }
    } catch {
      this.globalMuted = false;
      this.soundPreferences = { ...DEFAULT_SOUND_PREFERENCES };
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
    return this.globalMuted;
  }

  public setMuted(muted: boolean): void {
    this.globalMuted = muted;
    try {
      localStorage.setItem('dama_sound_muted', String(muted));
    } catch {}
  }

  public toggleMute(): boolean {
    this.setMuted(!this.globalMuted);
    return this.globalMuted;
  }

  public getPreferences(): SoundPreferences {
    return { ...this.soundPreferences };
  }

  public setCategoryEnabled(category: keyof SoundPreferences, enabled: boolean): void {
    this.soundPreferences[category] = enabled;
    try {
      localStorage.setItem('dama_sound_preferences', JSON.stringify(this.soundPreferences));
    } catch {}
  }

  public loadPreferences(prefs?: Partial<SoundPreferences>): void {
    if (prefs) {
      this.soundPreferences = { ...DEFAULT_SOUND_PREFERENCES, ...prefs };
      try {
        localStorage.setItem('dama_sound_preferences', JSON.stringify(this.soundPreferences));
      } catch {}
    }
  }

  public isCategoryAllowed(category: keyof SoundPreferences): boolean {
    if (this.globalMuted) return false;
    return this.soundPreferences[category] ?? true;
  }

  /**
   * Warm marimba notification chime for chat & messages
   */
  public playMessageChime(): void {
    if (!this.isCategoryAllowed('chat')) return;
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
    } catch {}
  }

  /**
   * Cheerful success chime (C5 -> E5 -> G5)
   */
  public playSuccessChime(): void {
    if (!this.isCategoryAllowed('success')) return;
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
    } catch {}
  }

  /**
   * Warm, soft error alert sound
   */
  public playAlertSound(): void {
    if (!this.isCategoryAllowed('error')) return;
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
    } catch {}
  }

  /**
   * Subtle bubble pop sound
   */
  public playPopSound(): void {
    if (!this.isCategoryAllowed('pop')) return;
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
   * Navigation tab transition sound
   */
  public playNavigationSound(): void {
    if (!this.isCategoryAllowed('navigation')) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1046.5, now);
      osc.frequency.exponentialRampToValueAtTime(1318.5, now + 0.05);
      gainNode.gain.setValueAtTime(0.05, now);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.05);
    } catch {}
  }

  /**
   * Drag & Drop action sound
   */
  public playDragDropSound(): void {
    if (!this.isCategoryAllowed('dragDrop')) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(350, now);
      osc.frequency.exponentialRampToValueAtTime(700, now + 0.07);
      gainNode.gain.setValueAtTime(0.07, now);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.07);
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.07);
    } catch {}
  }

  /**
   * Clock-in / Fichaje de jornada sound
   */
  public playClockInSound(): void {
    if (!this.isCategoryAllowed('clockIn')) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const chord = [
        { freq: 587.33, start: 0, duration: 0.1, gain: 0.12 },
        { freq: 880.00, start: 0.06, duration: 0.25, gain: 0.15 },
      ];
      chord.forEach(({ freq, start, duration, gain }) => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + start);
        gainNode.gain.setValueAtTime(0.001, now + start);
        gainNode.gain.exponentialRampToValueAtTime(gain, now + start + 0.015);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, now + start + duration);
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        osc.start(now + start);
        osc.stop(now + start + duration);
      });
    } catch {}
  }

  /**
   * Switch Toggle sound
   */
  public playToggleSound(): void {
    if (!this.isCategoryAllowed('toggle')) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(750, now);
      osc.frequency.exponentialRampToValueAtTime(950, now + 0.04);
      gainNode.gain.setValueAtTime(0.06, now);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.04);
    } catch {}
  }

  /**
   * Record Delete sound
   */
  public playDeleteSound(): void {
    if (!this.isCategoryAllowed('delete')) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(200, now + 0.12);
      gainNode.gain.setValueAtTime(0.08, now);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.12);
    } catch {}
  }

  public playCompleteSound(): void {
    this.playSuccessChime();
  }

  /**
   * Unified playback method supporting all granular categories
   */
  public play(
    type:
      | 'action'
      | 'success'
      | 'error'
      | 'alert'
      | 'pop'
      | 'navigation'
      | 'dragDrop'
      | 'clockIn'
      | 'toggle'
      | 'delete'
      | 'chat'
  ): void {
    switch (type) {
      case 'success':
        this.playSuccessChime();
        break;
      case 'error':
      case 'alert':
        this.playAlertSound();
        break;
      case 'navigation':
        this.playNavigationSound();
        break;
      case 'dragDrop':
        this.playDragDropSound();
        break;
      case 'clockIn':
        this.playClockInSound();
        break;
      case 'toggle':
        this.playToggleSound();
        break;
      case 'delete':
        this.playDeleteSound();
        break;
      case 'chat':
        this.playMessageChime();
        break;
      case 'action':
      case 'pop':
      default:
        this.playPopSound();
        break;
    }
  }
}

export const soundService = new SoundService();
