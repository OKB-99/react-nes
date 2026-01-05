import { Byte, MapperType, Memory, RAM, ROM, Word } from '../utils/commons';
import { APU } from '../proc/apu';
import { PPU } from '../proc/ppu';
import { KeypadCtrl } from '../controller/keypad-ctrl';
import { NROM } from '../mapper/nrom';
import { Mapper } from '../mapper/mapper';
import { UxROM } from '../mapper/uxrom';
import { Controller } from '../controller/controller';
import { GamepadCtrl } from '../controller/gamepad-ctrl';

/*
 * Address         Size        Device
 * ----------------------------------------
 * 0x0000～0x07FF	0x0800      WRAM
 * 0x0800～0x1FFF	-	        Mirror of WRAM
 * 0x2000～0x2007	0x0008	    PPU registers
 * 0x2008～0x3FFF	-	        Mirror of PPU registers
 * 0x4000～0x401F	0x0020	    APU I/O、PAD, (0x4014: OAMDMA(Sprite DMA))
 * 0x4020～0x5FFF	0x1FE0	    Extended ROM
 * 0x6000～0x7FFF	0x2000	    Extended RAM
 * 0x8000～0xBFFF	0x4000	    PRG-ROM
 * 0xC000～0xFFFF	0x4000	    PRG-ROM
 */
export class CpuBus {

    private wram: RAM;
    private extProgramRam: RAM = new Memory(new Uint8Array(0x2000)); // 8KB
    private ppu: PPU;
    private apu: APU;
    private controller1: Controller = new KeypadCtrl();
    private mapper: Mapper;

    constructor(mapper: Mapper, wram: RAM, ppu: PPU, apu: APU) {
        this.mapper = mapper;
        this.wram = wram;
        this.ppu = ppu;
        this.apu = apu;

        window.addEventListener("gamepadconnected", (e) => {
            console.log("Controller connected");
            if (e.gamepad) {
              this.controller1 = new GamepadCtrl();
            }
        });

        window.addEventListener("gamepaddisconnected", (e) => {
          console.log("Controller disconnected");
          this.controller1 = new KeypadCtrl();
        });
    }

    readByCpu(addr: Word): Byte {

        let data: Byte = 0;

        if (addr < 0x0800) {
            // WRAM
            data = this.wram.read(addr);
        } else if (addr < 0x2000) {
            // Mirror of WRAM
            const realAddr = addr % 0x800;
            data = this.wram.read(realAddr);
        } else if (addr < 0x4000) {
            // PPU Registers (0x2000-0x2008)
            const realAddr = (addr - 0x2000) % 8;
            data = this.ppu.readReg(realAddr);
        } else if (addr <= 0x4020) {
            if (addr === 0x4016) {
                data = this.controller1.read();
            } else {
                data = 0;
            }
        } else if (addr < 0x6000) {
            // Extended ROM
            throw new Error(`Extended ROM not supported: ${(addr >>> 0).toString(16)}`);
        } else if (addr < 0x8000) {
            data = this.extProgramRam.read(addr - 0x6000);
        } else if (addr <= 0xFFFF) {
            data = this.mapper.readPrg(addr - 0x8000);
        } else {
            throw new Error(`Address not suuported: 0x${(addr >>> 0).toString(16)}`);
        }
        //console.log(`CPU read addr: ${(addr >>> 0).toString(16)}, data: ${(data >>> 0).toString(16)}`);
        return data >>> 0;
    }

    writeByCpu(addr: Word, data: Byte): void {

        //console.log(`CPU write addr: ${(addr & 0xffff).toString(16)}, data: ${data.toString(16)}`);
        if (addr < 0x0800) {
            // WRAM
            this.wram.write(addr, data);
        } else if (addr < 0x2000) {
            // Mirror of WRAM
            const realAddr = addr % 0x800;
            this.wram.write(realAddr, data);
        } else if (addr < 0x4000) {
            // PPU Registers (0x2000-0x2008)
            const realAddr = (addr - 0x2000) % 8;
            this.ppu.writeReg(realAddr, data);
        } else if (addr <= 0x4020) {
            if (addr === 0x4014) {
                // Copy 256 B of data from 0x100*N(=data) of WRAM to OAM (513 cycles = 1 idle +256*2 cycles)
                this.ppu.dma(data); //TODO delay 513 cycles;
            } else if (addr === 0x4016) {
                this.controller1.write(data);
            } else {
                this.apu.writeReg(addr - 0x4000, data);
            }
        } else if (addr < 0x6000) {
            throw new Error(`Extended ROM not supported: ${(addr >>> 0).toString(16)}`);
        } else if (addr < 0x8000) {
            this.extProgramRam.write(addr - 0x6000, data);
        } else if (addr <= 0xFFFF) {
            this.mapper.writePrg(addr - 0x8000, data);
        } else {
            throw new Error(`Address not suuported: 0x${(addr >>> 0).toString(16)}`);
        }
    }
}