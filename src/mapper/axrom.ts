import { RAM, ROM } from "../utils/commons";
import { Mapper } from "./mapper";

export class AxROM extends Mapper {
  private prgBanks: number;
  private bankSelect: number = 0;

  constructor(prgROM: ROM, chrROM: ROM | RAM) {
    super(prgROM, chrROM);
    this.prgBanks = prgROM.size / 0x4000;
  }

  override readPrg(addr: number): number {
    const bankedAddr = (this.bankSelect * 0x4000) + addr;
    return this.prgROM.read(bankedAddr);
  }

  override writePrg(addr: number, value: number): void {
    this.bankSelect = (value & 0x07) * 2; //(value & 0x07) * 0x8000;
    //TODO set mirroring
  }
}