import { TableContainer, Paper, Table, TableHead, TableRow, TableCell, TableBody, TextField, Input, Box, Grid } from '@mui/material';
import { GamepadMap } from '../../nes/utils/commons';
import React, { useEffect, useRef, useState } from 'react';
import './index.css';


/**
 * Called only when Gamepad has been detected.
 * @returns
 */
const GamepadModal = () => {

  let gamepadMap: GamepadMap = JSON.parse(localStorage.getItem('gamepad-map'));
  
  const updateGamepadMap = (buttonId: keyof GamepadMap ) => (env: React.FocusEvent<HTMLInputElement>) => {
    gamepadMap[buttonId] = parseInt(env.target.value);
    localStorage.setItem('gamepad-map', JSON.stringify(gamepadMap));
  }

  const [buttonsStats, setButtonsStats] = useState(navigator.getGamepads()[0].buttons.map(button => button.pressed));
  const intervalRef = useRef(undefined as NodeJS.Timer | undefined);

  useEffect(() => {

    intervalRef.current = setInterval(() => {
      setButtonsStats(navigator.getGamepads()[0].buttons.map(button => button.pressed));
    });

    return () =>  {
      clearInterval(intervalRef.current);
    };
  })

  return (
    <>
      <Grid container spacing={1} direction="column">
        <Grid container direction="row">
          <Box>
            <Box>
              <Box component="span">Gamepad Buttons Test</Box>
            </Box>
            <Box display="flex">
              {buttonsStats.map((pressed, id) =>
                  <Box className={'circle' + (pressed ? ' circle-pressed' : '')}>{id}</Box>
              )}
            </Box>
          </Box>
        </Grid>
        <Grid container>
          <TableContainer component={Paper}>
            <Table sx={{ minWidth: 650 }} aria-label="simple table">
              <TableHead>
                <TableRow>
                  <TableCell align="right">Buttons</TableCell>
                  <TableCell align="right">Assigned buttons (Numeric)</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                  <TableRow>
                    <TableCell align="right">A</TableCell>
                    <TableCell align="right">
                      <TextField
                          required size="small" type="number"
                          defaultValue={gamepadMap.A}
                          onChange={updateGamepadMap('A' as keyof GamepadMap)}
                      />
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell align="right">B</TableCell>
                    <TableCell align="right">
                      <TextField
                          required size="small" type="number"
                          defaultValue={gamepadMap.B}
                          onChange={updateGamepadMap('B' as keyof GamepadMap)}
                      />
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell align="right">SELECT</TableCell>
                    <TableCell align="right">
                      <TextField
                          required size="small" type="number"
                          defaultValue={gamepadMap.SELECT}
                          onChange={updateGamepadMap('SELECT' as keyof GamepadMap)}
                      />
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell align="right">START</TableCell>
                    <TableCell align="right">
                      <TextField
                          required size="small" type="number"
                          defaultValue={gamepadMap.START}
                          onChange={updateGamepadMap('START' as keyof GamepadMap)}
                      />
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell align="right">←</TableCell>
                    <TableCell align="right">←</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell align="right">↑</TableCell>
                    <TableCell align="right">↑</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell align="right">→</TableCell>
                    <TableCell align="right">→</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell align="right">↓</TableCell>
                    <TableCell align="right">↓</TableCell>
                  </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
      </Grid>
    </>
  );
}

export default GamepadModal;