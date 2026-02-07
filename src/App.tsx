import React, { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { Grid, Input, Button, Slider, IconButton, Modal, Box, Link, Container, Drawer, CircularProgress } from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { VolumeUp, Keyboard, KeyboardDoubleArrowLeft, KeyboardDoubleArrowRight } from '@mui/icons-material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { faGamepad } from '@fortawesome/fontawesome-free-solid';
import { NES } from './nes/nes';
import { NesConfig } from './nes/nes-config';
import { GamepadCtrl } from './nes/controller/gamepad-ctrl';
import { KeypadCtrl } from './nes/controller/keypad-ctrl';
import AboutReactNes from './components/AboutReactNes';
import Main from './components/Main';

const KeyboardModal = lazy(() => import('./components/KeyboardModal'));
const GamepadModal = lazy(() => import('./components/GamepadModal'));

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
  const [ gameStarted, setGameStarted ] = useState(false);
  const [ aboutReactNesOpened, setAboutReactNesOpened ] = useState(false);

  useEffect(() => {
    // Load volume from session storage
    if (!localStorage.getItem('nes-audio-volume')) {
      localStorage.setItem('nes-audio-volume', '0.5');
    }

    nesConfig.current.masterVolume = parseFloat(localStorage.getItem('nes-audio-volume') as string);

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
  }, []);

  const startDemo = () => {
    // Load the demo ROM
    const demoRomFile = 'Tetramino.nes';
    fetch(`${process.env.PUBLIC_URL}/roms/${demoRomFile}`).then(
      response => response.blob().then(blob => {
        const file = new File([blob], demoRomFile)
        const event = {
          target: { files: [file] }
        } as unknown as React.ChangeEvent<HTMLInputElement>;
        fileOnChange(event);
      })
    );
  };

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
        setGameStarted(true);
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

  const handleToggleDrawer = () => {
    setAboutReactNesOpened(!aboutReactNesOpened);
  }

  return (
    <>
      <ThemeProvider theme={theme}>
        <Container>
          <Main open={!aboutReactNesOpened}>
            <Grid container direction="column" columns={24} spacing={3} justifyContent="center" alignItems="center" margin="auto"
                style={{ userSelect: 'none' }}>
              <Grid container>
              </Grid>
              <Grid container direction="row">
                <Grid size={8}>
                  <Input type='file' inputProps={{ accept: '.nes'}} onChange={fileOnChange} />
                </Grid>
                <Grid size={1}>
                </Grid>
                <Grid size={3}>
                  <Button variant='outlined' onClick={resetOnClick}>Reset</Button>
                </Grid>
                <Grid size={1}>
                </Grid>
                <Grid size={1} sx={{ marginRight: '-0.0em', verticalAlign: 'middle' }}>
                  <VolumeUp color="primary" />
                </Grid>
                <Grid size={5}>
                  <Slider id="volumeSlider" min={0} max={1} step={0.1} value={volume} onChange={volumeOnChange}></Slider>
                </Grid>
                <Grid size={2} display={"flex"} style={{ marginLeft: '1vw' }}>
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
                  <Box sx={{ position: 'relative', display: 'inline-block', height: '75vh',
                      border: '0px solid #711521', aspectRatio: 16 / 15 }}>
                    <canvas id="canvas" width="256" height="240" style={{ width: '100%', display: gameStarted ? 'flex': 'none' }}> </canvas>

                    <Box className="center" sx={{ display: gameStarted ? 'none' : 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center' }}
                    >
                      <Box component="p"> Press <Box component="span" color="red">START DEMO</Box> or Choose a <Box component="span" color="red">NES ROM</Box></Box>
                      <Button variant="contained" onClick={startDemo}>Start DEMO</Button>
                      <Box component="img" src={`${process.env.PUBLIC_URL}/images/Tetramino.jpg`}
                          sx={{ height: '45vh', aspectRatio: 16 /15, marginTop: '3vh', marginBottom: '-2vh' }}>
                      </Box>
                      <Box component="p"><Box component="b" sx={{ textDecoration: 'underline', margin: '0 10px 0 5px' }}>About Demo</Box><Box component="span" color="red">Tetramino</Box> is a public-domain, Tetris-like game developed by Damian Yerrick and distributed under the <Link rel="noopener noreferrer" target="_blank" href="https://www.gnu.org/licenses/gpl-3.0.txt">GPL</Link> license.</Box>
                    </Box>

                  </Box>
                </Grid>
              </Grid>
            </Grid>
          </Main>

          <IconButton onClick={handleToggleDrawer} color="default" size="large" sx={{ position: 'fixed', top: 0, right: 0, zIndex: 9999 }}>
              {aboutReactNesOpened ? <KeyboardDoubleArrowRight/> : <KeyboardDoubleArrowLeft />}
          </IconButton>
          <Drawer open={aboutReactNesOpened} variant="persistent" anchor="right"
              PaperProps={{ sx: { scrollbarWidth: 'thin', width: '50vw', backgroundColor: '#eaeaea' }}}>
            <AboutReactNes />
          </Drawer>

        </Container>

        <Modal open={keyboardModal} onClose={handleCloseKB} style={{ width: '50%', height: '50%', margin: 'auto' }} >
          <Box tabIndex={-1} sx={{ backgroundColor: 'white' }}>
            <Suspense
              fallback={
                <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                  <CircularProgress />
                </Box>
              }
            >
              {keyboardModal && <KeyboardModal />}
            </Suspense>
          </Box>
        </Modal>

        <Modal open={gamepadModal} onClose={handleCloseGP} style={{ width: '50%', height: '80%', margin: 'auto' }} >
          <Box tabIndex={-1} sx={{ backgroundColor: 'white' }} >
            <Suspense
              fallback={
                <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                  <CircularProgress />
                </Box>
              }
            >
              {gamepadModal && <GamepadModal />}
            </Suspense>
          </Box>
        </Modal>

      </ThemeProvider>
    </>
  );
}

export default App;
