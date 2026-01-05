import { Byte } from "../utils/commons";
import { CPU_CLOCKS, FRAME_RATE } from "../utils/constants";
import { AudioConfig } from "./audio-config";

export class TriangleChannel {

  private audioCtx: AudioContext;
  private gainNode: GainNode;
  private oscillator: OscillatorNode;
  private audioConfig: AudioConfig;

  /** Register 0 */
  private linearCounter = 0;
  private linearCounterToReload = 0;
  private linearCounterReloadFlag = false;
  private counterHalt = false;
  private lengthCounter = 0;

  private isPlaying = false;

  constructor(audioCtx: AudioContext, audioConfig: AudioConfig) {
    this.audioCtx = audioCtx;
    this.audioConfig = audioConfig;
    this.gainNode = this.audioCtx.createGain();
    this.gainNode.connect(this.audioCtx.destination);
    this.oscillator = this.audioCtx.createOscillator();
    this.oscillator.type = 'triangle';
    this.oscillator.start();
  }

  init(linearCounterAndControl: Byte) {

    this.counterHalt = ((linearCounterAndControl >> 7) & 0x01) === 1;
    this.linearCounter = linearCounterAndControl & 0x7F;
  }

  start(timer: number, lengthCounter: number): void {

    if (this.isPlaying) {
      this.stop();
    }

    this.setFrequencyByTimer(timer);
    this.setVolume(0.1);
    this.oscillator.connect(this.gainNode);
    this.isPlaying = true;

    this.lengthCounter = lengthCounter;
    this.linearCounterToReload = lengthCounter;
    this.linearCounterReloadFlag = true;
  }

  countLength() {

    if (this.linearCounterReloadFlag) {
      this.linearCounter = this.linearCounterToReload;
      this.linearCounterReloadFlag = false;
    } else if (this.linearCounter > 0) {
      this.linearCounter--;
    }

    if (!this.counterHalt && this.lengthCounter > 0) {
      this.lengthCounter--;
    }
    if (this.lengthCounter === 0 || this.linearCounter === 0) {
      this.stop();
    }
  }

  disable() {
    this.stop();
    this.counterHalt = true;
  }

  private stop() {
    if (this.isPlaying) {
      this.oscillator.disconnect(this.gainNode);
      this.isPlaying = false;
    }
  }

  private setFrequencyByTimer(timer: number) {
    const frequency = CPU_CLOCKS / (32 * (timer + 1)); // NTSC APU clock
    this.oscillator.frequency.setValueAtTime(frequency, this.audioCtx.currentTime);
  }

  private setVolume(volume: number) {
    volume = Math.max(0, Math.min(1, volume));
    this.gainNode.gain.value = volume * this.audioConfig.masterVolume;
  }
}