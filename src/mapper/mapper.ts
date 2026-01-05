import { RAM, ROM } from "../utils/commons";

export class Mapper {

  prgROM: ROM;
  chrROM: RAM | ROM;

  constructor(prgROM: ROM, chrROM: RAM | ROM) {
    this.prgROM = prgROM;
    this.chrROM = chrROM;
  }

  readPrg(addr: number): number {
    if (this.prgROM.size <= 0x4000 && addr >= 0x4000) {
      addr = addr - 0x4000;
    }
    return this.prgROM.read(addr);
  }

  writePrg(addr: number, value: number): void {
    console.warn(`Method not supported: writePrg (addr 0x${addr.toString(16)}, value ${value})`);
  }

  /**
   * @param addr: Address in the range 0x0000 - 0x1FFF
   * @returns 
   */
  readChr(addr: number): number {
    return this.chrROM.read(addr);
  }

  writeChr(addr: number, value: number): void {
    if ((<RAM> this.chrROM).write === undefined) {
      throw new Error(`Method not supported: writeChr(addr 0x${addr.toString(16)}, value ${value})`);
    }
    (<RAM> this.chrROM).write(addr, value);
  }

}