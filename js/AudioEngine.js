export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.gainNode = null;
    this.source = null;
    this.buffers = new Map();
    this.currentTrack = null;
    this.isPlaying = false;
    this._volume = 0.7;
  }

  init() {
    if (this.ctx) return;
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.gainNode = this.ctx.createGain();
    this.gainNode.gain.value = this._volume;
    this.gainNode.connect(this.ctx.destination);
  }

  async loadTrack(name, url) {
    if (this.buffers.has(name)) return;
    try {
      const resp = await fetch(url);
      const arrayBuf = await resp.arrayBuffer();
      const audioBuf = await this.ctx.decodeAudioData(arrayBuf);
      this.buffers.set(name, audioBuf);
    } catch (e) {
      console.warn('Failed to load:', name, e);
    }
  }

  async loadAll(tracks) {
    this.init();
    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
    const promises = tracks.map(t => this.loadTrack(t.name, t.mp3));
    await Promise.all(promises);
  }

  play(name) {
    if (!this.buffers.has(name)) return;
    this.stop();
    this.init();
    if (this.ctx.state === 'suspended') this.ctx.resume();
    this.source = this.ctx.createBufferSource();
    this.source.buffer = this.buffers.get(name);
    this.source.loop = true;
    this.source.connect(this.gainNode);
    this.source.start(0);
    this.currentTrack = name;
    this.isPlaying = true;
  }

  stop() {
    if (this.source) {
      try {
        this.gainNode.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05);
        const src = this.source;
        setTimeout(() => {
          try { src.stop(); } catch (e) {}
        }, 150);
      } catch (e) {}
      this.source = null;
    }
    this.isPlaying = false;
    this.currentTrack = null;
    // restore gain for next play
    setTimeout(() => {
      if (this.gainNode) {
        this.gainNode.gain.cancelScheduledValues(this.ctx.currentTime);
        this.gainNode.gain.value = this._volume;
      }
    }, 200);
  }

  setVolume(v) {
    this._volume = Math.max(0, Math.min(1, v));
    if (this.gainNode && this.isPlaying) {
      this.gainNode.gain.cancelScheduledValues(this.ctx.currentTime);
      this.gainNode.gain.setTargetAtTime(this._volume, this.ctx.currentTime, 0.02);
    }
  }

  getVolume() {
    return this._volume;
  }
}
