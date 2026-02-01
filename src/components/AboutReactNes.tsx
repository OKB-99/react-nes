import { Box, Link, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from "@mui/material";
import { INesMappers } from "./INesMappers";

const imgSize = {
  width: '14vw',
  aspectRatio: 16 / 15
}

const AboutReactNes: React.FC = () => {
  return (
    <Box sx={{ maxHeight: '100vh', caretColor: 'transparent', padding: '10px' }}>
      <Stack direction="column" spacing={2}>
        <Box component="h3">React NES - Lightweight Famicom Emulator</Box>

        <Box component="p">A lightweight Nintendo Entertainment System (NES) emulator built with TypeScript and React, designed for accuracy, performance, and simplicity. This project emulates the original NES hardware, allowing classic iNES-format .nes ROMs to run directly in a web browser.</Box>

        <Stack direction="row" spacing={3} justifyContent="center" alignItems="center">
          <Box component="img" src={`${process.env.PUBLIC_URL}/images/Super_Mario_Bros.jpg`} sx={imgSize} />
          <Box component="img" src={`${process.env.PUBLIC_URL}/images/Tetris.jpg`} sx={imgSize} />
          <Box component="img" src={`${process.env.PUBLIC_URL}/images/Gradius.jpg`} sx={imgSize} />
        </Stack>

        <Box sx={{ padding: '3vh 2vw 0'}}>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>iNES Mapper (games)</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Designations</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {INesMappers.map((row) => (
                  <TableRow key={row.mapper} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                    <TableCell component="th" scope="row">{row.mapper} (<Link rel="noopener noreferrer" target="_blank" href={`https://nesdir.github.io/${row.mapper.toLowerCase()}.html`}>game list</Link>)</TableCell>
                    <TableCell>{row.status}</TableCell>
                    <TableCell>{row.designations.join(', ')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </Stack>
    </Box>
  );
}

export default AboutReactNes;