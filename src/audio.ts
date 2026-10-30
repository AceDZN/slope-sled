// Synthesized sound (no files): wind that follows speed, crunches, chimes, a bark. Starts after the first gesture.

export class Sound {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private windGain: GainNode | null = null;
  private windFilter: BiquadFilterNode | null = null;
  muted = false;

  unlock(): void {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') void this.ctx.resume();
      return;
    }
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.muted ? 0 : 0.7;
    this.master.connect(this.ctx.destination);
    // Looping filtered noise for wind / runners.
    const buf = this.ctx.createBuffer(1, this.ctx.sampleRate * 2, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    this.windFilter = this.ctx.createBiquadFilter();
    this.windFilter.type = 'bandpass';
    this.windFilter.frequency.value = 500;
    this.windFilter.Q.value = 0.7;
    this.windGain = this.ctx.createGain();
    this.windGain.gain.value = 0;
    src.connect(this.windFilter).connect(this.windGain).connect(this.master);
    src.start();
  }

  setMuted(m: boolean): void {
    this.muted = m;
    if (this.master && this.ctx) this.master.gain.setTargetAtTime(m ? 0 : 0.7, this.ctx.currentTime, 0.05);
  }

  /** Continuous ride sound, speed in m/s (0 = silent). */
  wind(speed: number): void {
    if (!this.ctx || !this.windGain || !this.windFilter) return;
    const t = this.ctx.currentTime;
    this.windGain.gain.setTargetAtTime(Math.min(0.5, speed * 0.035), t, 0.1);
    this.windFilter.frequency.setTargetAtTime(300 + speed * 90, t, 0.1);
  }

  private tone(freq: number, dur: number, type: OscillatorType = 'sine', vol = 0.25, when = 0, slide = 0): void {
    if (!this.ctx || !this.master) return;
    const t = this.ctx.currentTime + when;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq * slide), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(this.master);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  private noise(dur: number, freq: number, vol = 0.5): void {
    if (!this.ctx || !this.master) return;
    const t = this.ctx.currentTime;
    const buf = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * dur), this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
    const s = this.ctx.createBufferSource();
    s.buffer = buf;
    const f = this.ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = freq;
    const g = this.ctx.createGain();
    g.gain.value = vol;
    s.connect(f).connect(g).connect(this.master);
    s.start(t);
  }

  // ---------- music: a gentle procedural loop (pad + pluck arpeggio; percussion while riding) ----------
  musicOn = true;
  private musicGain: GainNode | null = null;
  private musicTimer: number | null = null;
  private nextBeat = 0;
  private beat = 0;
  private intensity = 0;

  /** 0 = building (calm), 1 = riding (adds percussion and a brighter arpeggio). */
  setIntensity(v: number): void {
    this.intensity = v;
  }

  setMusic(on: boolean): void {
    this.musicOn = on;
    if (this.musicGain && this.ctx) this.musicGain.gain.setTargetAtTime(on ? 0.16 : 0, this.ctx.currentTime, 0.3);
  }

  startMusic(): void {
    if (!this.ctx || !this.master || this.musicTimer !== null) return;
    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = this.musicOn ? 0.16 : 0;
    this.musicGain.connect(this.master);
    this.nextBeat = this.ctx.currentTime + 0.1;
    this.musicTimer = window.setInterval(() => this.schedule(), 100);
  }

  private schedule(): void {
    if (!this.ctx || !this.musicGain) return;
    const spb = 60 / 100 / 2; // eighth notes at 100 bpm
    // I – V – vi – IV in D major, one chord per bar of 8 eighths.
    const chords = [[62, 66, 69], [69, 73, 76], [71, 74, 78], [67, 71, 74]];
    while (this.nextBeat < this.ctx.currentTime + 0.3) {
      const t = this.nextBeat;
      const bar = Math.floor(this.beat / 8) % 4;
      const step = this.beat % 8;
      const ch = chords[bar];
      const hz = (n: number) => 440 * Math.pow(2, (n - 69) / 12);
      if (step === 0) for (const n of ch) this.voice(hz(n - 12), t, spb * 8, 'sine', 0.05, 0.6);
      const arp = [0, 1, 2, 1, 0, 2, 1, 2][step];
      if (this.intensity > 0 || step % 2 === 0) this.voice(hz(ch[arp] + (this.intensity > 0 ? 12 : 0)), t, spb * 0.9, 'triangle', this.intensity > 0 ? 0.07 : 0.05, 0.005);
      if (this.intensity > 0) {
        if (step % 4 === 0) this.kick(t);
        if (step % 2 === 1) this.hat(t);
      }
      this.nextBeat += spb;
      this.beat++;
    }
  }

  private voice(freq: number, t: number, dur: number, type: OscillatorType, vol: number, attack: number): void {
    const o = this.ctx!.createOscillator();
    const g = this.ctx!.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + attack + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(this.musicGain!);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  private kick(t: number): void {
    const o = this.ctx!.createOscillator();
    const g = this.ctx!.createGain();
    o.frequency.setValueAtTime(140, t);
    o.frequency.exponentialRampToValueAtTime(45, t + 0.15);
    g.gain.setValueAtTime(0.35, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
    o.connect(g).connect(this.musicGain!);
    o.start(t);
    o.stop(t + 0.25);
  }

  private hat(t: number): void {
    const len = Math.floor(this.ctx!.sampleRate * 0.04);
    const buf = this.ctx!.createBuffer(1, len, this.ctx!.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = this.ctx!.createBufferSource();
    src.buffer = buf;
    const f = this.ctx!.createBiquadFilter();
    f.type = 'highpass';
    f.frequency.value = 7000;
    const g = this.ctx!.createGain();
    g.gain.value = 0.12;
    src.connect(f).connect(g).connect(this.musicGain!);
    src.start(t);
  }

  click(): void { this.tone(880, 0.05, 'triangle', 0.12); }
  tick(up: boolean): void { this.tone(up ? 1240 : 980, 0.035, 'square', 0.05); }
  go(): void { this.tone(392, 0.12, 'triangle', 0.25); this.tone(587, 0.18, 'triangle', 0.25, 0.1); }
  gate(): void { this.tone(1318, 0.18, 'sine', 0.2); this.tone(1760, 0.25, 'sine', 0.15, 0.06); }
  crash(): void { this.noise(0.6, 900, 0.9); this.tone(160, 0.4, 'sawtooth', 0.2, 0, 0.4); }
  stall(): void { this.tone(330, 0.5, 'triangle', 0.2, 0, 0.5); }
  whoosh(): void { this.noise(0.5, 2400, 0.35); }
  land(): void { this.noise(0.25, 600, 0.6); }
  bark(): void { this.tone(520, 0.08, 'sawtooth', 0.18, 0, 0.6); this.tone(560, 0.09, 'sawtooth', 0.16, 0.14, 0.6); }
  win(): void { [523, 659, 784, 1046].forEach((f, i) => this.tone(f, 0.3, 'triangle', 0.22, i * 0.11)); }
  star(i: number): void { this.tone(880 + i * 220, 0.22, 'sine', 0.2); }
  trick(): void { this.tone(700, 0.25, 'sine', 0.15, 0, 2); }
}
