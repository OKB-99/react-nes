import { RAM, ROM } from "../utils/commons";
import { Mapper } from "./mapper";

export class CNROM extends Mapper {
  private chrBanks: number;
  private bankSelect: number = 0;

  constructor(prgROM: ROM, chrROM: ROM | RAM) {
    super(prgROM, chrROM);
    this.chrBanks = chrROM.size / 0x2000;
  }

  override writePrg(addr: number, value: number): void {
    this.bankSelect = value % this.chrBanks;
  }

  override readChr(addr: number): number {
    const bankedAddr = (this.bankSelect * 0x2000) + addr;
    return this.chrROM.read(bankedAddr);
  }
}