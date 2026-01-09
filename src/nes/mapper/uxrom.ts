import { RAM, ROM } from "../utils/commons";
import { Mapper } from "./mapper";

export class UxROM extends Mapper {
  private prgBanks: number;
  private bankSelect: number = 0;

  constructor(prgROM: ROM, chrROM: ROM | RAM) {
    super(prgROM, chrROM);
    this.prgBanks = prgROM.size / 0x4000;
  }

  override readPrg(addr: number): number {
    if (addr < 0x4000) {
      // Switchable bank
      const bankedAddr = (this.bankSelect * 0x4000) + addr;
      return this.prgROM.read(bankedAddr);
    } else {
      // Fixed to last bank
      const bankedAddr = ((this.prgBanks - 1) * 0x4000) + addr - 0x4000;
      return this.prgROM.read(bankedAddr);
    }
  }

  override writePrg(addr: number, value: number): void {
    this.bankSelect = value % this.prgBanks;
  }
}