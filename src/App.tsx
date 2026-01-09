import React, { useEffect, useRef, useState } from 'react';
import { Grid, Input, Button, Slider, IconButton, Modal } from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { VolumeUp, Keyboard } from '@mui/icons-material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { faGamepad } from '@fortawesome/fontawesome-free-solid';
import './App.css';
import { NES } from './nes';
import KeyboardModal from './components/KeyboardModal';
import { KeyboardMap } from './utils/commons';

const theme = createTheme({
  palette: {
    primary: {
      main: '#711521'
    }
  }
});

const App: React.FC = () => {
  const nes = useRef(undefined as NES | undefined);
  const [ volume, setVolume ] = useState(parseFloat(localStorage.getItem('nes-audio-volume') || '0.5'));

  useEffect(() => {
    // Load volume from session storage
    if (!localStorage.getItem('nes-audio-volume')) {
      localStorage.setItem('nes-audio-volume', '0.5');
    }

    const volumeSlider = document.getElementById('volumeSlider') as HTMLInputElement;
    setVolume(parseFloat(localStorage.getItem('nes-audio-volume') as string));
    volumeSlider.style.visibility = 'visible';

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
        nes.current = new NES(buffer);
      });
  }
  
  const volumeOnChange = (event: Event) => {
    const input = event.target as HTMLInputElement;
    const volume = parseFloat(input.value);
    localStorage.setItem('nes-audio-volume', volume.toString());
    setVolume(volume);

    nes.current?.volumeOnChange(volume);
  }

  const [ keyboardModal, setKeyboardModal ] = useState(false);
  const handleOpenKB = () => setKeyboardModal(true);
  const handleCloseKB = () => {
    setKeyboardModal(false);
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
              <IconButton color="primary" onClick={handleOpenKB}>
                <Keyboard fontSize="large" />
              </IconButton>
              <IconButton color="primary" disabled>
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
            style={{ width: '50%', height: '50%', margin: 'auto' }}>
          <KeyboardModal></KeyboardModal>
        </Modal>
      </ThemeProvider>
    </>
  );
}

export default App;
