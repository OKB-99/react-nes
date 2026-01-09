import { FrameObj } from "../canvas/frame-obj";
import { Mapper } from "../mapper/mapper";
import { Byte, Memory, RAM, Word } from "../utils/commons";

/*
 * Address         Size        Device
 * ----------------------------------------
 * 0x0000-0x0FFF	0x1000	Pattern Table0 (4kB)
 * 0x1000-0x1FFF	0x1000	Pattern Table1
 * 0x2000-0x23BF	0x03C0  Name Table0 (0x0011 1100 0000 = 1024 - 64 = B)
 * 0x23C0-0x23FF	0x0040  Attr Table0 (0x0100 0000 = 2^6 = 64B)
 * 0x2400-0x27FF	0x0400	Name Table (-0x27BF) /Attr Table1
 * 0x2800-0x2BFF	0x0400	Name Table (-0x2BBF) /Attr Table2
 * 0x2C00-0x2FFF	0x0400	Name Table (-0x2FBF) /Attr Table3
 * 0x3000-0x3EFF	-	    Mirror of 0x2000-0x2EFF
 * 0x3F00-0x3F0F	0x0010	BG Palette (16B = 4 palets * 4 colors)
 * 0x3F10-0x3F1F	0x0010	Sprite Palette (16B)
 * 0x3F20-0x3FFF	-	    Mirror of 0x3F00-0x3F1F
 */
export class PpuBus {

    private mapper: Mapper;
    private vram: RAM = new Memory(new Uint8Array(0x800)); // 2KB
    private paletteRam: RAM = new Memory(new Uint8Array(0x20));
    private MIRRORING_TYPE: 'HORIZONTAL' | 'VERTICAL' | 'FOURSCREEN' = 'HORIZONTAL';

    constructor(headers: Uint8Array, mapper: Mapper) {
        this.mapper = mapper;

        if ((headers[6] & 0x01) === 0x00) {
            this.MIRRORING_TYPE = 'HORIZONTAL';
        } else if ((headers[6] & 0x01) === 0x01) {
            this.MIRRORING_TYPE = 'VERTICAL';
        } else if ((headers[6] & 0x03) === 0x02) {
            this.MIRRORING_TYPE = 'FOURSCREEN';
        }
    }

    readByPpu(addr: Word): Byte {
        if (addr < 0x2000) {
            // Pattern Table 0,1
            return this.mapper.readChr(addr);
        } else if (addr < 0x3000) {
            // Name Table, Attribute Table 0-3
            const mappedAddr = this.mirroringMap(addr - 0x2000);
            return this.vram.read(mappedAddr);
        } else if (addr < 0x3F00) {
            // Mirror of VRAM
            const mappedAddr = this.mirroringMap(addr - 0x3000);
            return this.vram.read(mappedAddr);
        } else {
            // Pallet RAM (0x3F00-0x3F1F) + Mirror (0x3F20-0x3FFF)
            addr &= 0x1F;
            // Mirror of background color
            if (addr & 0x10 && (addr & 0x03) === 0x00) {
                addr &= ~0x10;
            }
            return this.paletteRam.read(addr);
        }
    }

    writeByPpu(addr: Word, data: Byte): void {
        if (addr < 0x2000) {
            // Pattern Table 0,1
            this.mapper.writeChr(addr, data); // Not used in most cases
        } else if (addr < 0x3000) {
            // Name Table, Attribute Table 0-3
            const mappedAddr = this.mirroringMap(addr - 0x2000);
            this.vram.write(mappedAddr, data);
        } else if (addr < 0x3F00) {
            // Mirror of VRAM
            const mappedAddr = this.mirroringMap(addr - 0x3000);
            this.vram.write(mappedAddr, data);
        } else {
            // Pallet RAM (0x3F00-0x3F1F) + Mirror (0x3F20-0x3FFF)
            addr &= 0x1F;
            // Mirror of background color
            if (addr & 0x10 && (addr & 0x03) === 0x00) {
                addr &= ~0x10;
            }
            this.paletteRam.write(addr, data);
        }
    }

    getNewFrameObj() {
      // Setup palettes
      const bgPaletteIds = [], spPaletteIds = [];
      for (let i = 0; i < 16; i++) {
        bgPaletteIds.push(this.readByPpu(0x3F00 + i) % 64);
        spPaletteIds.push(this.readByPpu(0x3F10 + i) % 64);
      }
      return new FrameObj(bgPaletteIds, spPaletteIds);
    }

    private mirroringMap(addr: number): number {
        switch (this.MIRRORING_TYPE) {
            case 'HORIZONTAL':
                if (addr < 0x800) {
                    addr = addr % 0x400;
                } else if (addr < 0x1000) {
                    addr = (0x400 + (addr % 0x400)) & 0x7FF;
                }
                break;
            case 'VERTICAL':
                if (addr >= 0x800) {
                    addr -= 0x800;
                }
                break;
            case 'FOURSCREEN':
                break;
        }

        return addr;
    }
}