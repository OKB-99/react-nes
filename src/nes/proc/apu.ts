import { lengthCounterTbl } from "../audio/lookup-table";
import { NoiseChannel } from "../audio/noise-channel";
import { PulseChannel } from "../audio/pulse-channel";
import { TriangleChannel } from "../audio/triangle-channel";
import { Interrupts } from "../bus/interrupts";
import { NesConfig } from "../nes-config";
import { Byte, Word } from "../utils/commons";
import { CLOCKS_PER_FRAME } from "../utils/constants";

export class APU {

  private audioCtx: AudioContext;
  private pulseChannel1!: PulseChannel;
  private timer1 = 0;
  private pulseChannel2!: PulseChannel;
  private timer2 = 0;
  private triangleChannel!: TriangleChannel;
  private timer3 = 0;
  private sequencer = 0;
  private noiseChannel!: NoiseChannel;
  private interrupts: Interrupts;

  constructor(nesConfig: NesConfig, interrupts: Interrupts) {
    this.audioCtx = new AudioContext();
    this.pulseChannel1 = new PulseChannel(this.audioCtx, nesConfig, 1);
    this.pulseChannel2 = new PulseChannel(this.audioCtx, nesConfig, 2);
    this.triangleChannel = new TriangleChannel(this.audioCtx, nesConfig);
    this.noiseChannel = new NoiseChannel(this.audioCtx, nesConfig);
    this.interrupts = interrupts;
  }

  writeReg(addr: Word, data: Byte): void {
    if (addr === 0x0000) {
      this.pulseChannel1.init(data);
    } else if (addr === 0x0001) {
      this.pulseChannel1.setSweep(data);
    } else if (addr === 0x0002) {
      this.timer1 = data;
    } else if (addr === 0x0003) {
      this.timer1 |= ((data & 0x07) << 8);
      const lengthCounter = lengthCounterTbl[(data >> 3) & 0x1F];
      this.pulseChannel1.start(this.timer1, lengthCounter);
    } else if (addr === 0x0004) {
      this.pulseChannel2.init(data);
    } else if (addr === 0x0005) {
      this.pulseChannel2.setSweep(data);
    } else if (addr === 0x0006) {
      this.timer2 = data;
    } else if (addr === 0x0007) {
      this.timer2 |= ((data & 0x07) << 8);
      const lengthCounter = lengthCounterTbl[(data >> 3) & 0x1F];
      this.pulseChannel2.start(this.timer2, lengthCounter);
    } else if (addr === 0x0008) {
      this.triangleChannel.init(data);
    } else if (addr === 0x0009) {
      //Do nothing.
    } else if (addr === 0x000A) {
      this.timer3 = data;
    } else if (addr === 0x000B) {
      this.timer3 |= ((data & 0x07) << 8);
      const lengthCounter = lengthCounterTbl[(data >> 3) & 0x1F];
      this.triangleChannel.start(this.timer3, lengthCounter);
    } else if (addr === 0x000C) {
      this.noiseChannel.setEnvelope(data);
    } else if (addr === 0x000D) {
      //Do nothing.
    } else if (addr === 0x000E) {
      this.noiseChannel.setModeAndPeriod(data);
    } else if (addr === 0x000F) {
      this.noiseChannel.setLength(data);
    } else if (addr === 0x0015) {
      if (((data >>> 3) & 0x01) === 0) {
        this.noiseChannel.disable();
      }
      if (((data >>> 2) & 0x01) === 0) {
        this.triangleChannel.disable();
      }
      if (((data >>> 1) & 0x01) === 0) {
        this.pulseChannel2.disable();
      }
      if (((data >>> 0) & 0x01) === 0) {
        this.pulseChannel1.disable();
      }
    } else if (addr === 0x0017) {
      if ((data & 0xC0) === 0) {
        this.interrupts.setIrq(true);
      } else {
        this.interrupts.setIrq(false);
      }
    }
  }

  run(): void {

    const firstQuartPerFrame = ~~(CLOCKS_PER_FRAME / 4);
    const secondQuartPerFrame = firstQuartPerFrame * 2;
    const thirdQuartPerFrame = firstQuartPerFrame * 3;
    const fourthQuartPerFrame = firstQuartPerFrame * 4;

    // 240 Hz
    switch(this.sequencer++) {
      case firstQuartPerFrame:
      case thirdQuartPerFrame:
        this.triangleChannel.countLength();
        this.pulseChannel1.countEnvelope();
        this.pulseChannel2.countEnvelope();
        this.noiseChannel.countEnvelope();
        break;
      // @ts-ignore
      case fourthQuartPerFrame:
        this.sequencer = 0;
      case secondQuartPerFrame:
        this.pulseChannel1.countEnvelope();
        this.pulseChannel2.countEnvelope();
        this.pulseChannel1.countLengthAndSweep();
        this.pulseChannel2.countLengthAndSweep();
        this.triangleChannel.countLength();
        this.noiseChannel.countEnvelope();
        this.noiseChannel.countLength();
        break;
      default:
        //Do nothing
        break;
    }

    //this.pulseChannel1.countTimer();
    //this.pulseChannel2.countTimer();
    this.noiseChannel.countTimer();
  }

  closeAudioCtx() {
    this.audioCtx.close();
  }
}