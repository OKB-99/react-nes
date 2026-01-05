import { Byte } from "../utils/commons";
import { Controller } from "./controller";

export class KeypadCtrl implements Controller {

  private keyStatus: Byte = 0x00;
  private strobe: 0 | 1 = 0;
  private keyIndex: number = 0;

  constructor() {
    document.addEventListener('keydown', (event: KeyboardEvent) => {
      this.onKeyDown(this.getKeyIndex(event.keyCode));
    });
    document.addEventListener('keyup', (event: KeyboardEvent) => {
      this.onKeyUp(this.getKeyIndex(event.keyCode));
    });
  }

  private onKeyDown(keyIndex: number) {
    this.keyStatus |= (1 << keyIndex);
  }

  private onKeyUp(keyIndex: number) {
    this.keyStatus &= ~(1 << keyIndex);
  }

  read(): 0 | 1 {
    if (this.keyIndex > 7) {
      return 1;
    }

    const status = this.keyStatus & (1 << this.keyIndex) ? 1 : 0;
    if (this.strobe === 0) {
      this.keyIndex++;
    }
    return status;
  }

  write(data: number): void {
    if (data & 0x1) {
      this.keyIndex = 0; // Direction keys
    }
    this.strobe = (data & 0x1) as 0 | 1;
  }

  private getKeyIndex(keyCode: number): number {
    switch (keyCode) {
      case 88: return 0; // X  A 
      case 90: return 1; // Z  B
      case 65: return 2; // A  SELECT
      case 83: return 3; // S  START
      case 38: return 4; // ↑  ↑  
      case 40: return 5; // ↓  ↓
      case 37: return 6; // ←  ←
      case 39: return 7; // →  →
      default: return 8; // Other keys
    }
  }
}