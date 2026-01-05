export type Byte = number; // 1 byte
export type Word = number; // 2 bytes
export type Dummy = object;

export interface ROM {

  read(addr: Word): Byte;

  get size(): number;
}

export interface RAM {

  write(addr: Word, data: Byte): void;

  read(addr: Word): Byte;

  get size(): number;
}

export class Memory implements RAM, ROM {

  private data: Uint8Array;

  constructor(data: Uint8Array) {
    this.data = data;
  }

  read(addr: Word): Byte {
    return this.data[addr];
  }

  write(addr: Word, data: Byte): void {
    this.data[addr] = data;
  }

  get size(): number {
    return this.data.length;
  }
}

export type MapperType = 'NROM' | 'UXROM' | 'MMC1' | 'CNROM' | 'MMC3' | 'AOROM' |
    'COLORDREAMS' | 'COLORDREAMS46' | 'GNROM';