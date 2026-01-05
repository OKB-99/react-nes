import { Byte } from '../utils/commons';
import { AudioConfig } from './audio-config';
import { lengthCounterTbl, noisePeriodTbl } from './lookup-table';

export class NoiseChannel {

  private audioCtx: AudioContext;
  private whiteNoise : AudioBufferSourceNode;
  private gainNode: GainNode;
  private bandpass: BiquadFilterNode;
  private audioConfig: AudioConfig;

  /** Register 0 */
  private envelopePeriod = 0;
  private envelopeDivider = 0;
  private envelopeStartFlag = false;
  private envelopeDecay = 0;
  private counterHalt = false; // Envelope Loop
  private constantVolume = false;

  private mode!: 'longLFSR' | 'shortLFSR';
  private noisePeriod!: number;
  private noiseTimer = 0;
  private shifter: number[] = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1];

  private lengthCounter = 0;

  private isPlaying = false;

  constructor(audioCtx: AudioContext, audioConfig: AudioConfig) {
    this.audioCtx = audioCtx;
    this.audioConfig = audioConfig;
    this.gainNode = this.audioCtx.createGain();

    const bufferSize = 2 * this.audioCtx.sampleRate;
    const noiseBuffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random();
    }

    this.whiteNoise = this.audioCtx.createBufferSource();
    this.whiteNoise.buffer = noiseBuffer;
    this.whiteNoise.loop = true;
    this.whiteNoise.start();
    this.bandpass = this.audioCtx.createBiquadFilter();
    this.bandpass.type = "peaking";
    this.bandpass.frequency.value = 1500;
    this.bandpass.Q.value = 1;
    this.bandpass.gain.value = -5;
    this.gainNode.connect(this.bandpass);
    this.bandpass.connect(this.audioCtx.destination);
  }

  setEnvelope(reg0: Byte) {

    this.counterHalt = ((reg0 >> 5) & 0x01) === 1;
    this.constantVolume = ((reg0 >> 4) & 0x01) === 1;
    this.envelopePeriod = reg0 & 0x0F;
  }

  setModeAndPeriod(reg2: Byte) {
    this.mode = (reg2 >> 7) & 0x01 ? 'shortLFSR' : 'longLFSR';
    this.noisePeriod = noisePeriodTbl[reg2 & 0x0F];
    this.noiseTimer = this.noisePeriod;
  }

  setLength(reg3: Byte) {
    this.lengthCounter = lengthCounterTbl[(reg3 >> 3) & 0x1F];
    this.envelopeStartFlag = true;
    this.whiteNoise.connect(this.gainNode);
    this.isPlaying = true;
  }

  countTimer() {

    if (this.noiseTimer == 0) {
      this.noiseTimer = this.noisePeriod;
      if (this.mode) {
        let feedback = 0;
        if (this.mode === 'longLFSR') {
          feedback = this.shifter[14] ^ this.shifter[13];
        } else {
          feedback = this.shifter[14] ^ this.shifter[8];
        }
        this.shifter.pop();
        this.shifter.unshift(feedback);
      }
    } else {
      this.noiseTimer--;
    }
  }

  countEnvelope() {
    if (this.envelopeStartFlag) {
      this.envelopeStartFlag = false;
      this.envelopeDecay = 15;
      this.envelopeDivider = this.envelopePeriod;
    } else {
      if (this.envelopeDivider > 0) {
        this.envelopeDivider--;
      } else {
        this.envelopeDivider = this.envelopePeriod;
        if (this.envelopeDecay > 0) {
          this.envelopeDecay--;
        } else if (this.counterHalt) {
          this.envelopeDecay = 15;
        }
      }
    }
  }

  countLength() {
    if (this.lengthCounter > 0 && !this.counterHalt) {
      this.lengthCounter--;
      if (this.lengthCounter === 0) {
        this.stop();
      }
    }

    // The shifter is not used.
    const outputVolume = this.constantVolume ? this.envelopePeriod : this.envelopeDecay;
    this.setVolume(outputVolume);
  }

  disable() {
    this.stop();
    this.counterHalt = true;
  }

  private stop() {
    if (this.isPlaying) {
      this.whiteNoise.disconnect(this.gainNode);
      this.isPlaying = false;
    }
  }

  private setVolume(volume: number) {
    volume = Math.max(0, Math.min(1, volume / 16));
    this.gainNode.gain.value = volume * this.audioConfig.masterVolume;
  }
}