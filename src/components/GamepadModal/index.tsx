import { TableContainer, Paper, Table, TableHead, TableRow, TableCell, TableBody, TextField, Input, Box, Grid } from '@mui/material';
import { GamepadMap } from '../../nes/utils/commons';
import React, { useEffect, useRef, useState } from 'react';
import './index.css';
import { ArrowBack, ArrowUpward, ArrowForward, ArrowDownward } from '@mui/icons-material';


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
        <Box component="p">
          <Box component="span" sx={{ fontSize: '1.17em', fontWeight: 'bold', padding: '0 10px'}}>Gamepad Configuration</Box>
          <Box component="span">*A page reload may be necessary after configuration.</Box>
        </Box>
        </Grid>
        <Grid container direction="row">
          <Box>
            <Box>
              <Box component="span" sx={{ padding: '0 10px' }}>Gamepad Buttons Test</Box>
            </Box>
            <Box display="flex">
              {buttonsStats.map((pressed, id) =>
                  <Box key={id} className={'circle' + (pressed ? ' circle-pressed' : '')}>{id}</Box>
              )}
            </Box>
          </Box>
        </Grid>
        <Grid container>
          <TableContainer component={Paper}>
            <Table sx={{ minWidth: 650 }} aria-label="simple table">
              <TableHead>
                <TableRow>
                  <TableCell align="right" size="small">Buttons</TableCell>
                  <TableCell align="right" size="small">Assigned buttons (Numeric)</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                  <TableRow>
                    <TableCell align="right" size="small">A</TableCell>
                    <TableCell align="right" size="small">
                      <TextField
                          required size="small" type="number"
                          defaultValue={gamepadMap.A}
                          onChange={updateGamepadMap('A' as keyof GamepadMap)}
                      />
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell align="right" size="small">B</TableCell>
                    <TableCell align="right" size="small">
                      <TextField
                          required size="small" type="number"
                          defaultValue={gamepadMap.B}
                          onChange={updateGamepadMap('B' as keyof GamepadMap)}
                      />
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell align="right" size="small">SELECT</TableCell>
                    <TableCell align="right" size="small">
                      <TextField
                          required size="small" type="number"
                          defaultValue={gamepadMap.SELECT}
                          onChange={updateGamepadMap('SELECT' as keyof GamepadMap)}
                      />
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell align="right" size="small">START</TableCell>
                    <TableCell align="right" size="small">
                      <TextField
                          required size="small" type="number"
                          defaultValue={gamepadMap.START}
                          onChange={updateGamepadMap('START' as keyof GamepadMap)}
                      />
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell align="right" size="small"><ArrowBack fontSize='small'/></TableCell>
                    <TableCell align="right" size="small"><ArrowBack fontSize='small'/></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell align="right" size="small"><ArrowUpward fontSize='small'/></TableCell>
                    <TableCell align="right" size="small"><ArrowUpward fontSize='small'/></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell align="right" size="small"><ArrowForward fontSize='small'/></TableCell>
                    <TableCell align="right" size="small"><ArrowForward fontSize='small'/></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell align="right" size="small"><ArrowDownward fontSize='small'/></TableCell>
                    <TableCell align="right" size="small"><ArrowDownward fontSize='small'/></TableCell>
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