// Çocuk dostu neşeli Web Audio API ses efektleri (dış ses dosyası gerektirmez)
(function (global) {
  const ISH = (global.ISH = global.ISH || {});

  class SoundFX {
  constructor() {
    this.muted = false;
    this.ctx = null;
  }

  _ensureCtx() {
    if (this.muted) return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  _tone(freq, duration = 0.12, type = 'sine', gainVal = 0.12, delay = 0) {
    const ctx = this._ensureCtx();
    if (!ctx) return;
    const now = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(gainVal, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  pop() {
    this._tone(520, 0.08, 'sine', 0.11);
    this._tone(740, 0.09, 'sine', 0.09, 0.04);
  }

  tick() {
    this._tone(660, 0.05, 'triangle', 0.07);
  }

  success() {
    this._tone(523.25, 0.11, 'sine', 0.12, 0);
    this._tone(659.25, 0.11, 'sine', 0.12, 0.08);
    this._tone(783.99, 0.18, 'sine', 0.13, 0.16);
  }

  fanfare() {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((n, i) => this._tone(n, 0.18, 'triangle', 0.13, i * 0.09));
  }

  reaction() {
    this._tone(587.33, 0.08, 'sine', 0.1, 0);
    this._tone(880, 0.12, 'sine', 0.1, 0.06);
  }

  buzz() {
    this._tone(240, 0.14, 'sawtooth', 0.07, 0);
  }

  // Birisi "BİTİRDİM!" dediğinde çalan heyecanlı uyarı sesi
  panicStart() {
    this._tone(660, 0.12, 'triangle', 0.14, 0);
    this._tone(880, 0.12, 'triangle', 0.14, 0.11);
    this._tone(1046.5, 0.2, 'triangle', 0.15, 0.22);
  }

  // 10'dan geriye sayarken her saniye yükselen heyecanlı tik sesi
  panicTick(secLeft) {
    const freq = 520 + (10 - Math.max(0, Math.min(10, secLeft))) * 45;
    this._tone(freq, 0.09, 'square', 0.08, 0);
    if (secLeft <= 3 && secLeft > 0) {
      this._tone(freq * 1.25, 0.07, 'triangle', 0.09, 0.09);
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }
}

  ISH.sfx = new SoundFX();
})(window);
