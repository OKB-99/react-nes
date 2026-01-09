import { Controller } from "./controller/controller";
import { KeypadCtrl } from "./controller/keypad-ctrl";

export class NesConfig {
  masterVolume: number;
  updateKeyboardMap: boolean;
  updateGamepadMap: boolean;
  controller1: Controller = new KeypadCtrl(this); // Keyboard or Gamepad
}