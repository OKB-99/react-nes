import { TextField } from "@mui/material";
import { GamepadMap, KeyboardMap, KeyboardKey, CtrlKey } from "../nes/utils/commons";

interface CommandTextFieldProps {
  ctrlKey: CtrlKey;
  controller: 'keyboard' | 'gamepad';
  defaultValue: string | number;
  controllerMap: KeyboardMap | GamepadMap;
}

const CommandTextField: React.FC<CommandTextFieldProps> = (props) => {
  const { ctrlKey, controller, controllerMap, defaultValue } = props;

  const updateConfig = (buttonId: CtrlKey) => (env: React.FocusEvent<HTMLInputElement>) => {
    if (controller === 'gamepad') {
      controllerMap[buttonId] = parseInt(env.target.value);
      localStorage.setItem('gamepad-map', JSON.stringify(controllerMap));
    } else {
      controllerMap[buttonId] = (env.target.value as string) as KeyboardKey;
      localStorage.setItem('keyboard-map', JSON.stringify(controllerMap));
    }
  }

  const onInput = (env: React.FocusEvent<HTMLInputElement>) => {
    env.target.value = (env.target.value as string).toUpperCase();
  }

  return (
    <TextField size="small" type={controller === 'keyboard' ? 'text' : 'number'} defaultValue={defaultValue}
      onChange={updateConfig(ctrlKey)} onInput={onInput} style={{ maxWidth: '5vw' }}
      slotProps={{ htmlInput: { maxLength: 1, minLength: 1, style: { paddingTop: '3px', paddingBottom: '3px' } } }}
    />
  );
}

export default CommandTextField;