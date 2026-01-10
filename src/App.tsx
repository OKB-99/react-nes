import React, { useEffect, useRef, useState } from 'react';
import { Grid, Input, Button, Slider, IconButton, Modal } from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { VolumeUp, Keyboard } from '@mui/icons-material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { faGamepad } from '@fortawesome/fontawesome-free-solid';
import { NES } from './nes/nes';
import KeyboardModal from './components/KeyboardModal';
import { GamepadMap, KeyboardMap } from './nes/utils/commons';
import { NesConfig } from './nes/nes-config';
import GamepadModal from './components/GamepadModal';
import { GamepadCtrl } from './nes/controller/gamepad-ctrl';
import { KeypadCtrl } from './nes/controller/keypad-ctrl';

const theme = createTheme({
  palette: {
    primary: {
      main: '#711521'
    }
  }
});

const App: React.FC = () => {
  const nes = useRef(undefined as NES | undefined);
  const nesConfig = useRef(new NesConfig());
  const [ volume, setVolume ] = useState(parseFloat(localStorage.getItem('nes-audio-volume') || '0.5'));
  const [ gamepadDetected, setGamepadDetacted ] = useState(false);

  useEffect(() => {
    // Load volume from session storage
    if (!localStorage.getItem('nes-audio-volume')) {
      localStorage.setItem('nes-audio-volume', '0.5');
    }

    nesConfig.current.masterVolume = parseFloat(localStorage.getItem('nes-audio-volume') as string);

    // Load keyboard map from local storage
    if (!localStorage.getItem('keyboard-map')) {
      const keyboardMap: KeyboardMap = {
        A: 'X',
        B: 'Z',
        SELECT: 'A',
        START: 'S'
      };
      localStorage.setItem('keyboard-map', JSON.stringify(keyboardMap));
    }

    // Load gamepad map from local storage
    if (!localStorage.getItem('gamepad-map')) {
      const gamepadMap: GamepadMap = {
        A: 0,
        B: 1,
        SELECT: 2,
        START: 3
      };
      localStorage.setItem('gamepad-map', JSON.stringify(gamepadMap));
    }

    window.addEventListener("gamepadconnected", (e) => {
        console.log("Controller connected");
        if (e.gamepad) {
          nesConfig.current.controller1 = new GamepadCtrl(nesConfig.current);
          setGamepadDetacted(true);
        }
    });

    window.addEventListener("gamepaddisconnected", (e) => {
      console.log("Controller disconnected");
      nesConfig.current.controller1 = new KeypadCtrl(nesConfig.current);
      setGamepadDetacted(false);
    });
  });

  const resetOnClick = () => {
    nes.current?.cpuReset();
  };

  const fileOnChange = (evt: React.ChangeEvent<HTMLInputElement>) => {

    const input = evt.target;
  
    if (!input.files || input.files.length === 0) {
      console.error("No file selected.");
      return;
    }

    const file: File = input.files[0];
  
    file.arrayBuffer()
      .then((buffer: ArrayBuffer) => {
        const bytes = new Uint8Array(buffer);
        if (bytes[0] !== 0x4E || bytes[1] !== 0x45 || bytes[2] !== 0x53 || bytes[3] !== 0x1A) {
          console.error("Invalid NES file format.");
          return;
        }

        if (nes.current) {
          nes.current.terminate();
        }

        nes.current = new NES(buffer, nesConfig.current);
      });
  }
  
  const volumeOnChange = (event: Event) => {
    const input = event.target as HTMLInputElement;
    const volume = parseFloat(input.value);
    localStorage.setItem('nes-audio-volume', volume.toString());
    setVolume(volume);
    nesConfig.current.masterVolume = volume;
  }

  const [ keyboardModal, setKeyboardModal ] = useState(false);
  const handleOpenKB = () => setKeyboardModal(true);
  const handleCloseKB = () => {
    setKeyboardModal(false);
    nesConfig.current.updateKeyboardMap = true; // KeyboardMap to be updated
  }

  const [ gamepadModal, setGamepadModal ] = useState(false);
  const handleOpenGP = () => setGamepadModal(true);
  const handleCloseGP = () => {
    setGamepadModal(false);
    nesConfig.current.updateGamepadMap = true; // gamepadMap to be updated
  }
  
  return (
    <>
      <ThemeProvider theme={theme}>
        <Grid container direction="column" spacing={3} width="45vw" justifyContent="center" alignItems="center" margin="auto"
            style={{ userSelect: 'none' }}>
          <Grid container>
          </Grid>
          <Grid container direction="row" width="100%">
            <Grid size={4}>
              <Input type='file' onChange={fileOnChange}></Input>
            </Grid>
            <Grid size={1}>
            </Grid>
            <Grid size={2}>
              <Button variant='outlined' onClick={resetOnClick}>Reset</Button>
            </Grid>
            <Grid size={1} marginRight="-2vw">
              <VolumeUp color="primary" />
            </Grid>
            <Grid size={3}>
              <Slider id="volumeSlider" min={0} max={1} step={0.1} value={volume} onChange={volumeOnChange}></Slider>
            </Grid>
            <Grid size={1} display={"flex"} style={{ marginLeft: '1vw' }}>
              <IconButton color="primary" disabled={gamepadDetected} onClick={handleOpenKB}>
                <Keyboard fontSize="large" />
              </IconButton>
              <IconButton color="primary" disabled={!gamepadDetected} onClick={handleOpenGP}>
                <FontAwesomeIcon icon={faGamepad as IconProp} />
              </IconButton>
            </Grid>
          </Grid>
          <Grid container>
            <Grid>
              <canvas id="canvas" width="256" height="240"
                  style={{ width: '40vw', border: '0px solid #711521', aspectRatio: 16 / 15 }}></canvas>
            </Grid>
          </Grid>
        </Grid>

        <Modal open={keyboardModal} onClose={handleCloseKB}
            style={{ width: '50%', height: '70%', margin: 'auto' }}
            sx={{ '& .MuiGrid-container': { background: 'white' } }}>
          <KeyboardModal></KeyboardModal>
        </Modal>

        <Modal open={gamepadModal} onClose={handleCloseGP}
            style={{ width: '50%', height: '80%', margin: 'auto' }}
            sx={{ '& .MuiGrid-container': { background: 'white' } }}>
          <GamepadModal></GamepadModal>
        </Modal>
      </ThemeProvider>
    </>
  );
}

export default App;
