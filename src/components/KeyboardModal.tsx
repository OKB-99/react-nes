import { TableContainer, Paper, Table, TableHead, TableRow, TableCell, TableBody, TextField, Input, Grid, Box, Container } from '@mui/material';
import { KeyboardKey, KeyboardMap } from '../nes/utils/commons';
import React from 'react';
import { ArrowBack, ArrowUpward, ArrowForward, ArrowDownward } from '@mui/icons-material';
import CommandTextField from './CommandTextField';


const KeyboardModal = () => {

  let keyboardMap: KeyboardMap = JSON.parse(localStorage.getItem('keyboard-map'));

  const updateKeyboardMap = (key: keyof KeyboardMap ) => (env: React.FocusEvent<HTMLInputElement>) => {
    keyboardMap[key] = (env.target.value as string).toUpperCase() as KeyboardKey;
    localStorage.setItem('keyboard-map', JSON.stringify(keyboardMap));
  }

  const onInput = (key: keyof KeyboardMap ) => (env: React.FocusEvent<HTMLInputElement>) => {
    env.target.value = (env.target.value as string).toUpperCase();
  }

  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'center', margin: 'auto' }}>
      <Grid container spacing={1} direction="column">
        <Grid container direction="row">
        <Box component="p">
          <Box component="span" sx={{ fontSize: '1.17em', fontWeight: 'bold', padding: '0 10px'}}>Keyboard Configuration</Box>
          <Box component="span" fontSize={'0.8em'}>*A page reload may be necessary after configuration.</Box>
        </Box>
        </Grid>
        <Grid container direction="row">
          <TableContainer component={Paper}>
            <Table aria-label="simple table">
              <TableHead>
                <TableRow>
                  <TableCell align="right" size="small">Buttons</TableCell>
                  <TableCell align="right" size="small">Assigned keys (A-Z or 0-9)</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                  <TableRow>
                    <TableCell align="right" size="small">A</TableCell>
                    <TableCell align="right" size="small">
                      <CommandTextField
                          ctrlKey={'A'} controller={'keyboard'} defaultValue={keyboardMap.A} controllerMap={keyboardMap}
                      />
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell align="right" size="small">B</TableCell>
                    <TableCell align="right" size="small">
                      <CommandTextField
                          ctrlKey={'B'} controller={'keyboard'} defaultValue={keyboardMap.B} controllerMap={keyboardMap}
                      />
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell align="right" size="small">SELECT</TableCell>
                    <TableCell align="right" size="small">
                      <CommandTextField
                          ctrlKey={'SELECT'} controller={'keyboard'} defaultValue={keyboardMap.SELECT} controllerMap={keyboardMap}
                      />
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell align="right" size="small">START</TableCell>
                    <TableCell align="right" size="small">
                      <CommandTextField
                          ctrlKey={'START'} controller={'keyboard'} defaultValue={keyboardMap.START} controllerMap={keyboardMap}
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
      </Box>
    </>
  );
}

export default KeyboardModal;