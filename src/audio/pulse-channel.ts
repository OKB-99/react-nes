import { Byte } from '../utils/commons';
import { CPU_CLOCKS, FRAME_RATE } from '../utils/constants';
import { AudioConfig } from './audio-config';
import { pulse } from './pulse';

export class PulseChannel {

  private pulseNum: 1 | 2;
  private audioCtx: AudioContext;
  private gainNode: GainNode;
  private oscillator: OscillatorNode;
  private audioConfig: AudioConfig;

  /** Register 0 */
  private dutySequence: number[] = [];
  private envelopePeriod = 0;
  private envelopeDivider = 0;
  private envelopeStartFlag = false;
  private envelopeDecay = 0;
  private counterHalt = false; // Envelope Loop
  private constantVolume = false;

  /** Register 1 */
  private sweepEnabled = false;
  private sweepCounter = 0;
  private sweepDivider = 0;
  private sweepNegate = false;
  private sweepShift = 0;

  private lengthCounter = 0;
  private initTimer= 0;
  private timer = 0;

  private isPlaying = false;

  private duties = [
    [0, 0, 0, 0, 0, 0, 0, 1], // 12.5%
    [0, 0, 0, 0, 0, 0, 1, 1], // 25%
    [0, 0, 0, 0, 1, 1, 1, 1], // 50%
    [1, 1, 1, 1, 1, 1, 0, 0]  // 75%
  ];
  private dutyIndex = 0;

  private readonly dutyCycles = ['0.125', '0.25', '0.5', '0.75'];
  private waves: {[key: string]: PeriodicWave} = {};

  constructor(audioCtx: AudioContext, audioConfig: AudioConfig, pulseNum: 1 | 2) {
    this.pulseNum = pulseNum;
    this.audioCtx = audioCtx;
    this.audioConfig = audioConfig;
    this.gainNode = this.audioCtx.createGain();
    this.gainNode.connect(this.audioCtx.destination);
    this.oscillator = this.audioCtx.createOscillator();
    this.oscillator.type = 'square';
    this.oscillator.start();

    this.dutyCycles.forEach((duty) => {
      const { real, imag } = pulse[duty as keyof typeof pulse];
      this.waves[duty] = this.audioCtx.createPeriodicWave(real, imag);
    });

  }

  init(reg0: Byte) {

    const dutyKey = this.dutyCycles[(reg0 >> 6) & 0x03];
    this.oscillator.setPeriodicWave(this.waves[dutyKey]);
    //this.dutySequence = this.duties[(reg0 >> 6) & 0x03];
    //this.dutyIndex = 0;

    this.counterHalt = ((reg0 >> 5) & 0x01) === 1;
    this.constantVolume = ((reg0 >> 4) & 0x01) === 1;
    this.envelopePeriod = reg0 & 0x0F;
  }

  setSweep(reg1: Byte): void {
    this.sweepEnabled = ((reg1 >> 7) & 0x01) === 1;
    this.sweepDivider = (reg1 >> 4) & 0x07;
    this.sweepNegate = ((reg1 >> 3) & 0x01) === 1;
    this.sweepShift = reg1 & 0x07;
  }

  start(timer: number, lengthCounter: number): void {

    if (this.isPlaying) {
      this.stop();
    }

    this.initTimer = timer;
    this.timer = timer;
    this.setFrequencyByTimer(timer);
    //this.oscillator.connect(this.gainNode).connect(this.audioCtx.destination);
    this.oscillator.connect(this.gainNode);
    this.isPlaying = true;

    this.lengthCounter = lengthCounter;
    this.sweepCounter = 0;
    this.envelopeStartFlag = true;
  }

  // Not used.
  countTimer() {
    if (this.dutySequence.length === 0)
      return;

    if (this.timer == 0) {
      this.dutyIndex = (this.dutyIndex + 1) & 7;
      this.timer = this.initTimer;
    } else {
      this.timer--;
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

  countLengthAndSweep() {
    if (this.lengthCounter > 0 && !this.counterHalt) {
      this.lengthCounter--;
      if (this.lengthCounter === 0) {
        //this.oscillator.stop();
        this.stop();
      }
    }

    this.sweepCounter++;
    if (this.sweepEnabled && this.sweepCounter >= this.sweepDivider) {
      const currentFreq =  this.oscillator.frequency.value;
      let newFreq = currentFreq + (currentFreq >> this.sweepShift) * (this.sweepNegate ? -1 : 1);

      if (this.pulseNum === 1 && this.sweepNegate) {
        newFreq = newFreq - 1;
      }

      if (newFreq > 0xFFF) {
        newFreq = 0xFFF;
        this.stop();
      } else if (newFreq < 0x10) {
        newFreq = 0x10;
        this.stop();
      }
      this.setFrequencyByTimer(newFreq);
    }

    //const sampleBit = this.dutySequence[this.dutyIndex];
    const outputVolume = this.constantVolume ? this.envelopePeriod : this.envelopeDecay;
    //this.setVolume(sampleBit ? outputVolume : 0);
    this.setVolume(outputVolume);
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
    const frequency = CPU_CLOCKS / (16 * (timer + 1));
    this.oscillator.frequency.setValueAtTime(frequency, this.audioCtx.currentTime);
  }

  private setVolume(volume: number) {
    volume = Math.max(0, Math.min(1, volume / 16));
    this.gainNode.gain.value = volume * this.audioConfig.masterVolume;
  }

}