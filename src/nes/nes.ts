import { CpuBus } from "./bus/cpu-bus";
import { Interrupts } from "./bus/interrupts";
import { PpuBus } from "./bus/ppu-bus";
import { CanvasRenderer } from "./canvas/canvas-renderer";
import { FrameObj } from "./canvas/frame-obj";
import { AxROM } from "./mapper/axrom";
import { CNROM } from "./mapper/cnrom";
import { Mapper } from "./mapper/mapper";
import { NROM } from "./mapper/nrom";
import { UxROM } from "./mapper/uxrom";
import { APU } from "./proc/apu";
import { CPU } from "./proc/cpu";
import { PPU } from "./proc/ppu";
import { ROM, RAM, MapperType } from "./utils/commons";
import { FRAME_RATE } from "./utils/constants";
import { Memory } from "./utils/commons";
import { NesConfig } from "./nes-config";

export class NES {

  private terminated = false;
  private cpu = null as CPU | null;
  private canvasRenderer = new CanvasRenderer();

  constructor(buffer: ArrayBuffer, nesConfig: NesConfig) {
    const [ headers, programRom, characterRom ] = this.parse(buffer);

    const mapper = this.getMap(headers, programRom, characterRom);
    const wram = new Memory(new Uint8Array(0x800)); // 2KB
    const ppuBus = new PpuBus(headers, mapper);
    const interrupts = new Interrupts();
    const ppu = new PPU(ppuBus, wram, interrupts);
    const apu = new APU(nesConfig, interrupts);

    const cpuBus = new CpuBus(mapper, wram, ppu, apu, nesConfig);
    this.cpu = new CPU(cpuBus, interrupts);

    let then = performance.now();

    const FRAME_DURATION = 1000 / FRAME_RATE; // 16.7 ms

    let loopcount = 0
    const loop = (now: number) => {

      if (this.terminated) {
        apu.closeAudioCtx();
        return;
      }

      requestAnimationFrame(loop);

      const elapsed = now - then;

      if (elapsed > FRAME_DURATION) {
        then = now - (elapsed % FRAME_DURATION);
        //if (loopcount++ % FRAME_RATE === 0) {
        //  console.log(`frame: ${new Date().getSeconds()}.${new Date().getMilliseconds()}`);
        //}
        this.frame(ppu, apu);
      }
    }

    requestAnimationFrame(loop);
  }

  terminate() {
    this.terminated = true;
  }

  frame(ppu: PPU, apu: APU) {
  
    if (this.cpu === null) {
      throw new Error("CPU not initialized.");
    }
  
    let frameObj: FrameObj | null = null;
  
    do {
      let cycle = this.cpu.run();
  
      for (let ppuCycle = 0; ppuCycle < cycle * 3; ppuCycle++) {
        const newFrameOrNull = ppu.run();
        if (!frameObj && newFrameOrNull) {
          frameObj = newFrameOrNull;
        }
      }
  
      for (let apuCycle = 0; apuCycle < cycle; apuCycle++) {
        apu.run();
      }
  
    } while (frameObj === null);
  
    this.canvasRenderer.render(frameObj);
  }

  cpuReset() {
    if (this.cpu !== null) {
      this.cpu.reset();
    }
  }

  private parse(buf: ArrayBuffer): [Uint8Array, ROM, ROM | RAM] {
    const NES_HEADER_SIZE = 0x10;
    const bytes = new Uint8Array(buf);
  
    const prgRomSize = bytes[4] * 0x4000; // 16KB units
    const chrRomSize = bytes[5] * 0x2000;  // 8KB units
  
    const hasTrainer = (bytes[6] & 0x04) !== 0;
    const trainerOffset = hasTrainer ? 512 : 0;
  
    const prgRomStart = NES_HEADER_SIZE + trainerOffset;
    const prgRomEnd = prgRomStart + prgRomSize;
  
    const headers = bytes.slice(0, prgRomStart);
    const prgRom = bytes.slice(prgRomStart, prgRomEnd);
  
    let chrRomOrRam = null;
    if (chrRomSize > 0) {
      const chrRomStart = prgRomEnd;
      const chrRomEnd = chrRomStart + chrRomSize;
      const chrRom = bytes.slice(chrRomStart, chrRomEnd);
      chrRomOrRam = new Memory(chrRom) as ROM;
    } else {
      const chrRam = new Uint8Array(0x2000); // 8KB of CHR RAM
      chrRomOrRam = new Memory(chrRam) as RAM;
    }
  
    return [headers, new Memory(prgRom) as ROM, chrRomOrRam];
  }

  private getMap(headers: Uint8Array, prgRom: ROM, chrRom: ROM | RAM): Mapper {
    const mapperNum = ((headers[6] >> 4) | (headers[7] & 0xF0)) >>> 0;
  
    let mapper = null;
    let mapperType: MapperType = 'NROM';
  
    switch (mapperNum) {
        case 0:
            mapper = new NROM(prgRom, chrRom);
            break;
        case 1:
        case 105:
        case 155:
            throw new Error(`Unsupported MMC1 mapper: ${mapperNum}`);
        case 2:
        case 94:
        case 180:
            mapper = new UxROM(prgRom, chrRom);
            mapperType = 'UXROM';
            break;
        case 3:
        case 185:
            mapper = new CNROM(prgRom, chrRom);
            mapperType = 'CNROM';
            break;
        case 4:
        case 118:
        case 119:
            throw new Error(`Unsupported MMC3 mapper: ${mapperNum}`);
        case 5:
            throw new Error(`Unsupported MMC5 mapper: ${mapperNum}`);
        case 7:
            mapper = new AxROM(prgRom, chrRom);
            mapperType = 'CNROM';
            break;
        default:
            // MMC1, CNROM, MMC3, AOROM, COLORDREAMS, COLORDREAMS46, GNROM to be supported
           console.log(`Unsupported mapper: ${mapperNum}`);
           mapper = new Mapper(prgRom, chrRom);
    }
    console.log(`Mapper Type: ${mapperType} (${mapperNum})`);
    return mapper;
  }
}