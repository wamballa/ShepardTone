class ShepardToneEngine {
  constructor() {
    this.audioContext = null;
    this.masterGain = null;
    this.analyser = null;
    this.delayNode = null;
    this.feedbackGain = null;
    this.delayMixGain = null;
    this.dryGain = null;
    this.mixBus = null;
    this.formantMixGain = null;
    this.formantFilterA = null;
    this.formantFilterB = null;
    this.oscillators = [];
    this.running = false;
    this.lastTime = 0;
    this.phase = 0;
    this.config = {
      direction: -1,
      speed: 0.08,
      baseFrequency: 203,
      volume: 0.35,
      echoMix: 0.14,
      width: 0.91,
      spacing: 1,
      layerCount: 17,
      octaveSpan: 16,
      mode: "glissando",
      timbre: "classic-risset"
    };
  }

  async init() {
    if (this.audioContext) {
      if (this.audioContext.state === "suspended") {
        await this.audioContext.resume();
      }

      this.ensureLayerCount();
      return;
    }

    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    this.audioContext = new AudioCtx();
    this.masterGain = this.audioContext.createGain();
    this.analyser = this.audioContext.createAnalyser();
    this.delayNode = this.audioContext.createDelay(1.2);
    this.feedbackGain = this.audioContext.createGain();
    this.delayMixGain = this.audioContext.createGain();
    this.dryGain = this.audioContext.createGain();
    this.mixBus = this.audioContext.createGain();
    this.formantMixGain = this.audioContext.createGain();
    this.formantFilterA = this.audioContext.createBiquadFilter();
    this.formantFilterB = this.audioContext.createBiquadFilter();
    this.analyser.fftSize = 2048;
    this.analyser.smoothingTimeConstant = 0.85;
    this.masterGain.gain.value = 0;
    this.delayNode.delayTime.value = 0.22;
    this.feedbackGain.gain.value = 0.28;
    this.delayMixGain.gain.value = this.config.echoMix;
    this.dryGain.gain.value = 1;
    this.mixBus.gain.value = 1;
    this.formantMixGain.gain.value = 0;
    this.formantFilterA.type = "bandpass";
    this.formantFilterA.Q.value = 3.2;
    this.formantFilterB.type = "bandpass";
    this.formantFilterB.Q.value = 4.4;
    this.masterGain.connect(this.dryGain);
    this.masterGain.connect(this.formantFilterA);
    this.masterGain.connect(this.formantFilterB);
    this.formantFilterA.connect(this.formantMixGain);
    this.formantFilterB.connect(this.formantMixGain);
    this.dryGain.connect(this.mixBus);
    this.formantMixGain.connect(this.mixBus);
    this.mixBus.connect(this.analyser);
    this.mixBus.connect(this.delayNode);
    this.delayNode.connect(this.feedbackGain);
    this.feedbackGain.connect(this.delayNode);
    this.delayNode.connect(this.delayMixGain);
    this.delayMixGain.connect(this.analyser);
    this.analyser.connect(this.audioContext.destination);

    this.updateFormantVoicing(this.audioContext.currentTime);
    this.rebuildOscillators();
  }

  rebuildOscillators() {
    this.oscillators.forEach(({ oscillator, gain, panNode }) => {
      try {
        oscillator.stop();
      } catch (error) {
        // Ignore stop calls on already-stopped oscillators.
      }
      oscillator.disconnect();
      gain.disconnect();
      if (panNode) {
        panNode.disconnect();
      }
    });

    this.oscillators = [];

    for (let i = 0; i < this.config.layerCount; i += 1) {
      const oscillator = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();
      const panNode = this.audioContext.createStereoPanner
        ? this.audioContext.createStereoPanner()
        : null;
      this.applyTimbre(oscillator, i);
      gain.gain.value = 0;
      oscillator.connect(gain);
      if (panNode) {
        gain.connect(panNode);
        panNode.connect(this.masterGain);
      } else {
        gain.connect(this.masterGain);
      }
      oscillator.start();
      this.oscillators.push({ oscillator, gain, panNode, index: i });
    }
  }

  updateFormantVoicing(now) {
    if (!this.audioContext || !this.formantFilterA || !this.formantFilterB) {
      return;
    }

    const useOooChoir = this.config.timbre === "ooo-choir";
    const cycle = this.getCyclePhase();
    const drift = Math.sin(cycle * Math.PI * 2) * 18;
    const dryLevel = useOooChoir ? 0.52 : 1;
    const formantLevel = useOooChoir ? 0.48 : 0;
    const f1 = 340 + drift;
    const f2 = 760 + drift * 0.7;

    this.dryGain.gain.setValueAtTime(dryLevel, now);
    this.formantMixGain.gain.setValueAtTime(formantLevel, now);
    this.formantFilterA.frequency.setValueAtTime(f1, now);
    this.formantFilterB.frequency.setValueAtTime(f2, now);
    this.formantFilterA.Q.setValueAtTime(useOooChoir ? 4.6 : 3.2, now);
    this.formantFilterB.Q.setValueAtTime(useOooChoir ? 5.2 : 4.4, now);
  }

  ensureLayerCount() {
    if (this.oscillators.length !== this.config.layerCount) {
      this.rebuildOscillators();
    }
  }

  applyTimbre(oscillator, index = 0) {
    const now = this.audioContext.currentTime;
    const centerIndex = (this.config.layerCount - 1) / 2;
    const spread = index - centerIndex;

    if (this.config.timbre === "classic-risset") {
      oscillator.type = "sine";
      oscillator.detune.setValueAtTime(0, now);
      return;
    }

    if (this.config.timbre === "ghostly") {
      oscillator.setPeriodicWave(this.createGhostlyWave());
      oscillator.detune.setValueAtTime(spread * 3.5, now);
      return;
    }

    if (this.config.timbre === "rich") {
      oscillator.setPeriodicWave(this.createRichWave());
      oscillator.detune.setValueAtTime(0, now);
      return;
    }

    if (this.config.timbre === "organ") {
      oscillator.setPeriodicWave(this.createOrganWave());
      oscillator.detune.setValueAtTime(spread * 0.8, now);
      return;
    }

    if (this.config.timbre === "choir") {
      oscillator.setPeriodicWave(this.createChoirWave());
      oscillator.detune.setValueAtTime(spread * 2.2, now);
      return;
    }

    if (this.config.timbre === "bell") {
      oscillator.setPeriodicWave(this.createBellWave());
      oscillator.detune.setValueAtTime(spread * 1.4, now);
      return;
    }

    if (this.config.timbre === "pulse") {
      oscillator.setPeriodicWave(this.createPulseWave());
      oscillator.detune.setValueAtTime(0, now);
      return;
    }

    if (this.config.timbre === "strings") {
      oscillator.setPeriodicWave(this.createStringsWave());
      oscillator.detune.setValueAtTime(spread * 1.6, now);
      return;
    }

    if (this.config.timbre === "reference") {
      oscillator.setPeriodicWave(this.createReferenceWave());
      oscillator.detune.setValueAtTime(0, now);
      return;
    }

    if (this.config.timbre === "ooo-choir") {
      oscillator.setPeriodicWave(this.createOooChoirWave());
      oscillator.detune.setValueAtTime(spread * 1.1, now);
      return;
    }

    oscillator.type = this.config.timbre;
    oscillator.detune.setValueAtTime(0, now);
  }

  createRichWave() {
    if (this.richWave) {
      return this.richWave;
    }

    const real = new Float32Array([0, 1, 0.35, 0.18, 0.08, 0.03]);
    const imag = new Float32Array(real.length);
    this.richWave = this.audioContext.createPeriodicWave(real, imag);
    return this.richWave;
  }

  createGhostlyWave() {
    if (this.ghostlyWave) {
      return this.ghostlyWave;
    }

    const real = new Float32Array([0, 0.8, 0.22, 0.1, 0.04, 0.015, 0.008]);
    const imag = new Float32Array(real.length);
    this.ghostlyWave = this.audioContext.createPeriodicWave(real, imag);
    return this.ghostlyWave;
  }

  createOrganWave() {
    if (this.organWave) {
      return this.organWave;
    }

    const real = new Float32Array([0, 0.95, 0.45, 0.24, 0.12, 0.06, 0.03]);
    const imag = new Float32Array(real.length);
    this.organWave = this.audioContext.createPeriodicWave(real, imag);
    return this.organWave;
  }

  createChoirWave() {
    if (this.choirWave) {
      return this.choirWave;
    }

    const real = new Float32Array([0, 0.75, 0.3, 0.16, 0.08, 0.03, 0.012]);
    const imag = new Float32Array(real.length);
    this.choirWave = this.audioContext.createPeriodicWave(real, imag);
    return this.choirWave;
  }

  createBellWave() {
    if (this.bellWave) {
      return this.bellWave;
    }

    const real = new Float32Array([0, 0.6, 0.08, 0.22, 0.03, 0.14, 0.02, 0.09]);
    const imag = new Float32Array(real.length);
    this.bellWave = this.audioContext.createPeriodicWave(real, imag);
    return this.bellWave;
  }

  createPulseWave() {
    if (this.pulseWave) {
      return this.pulseWave;
    }

    const real = new Float32Array([0, 1, 0, 0.33, 0, 0.2, 0, 0.14, 0, 0.11]);
    const imag = new Float32Array(real.length);
    this.pulseWave = this.audioContext.createPeriodicWave(real, imag);
    return this.pulseWave;
  }

  createStringsWave() {
    if (this.stringsWave) {
      return this.stringsWave;
    }

    const real = new Float32Array([0, 0.88, 0.36, 0.19, 0.1, 0.055, 0.03, 0.018]);
    const imag = new Float32Array(real.length);
    this.stringsWave = this.audioContext.createPeriodicWave(real, imag);
    return this.stringsWave;
  }

  createReferenceWave() {
    if (this.referenceWave) {
      return this.referenceWave;
    }

    const real = new Float32Array([0, 0.92, 0.28, 0.12, 0.05, 0.02, 0.008]);
    const imag = new Float32Array(real.length);
    this.referenceWave = this.audioContext.createPeriodicWave(real, imag);
    return this.referenceWave;
  }

  createOooChoirWave() {
    if (this.oooChoirWave) {
      return this.oooChoirWave;
    }

    const real = new Float32Array([0, 0.78, 0.18, 0.32, 0.09, 0.045, 0.016, 0.008]);
    const imag = new Float32Array(real.length);
    this.oooChoirWave = this.audioContext.createPeriodicWave(real, imag);
    return this.oooChoirWave;
  }

  getCyclePhase() {
    return ((this.phase % 1) + 1) % 1;
  }

  getMotionOffset() {
    if (this.config.mode === "held") {
      return this.phase;
    }

    if (this.config.mode === "discrete") {
      const semitonePhase = this.phase * 12;
      const quantizedSemitone = this.config.direction >= 0
        ? Math.floor(semitonePhase)
        : Math.ceil(semitonePhase);
      return quantizedSemitone / 12;
    }

    return this.phase;
  }

  rissetEnvelope(octaveOffset) {
    if (this.config.timbre === "classic-risset") {
      const sigma = this.config.octaveSpan / 5;
      return Math.exp(-(octaveOffset * octaveOffset) / (2 * sigma * sigma));
    }

    const halfSpan = this.config.octaveSpan / 2;
    const normalized = octaveOffset / halfSpan;
    if (Math.abs(normalized) > 1) {
      return 0;
    }

    return 0.5 * (1 + Math.cos(Math.PI * normalized));
  }

  getLayerGainScale() {
    if (this.config.timbre === "classic-risset") {
      return 0.8 / Math.sqrt(this.config.layerCount);
    }

    return 0.72 / Math.sqrt(this.config.layerCount);
  }

  getLayerState(index) {
    if (this.config.mode === "held") {
      return this.getHeldLayerState(index);
    }

    const centerIndex = (this.config.layerCount - 1) / 2;
    const spacedIndex = (index - centerIndex) * this.config.spacing;
    const rawOffset = spacedIndex + this.getMotionOffset();
    const span = this.config.octaveSpan;
    const wrappedOffset = ((rawOffset + span / 2) % span + span) % span - span / 2;
    const normalizedPosition = (wrappedOffset + span / 2) / span;
    const octaveOffset = wrappedOffset;
    const frequency = this.config.baseFrequency * Math.pow(2, octaveOffset);
    const amplitude = this.rissetEnvelope(wrappedOffset) * this.getLayerGainScale();

    return {
      wrappedOffset,
      normalizedPosition,
      octaveOffset,
      frequency,
      amplitude
    };
  }

  getHeldLayerState(index) {
    const heldLayers = 4;
    const cyclePhase = this.getCyclePhase();
    const evenOffset = index / heldLayers;
    const spacedOffset = evenOffset * this.config.spacing;
    const layerPhase = ((cyclePhase + spacedOffset) % 1 + 1) % 1;
    const octaveOffset = (layerPhase - 0.5) * this.config.direction;
    const frequency = this.config.baseFrequency * Math.pow(2, octaveOffset);
    const amplitude = Math.sin(layerPhase * Math.PI) * 0.42;

    return {
      wrappedOffset: octaveOffset,
      normalizedPosition: layerPhase,
      octaveOffset,
      frequency,
      amplitude
    };
  }

  updateVoices(time) {
    const now = time || this.audioContext.currentTime;
    const dt = this.lastTime ? now - this.lastTime : 0;
    this.lastTime = now;

    this.phase += dt * this.config.speed * this.config.direction;
    this.updateFormantVoicing(now);

    this.oscillators.forEach(({ oscillator, gain, panNode, index }) => {
      const { frequency, amplitude } = this.getLayerState(index);

      oscillator.frequency.setValueAtTime(frequency, now);
      gain.gain.setValueAtTime(amplitude, now);
      this.updatePanPosition(panNode, index, now);
    });
  }

  updatePanPosition(panNode, index, now) {
    if (!panNode) {
      return;
    }

    const centerIndex = (this.config.layerCount - 1) / 2;
    const normalizedIndex = centerIndex === 0 ? 0 : (index - centerIndex) / centerIndex;
    const staticPan = normalizedIndex * this.config.width * 0.72;
    const motionPan = Math.sin(this.phase * Math.PI * 2 + index * 0.65) * this.config.width * 0.12;
    const pan = Math.max(-1, Math.min(1, staticPan + motionPan));
    panNode.pan.setValueAtTime(pan, now);
  }

  getVisualizerState() {
    return this.oscillators.map(({ index }) => {
      return this.getLayerState(index);
    });
  }

  tick = () => {
    if (!this.running || !this.audioContext) {
      return;
    }

    this.updateVoices(this.audioContext.currentTime);
    requestAnimationFrame(this.tick);
  };

  async start() {
    await this.init();
    await this.audioContext.resume();
    this.ensureLayerCount();
    this.running = true;
    this.lastTime = this.audioContext.currentTime;
    this.masterGain.gain.cancelScheduledValues(this.audioContext.currentTime);
    this.masterGain.gain.linearRampToValueAtTime(
      this.config.volume,
      this.audioContext.currentTime + 0.2
    );
    this.tick();
  }

  stop() {
    if (!this.audioContext || !this.masterGain) {
      return;
    }

    this.running = false;
    const now = this.audioContext.currentTime;
    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
    this.masterGain.gain.linearRampToValueAtTime(0, now + 0.25);
  }

  setDirection(direction) {
    this.config.direction = Number(direction);
  }

  setSpeed(speed) {
    this.config.speed = Number(speed);
  }

  setBaseFrequency(baseFrequency) {
    this.config.baseFrequency = Number(baseFrequency);
  }

  setVolume(volume) {
    this.config.volume = Number(volume);
    if (this.running && this.audioContext && this.masterGain) {
      const now = this.audioContext.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.linearRampToValueAtTime(this.config.volume, now + 0.1);
    }
  }

  setEchoMix(echoMix) {
    this.config.echoMix = Number(echoMix);
    if (!this.audioContext || !this.delayMixGain) {
      return;
    }

    const now = this.audioContext.currentTime;
    this.delayMixGain.gain.cancelScheduledValues(now);
    this.delayMixGain.gain.linearRampToValueAtTime(this.config.echoMix, now + 0.1);
  }

  setWidth(width) {
    this.config.width = Number(width);
    if (!this.audioContext) {
      return;
    }

    const now = this.audioContext.currentTime;
    this.oscillators.forEach(({ panNode, index }) => {
      this.updatePanPosition(panNode, index, now);
    });
  }

  setSpacing(spacing) {
    this.config.spacing = Number(spacing);
  }

  setMode(mode) {
    this.config.mode = mode;
    if (mode === "held") {
      this.config.layerCount = 4;
      this.config.octaveSpan = 1;
    } else {
      this.config.octaveSpan = Math.max(4, this.config.layerCount - 1);
    }

    if (this.audioContext) {
      this.rebuildOscillators();
    }
  }

  setTimbre(timbre) {
    this.config.timbre = timbre;
    if (timbre === "classic-risset") {
      this.config.echoMix = 0;
      this.config.width = 0;
    }
    if (this.audioContext) {
      this.updateFormantVoicing(this.audioContext.currentTime);
      if (timbre === "classic-risset") {
        this.setEchoMix(0);
        this.setWidth(0);
      }
    }
    this.oscillators.forEach(({ oscillator, index }) => {
      this.applyTimbre(oscillator, index);
    });
  }

  setLayerCount(layerCount) {
    this.config.layerCount = Number(layerCount);
    this.config.octaveSpan = Math.max(4, this.config.layerCount - 1);
    if (!this.audioContext) {
      return;
    }

    this.rebuildOscillators();
  }
}

class ShepardVisualizer {
  constructor(canvas, engine) {
    this.canvas = canvas;
    this.engine = engine;
    this.context = canvas.getContext("2d");
    this.waveform = new Uint8Array(1024);
    this.pixelRatio = window.devicePixelRatio || 1;
    this.resize();
    window.addEventListener("resize", () => this.resize());
    requestAnimationFrame(this.draw);
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    const width = Math.max(320, Math.round(rect.width || this.canvas.width));
    const height = Math.max(220, Math.round((width * 7) / 16));
    this.canvas.width = Math.round(width * this.pixelRatio);
    this.canvas.height = Math.round(height * this.pixelRatio);
    this.context.setTransform(this.pixelRatio, 0, 0, this.pixelRatio, 0, 0);
    this.width = width;
    this.height = height;
  }

  drawBackground() {
    const ctx = this.context;
    ctx.clearRect(0, 0, this.width, this.height);

    const gradient = ctx.createLinearGradient(0, 0, 0, this.height);
    gradient.addColorStop(0, "rgba(123, 223, 242, 0.12)");
    gradient.addColorStop(1, "rgba(3, 7, 18, 0.9)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.width, this.height);

    ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
    ctx.lineWidth = 1;
    for (let i = 1; i < 5; i += 1) {
      const y = (this.height / 5) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.width, y);
      ctx.stroke();
    }
  }

  drawWaveform() {
    const analyser = this.engine.analyser;
    const ctx = this.context;
    const midY = this.height * 0.22;

    if (!analyser) {
      return;
    }

    if (this.waveform.length !== analyser.fftSize) {
      this.waveform = new Uint8Array(analyser.fftSize);
    }

    analyser.getByteTimeDomainData(this.waveform);

    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(255, 209, 102, 0.95)";
    ctx.beginPath();

    for (let i = 0; i < this.waveform.length; i += 1) {
      const x = (i / (this.waveform.length - 1)) * this.width;
      const sample = (this.waveform[i] - 128) / 128;
      const y = midY + sample * (this.height * 0.08);
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.stroke();
  }

  drawLayers() {
    const ctx = this.context;
    const layers = this.engine.getVisualizerState();
    const areaLeft = 42;
    const areaRight = this.width - 18;
    const areaWidth = areaRight - areaLeft;
    const areaTop = this.height * 0.34;
    const areaHeight = this.height * 0.5;

    ctx.fillStyle = "rgba(255, 255, 255, 0.86)";
    ctx.font = '12px Georgia, "Times New Roman", serif';
    ctx.fillText("Octave cycle", areaLeft, areaTop - 10);

    ctx.strokeStyle = "rgba(255, 255, 255, 0.18)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(areaLeft, areaTop);
    ctx.lineTo(areaLeft, areaTop + areaHeight);
    ctx.lineTo(areaRight, areaTop + areaHeight);
    ctx.stroke();

    ctx.strokeStyle = "rgba(123, 223, 242, 0.18)";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 8; i += 1) {
      const x = areaLeft + (i / 8) * areaWidth;
      ctx.beginPath();
      ctx.moveTo(x, areaTop);
      ctx.lineTo(x, areaTop + areaHeight);
      ctx.stroke();
    }

    ctx.fillStyle = "rgba(248, 250, 252, 0.72)";
    ctx.font = '11px Georgia, "Times New Roman", serif';
    for (let i = 0; i <= 8; i += 1) {
      const x = areaLeft + (i / 8) * areaWidth;
      const label = i === 8 ? "1.0" : (i / 8).toFixed(3).replace(/0+$/, "").replace(/\.$/, "");
      ctx.textAlign = i === 8 ? "right" : i === 0 ? "left" : "center";
      ctx.fillText(label, x, areaTop + areaHeight + 16);
    }

    const yTicks = [
      { value: 0, label: "0.0" },
      { value: 0.5, label: "0.5" },
      { value: 1, label: "1.0" }
    ];
    yTicks.forEach((tick) => {
      const y = areaTop + areaHeight - tick.value * areaHeight;
      ctx.textAlign = "right";
      ctx.fillText(tick.label, areaLeft - 8, y + 4);
    });

    ctx.save();
    ctx.translate(14, areaTop + areaHeight / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = "center";
    ctx.fillText("Layer gain", 0, 0);
    ctx.restore();

    ctx.textAlign = "center";
    ctx.fillText("Cycle position", areaLeft + areaWidth / 2, areaTop + areaHeight + 32);

    layers.forEach((layer) => {
      const x = areaLeft + areaWidth * layer.normalizedPosition;
      const y = areaTop + areaHeight - layer.amplitude * areaHeight * 2.4;
      const radius = 5 + layer.amplitude * 28;
      const hue = 190 + layer.normalizedPosition * 70;

      const glow = ctx.createRadialGradient(x, y, 0, x, y, radius * 2.4);
      glow.addColorStop(0, `hsla(${hue}, 85%, 72%, 0.95)`);
      glow.addColorStop(1, `hsla(${hue}, 85%, 72%, 0)`);
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(x, y, radius * 2.4, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = `hsla(${hue}, 90%, 76%, 0.95)`;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  drawIdleHint() {
    if (this.engine.running) {
      return;
    }

    const ctx = this.context;
    ctx.fillStyle = "rgba(248, 250, 252, 0.7)";
    ctx.font = '16px Georgia, "Times New Roman", serif';
    ctx.textAlign = "center";
    ctx.fillText("Press Start Audio to animate the tone in real time.", this.width / 2, this.height / 2);
    ctx.textAlign = "start";
  }

  draw = () => {
    this.drawBackground();
    this.drawWaveform();
    this.drawLayers();
    this.drawIdleHint();
    requestAnimationFrame(this.draw);
  };
}

const engine = new ShepardToneEngine();

const directionSelect = document.getElementById("directionSelect");
const speedRange = document.getElementById("speedRange");
const baseRange = document.getElementById("baseRange");
const volumeRange = document.getElementById("volumeRange");
const echoRange = document.getElementById("echoRange");
const widthRange = document.getElementById("widthRange");
const spacingRange = document.getElementById("spacingRange");
const modeSelect = document.getElementById("modeSelect");
const timbreSelect = document.getElementById("timbreSelect");
const layersSelect = document.getElementById("layersSelect");
const speedValue = document.getElementById("speedValue");
const baseValue = document.getElementById("baseValue");
const volumeValue = document.getElementById("volumeValue");
const echoValue = document.getElementById("echoValue");
const widthValue = document.getElementById("widthValue");
const spacingValue = document.getElementById("spacingValue");
const toggleButton = document.getElementById("toggleButton");
const panicButton = document.getElementById("panicButton");
const statusText = document.getElementById("statusText");
const visualizerCanvas = document.getElementById("visualizerCanvas");
new ShepardVisualizer(visualizerCanvas, engine);

function syncLabels() {
  speedValue.textContent = Number(speedRange.value).toFixed(2);
  baseValue.textContent = baseRange.value;
  volumeValue.textContent = Math.round(Number(volumeRange.value) * 100);
  echoValue.textContent = Math.round(Number(echoRange.value) * 100);
  widthValue.textContent = Math.round(Number(widthRange.value) * 100);
  spacingValue.textContent = Math.round(Number(spacingRange.value) * 100);
}

function setStatus(text) {
  statusText.textContent = text;
}

directionSelect.addEventListener("change", () => {
  engine.setDirection(directionSelect.value);
  setStatus(engine.running ? "Playing" : "Configured");
});

speedRange.addEventListener("input", () => {
  engine.setSpeed(speedRange.value);
  syncLabels();
});

baseRange.addEventListener("input", () => {
  engine.setBaseFrequency(baseRange.value);
  syncLabels();
});

volumeRange.addEventListener("input", () => {
  engine.setVolume(volumeRange.value);
  syncLabels();
});

echoRange.addEventListener("input", () => {
  engine.setEchoMix(echoRange.value);
  syncLabels();
});

widthRange.addEventListener("input", () => {
  engine.setWidth(widthRange.value);
  syncLabels();
});

spacingRange.addEventListener("input", () => {
  engine.setSpacing(spacingRange.value);
  syncLabels();
});

modeSelect.addEventListener("change", () => {
  engine.setMode(modeSelect.value);
});

timbreSelect.addEventListener("change", () => {
  engine.setTimbre(timbreSelect.value);
});

layersSelect.addEventListener("change", () => {
  engine.setLayerCount(layersSelect.value);
});

toggleButton.addEventListener("click", async () => {
  if (engine.running) {
    engine.stop();
    toggleButton.textContent = "Start Audio";
    setStatus("Idle");
    return;
  }

  try {
    await engine.start();
    toggleButton.textContent = "Stop Audio";
    setStatus("Playing");
  } catch (error) {
    console.error(error);
    setStatus("Audio start failed");
  }
});

panicButton.addEventListener("click", () => {
  engine.stop();
  toggleButton.textContent = "Start Audio";
  setStatus("Fading Out");
  window.setTimeout(() => {
    if (!engine.running) {
      setStatus("Idle");
    }
  }, 280);
});

syncLabels();
