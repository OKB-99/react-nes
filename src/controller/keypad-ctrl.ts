import { NesConfig } from "../nes-config";
import { Byte, getKeycodeFromKey, KeyboardMap } from "../utils/commons";
import { Controller } from "./controller";

export class KeypadCtrl implements Controller {

  private nesConfig: NesConfig;
  private keyStatus: Byte = 0x00;
  private strobe: 0 | 1 = 0;
  private keyIndex: number = 0;

  private keyboardMap: KeyboardMap;
  private keycodeA: number;
  private keycodeB: number;
  private keycodeStart: number;
  private keycodeSelect: number;

  constructor(nesConfig: NesConfig) {
    document.addEventListener('keydown', (event: KeyboardEvent) => {
      this.onKeyDown(this.getKeyIndex(event.keyCode));
    });
    document.addEventListener('keyup', (event: KeyboardEvent) => {
      this.onKeyUp(this.getKeyIndex(event.keyCode));
    });

    this.nesConfig = nesConfig;
    this.updateKeycode();
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

  updateKeycode() {
    const sKeyboardMap = localStorage.getItem('keyboard-map');
    this.keyboardMap = JSON.parse(sKeyboardMap);
    this.keycodeA = getKeycodeFromKey(this.keyboardMap.A);
    this.keycodeB = getKeycodeFromKey(this.keyboardMap.B);
    this.keycodeSelect = getKeycodeFromKey(this.keyboardMap.SELECT);
    this.keycodeStart = getKeycodeFromKey(this.keyboardMap.START);
  }

  private getKeyIndex(keycode: number): number {
    if (this.nesConfig.updateKeyboardMap) {
      this.updateKeycode();
      this.nesConfig.updateKeyboardMap = false;
    }

    switch (keycode) {
      case this.keycodeA: return 0; // X  A
      case this.keycodeB: return 1; // Z  B
      case this.keycodeSelect: return 2; // A  SELECT
      case this.keycodeStart: return 3; // S  START
      case 38: return 4; // ↑  ↑  
      case 40: return 5; // ↓  ↓
      case 37: return 6; // ←  ←
      case 39: return 7; // →  →
      default: return 8; // Other keys
    }
  }
}