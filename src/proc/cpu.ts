import { Byte, Word } from "../utils/commons";
import { CpuBus } from "../bus/cpu-bus";
import { AddressingMode, dict } from "./opecode";
import { Interrupts } from "../bus/interrupts";

interface CpuStatus {
  negative: boolean;
  overflow: boolean;
  reserved: boolean;
  break: boolean;
  decimal: boolean;
  interrupt: boolean; // true if the interrupt is disabled.
  zero: boolean;
  carry: boolean;
}

interface Registers {
    accumulator: Byte;
    indexX: Byte;
    indexY: Byte;
    status: CpuStatus;
    SP: Byte;
    PC: Word;
}

export class CPU {

    registers!: Registers;
    bus: CpuBus;
    interrupts: Interrupts;
    hasBranched: boolean = false;
    pageCrossed: boolean = false;

    constructor(bus: CpuBus, interrupts: Interrupts) {
        this.bus = bus;
        this.interrupts = interrupts;
        this.reset();
        console.log(`CPU initialized! PC: 0x${this.registers.PC.toString(16)}`);
    }

    private defaultRegisters: Registers = {
        accumulator: 0x00,
        indexX: 0x00,
        indexY: 0x00,
        status: {
            negative: false,
            overflow: false,
            reserved: true,
            break: true,
            decimal: false,
            interrupt: true,
            zero: false,
            carry: false,
        },
        SP: 0xFD,
        PC: 0xFFFC
    }

    reset() {
        this.registers = this.defaultRegisters;
        this.registers.PC = (this.bus.readByCpu(0xFFFC) | (this.bus.readByCpu(0xFFFD) << 8)) & 0xFFFF;
    }

    fetch(): Byte {
        return this.bus.readByCpu(this.registers.PC++) & 0xFF;
    }

    fetchWord(): Word {
        return (this.bus.readByCpu(this.registers.PC++) | (this.bus.readByCpu(this.registers.PC++) << 8)) & 0xFFFF;
    }

    /*
      fixedCycle: true for ASL, LSR, ROL, ROR, DEC, INC, STA opcodes.
    */
    getAddrOrData(mode: AddressingMode, fixedCycles = false): Byte | Word {
        switch(mode) {
          case 'implied': // Used only when CPU's status must be changed.
            // Following opcodes has only implied addressing mode: Push, Pull, Set/Clear flag, Transfer, Inc/Dec, and BRK
            return 0x00;
          case 'accumulator': // Used only for the rotating or shiting opcodes: ROR, ROL, ASL and LSR
            return 0x00;
          case 'immediate':
            return this.fetch();
          case 'zeroPage':
            return this.fetch();
          case 'zeroPageX': {
            return (this.fetch() + this.registers.indexX) & 0xFF;
          }
          case 'zeroPageY': {
            return (this.fetch() + this.registers.indexY) & 0xFF;
          }
          case 'absolute':
            return this.fetchWord();
          case 'absoluteX': {
            const orig = this.fetchWord();
            const result = (orig + this.registers.indexX) & 0xFFFF;
            this.pageCrossed = !fixedCycles && ((orig & 0xFF00) !== (result & 0xFF00));
            return result;
          }
          case 'absoluteY': {
            const orig = this.fetchWord();
            const result = (orig + this.registers.indexY) & 0xFFFF;
            this.pageCrossed = !fixedCycles && ((orig & 0xFF00) !== (result & 0xFF00));
            return result;
          }
          case 'relative': // Used only for the Branching opcodes.
            return this.fetch();
          case 'preIndexedIndirect': {
            const addr = (this.fetch() + this.registers.indexX) & 0xFF; // zeroPageX
            const result = (this.bus.readByCpu(addr) | (this.bus.readByCpu((addr + 1) & 0xFF) << 8)) & 0xFFFF;
            return result;
          }
          case 'postIndexedIndirect': {
            const addr = this.fetch(); // zeroPage
            const orig = (this.bus.readByCpu(addr) | (this.bus.readByCpu((addr + 1) & 0xFF) << 8)) & 0xFFFF;
            const result = (orig + this.registers.indexY) & 0xFFFF;
            this.pageCrossed = !fixedCycles && ((orig & 0xFF00) !== (result & 0xFF00));
            return result;
          }
          case 'indirectAbsolute': {
            const orig = this.fetchWord();
            const lsb = this.bus.readByCpu(orig) & 0xFF;
            const msb = this.bus.readByCpu((orig & 0xFF00) | ((orig + 1) & 0x00FF)) & 0xFF
            const result = (lsb | (msb << 8)) & 0xFFFF;
            this.pageCrossed = !fixedCycles && ((orig & 0xFF00) !== (result & 0xFF00));
            return result;
          }
        }
    }

    branch(addr: Byte) {
      // PC = PC + 2 + memory (signed)
      if ((addr & 0x80) > 0) {
        this.registers.PC = (this.registers.PC + addr - 0x100) & 0xFFFF;
      } else {
        this.registers.PC = (this.registers.PC + addr) & 0xFFFF;
      }
      this.hasBranched = true;
    }

    push(data: Byte) {
      this.bus.writeByCpu(0x100 | this.registers.SP, data);
      this.registers.SP--;
    }

    pushPC(): void {
      this.push((this.registers.PC >> 8) & 0xFF);
      this.push(this.registers.PC & 0xFF);
    }

    pushStatus() {
      const status: Byte = //NV11DIZC
          (+this.registers.status.negative) << 7 | (+this.registers.status.overflow) << 6 |
          (+this.registers.status.reserved) << 5 | (+this.registers.status.break) << 4 |
          (+this.registers.status.decimal) << 3 | (+this.registers.status.interrupt) << 2 |
          (+this.registers.status.zero) << 1 | (+this.registers.status.carry);
      this.push(status);
    }

    pull(): Byte {
      this.registers.SP++;
      return this.bus.readByCpu(0x100 | this.registers.SP);
    }

    pullPC(): void {
      const lsb  = this.pull();
      const msb  = this.pull();
      this.registers.PC = (lsb | (msb << 8)) & 0xFFFF;
    }

    pullStatus(): void {
      const status: Byte = this.pull();
      this.registers.status.negative = !!(status & 0x80);
      this.registers.status.overflow = !!(status & 0x40);
      this.registers.status.reserved = !!(status & 0x20);
      this.registers.status.break = !!(status & 0x10);
      this.registers.status.decimal = !!(status & 0x8);
      this.registers.status.interrupt = !!(status & 0x4);
      this.registers.status.zero = !!(status & 0x2);
      this.registers.status.carry = !!(status & 0x1);
    }

    setZN(registerOrResult: Byte) {
      this.registers.status.zero = !(registerOrResult & 0xFF);
      this.registers.status.negative = !!(registerOrResult & 0x80);
    }

    execInstruction(baseName: string, mode: AddressingMode, addrOrData: Byte | Word = 0): void {
      switch(baseName) {

        /** --Arithmetic opcodes (5)-- */
        case 'ADC': { // Add with Carry
          const data = mode === 'immediate' ? addrOrData : this.bus.readByCpu(addrOrData);
          const result = this.registers.accumulator + data + (+this.registers.status.carry);
          const overflow = (result ^ this.registers.accumulator) & (result ^ data) & 0x80
          this.registers.accumulator = result & 0xFF;
          this.registers.status.overflow = !!overflow;
          this.registers.status.carry = result > 0xFF;
          this.setZN(this.registers.accumulator);
          break;
        }

        case 'SBC': { // Substract with Carry
          const data = mode === 'immediate' ? addrOrData : this.bus.readByCpu(addrOrData);
          const result = this.registers.accumulator + ~data + (+this.registers.status.carry);
          const overflow = (result ^ this.registers.accumulator) & (result ^ ~data) & 0x80
          this.registers.accumulator = result & 0xFF;
          this.registers.status.overflow = !!overflow;
          this.registers.status.carry = result >= 0x00;
          this.setZN(this.registers.accumulator);
          break;
        }

        case 'CMP': { // Compare A
          const data = mode === 'immediate' ? addrOrData : this.bus.readByCpu(addrOrData);
          const result = this.registers.accumulator - data;
          this.registers.status.carry = result >= 0;
          this.setZN(result);
          break;
        }

        case 'CPX': { // Compare X
          const data = mode === 'immediate' ? addrOrData : this.bus.readByCpu(addrOrData);
          const result = this.registers.indexX - data;
          this.registers.status.carry = result >= 0;
          this.setZN(result);
          break;
        }

        case 'CPY': { // Compare Y
          const data = mode === 'immediate' ? addrOrData : this.bus.readByCpu(addrOrData);
          const result = this.registers.indexY - data;
          this.registers.status.carry = result >= 0;
          this.setZN(result);
          break;
        }
        /** !-Arithmetic opcodes (5)-- */

        /** --Logical opcodes (4)-- */
        case 'AND': { // Bitwise AND
          const data = mode === 'immediate' ? addrOrData : this.bus.readByCpu(addrOrData);
          this.registers.accumulator = this.registers.accumulator & data;
          this.setZN(this.registers.accumulator);
          break;
        }

        case 'EOR': { // Exclusive OR
          const data = mode === 'immediate' ? addrOrData : this.bus.readByCpu(addrOrData);
          this.registers.accumulator = this.registers.accumulator ^ data;
          this.setZN(this.registers.accumulator);
          break;
        }

        case 'ORA': { // Bitwise OR
          const data = mode === 'immediate' ? addrOrData : this.bus.readByCpu(addrOrData);
          this.registers.accumulator = this.registers.accumulator | data;
          this.setZN(this.registers.accumulator);
          break;
        }

        case 'BIT': { // Bit Test
          const data = this.bus.readByCpu(addrOrData);
          this.registers.status.zero = !(this.registers.accumulator & data);
          this.registers.status.negative = !!(data & 0x80);
          this.registers.status.overflow = !!(data & 0x40);
          break;
        }
        /** !-Logical opcodes-- */

        /** --Shited, Rotated (4)-- */
        case 'ASL': { // Arithmetic Shift Left
          let data, result = 0x00;
          if (mode === 'accumulator') {
            data = this.registers.accumulator;
            result = (data << 1) & 0xFF
            this.registers.accumulator = result;
          } else {
            data = this.bus.readByCpu(addrOrData);
            result = (data << 1) & 0xFF
            this.bus.writeByCpu(addrOrData, result);
          }
          this.registers.status.carry = !!(data & 0x80); // not evaluated for the result?
          this.setZN(result);
          break;
        }

        case 'LSR': { // Logical Shift Right
          let data, result = 0x00;
          if (mode === 'accumulator') {
            data = this.registers.accumulator;
            result = (data >> 1) & 0xFF
            this.registers.accumulator = result;
          } else {
            data = this.bus.readByCpu(addrOrData);
            result = (data >> 1) & 0xFF
            this.bus.writeByCpu(addrOrData, result);
          }
          this.registers.status.carry = !!(data & 0x01);
          this.setZN(result);
          break;
        }

        case 'ROL': { // Rotate Left
          let data, result = 0x00;
          if (mode === 'accumulator') {
            data = this.registers.accumulator;
            result = ((data << 1) & 0xFF) | (+this.registers.status.carry)
            this.registers.accumulator = result;
          } else {
            data = this.bus.readByCpu(addrOrData);
            result = ((data << 1) & 0xFF) | (+this.registers.status.carry)
            this.bus.writeByCpu(addrOrData, result);
          }
          this.registers.status.carry = !!(data & 0x80);
          this.setZN(result);
          break;
        }

        case 'ROR': { // Rotate Right
          let data, result = 0x00;
          if (mode === 'accumulator') {
            data = this.registers.accumulator;
            result = (+this.registers.status.carry << 7) | ((data >> 1) & 0x7F)
            this.registers.accumulator = result;
          } else {
            data = this.bus.readByCpu(addrOrData);
            result = (+this.registers.status.carry << 7) | ((data >> 1) & 0x7F)
            this.bus.writeByCpu(addrOrData, result);
          }
          this.registers.status.carry = !!(data & 0x01);
          this.setZN(result);
          break;
        }
        /** !-Shited, Rotated-- */

        /** --Branches (8)-- */
        case 'BCC': { // Branch if Carry Clear
          !this.registers.status.carry && this.branch(addrOrData);
          break;
        }

        case 'BCS': { // Branch if Carry Set
          this.registers.status.carry && this.branch(addrOrData);
          break;
        }

        case 'BEQ': { // Branch if Equal
          this.registers.status.zero && this.branch(addrOrData);
          break;
        }

        case 'BMI': { // Branch if Minus
          this.registers.status.negative && this.branch(addrOrData);
          break;
        }

        case 'BNE': { // Branch if Not Equal
          !this.registers.status.zero && this.branch(addrOrData);
          break;
        }

        case 'BPL': { // Branch if Plus
          !this.registers.status.negative && this.branch(addrOrData);
          break;
        }

        case 'BVC': { // Branch if Overflow Clear
          !this.registers.status.overflow && this.branch(addrOrData);
          break;
        }

        case 'BVS': { // Branch if Overflow Set
          this.registers.status.overflow && this.branch(addrOrData);
          break;
        }
        /** !-Branches-- */

        case 'BRK': {
          mode === 'implied' && this.registers.PC++;
          this.registers.status.break = true;
          this.pushPC();
          this.pushStatus();
          this.registers.status.interrupt = true;
          this.registers.PC =  (this.bus.readByCpu(0xFFFE) | (this.bus.readByCpu(0xFFFF) << 8)) & 0xFFFF;
          break;
        }

        /** --Set, Clear Flag (7)-- */
        case 'CLC': { // Clear Carry
          this.registers.status.carry = false;
          break;
        }

        case 'CLD': { // Clear Decimal
          this.registers.status.decimal = false;
          break;
        }

        case 'CLI': { // Clear Intruption Disable
          this.registers.status.interrupt = false;
          break;
        }

        case 'CLV': { // Clear Overflow
          this.registers.status.overflow = false;
          break;
        }

        case 'SEC': { // Set Carry
          this.registers.status.carry = true;
          break;
        }

        case 'SED': { // Set Decimal
          this.registers.status.decimal = true;
          break;
        }

        case 'SEI': { // Set Interrupt Disable
          this.registers.status.interrupt = true;
          break;
        }
        /** !-Set, Clear Flag-- */

        /** --Increment, Decrement(6)-- */
        case 'INC': { // Increment Memory
          const data = this.bus.readByCpu(addrOrData);
          const result = (data + 1) & 0xFF;
          this.bus.writeByCpu(addrOrData, result);
          this.setZN(result);
          break;
        }

        case 'INX': { // Increment X
          this.registers.indexX = (this.registers.indexX + 1) & 0xFF;
          this.setZN(this.registers.indexX);
          break;
        }

        case 'INY': { // Increment Y
          this.registers.indexY = (this.registers.indexY + 1) & 0xFF;
          this.setZN(this.registers.indexY);
          break;
        }

        case 'DEC': { // Decrement Memory
          const data = this.bus.readByCpu(addrOrData);
          const result = (data - 1) & 0xFF;
          this.bus.writeByCpu(addrOrData, result);
          this.setZN(result);
          break;
        }

        case 'DEX': { // Decrement X
          this.registers.indexX = (this.registers.indexX - 1) & 0xFF;
          this.setZN(this.registers.indexX);
          break;
        }

        case 'DEY': { // Decrement Y
          this.registers.indexY = (this.registers.indexY - 1) & 0xFF;
          this.setZN(this.registers.indexY);
          break;
        }
        /** !-Increment, Decrement-- */

        /** --Jump (3)-- */
        case 'JMP': { // Jump
          this.registers.PC = addrOrData;
          break;
        }

        case 'JSR': { // Jump to Subroutine
          this.registers.PC--;
          this.pushPC();
          this.registers.PC = addrOrData;
          break;
        }

        case 'RTS': { // Return from Subroutine
          this.pullPC();
          this.registers.PC++;
          break;
        }
        /** !-Jump-- */

        /** --Load, Store (6)-- */
        case 'LDA': { // Load A
          const data = mode === 'immediate' ? addrOrData : this.bus.readByCpu(addrOrData);
          this.registers.accumulator = data;
          this.setZN(this.registers.accumulator);
          break;
        }

        case 'LDX': { // Load X
          const data = mode === 'immediate' ? addrOrData : this.bus.readByCpu(addrOrData);
          this.registers.indexX = data;
          this.setZN(this.registers.indexX);
          break;
        }

        case 'LDY': { // Load Y
          const data = mode === 'immediate' ? addrOrData : this.bus.readByCpu(addrOrData);
          this.registers.indexY = data;
          this.setZN(this.registers.indexY);
          break;
        }

        case 'STA': { // Store A
          this.bus.writeByCpu(addrOrData, this.registers.accumulator);
          break;
        }

        case 'STX': { // Store X
          this.bus.writeByCpu(addrOrData, this.registers.indexX);
          break;
        }

        case 'STY': { // Store Y
          this.bus.writeByCpu(addrOrData, this.registers.indexY);
          break;
        }
        /** !-Load, Store-- */

        case 'NOP':
          // Do nothing.
          break;

        /** --Stack Operations (6)-- */
        case 'TSX': { // Transfer Stack Pointer to X
          this.registers.indexX = this.registers.SP;
          this.setZN(this.registers.indexX);
          break;
        }

        case 'TXS': { // Transfer X to Stack Pointer
          this.registers.SP = this.registers.indexX;
          break;
        }

        case 'PHA': { // Push A
          this.push(this.registers.accumulator);
          break;
        }

        case 'PHP': { // Push Processor Status
          this.pushStatus();
          this.registers.status.break = true;
          break;
        }

        case 'PLA': { // Pull A
          this.registers.accumulator = this.pull();
          this.setZN(this.registers.accumulator);
          break;
        }

        case 'PLP': { // Pull Processor Status
          this.pullStatus();
          break;
        }
        /** !-Stack Operations-- */

        case 'RTI': { // Return from Interrupt
          this.pullStatus();
          this.pullPC();
          break;
        }

        /** --Transfer (4)-- */
        case 'TAX': { // Transfer A to X
          this.registers.indexX = this.registers.accumulator;
          this.setZN(this.registers.indexX);
          break;
        }

        case 'TAY': { // Transfer A to Y
          this.registers.indexY = this.registers.accumulator;
          this.setZN(this.registers.indexY);
          break;
        }

        case 'TXA': { // Transfer X to A
          this.registers.accumulator = this.registers.indexX;
          this.setZN(this.registers.accumulator);
          break;
        }

        case 'TYA': { // Transfer Y to A
          this.registers.accumulator = this.registers.indexY;
          this.setZN(this.registers.accumulator);
          break;
        }
        /** !-Transfer-- */

        /** --Unofficial opcodes-- */
        case 'ISB': { // Increment Memory and Subtract with Carry (Unofficial)
          let data = this.bus.readByCpu(addrOrData);
          const result = (data + 1) & 0xFF
          this.bus.writeByCpu(addrOrData, result);
          this.setZN(result);
          const subResult = this.registers.accumulator - result;
          this.registers.status.carry = subResult >= 0;
          this.setZN(subResult);
          this.registers.accumulator = subResult & 0xFF;
          break;
        }

        case 'DCP': { // Decrement Memory and Compare with A (Unofficial)
          let data = this.bus.readByCpu(addrOrData);
          const result = (data - 1) & 0xFF
          this.bus.writeByCpu(addrOrData, result);
          this.setZN(result);
          const subResult = this.registers.accumulator - result;
          this.registers.status.carry = subResult >= 0;
          this.setZN(subResult);
          break;
        }

        case 'LAX': { // Load A and X (Unofficial)
          const data = mode === 'immediate' ? addrOrData : this.bus.readByCpu(addrOrData);
          this.registers.accumulator = data;
          this.registers.indexX = data;
          this.setZN(data);
          break;
        }

        case 'LAS': { // Load A, X, and SP (Unofficial)
          const data = mode === 'immediate' ? addrOrData : this.bus.readByCpu(addrOrData);
          this.registers.accumulator = (data & this.registers.SP) & 0xFF;
          this.registers.indexX = this.registers.accumulator;
          this.registers.SP = this.registers.accumulator;
          this.setZN(this.registers.accumulator);
          break;
        }

        case 'SBX': { // Subtract with Carry and AND with X (Unofficial)
          const data = mode === 'immediate' ? addrOrData : this.bus.readByCpu(addrOrData);
          const subResult = this.registers.indexX - data;
          this.registers.status.carry = subResult >= 0;
          this.setZN(subResult);
          this.registers.indexX = (subResult & this.registers.accumulator) & 0xFF;
          this.setZN(this.registers.indexX);
          break;
        }

        case 'RLA': { // Rotate Left and AND with A (Unofficial)
          let data = this.bus.readByCpu(addrOrData);
          const result = ((data << 1) & 0xFF) | (+this.registers.status.carry)
          this.bus.writeByCpu(addrOrData, result);
          this.registers.status.carry = !!(data & 0x80);
          this.setZN(result);
          this.registers.accumulator = this.registers.accumulator & result;
          this.setZN(this.registers.accumulator);
          break;
        }

        case 'RRA': { // Rotate Right and AND with A (Unofficial)
          let data = this.bus.readByCpu(addrOrData);
          const result = ((+this.registers.status.carry << 7) | data >> 1) & 0xFF
          this.bus.writeByCpu(addrOrData, result);
          this.registers.status.carry = !!(data & 0x01);
          this.setZN(result);
          this.registers.accumulator = (this.registers.accumulator + result + (+this.registers.status.carry)) & 0xFF;
          this.registers.status.overflow = !!((this.registers.accumulator ^ result) & (this.registers.accumulator ^ data) & 0x80);
          this.registers.status.carry = this.registers.accumulator > 0xFF;
          this.registers.accumulator &= 0xFF;
          this.setZN(this.registers.accumulator);
          break;
        }

        case 'SRA': { // Shift Right and AND with A (Unofficial)
          let data = this.bus.readByCpu(addrOrData);
          const result = (data >> 1) & 0xFF
          this.bus.writeByCpu(addrOrData, result);
          this.registers.status.carry = !!(data & 0x01);
          this.setZN(result);
          this.registers.accumulator = this.registers.accumulator & result;
          this.setZN(this.registers.accumulator);
          break;
        }

        case 'SRE': { // Shift Right and EOR with A (Unofficial)
          let data = this.bus.readByCpu(addrOrData);
          const result = (data >> 1) & 0xFF
          this.bus.writeByCpu(addrOrData, result);
          this.registers.status.carry = !!(data & 0x01);
          this.setZN(result);
          this.registers.accumulator = this.registers.accumulator ^ result;
          this.setZN(this.registers.accumulator);
          break;
        }

        case 'SLO': { // Shift Left and OR with A (Unofficial)
          let data = this.bus.readByCpu(addrOrData);
          const result = (data << 1) & 0xFF
          this.bus.writeByCpu(addrOrData, result);
          this.registers.status.carry = !!(data & 0x80);
          this.setZN(result);
          this.registers.accumulator = this.registers.accumulator | result;
          this.setZN(this.registers.accumulator);
          break;
        }

        case 'SAX': { // Store A AND X (Unofficial)
          const data = this.registers.accumulator & this.registers.indexX;
          this.bus.writeByCpu(addrOrData, data);
          break;
        }

        case 'SHX': { // Store X AND High Byte of Address (Unofficial)
          const highByte = (addrOrData >> 8) & 0xFF;
          const data = this.registers.indexX & highByte;
          this.bus.writeByCpu(addrOrData, data);
          break;
        }

        case 'SHY': { // Store Y AND High Byte of Address (Unofficial)
          const highByte = (addrOrData >> 8) & 0xFF;
          const data = this.registers.indexY & highByte;
          this.bus.writeByCpu(addrOrData, data);
          break;
        }

        case 'STP': { // Stop the Clock (Unofficial)
          this.registers.PC--;
          break;
        }

        case 'ANC': { // AND with A, Copy A to Carry (Unofficial)
          const data = mode === 'immediate' ? addrOrData : this.bus.readByCpu(addrOrData);
          this.registers.accumulator = this.registers.accumulator & data;
          this.setZN(this.registers.accumulator);
          this.registers.status.carry = !!(this.registers.accumulator & 0x80);
          break;
        }

        case 'ALR': { // AND with A, LSR A (Unofficial)
          const data = mode === 'immediate' ? addrOrData : this.bus.readByCpu(addrOrData);
          this.registers.accumulator = this.registers.accumulator & data;
          this.registers.status.carry = !!(this.registers.accumulator & 0x01);
          this.registers.accumulator = (this.registers.accumulator >> 1) & 0xFF;
          this.setZN(this.registers.accumulator);
          break;
        }

        case 'ARR': { // AND with A, ROR A (Unofficial)
          const data = mode === 'immediate' ? addrOrData : this.bus.readByCpu(addrOrData);
          this.registers.accumulator = this.registers.accumulator & data;
          const oldBit0 = this.registers.accumulator & 0x01;
          this.registers.accumulator = ((+this.registers.status.carry << 7) | (this.registers.accumulator >> 1)) & 0xFF;
          this.setZN(this.registers.accumulator);
          this.registers.status.carry = !!oldBit0;
          this.registers.status.overflow = !!((this.registers.accumulator >> 6) & 0x01 ^ (this.registers.accumulator >> 5) & 0x01);
          break;
        }

        case 'TAS': { // Transfer A AND X to SP (Unofficial)
          const data = (this.registers.accumulator & this.registers.indexX) & 0xFF;
          this.registers.SP = data;
          break;
        }

        case 'XAA': { // Transfer X to A, AND with Memory (Unofficial)
          const data = mode === 'immediate' ? addrOrData : this.bus.readByCpu(addrOrData);
          this.registers.accumulator = this.registers.indexX & data;
          this.setZN(this.registers.accumulator);
          break;
        }
        /** !-Unofficial opcodes-- */

        default:
          throw new Error('Opecode not implemented');
      }
    }

    run(): number {
      this.hasBranched = false;
      this.pageCrossed = false;

      if (this.interrupts.handleNmi()) {
        this.interrupts.setNmi(false);
        this.registers.status.break = false;
        this.pushPC();
        this.pushStatus();
        this.registers.status.interrupt = true;
        this.registers.PC =  (this.bus.readByCpu(0xFFFA) | (this.bus.readByCpu(0xFFFB) << 8)) & 0xFFFF;
      }

      //TODO check IRQ steps.
      if (this.interrupts.handleIrq() && !this.registers.status.interrupt) {
        this.interrupts.setIrq(false);
        this.registers.status.break = false;
        this.pushPC();
        this.pushStatus();
        this.registers.status.interrupt = true;
        this.registers.PC =  (this.bus.readByCpu(0xFFFE) | (this.bus.readByCpu(0xFFFF) << 8)) & 0xFFFF;
      }

      const pc = this.registers.PC.toString(16).toUpperCase().padStart(4, '0');
      const opcode = this.fetch().toString(16).toUpperCase().padStart(2, '0');
      //console.debug(`Program Counter=0x${pc}, opcode=${opcode}`);

      try {
        let { baseName, mode, cycle } = dict[opcode];
        const addrOrData = this.getAddrOrData(mode);

        if (baseName === 'JMP' || baseName === 'STP') { //TODO DELETE ME
          if (this.startLoop === false) {
            console.log(`${baseName} loop started`);
            this.startLoop = true;
          }
        //} else if (!(baseName === 'INC' && this.preBasename === 'BRK' || baseName === 'BRK' && this.preBasename === 'INC')) {
        //} else if (baseName !== 'JMP') {
        } else if (baseName === 'LDA' && this.preBasename === 'BPL' || baseName === 'BPL' && this.preBasename === 'LDA') {
          if (this.startLoop === false) {
            console.debug(`Start Loop by LDA-BPL`);
            this.startLoop = true; //TODO DELETE ME
          }
        } else if (this.logActive) {
          this.startLoop = false;
          console.log(`PC=0x${pc}, baseName=${baseName}, mode=${mode}, addrOrData=0x${addrOrData.toString(16).toUpperCase().padStart(4, '0')}`);
        }
         //if (baseName === 'BNE' && addrOrData == 0xF8 && this.preBasename === 'INX') {
         // console.log(`INX count ${this.logCount++}`); //TODO DELETE ME
         //}

        this.execInstruction(baseName, mode, addrOrData);
        //if (baseName === 'JMP') { //TODO DELETE ME
        //  this.jmpCounter++;
        //  if (this.jmpCounter > 100000) {
        //    throw new Error('Program has ended.');
        //  }
        //}

        if (this.interrupts.dmaProcessed) {
          cycle += 514;
          this.interrupts.setDmaProcessed(false);
        }

        if (!this.allBaseNameAddrs[baseName]) {
          this.allBaseNameAddrs[baseName] = [];
        }

        if (!this.allBaseNameAddrs[baseName].includes(mode)) {
          this.allBaseNameAddrs[baseName].push(mode);
        }

        this.preBasename = baseName;

        return cycle + (+this.pageCrossed) + (+this.hasBranched);

      } catch (e) {
        console.error(`Error at PC=0x${this.registers.PC.toString(16).toUpperCase().padStart(4, '0')}, opcode=${opcode}`);
        throw e;
      }
    }

    private logActive = false; //TODO Delete me
    private startLoop = false; //TODO Delete me
    private logCount = 0; //TODO Delete me
    private preBasename = '';
    private allBaseNameAddrs: { [key: string]: AddressingMode[] } = {}; //TODO Delete me
    private jmpCounter = 0;
}
