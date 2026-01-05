//https://www.nesdev.org/wiki/Instruction_reference

export interface OpecodeProps {
  baseName: string;
  mode: AddressingMode;
  cycle: number;
}

export type AddressingMode =
  'zeroPage' |
  'relative' |
  'implied' |
  'absolute' |
  'accumulator' |
  'immediate' |
  'zeroPageX' |
  'zeroPageY' |
  'absoluteX' |
  'absoluteY' |
  'preIndexedIndirect' |
  'postIndexedIndirect' |
  'indirectAbsolute';

export const dict: { [code: string]: OpecodeProps } = {
  '00': { baseName: 'BRK', mode: 'implied', cycle: 7 },
  '01': { baseName: 'ORA', mode: 'preIndexedIndirect', cycle: 6 },
  '02': { baseName: 'STP', mode: 'implied', cycle: 3 },
  '03': { baseName: 'SLO', mode: 'preIndexedIndirect', cycle: 8 },
  '04': { baseName: 'NOP', mode: 'zeroPage', cycle: 3 },
  '05': { baseName: 'ORA', mode: 'zeroPage', cycle: 3 },
  '06': { baseName: 'ASL', mode: 'zeroPage', cycle: 5 },
  '07': { baseName: 'SLO', mode: 'zeroPage', cycle: 5 },
  '08': { baseName: 'PHP', mode: 'implied', cycle: 3 },
  '09': { baseName: 'ORA', mode: 'immediate', cycle: 2 },
  '0A': { baseName: 'ASL', mode: 'accumulator', cycle: 2 },
  '0B': { baseName: 'ANC', mode: 'immediate', cycle: 2 },
  '0C': { baseName: 'NOP', mode: 'absolute', cycle: 4 },
  '0D': { baseName: 'ORA', mode: 'absolute', cycle: 4 },
  '0E': { baseName: 'ASL', mode: 'absolute', cycle: 6 },
  '0F': { baseName: 'SLO', mode: 'absolute', cycle: 6 },
  '10': { baseName: 'BPL', mode: 'relative', cycle: 2 }, //3 if branch taken, 4 if page crossed*
  '11': { baseName: 'ORA', mode: 'postIndexedIndirect', cycle: 5 }, //6 if page crossed
  '12': { baseName: 'STP', mode: 'implied', cycle: 3 },
  '13': { baseName: 'SLO', mode: 'postIndexedIndirect', cycle: 8 },
  '14': { baseName: 'NOP', mode: 'zeroPageX', cycle: 4 },
  '15': { baseName: 'ORA', mode: 'zeroPageX', cycle: 4 },
  '16': { baseName: 'ASL', mode: 'zeroPageX', cycle: 6 },
  '17': { baseName: 'SLO', mode: 'zeroPageX', cycle: 6 },
  '18': { baseName: 'CLC', mode: 'implied', cycle: 2 },
  '19': { baseName: 'ORA', mode: 'absoluteY', cycle: 4 }, //5 if page crossed
  '1A': { baseName: 'NOP', mode: 'implied', cycle: 2 },
  '1B': { baseName: 'SLO', mode: 'absoluteY', cycle: 7 },
  '1C': { baseName: 'NOP', mode: 'absoluteX', cycle: 4 }, //5 if page crossed
  '1D': { baseName: 'ORA', mode: 'absoluteX', cycle: 4 }, //5 if page crossed
  '1E': { baseName: 'ASL', mode: 'absoluteX', cycle: 7 },
  '1F': { baseName: 'SLO', mode: 'absoluteX', cycle: 7 },
  '20': { baseName: 'JSR', mode: 'absolute', cycle: 6 },
  '21': { baseName: 'AND', mode: 'preIndexedIndirect', cycle: 6 },
  '22': { baseName: 'STP', mode: 'implied', cycle: 3 },
  '23': { baseName: 'RLA', mode: 'preIndexedIndirect', cycle: 8 },
  '24': { baseName: 'BIT', mode: 'zeroPage', cycle: 3 },
  '25': { baseName: 'AND', mode: 'zeroPage', cycle: 3 },
  '26': { baseName: 'ROL', mode: 'zeroPage', cycle: 5 },
  '27': { baseName: 'RLA', mode: 'zeroPage', cycle: 5 },
  '28': { baseName: 'PLP', mode: 'implied', cycle: 4 },
  '29': { baseName: 'AND', mode: 'immediate', cycle: 2 },
  '2A': { baseName: 'ROL', mode: 'accumulator', cycle: 2 },
  '2B': { baseName: 'ANC', mode: 'immediate', cycle: 2 },
  '2C': { baseName: 'BIT', mode: 'absolute', cycle: 4 },
  '2D': { baseName: 'AND', mode: 'absolute', cycle: 4 },
  '2E': { baseName: 'ROL', mode: 'absolute', cycle: 6 },
  '2F': { baseName: 'RLA', mode: 'absolute', cycle: 6 },
  '30': { baseName: 'BMI', mode: 'relative', cycle: 2 }, //3 if branch taken, 4 if page crossed*
  '31': { baseName: 'AND', mode: 'postIndexedIndirect', cycle: 5 }, //6 if page crossed
  '32': { baseName: 'STP', mode: 'implied', cycle: 3 },
  '33': { baseName: 'RLA', mode: 'postIndexedIndirect', cycle: 8 },
  '34': { baseName: 'NOP', mode: 'zeroPageX', cycle: 4 },
  '35': { baseName: 'AND', mode: 'zeroPageX', cycle: 4 },
  '36': { baseName: 'ROL', mode: 'zeroPageX', cycle: 6 },
  '37': { baseName: 'RLA', mode: 'zeroPageX', cycle: 6 },
  '38': { baseName: 'SEC', mode: 'implied', cycle: 2 },
  '39': { baseName: 'AND', mode: 'absoluteY', cycle: 4 }, //5 if page crossed
  '3A': { baseName: 'NOP', mode: 'implied', cycle: 2 },
  '3B': { baseName: 'RLA', mode: 'absoluteY', cycle: 7 },
  '3C': { baseName: 'NOP', mode: 'absoluteX', cycle: 4 }, //5 if page crossed
  '3D': { baseName: 'AND', mode: 'absoluteX', cycle: 4 }, //5 if page crossed
  '3E': { baseName: 'ROL', mode: 'absoluteX', cycle: 7 },
  '3F': { baseName: 'RLA', mode: 'absoluteX', cycle: 7 },
  '40': { baseName: 'RTI', mode: 'implied', cycle: 6 },
  '41': { baseName: 'EOR', mode: 'preIndexedIndirect', cycle: 6 },
  '42': { baseName: 'STP', mode: 'implied', cycle: 3 },
  '43': { baseName: 'SRE', mode: 'preIndexedIndirect', cycle: 8 },
  '44': { baseName: 'NOP', mode: 'zeroPage', cycle: 3 },
  '45': { baseName: 'EOR', mode: 'zeroPage', cycle: 3 },
  '46': { baseName: 'LSR', mode: 'zeroPage', cycle: 5 },
  '47': { baseName: 'SRE', mode: 'zeroPage', cycle: 5 },
  '48': { baseName: 'PHA', mode: 'implied', cycle: 3 },
  '49': { baseName: 'EOR', mode: 'immediate', cycle: 2 },
  '4A': { baseName: 'LSR', mode: 'accumulator', cycle: 2 },
  '4B': { baseName: 'ALR', mode: 'immediate', cycle: 2 },
  '4C': { baseName: 'JMP', mode: 'absolute', cycle: 3 },
  '4D': { baseName: 'EOR', mode: 'absolute', cycle: 4 },
  '4E': { baseName: 'LSR', mode: 'absolute', cycle: 6 },
  '4F': { baseName: 'SRE', mode: 'absolute', cycle: 6 },
  '50': { baseName: 'BVC', mode: 'relative', cycle: 2 }, //3 if branch taken, 4 if page crossed*
  '51': { baseName: 'EOR', mode: 'postIndexedIndirect', cycle: 5 }, //6 if page crossed
  '52': { baseName: 'STP', mode: 'implied', cycle: 3 },
  '53': { baseName: 'SRE', mode: 'postIndexedIndirect', cycle: 8 },
  '54': { baseName: 'NOP', mode: 'zeroPageX', cycle: 4 },
  '55': { baseName: 'EOR', mode: 'zeroPageX', cycle: 4 },
  '56': { baseName: 'LSR', mode: 'zeroPageX', cycle: 6 },
  '57': { baseName: 'SRE', mode: 'zeroPageX', cycle: 6 },
  '58': { baseName: 'CLI', mode: 'implied', cycle: 2 },
  '59': { baseName: 'EOR', mode: 'absoluteY', cycle: 4 }, //5 if page crossed
  '5A': { baseName: 'NOP', mode: 'implied', cycle: 2 },
  '5B': { baseName: 'SRE', mode: 'absoluteY', cycle: 7 },
  '5C': { baseName: 'NOP', mode: 'absoluteX', cycle: 8 },
  '5D': { baseName: 'EOR', mode: 'absoluteX', cycle: 4 }, //5 if page crossed
  '5E': { baseName: 'LSR', mode: 'absoluteX', cycle: 7 },
  '5F': { baseName: 'SRE', mode: 'absoluteX', cycle: 7 },
  '60': { baseName: 'RTS', mode: 'implied', cycle: 6 },
  '61': { baseName: 'ADC', mode: 'preIndexedIndirect', cycle: 6 },
  '62': { baseName: 'STP', mode: 'implied', cycle: 3 },
  '63': { baseName: 'RRA', mode: 'preIndexedIndirect', cycle: 8 },
  '64': { baseName: 'NOP', mode: 'zeroPage', cycle: 3 },
  '65': { baseName: 'ADC', mode: 'zeroPage', cycle: 3 },
  '66': { baseName: 'ROR', mode: 'zeroPage', cycle: 5 },
  '67': { baseName: 'RRA', mode: 'zeroPage', cycle: 5 },
  '68': { baseName: 'PLA', mode: 'implied', cycle: 4 },
  '69': { baseName: 'ADC', mode: 'immediate', cycle: 2 },
  '6A': { baseName: 'ROR', mode: 'accumulator', cycle: 2 },
  '6B': { baseName: 'ARR', mode: 'immediate', cycle: 2 },
  '6C': { baseName: 'JMP', mode: 'indirectAbsolute', cycle: 5 },
  '6D': { baseName: 'ADC', mode: 'absolute', cycle: 4 },
  '6E': { baseName: 'ROR', mode: 'absolute', cycle: 6 },
  '6F': { baseName: 'RRA', mode: 'absolute', cycle: 6 },
  '70': { baseName: 'BVS', mode: 'relative', cycle: 2 }, //3 if branch taken, 4 if page crossed*
  '71': { baseName: 'ADC', mode: 'postIndexedIndirect', cycle: 5 }, //6 if page crossed
  '72': { baseName: 'STP', mode: 'implied', cycle: 3 },
  '73': { baseName: 'RRA', mode: 'postIndexedIndirect', cycle: 8 },
  '74': { baseName: 'NOP', mode: 'zeroPageX', cycle: 4 },
  '75': { baseName: 'ADC', mode: 'zeroPageX', cycle: 4 },
  '76': { baseName: 'ROR', mode: 'zeroPageX', cycle: 6 },
  '77': { baseName: 'RRA', mode: 'zeroPageX', cycle: 6 },
  '78': { baseName: 'SEI', mode: 'implied', cycle: 2 },
  '79': { baseName: 'ADC', mode: 'absoluteY', cycle: 4 }, //5 if page crossed
  '7A': { baseName: 'NOP', mode: 'implied', cycle: 2 },
  '7B': { baseName: 'RRA', mode: 'absoluteY', cycle: 7 },
  '7C': { baseName: 'NOP', mode: 'absoluteX', cycle: 4 }, //5 if page crossed
  '7D': { baseName: 'ADC', mode: 'absoluteX', cycle: 4 }, //5 if page crossed
  '7E': { baseName: 'ROR', mode: 'absoluteX', cycle: 7 },
  '7F': { baseName: 'RRA', mode: 'absoluteX', cycle: 7 },
  '80': { baseName: 'NOP', mode: 'immediate', cycle: 2 },
  '81': { baseName: 'STA', mode: 'preIndexedIndirect', cycle: 6 },
  '82': { baseName: 'NOP', mode: 'immediate', cycle: 2 },
  '83': { baseName: 'SAX', mode: 'preIndexedIndirect', cycle: 6 },
  '84': { baseName: 'STY', mode: 'zeroPage', cycle: 3 },
  '85': { baseName: 'STA', mode: 'zeroPage', cycle: 3 },
  '86': { baseName: 'STX', mode: 'zeroPage', cycle: 3 },
  '87': { baseName: 'SAX', mode: 'zeroPage', cycle: 3 },
  '88': { baseName: 'DEY', mode: 'implied', cycle: 2 },
  '89': { baseName: 'NOP', mode: 'immediate', cycle: 2 },
  '8A': { baseName: 'TXA', mode: 'implied', cycle: 2 },
  '8B': { baseName: 'XAA', mode: 'immediate', cycle: 2 }, //Highly unstable, behaves differently on different 6502 models**
  '8C': { baseName: 'STY', mode: 'absolute', cycle: 4 },
  '8D': { baseName: 'STA', mode: 'absolute', cycle: 4 },
  '8E': { baseName: 'STX', mode: 'absolute', cycle: 4 },
  '8F': { baseName: 'SAX', mode: 'absolute', cycle: 4 },
  '90': { baseName: 'BCC', mode: 'relative', cycle: 2 }, //3 if branch taken, 4 if page crossed*
  '91': { baseName: 'STA', mode: 'postIndexedIndirect', cycle: 6 },
  '92': { baseName: 'STP', mode: 'implied', cycle: 3 },
  '93': { baseName: 'AHX', mode: 'postIndexedIndirect', cycle: 6 }, //Unstable, behaves differently on different 6502 models**
  '94': { baseName: 'STY', mode: 'zeroPageX', cycle: 4 },
  '95': { baseName: 'STA', mode: 'zeroPageX', cycle: 4 },
  '96': { baseName: 'STX', mode: 'zeroPageY', cycle: 4 },
  '97': { baseName: 'SAX', mode: 'zeroPageY', cycle: 4 },
  '98': { baseName: 'TYA', mode: 'implied', cycle: 2 },
  '99': { baseName: 'STA', mode: 'absoluteY', cycle: 5 },
  '9A': { baseName: 'TXS', mode: 'implied', cycle: 2 },
  '9B': { baseName: 'TAS', mode: 'absoluteY', cycle: 5 }, //Unstable, behaves differently on different 6502 models**
  '9C': { baseName: 'SHY', mode: 'absoluteX', cycle: 5 }, //Unstable, behaves differently on different 6502 models*
  '9D': { baseName: 'STA', mode: 'absoluteX', cycle: 5 },
  '9E': { baseName: 'SHX', mode: 'absoluteY', cycle: 5 }, //Unstable, behaves differently on different 6502 models*
  '9F': { baseName: 'AHX', mode: 'absoluteY', cycle: 5 }, //Unstable, behaves differently on different 6502 models**
  'A0': { baseName: 'LDY', mode: 'immediate', cycle: 2 },
  'A1': { baseName: 'LDA', mode: 'preIndexedIndirect', cycle: 6 },
  'A2': { baseName: 'LDX', mode: 'immediate', cycle: 2 },
  'A3': { baseName: 'LAX', mode: 'preIndexedIndirect', cycle: 6 },
  'A4': { baseName: 'LDY', mode: 'zeroPage', cycle: 3 },
  'A5': { baseName: 'LDA', mode: 'zeroPage', cycle: 3 },
  'A6': { baseName: 'LDX', mode: 'zeroPage', cycle: 3 },
  'A7': { baseName: 'LAX', mode: 'zeroPage', cycle: 3 },
  'A8': { baseName: 'TAY', mode: 'implied', cycle: 2 },
  'A9': { baseName: 'LDA', mode: 'immediate', cycle: 2 },
  'AA': { baseName: 'TAX', mode: 'implied', cycle: 2 },
  'AB': { baseName: 'LAX', mode: 'immediate', cycle: 2 }, //Highly unstable, behaves differently on different 6502 models**
  'AC': { baseName: 'LDY', mode: 'absolute', cycle: 4 },
  'AD': { baseName: 'LDA', mode: 'absolute', cycle: 4 },
  'AE': { baseName: 'LDX', mode: 'absolute', cycle: 4 },
  'AF': { baseName: 'LAX', mode: 'absolute', cycle: 4 },
  'B0': { baseName: 'BCS', mode: 'relative', cycle: 2 }, //3 if branch taken, 4 if page crossed*
  'B1': { baseName: 'LDA', mode: 'postIndexedIndirect', cycle: 5 }, //6 if page crossed
  'B2': { baseName: 'STP', mode: 'implied', cycle: 3 },
  'B3': { baseName: 'LAX', mode: 'postIndexedIndirect', cycle: 5 }, //6 if page crossed
  'B4': { baseName: 'LDY', mode: 'zeroPageX', cycle: 4 },
  'B5': { baseName: 'LDA', mode: 'zeroPageX', cycle: 4 },
  'B6': { baseName: 'LDX', mode: 'zeroPageY', cycle: 4 },
  'B7': { baseName: 'LAX', mode: 'zeroPageY', cycle: 4 },
  'B8': { baseName: 'CLV', mode: 'implied', cycle: 2 },
  'B9': { baseName: 'LDA', mode: 'absoluteY', cycle: 4 }, //5 if page crossed
  'BA': { baseName: 'TSX', mode: 'implied', cycle: 2 },
  'BB': { baseName: 'LAS', mode: 'absoluteY', cycle: 4 }, //5 if page crossed
  'BC': { baseName: 'LDY', mode: 'absoluteX', cycle: 4 }, //5 if page crossed
  'BD': { baseName: 'LDA', mode: 'absoluteX', cycle: 4 }, //5 if page crossed
  'BE': { baseName: 'LDX', mode: 'absoluteY', cycle: 4 }, //5 if page crossed
  'BF': { baseName: 'LAX', mode: 'absoluteY', cycle: 4 }, //5 if page crossed
  'C0': { baseName: 'CPY', mode: 'immediate', cycle: 2 },
  'C1': { baseName: 'CMP', mode: 'preIndexedIndirect', cycle: 6 },
  'C2': { baseName: 'NOP', mode: 'immediate', cycle: 2 },
  'C3': { baseName: 'DCP', mode: 'preIndexedIndirect', cycle: 8 },
  'C4': { baseName: 'CPY', mode: 'zeroPage', cycle: 3 },
  'C5': { baseName: 'CMP', mode: 'zeroPage', cycle: 3 },
  'C6': { baseName: 'DEC', mode: 'zeroPage', cycle: 5 },
  'C7': { baseName: 'DCP', mode: 'zeroPage', cycle: 5 },
  'C8': { baseName: 'INY', mode: 'implied', cycle: 2 },
  'C9': { baseName: 'CMP', mode: 'immediate', cycle: 2 },
  'CA': { baseName: 'DEX', mode: 'implied', cycle: 2 },
  'CB': { baseName: 'AXS', mode: 'immediate', cycle: 2 },
  'CC': { baseName: 'CPY', mode: 'absolute', cycle: 4 },
  'CD': { baseName: 'CMP', mode: 'absolute', cycle: 4 },
  'CE': { baseName: 'DEC', mode: 'absolute', cycle: 6 },
  'CF': { baseName: 'DCP', mode: 'absolute', cycle: 6 },
  'D0': { baseName: 'BNE', mode: 'relative', cycle: 2 }, //3 if branch taken, 4 if page crossed*
  'D1': { baseName: 'CMP', mode: 'postIndexedIndirect', cycle: 5 }, //6 if page crossed
  'D2': { baseName: 'STP', mode: 'implied', cycle: 3 },
  'D3': { baseName: 'DCP', mode: 'postIndexedIndirect', cycle: 8 },
  'D4': { baseName: 'NOP', mode: 'zeroPageX', cycle: 4 },
  'D5': { baseName: 'CMP', mode: 'zeroPageX', cycle: 4 },
  'D6': { baseName: 'DEC', mode: 'zeroPageX', cycle: 6 },
  'D7': { baseName: 'DCP', mode: 'zeroPageX', cycle: 6 },
  'D8': { baseName: 'CLD', mode: 'implied', cycle: 2 },
  'D9': { baseName: 'CMP', mode: 'absoluteY', cycle: 4 }, //5 if page crossed
  'DA': { baseName: 'NOP', mode: 'implied', cycle: 2 },
  'DB': { baseName: 'DCP', mode: 'absoluteY', cycle: 7 },
  'DC': { baseName: 'NOP', mode: 'absoluteX', cycle: 4 },
  'DD': { baseName: 'CMP', mode: 'absoluteX', cycle: 4 }, //5 if page crossed
  'DE': { baseName: 'DEC', mode: 'absoluteX', cycle: 7 },
  'DF': { baseName: 'DCP', mode: 'absoluteX', cycle: 7 },
  'E0': { baseName: 'CPX', mode: 'immediate', cycle: 2 },
  'E1': { baseName: 'SBC', mode: 'preIndexedIndirect', cycle: 6 },
  'E2': { baseName: 'NOP', mode: 'immediate', cycle: 2 },
  'E3': { baseName: 'ISB', mode: 'preIndexedIndirect', cycle: 8 },
  'E4': { baseName: 'CPX', mode: 'zeroPage', cycle: 3 },
  'E5': { baseName: 'SBC', mode: 'zeroPage', cycle: 3 },
  'E6': { baseName: 'INC', mode: 'zeroPage', cycle: 5 },
  'E7': { baseName: 'ISB', mode: 'zeroPage', cycle: 5 },
  'E8': { baseName: 'INX', mode: 'implied', cycle: 2 },
  'E9': { baseName: 'SBC', mode: 'immediate', cycle: 2 },
  'EA': { baseName: 'NOP', mode: 'implied', cycle: 2 },
  'EB': { baseName: 'SBC', mode: 'immediate', cycle: 2 },
  'EC': { baseName: 'CPX', mode: 'absolute', cycle: 4 },
  'ED': { baseName: 'SBC', mode: 'absolute', cycle: 4 },
  'EE': { baseName: 'INC', mode: 'absolute', cycle: 6 },
  'EF': { baseName: 'ISB', mode: 'absolute', cycle: 6 },
  'F0': { baseName: 'BEQ', mode: 'relative', cycle: 2 }, //3 if branch taken, 4 if page crossed*
  'F1': { baseName: 'SBC', mode: 'postIndexedIndirect', cycle: 5 }, //6 if page crossed
  'F2': { baseName: 'STP', mode: 'implied', cycle: 3 },
  'F3': { baseName: 'ISB', mode: 'postIndexedIndirect', cycle: 8 },
  'F4': { baseName: 'NOP', mode: 'zeroPageX', cycle: 4 },
  'F5': { baseName: 'SBC', mode: 'zeroPageX', cycle: 4 },
  'F6': { baseName: 'INC', mode: 'zeroPageX', cycle: 6 },
  'F7': { baseName: 'ISB', mode: 'zeroPageX', cycle: 6 },
  'F8': { baseName: 'SED', mode: 'implied', cycle: 2 },
  'F9': { baseName: 'SBC', mode: 'absoluteY', cycle: 4 }, //5 if page crossed
  'FA': { baseName: 'NOP', mode: 'implied', cycle: 2 },
  'FB': { baseName: 'ISB', mode: 'absoluteY', cycle: 7 },
  'FC': { baseName: 'NOP', mode: 'absoluteX', cycle: 4 },
  'FD': { baseName: 'SBC', mode: 'absoluteX', cycle: 4 }, //5 if page crossed
  'FE': { baseName: 'INC', mode: 'absoluteX', cycle: 7 },
  'FF': { baseName: 'ISB', mode: 'absoluteX', cycle: 7 },
}