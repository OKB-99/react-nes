import { NesConfig } from "../nes-config";
import { Byte } from "../utils/commons";
import { FRAME_RATE } from "../utils/constants";
import { Controller } from "./controller";

export class GamepadCtrl implements Controller {

  private interval: NodeJS.Timeout;
  private nesConfig: NesConfig;

  constructor(nesConfig: NesConfig) {
    //console.log("Gamepad controller initialized");
    this.interval = setInterval(() => this.readButtons(), 1000/FRAME_RATE);
    this.nesConfig = nesConfig;
  }

  private keyStatus: Byte = 0x00;
  private strobe: 0 | 1 = 0;
  private keyIndex: number = 0;

  private readButtons() {
    const gamepad = navigator.getGamepads()[0];
    if (!gamepad) {
      clearInterval(this.interval);
      return;
    }

    if (gamepad.axes[0] < -0.5) {
      this.keyStatus |= (1 << 6); // Left
      this.keyStatus &= ~(1 << 7);
    } else if (gamepad.axes[0] > 0.5) {
      this.keyStatus |= (1 << 7); // Right
      this.keyStatus &= ~(1 << 6);
    } else {
      this.keyStatus &= ~(1 << 6);
      this.keyStatus &= ~(1 << 7);
    }

    if (gamepad.axes[1] < -0.5) {
      this.keyStatus |= (1 << 4); // Down
      this.keyStatus &= ~(1 << 5);
    } else if (gamepad.axes[1] > 0.5) {
      this.keyStatus |= (1 << 5); // Up
      this.keyStatus &= ~(1 << 4);
    } else {
      this.keyStatus &= ~(1 << 5);
      this.keyStatus &= ~(1 << 4);
    }

    if (gamepad.buttons[0].pressed) {
     this.keyStatus |= (1 << 2) // Select
    } else {
       this.keyStatus &= ~(1 << 0);
    }

    if (gamepad.buttons[1].pressed) {
     this.keyStatus |= (1 << 1) // B
    } else {
       this.keyStatus &= ~(1 << 1);
    }

    if (gamepad.buttons[2].pressed) {
     this.keyStatus |= (1 << 0) // A
    } else {
       this.keyStatus &= ~(1 << 2);
    }

    if (gamepad.buttons[8].pressed) {
     this.keyStatus |= (1 << 3) // Start
    } else {
       this.keyStatus &= ~(1 << 3);
    }
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
}