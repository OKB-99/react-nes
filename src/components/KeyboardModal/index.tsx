import { TableContainer, Paper, Table, TableHead, TableRow, TableCell, TableBody, TextField, Input } from '@mui/material';
import { KeyboardKey, KeyboardMap } from '../../nes/utils/commons';
import React from 'react';


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
      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }} aria-label="simple table">
          <TableHead>
            <TableRow>
              <TableCell align="right">Buttons</TableCell>
              <TableCell align="right">Assigned keys (A-Z or 0-9)</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
              <TableRow>
                <TableCell align="right">A</TableCell>
                <TableCell align="right">
                  <TextField
                      required size="small"
                      defaultValue={keyboardMap.A}
                      onInput ={onInput('A' as keyof KeyboardMap)}
                      onChange={updateKeyboardMap('A' as keyof KeyboardMap)}
                      slotProps={{ htmlInput: { maxLength: 1, minLength: 1 } }}
                  />
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell align="right">B</TableCell>
                <TableCell align="right">
                  <TextField
                      required size="small"
                      defaultValue={keyboardMap.B}
                      onInput ={onInput('B' as keyof KeyboardMap)}
                      onChange={updateKeyboardMap('B' as keyof KeyboardMap)}
                      slotProps={{ htmlInput: { maxLength: 1, minLength: 1 } }}
                  />
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell align="right">SELECT</TableCell>
                <TableCell align="right">
                  <TextField
                      required size="small"
                      defaultValue={keyboardMap.SELECT}
                      onInput ={onInput('SELECT' as keyof KeyboardMap)}
                      onChange={updateKeyboardMap('SELECT' as keyof KeyboardMap)}
                      slotProps={{ htmlInput: { maxLength: 1, minLength: 1 } }}
                  />
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell align="right">START</TableCell>
                <TableCell align="right">
                  <TextField
                      required size="small"
                      defaultValue={keyboardMap.START}
                      onInput ={onInput('START' as keyof KeyboardMap)}
                      onChange={updateKeyboardMap('START' as keyof KeyboardMap)}
                      slotProps={{ htmlInput: { maxLength: 1, minLength: 1 } }}
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
    </>
  );
}

export default KeyboardModal;