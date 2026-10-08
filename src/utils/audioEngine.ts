/**
 * Audio Engine for Walkie-Talkie Sound FX, Real-time Voice Processing and DSP Filters
 */
import { RogerBeepType, VoiceFilterMode } from '../types/radio';

class AudioEngine {
  private ctx: AudioContext | null = null;
  private micStream: MediaStream | null = null;
  private micSource: MediaStreamAudioSourceNode | null = null;
  private filterNodes: {
    highpass?: BiquadFilterNode;
    lowpass?: BiquadFilterNode;
    distortion?: WaveShaperNode;
    gain?: GainNode;
  } = {};
  private analyser: AnalyserNode | null = null;
  private processedStreamDest: MediaStreamAudioDestinationNode | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private isInitialized = false;

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public getContext(): AudioContext {
    return this.initContext();
  }

  // Create a distortion curve for analog radio saturation
  private makeDistortionCurve(amount = 20): Float32Array {
    const k = amount;
    const nSamples = 44100;
    const curve = new Float32Array(nSamples);
    const deg = Math.PI / 180;
    for (let i = 0; i < nSamples; ++i) {
      const x = (i * 2) / nSamples - 1;
      curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
    }
    return curve;
  }

  // Generate white noise buffer for squelch effects
  private createNoiseBuffer(durationSeconds = 0.2): AudioBuffer {
    const ctx = this.getContext();
    const bufferSize = ctx.sampleRate * durationSeconds;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  /**
   * Sound FX: PTT Button Switch Click & Squelch Burst (when keying the mic)
   */
  public playPttStartFx() {
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;

      // 1. Mechanical switch click (low pop)
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.03);

      oscGain.gain.setValueAtTime(0.4, now);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

      osc.connect(oscGain);
      oscGain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.04);

      // 2. Short squelch noise burst
      const noiseBuffer = this.createNoiseBuffer(0.06);
      const noise = ctx.createBufferSource();
      noise.buffer = noiseBuffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1800, now);
      filter.Q.setValueAtTime(1.5, now);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.12, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      noise.start(now);
      noise.stop(now + 0.06);
    } catch {
      // Audio autoplay policy safety
    }
  }

  /**
   * Sound FX: Squelch Tail (end of carrier reception or PTT release)
   */
  public playSquelchTail() {
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;

      const noiseBuffer = this.createNoiseBuffer(0.08);
      const noise = ctx.createBufferSource();
      noise.buffer = noiseBuffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1600, now);
      filter.Q.setValueAtTime(2.0, now);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      noise.start(now);
      noise.stop(now + 0.08);
    } catch {
      // Audio autoplay policy safety
    }
  }

  /**
   * Sound FX: Authentic Roger Beep (K-tone, Motorola Chirp, NASA tone)
   */
  public playRogerBeep(type: RogerBeepType = 'motorola') {
    if (type === 'none') return;

    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;

      if (type === 'motorola') {
        // Motorola 2-tone chirp (High then Higher or High-Mid)
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';

        // Tone 1: 1100 Hz for 45ms
        osc.frequency.setValueAtTime(1150, now);
        // Tone 2: 1350 Hz for 45ms
        osc.frequency.setValueAtTime(1400, now + 0.045);

        gain.gain.setValueAtTime(0.25, now);
        gain.gain.setValueAtTime(0.25, now + 0.085);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.12);

        // Add tail squelch right after beep
        setTimeout(() => this.playSquelchTail(), 110);
      } else if (type === 'classic') {
        // Classic 1000Hz K-Tone
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1020, now);

        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.13);

        setTimeout(() => this.playSquelchTail(), 120);
      } else if (type === 'nasa') {
        // NASA Apollo Quindar Tone: 2525 Hz
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(2525, now);

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.16);

        setTimeout(() => this.playSquelchTail(), 150);
      }
    } catch {
      // Audio autoplay policy safety
    }
  }

  /**
   * Sound FX: Paging / Radio Alert Call Tone (to get partner's attention)
   */
  public playCallAlertSound() {
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;

      // 4-tone ascending alert chime
      const freqs = [700, 900, 1100, 1400];
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);

        gain.gain.setValueAtTime(0, now + idx * 0.08);
        gain.gain.linearRampToValueAtTime(0.25, now + idx * 0.08 + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.075);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.08);
      });
    } catch {
      // Safety
    }
  }

  /**
   * Sound FX: Channel change knob click
   */
  public playKnobClick() {
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(240, now);
      osc.frequency.exponentialRampToValueAtTime(60, now + 0.02);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.025);
    } catch {
      // Safety
    }
  }

  /**
   * Initialize Microphone input with Walkie-Talkie DSP Radio Filters
   */
  public async initMicrophone(filterMode: VoiceFilterMode = 'radio'): Promise<boolean> {
    try {
      const ctx = this.getContext();
      if (!this.micStream) {
        this.micStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
      }

      if (!this.micSource) {
        this.micSource = ctx.createMediaStreamSource(this.micStream);
      }

      if (!this.analyser) {
        this.analyser = ctx.createAnalyser();
        this.analyser.fftSize = 256;
        this.analyser.smoothingTimeConstant = 0.5;
      }

      this.processedStreamDest = ctx.createMediaStreamDestination();
      this.applyFilterGraph(filterMode);
      this.isInitialized = true;
      return true;
    } catch (err) {
      console.warn('Microphone access denied or error:', err);
      return false;
    }
  }

  /**
   * Reconfigures DSP graph based on filter mode ('radio', 'hd', 'vintage')
   */
  public applyFilterGraph(filterMode: VoiceFilterMode) {
    if (!this.ctx || !this.micSource || !this.analyser || !this.processedStreamDest) {
      return;
    }

    try {
      // Disconnect existing filters
      this.micSource.disconnect();
      if (this.filterNodes.highpass) this.filterNodes.highpass.disconnect();
      if (this.filterNodes.lowpass) this.filterNodes.lowpass.disconnect();
      if (this.filterNodes.distortion) this.filterNodes.distortion.disconnect();
      if (this.filterNodes.gain) this.filterNodes.gain.disconnect();

      const ctx = this.ctx;

      if (filterMode === 'radio' || filterMode === 'vintage') {
        // Highpass filter: cuts rumble below 350 Hz (VHF/UHF radio characteristic)
        const hp = ctx.createBiquadFilter();
        hp.type = 'highpass';
        hp.frequency.setValueAtTime(filterMode === 'vintage' ? 450 : 350, ctx.currentTime);
        hp.Q.setValueAtTime(0.9, ctx.currentTime);

        // Lowpass filter: cuts highs above 3000 Hz (Walkie-talkie bandwidth)
        const lp = ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.setValueAtTime(filterMode === 'vintage' ? 2400 : 3100, ctx.currentTime);
        lp.Q.setValueAtTime(1.1, ctx.currentTime);

        // Gentle analog saturation / radio limiter
        const dist = ctx.createWaveShaper();
        dist.curve = this.makeDistortionCurve(filterMode === 'vintage' ? 25 : 12) as unknown as Float32Array<ArrayBuffer>;
        dist.oversample = '2x';

        // Gain boost to compensate for bandpass filtering
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(1.4, ctx.currentTime);

        // Connect chain: Mic -> Highpass -> Lowpass -> Distortion -> Gain -> Analyser & Destination
        this.micSource.connect(hp);
        hp.connect(lp);
        lp.connect(dist);
        dist.connect(gain);
        gain.connect(this.analyser);
        gain.connect(this.processedStreamDest);

        this.filterNodes = { highpass: hp, lowpass: lp, distortion: dist, gain };
      } else {
        // HD Intercom mode (Crystal clear audio)
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(1.0, ctx.currentTime);

        this.micSource.connect(gain);
        gain.connect(this.analyser);
        gain.connect(this.processedStreamDest);

        this.filterNodes = { gain };
      }
    } catch (e) {
      console.error('Failed to configure audio filters', e);
    }
  }

  /**
   * Start transmission: returns the processed audio stream for WebRTC
   */
  public startTransmitting(onRecordingReady?: (blob: Blob) => void): MediaStream | null {
    this.playPttStartFx();

    if (!this.processedStreamDest) {
      return null;
    }

    const stream = this.processedStreamDest.stream;

    // Start local recording for playback history
    try {
      this.recordedChunks = [];
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';

      this.mediaRecorder = new MediaRecorder(stream, { mimeType });
      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          this.recordedChunks.push(e.data);
        }
      };
      this.mediaRecorder.onstop = () => {
        if (this.recordedChunks.length > 0 && onRecordingReady) {
          const blob = new Blob(this.recordedChunks, { type: 'audio/webm' });
          onRecordingReady(blob);
        }
      };
      this.mediaRecorder.start(100);
    } catch {
      // MediaRecorder might not be supported on all mobile webviews
    }

    return stream;
  }

  /**
   * Stop transmission: stops recording and plays Roger Beep
   */
  public stopTransmitting(rogerBeep: RogerBeepType = 'motorola') {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      try {
        this.mediaRecorder.stop();
      } catch {
        // Ignore
      }
    }
    this.playRogerBeep(rogerBeep);
  }

  /**
   * Play an incoming audio blob or stream through the radio speaker
   */
  public async playIncomingAudio(audioBlob: Blob, rogerBeep: RogerBeepType = 'motorola', filterMode: VoiceFilterMode = 'radio') {
    try {
      const ctx = this.getContext();
      // 1. Play opening squelch
      this.playPttStartFx();

      const arrayBuffer = await audioBlob.arrayBuffer();
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer);

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;

      // Filter incoming audio like an authentic speaker
      const hp = ctx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.setValueAtTime(filterMode === 'vintage' ? 450 : 350, ctx.currentTime);

      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.setValueAtTime(filterMode === 'vintage' ? 2400 : 3200, ctx.currentTime);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(1.1, ctx.currentTime);

      source.connect(hp);
      hp.connect(lp);
      lp.connect(gain);
      gain.connect(ctx.destination);

      source.onended = () => {
        this.playRogerBeep(rogerBeep);
      };

      source.start();
    } catch (err) {
      console.warn('Failed to play incoming transmission audio', err);
    }
  }

  /**
   * Real-time VU Meter audio level analyzer (0.0 to 1.0)
   */
  public getAudioLevel(): number {
    if (!this.analyser) return 0;
    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteTimeDomainData(dataArray);

    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      const val = (dataArray[i] - 128) / 128;
      sum += val * val;
    }
    const rms = Math.sqrt(sum / dataArray.length);
    // Scale RMS dynamically
    const level = Math.min(1, rms * 4.5);
    return level;
  }

  public getStream(): MediaStream | null {
    return this.processedStreamDest?.stream || this.micStream;
  }

  public isReady(): boolean {
    return this.isInitialized && this.micStream !== null;
  }

  public cleanup() {
    if (this.micStream) {
      this.micStream.getTracks().forEach((track) => track.stop());
    }
    if (this.ctx) {
      this.ctx.close();
    }
  }
}

export const audioEngine = new AudioEngine();
