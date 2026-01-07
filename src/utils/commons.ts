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

export type KeyboardKey = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I' | 'J' | 'K' | 'L' | 'M' | 'N' | 'O' | 'P' |
    'Q' | 'R' | 'S' | 'T' | 'U' | 'V' | 'W' | 'X' | 'Y' | 'Z' | '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9';

export interface KeyboardMap {
  A: KeyboardKey;
  B: KeyboardKey;
  SELECT: KeyboardKey;
  START: KeyboardKey;
}

export function getKeycodeFromKey(str: KeyboardKey): number {
  switch(str) {
    case 'A': return 65;
    case 'B': return 66;
    case 'C': return 67;
    case 'D': return 68;
    case 'E': return 69;
    case 'F': return 70;
    case 'G': return 71;
    case 'H': return 72;
    case 'I': return 73;
    case 'J': return 74;
    case 'K': return 75;
    case 'L': return 76;
    case 'M': return 77;
    case 'N': return 78;
    case 'O': return 79;
    case 'P': return 80;
    case 'Q': return 81;
    case 'R': return 82;
    case 'S': return 83;
    case 'T': return 84;
    case 'U': return 85;
    case 'V': return 86;
    case 'W': return 87;
    case 'X': return 88;
    case 'Y': return 89;
    case 'Z': return 90;
    case '0': return 48;
    case '1': return 49;
    case '2': return 50;
    case '3': return 51;
    case '4': return 52;
    case '5': return 53;
    case '6': return 54;
    case '7': return 55;
    case '8': return 56;
    case '9': return 57;
    default: return 0;
  }
}