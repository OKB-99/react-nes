import { RAM, ROM } from "../utils/commons";
import { Mapper } from "./mapper";

export class NROM extends Mapper {

  constructor(prgROM: ROM, chrROM: ROM | RAM) {
    super(prgROM, chrROM);
  }
}