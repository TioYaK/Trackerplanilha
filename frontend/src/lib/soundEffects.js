// Web Audio API Synthesizer - 0 dependências externas, áudio procedural de baixa latência
class SoundFX {
  constructor() {
    this.ctx = null;
    this.enabled = false;
    if (typeof window !== 'undefined') {
      this.enabled = localStorage.getItem('tactical_audio_enabled') === 'true';
    }
  }

  init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
  }

  isEnabled() {
    return this.enabled;
  }

  toggle(enable) {
    this.enabled = typeof enable === 'boolean' ? enable : !this.enabled;
    if (typeof window !== 'undefined') {
      localStorage.setItem('tactical_audio_enabled', String(this.enabled));
    }
    if (this.enabled) {
      this.playTacticalPing();
    }
    return this.enabled;
  }

  // Ping de radar tático (sonar)
  playTacticalPing() {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') this.ctx.resume();

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(1760, now + 0.12);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.35);
    } catch (e) {}
  }

  // Alerta de Inimigo / Hunted entrando online (pulso tático duplo)
  playEnemyAlert() {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') this.ctx.resume();

      const now = this.ctx.currentTime;
      [0, 0.18].forEach((offset) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(987.77, now + offset); // B5
        osc.frequency.exponentialRampToValueAtTime(1318.51, now + offset + 0.08); // E6

        gain.gain.setValueAtTime(0.3, now + offset);
        gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.22);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + offset);
        osc.stop(now + offset + 0.22);
      });
    } catch (e) {}
  }

  // Alarme de Baixa / Morte de Aliado
  playGuildDeathAlert() {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') this.ctx.resume();

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(350, now);
      osc.frequency.exponentialRampToValueAtTime(140, now + 0.5);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.6);
    } catch (e) {}
  }
}

export const soundFX = new SoundFX();
