import { Interrupts } from "../bus/interrupts";
import { PpuBus } from "../bus/ppu-bus";
import { FrameObj, TileSize } from "../canvas/frame-obj";
import { Byte, Memory, RAM, Word } from "../utils/commons";

export class PPU {

  private readonly NMI_ENABLED = 0x80;
  private readonly LONG_SPRITE = 0x20;
  private readonly BG_OFFSET = 0x10;
  private readonly SP_OFFSET = 0x08;
  private readonly INCREMENT_32 = 0x04;

  private readonly SPRITE_ENABLED = 0x10;
  private readonly BACKGROUND_ENABLED = 0x08;
  private readonly SP_LEFTCOLUMN_ENABLED = 0x04;


  /**
   * 0x0000	PPUCTRL	W (VPHB SINN)
   * [NMI, PPU Master/Slave, sprite height, bg tile select, sprite tile select, increment mode of VRAM addr, Base nametable address 0-3: 0x2000-0x2C00]
   * 0x0001	PPUMASK	W (BGRsbMmG)
   * [BGR, Sprite Enable, BG Enable, Sprite left column enable, BG left column enable, greyscale]
   * 0x0002	PPUSTATUS (VSO-----)
   * [vblank, Sprite 0 hit, Sprite Overflow]
   * 0x0003	OAMADDR	W	address on OAM (size: 0x100)
   * 0x0004	OAMDATA	RW	data to be writen on OAM
   * 0x0005	PPUSCROLL	W	BG Scroll Offset/BG Scroll value
   * 0x0006	PPUADDR	W	address on VRAM (0x2000-0x3EFF)
   * 0x0007	PPUDATA	RW	data to be writen on VRAM
   **/
  private registers = new Uint8Array(8);

  private cycle = 0;
  private scanLine = 0;
  private frameObj!: FrameObj;

  private get dot() {
    return this.cycle - 1;
  }

  /** Current address in the Name Table. yyy NN YYYY XXXX(15bit) */
  private v = 0;
  /** Address of the top left tile on the screen. yyy NN YYYYY XXXXX(15bit) */
  private t = 0; // Address of the top left tile on screen
  /** fineX: Nth horizontal pixel in a tile. 0-7 as well as fineY.*/
  private x = 0;
  /** First or second write toggle. false before the first write, true after the first write. */
  private w = false;

  private vReadBuffer = 0;

  private get fineY() {
    return this.t >> 12 & 0x07;
  }

  constructor(bus: PpuBus, wram: RAM, interrupts: Interrupts) {
      this.bus = bus;
      this.wram = wram;
      this.interrupts = interrupts;
  }

  /**
   * 0x0003	OAMADDR	W	address on OAM (size: 256B (0x100) = 64 sprites x 4B)
   * 0x0004	OAMDATA	RW	data to be writen on OAM
   * OAM date is composed of 4 bytes.
   * Byte 0, 3: Y, X position, Byte1: Sprite number (ref. Bit 3 of PPUCTL(reg[0])) in Pattern table
   * Byte2: Attribute Flip Horizontaly, Flip Verticaly, Priority(0: in front of BG, 1: behind BG/, xxx, Palette of sprite (2bit)
   */
  private oamAddr: Byte = 0x00;
  private oam: RAM = new Memory(new Uint8Array(0x100).fill(0xFF)); // 256B
  private spriteIdToDrow: number[] = [];
  private oamCache: [number, number, number, number[]][] = []; // [index, X position , BG priority, Sprite pixels (max 8 pixels)]
  private wram: RAM;

  /*
   * 0x0005	PPUSCROLL	W	BG Scroll Offset/ BG Scroll Value
   * 0x0006	PPUADDR	W	address on VRAM (0x2000-0x3EFF)
   * 0x0007	PPUDATA	RW	data to be writen on VRAM
   */
  //private bus: RAM = new Memory(new Uint8Array(0x0800)); // 2kB
  private bus: PpuBus;

  private interrupts: Interrupts;

  readReg(addr: Word): Byte {

    let data = 0;

    if (addr <= 0x0002) {
      data = this.registers[addr];
      if (addr === 0x0002) {
        this.w = false;
        this.setVblank(false); // Reading PPUSTATUS clears the vblank flag.
        //this.interrupts.setNmi(false);
      }
    } else if (addr === 0x0004) {
      data = this.oam.read(this.oamAddr); // No increment occurs for the read.
    } else if (addr === 0x0007) {
      // Outside of rendering this can be called by CPU.
      const prevBuffer = this.vReadBuffer;
      this.vReadBuffer = this.bus.readByPpu(this.v);

      if (this.v >= 0x3F00) {
        data = this.vReadBuffer;
      } else {
        data = prevBuffer;
      }

      this.v = !!(this.registers[0] & this.INCREMENT_32) ? this.v + 32 : this.v + 1;
    }
    return data;
  }

  writeReg(addr: Word, data: Byte): void {
    //console.log(`PPU: Write Reg[${addr.toString(16)}] <= ${data.toString(16)}`);

    if (addr === 0x0000) {
      this.t = (this.t & 0xF3FF) | ((data & 0x03) << 10);
      //this.interrupts.setNmi(this.isVblank() && !!(data & this.NMI_ENABLED));
    } else if (addr === 0x0003) {
      this.oamAddr = data;
    } else if (addr === 0x0004) {
      this.oam.write(this.oamAddr++, data);
    } else if (addr === 0x0005) {
      // Write ScrollData
      if (!this.w) {
        this.t &= ~0x1F;
        this.t |= (data & 0xF8) >> 3;
        this.x = data & 0x07;
        this.w = true;
      } else {
        this.t &= ~0x73E0;
        this.t |= (data & 0x07 << 12) | ((data & 0xF8) << 2);
        this.w = false;
      }
    } else if (addr === 0x0006) {
      // Write VRAM address
      if (!this.w) {
        this.t = (data & 0x3F) << 8;
        this.w = true;
      } else {
        this.t |=  data & 0xFF;
        this.v = this.t;
        this.w = false;
      }
    } else if (addr === 0x0007) {
      //const nmiFlag = this.isVblank() && !!(this.registers[0] & this.NMI_ENABLED);
      //if ((this.isRenderingEnabled() && !this.isVblank()) || this.v < 0x2000) {
      //  console.warn(`PPU: Writing to nametable space v=0x${this.v.toString(16)} at scanline=${this.scanLine}, cycle=${this.cycle}`);
      //}
      // Outside of rendering this can be called by CPU.
      this.bus.writeByPpu(this.v, data);
      this.v = !!(this.registers[0] & this.INCREMENT_32) ? this.v + 32 : this.v + 1;
    }
    this.registers[addr] = data;
  }

  dma(n: Byte) {
    //console.log(`PPU: DMA from ${n.toString(16)}00 to OAM at 0x${this.oamAddr.toString(16)}`);
    const startAt = 0x100 * n; // The OAM write starts from this address.

    for (let i = 0; i < 256; i++) {
      this.oam.write((this.oamAddr + i) % 0x100, this.wram.read(startAt + i));
    }

    this.interrupts.setDmaProcessed(true);
  }

  private generateBGShifter() {
    const tileAddr = 0x2000 | (this.v & 0x0FFF); // Nametable base address + offset
    const tileId: Byte = this.bus.readByPpu(tileAddr);

    const paletteAddr = 0x23C0 | (this.v & 0x0C00) | ((this.v >> 4) & 0x38) | ((this.v >> 2) & 0x07)
    const paletteId = (this.bus.readByPpu(paletteAddr) >> ((this.v >> 4) & 0x04 | (this.v & 0x02))) & 0x03;

    //if (this.scanLine % 8 === 0) {
    //  console.log(`(X=${((this.v & 0x0FFF) % 32)}, Y=${~~(this.scanLine / 8)}) spriteId=${tileId}, paletteId=${paletteId}`);
    //}

    const n = (this.scanLine + this.fineY) % 8 as TileSize;
    const shifter = this.generateNthLineOfTile(tileId, paletteId, n);

    return shifter;
  }

  private consumeShifter(shifterBG: number[]) {

    // when x > 0 some pixels are skipped and then sprites must be shown earlier than the coordinate x.
    const xInRange = (coordX: number) =>
        (this.dot - this.x) - 8 < coordX && coordX <= this.dot - this.x;

    let skipPixels = this.dot < 8 ? this.x : 0;

    shifterBG.forEach((pixelToPush, bgIdx) => {
      this.oamCache.filter(([i, coordX, p, s])=> xInRange(coordX - bgIdx + 7)).reverse().forEach(([index, x, bgPriority, shifter]) => {
        const spPixel = shifter.shift() as number;
        if (bgPriority === 0 || (pixelToPush & 0x03) === 0) {
          if (spPixel & 0x03) {
            pixelToPush = spPixel;
          }
        }

        if (!this.hasSpriteZeroHit() && (spPixel & 0x03) && index === 0) {
          this.setSpriteZeroHit(true);
        }
      });

      if ((pixelToPush & 0x03) === 0) {
        pixelToPush &= ~0x0F; // Backdrop color
      }

      if (0 < skipPixels) {
        skipPixels--;
      } else {
        this.frameObj.toBeRendered[this.scanLine].push(pixelToPush);
      }
    });
  }

  private paternTableAddressOffset(isSprite: boolean): number {

    if (isSprite) {
      if ((this.registers[0] & this.SP_OFFSET) && !(this.registers[0] & this.LONG_SPRITE)) {
        return 0x1000;
      }
    } else {
      if (this.registers[0] & this.BG_OFFSET) { // Bit 4 of PPUCTRL
        return 0x1000;
      }
    }
    return 0x0000;
  }

  /**
   * 
   * @param tileId 
   * @param paletteId 
   * @param n: (fine Y + scanLine) % 8 (or 16 for 8x16 sprite)
   * @param flipX 
   * @param flipY 
   * @returns 
   */
  private generateNthLineOfTile(tileId: number, paletteId: number, n: number, isSprite = false, flipX = false, flipY = false): number[] {

    const tileHeight = isSprite ? this.spriteHeight : 8;
    let lineNumOfSP = flipY ? (tileHeight - 1) - n : n;

    let ptnTblAddr;
    if (isSprite && this.registers[0] & this.LONG_SPRITE) {
      const bottomOffset = lineNumOfSP > 7 ? 1 : 0;
      ptnTblAddr = ((tileId & 0xFE) + bottomOffset) * 16 + (lineNumOfSP & 0x7) + ((tileId & 1) ? 0x1000 : 0);
    } else {
      ptnTblAddr = tileId * 16 + lineNumOfSP + this.paternTableAddressOffset(isSprite);
    }

    const spriteLsb: Byte = this.bus.readByPpu(ptnTblAddr);
    const spriteMsb: Byte = this.bus.readByPpu(ptnTblAddr + 8);

    const shifter: number[] = [];

    for (let i = 0; i < 8; i++) {
      shifter[i] = (+isSprite << 4) | (paletteId << 2) |
          ((spriteMsb >> (7 - i) & 0x1) << 1) | (spriteLsb >> (7 - i) & 0x1); // Little endian
    }

    return flipX ? shifter.reverse() : shifter;
  }

  incHorizontalV() {
    if ((this.v & 0x001F) === 0x001F) { // if coarse X == 31
      this.v &= ~0x001F; // coarse X = 0 (Incrementing coarse X)
      this.v ^= 0x0400; // Switch horizontal nametable
    } else {
      this.v += 1; // Increment coarse X
    }
  }

  setVtoNextline() {
    this.v = (this.v & ~0x041F) | (this.t & 0x041F); // Copy horizontal position from t to v

    if ((this.fineY + this.scanLine) % 8 === 7) {
      const coarseY = (this.v >> 5) & 0x1F;
      if (coarseY === 29) { // If coarse Y == 29
        this.v &= ~0x03E0; // coarse Y = 0 (Incrementing coarse Y)
        this.v ^= 0x0800; // Switch vertical nametable
      } else if (coarseY === 31) { // If coarse Y == 31
        this.v &= ~0x03E0; // coarse Y = 0
      } else {
        this.v += 0x20; // Increment coarse Y
      }
    }
  }

  get spriteHeight() {
    return (this.registers[0] & this.LONG_SPRITE) ? 16 : 8;
  }

  setVblank(flag: boolean) {
    this.registers[2] &= ~0x80;
    this.registers[2] |= +flag << 7;
  }

  isVblank() {
    return (this.registers[2] & 0x80) !== 0;
  }

  setSpriteZeroHit(flag: boolean) {
    this.registers[2] &= ~0x40;
    this.registers[2] |= +flag << 6;
  }

  hasSpriteZeroHit() {
    return (this.registers[2] & 0x40) !== 0;
  }

  setSpriteOverflow(flag: boolean) {
    this.registers[2] &= ~0x20;
    this.registers[2] |= +flag << 5;
  }

  isRenderingEnabled() {
    return (this.registers[1] & (this.BACKGROUND_ENABLED | this.SPRITE_ENABLED)) !== 0;
  }

  run(): FrameObj | null {

    if (this.scanLine === 0 && this.cycle === 0) {
      //console.log(`##New Frame##v=0x${this.v.toString(16)}`);
      this.frameObj = this.bus.getNewFrameObj();
    }

    if (this.scanLine < 240)  {
      if (this.cycle === 0) {

      } else if (this.cycle <= 256) {
        // BG
        if (this.dot % 8 === 7) {
          //console.log(`SL=${this.scanLine} DOT=${this.dot} V=${this.v.toString(16)}`);
          if (this.isRenderingEnabled()) {
            const shifterBG = this.registers[1] & this.BACKGROUND_ENABLED ? this.generateBGShifter() : Array(8).fill(0);

            this.consumeShifter(shifterBG);
            this.incHorizontalV();
          }

        }

      } else if (this.cycle <= 320) {

        const slPlus1 = this.scanLine + 1; // Next scan line used for sprite evaluation

        if (this.cycle === 257) {

          if (this.x > 0) {
            if (this.isRenderingEnabled()) {
              const shifterBG = this.registers[1] & this.BACKGROUND_ENABLED ? this.generateBGShifter() : Array(8).fill(0);

              for (let i = 0; i < (7 - this.x); i++) {
                shifterBG.pop();
              }

              this.consumeShifter(shifterBG);
              this.incHorizontalV();
            }
          }

          // Clear OAM cache
          this.spriteIdToDrow = [] // Empty if Sprite Enable is off
          this.oamCache = [];

          if (this.registers[1] & this.SPRITE_ENABLED) {
            for (let i = 0; i < 256; i = i + 4) {
              const y = this.oam.read(i);
              if (y >= 0xEF) {
                continue; // Sprite not visible
              }

              if (slPlus1 >= y && slPlus1 < y + this.spriteHeight) {
                if (this.spriteIdToDrow.length < 8) {
                  this.spriteIdToDrow.push(i);
                } else {
                  this.setSpriteOverflow(true);
                  break;
                }
              }
            }
          }
        }
        //!-- Finish cycle 257 --

        if ((this.cycle % 8) === 0) {

          const i = this.spriteIdToDrow[((this.cycle - 256) / 8) - 1];

          if (i >= 0) {
            const coordY = this.oam.read(i);
            const spriteIdx = this.oam.read(i + 1);
            const spriteAttr = this.oam.read(i + 2);
            const coordX = this.oam.read(i + 3);

            const lineN = slPlus1 - coordY;
            const paletteId = spriteAttr & 0x03;
            const bgPriority = (spriteAttr >> 5) & 0x01;
            const flipX = !!(spriteAttr & 0x40), flipY = !!(spriteAttr & 0x80);
            const shifter = this.generateNthLineOfTile(spriteIdx, paletteId, lineN, true, flipX, flipY);

            if (0xF9 <= coordX) { // Checked!
              const overflowed = shifter.splice(coordX, 8 - (0xFF - coordX + 1));
              if (this.registers[1] & this.SP_LEFTCOLUMN_ENABLED) {
                this.oamCache.push([i, 0, bgPriority, overflowed]);
              }
            }
            this.oamCache.push([i, coordX, bgPriority, shifter]);
          }
        }

      }
    } else if (this.scanLine === 241 && this.cycle === 1) {
      this.setVblank(true);
      this.interrupts.setNmi(this.isVblank() && !!(this.registers[0] & this.NMI_ENABLED));
    } else if (this.scanLine === 261 && this.cycle === 1) {
      this.setVblank(false);
      this.setSpriteZeroHit(false);
      this.setSpriteOverflow(false);
      this.interrupts.setNmi(false);
    }

    if (++this.cycle === 341) { //Increment of cycle
      this.cycle = 0;

      if (this.scanLine < 240 && this.isRenderingEnabled()) {
        this.setVtoNextline(); // Increment of v
      }

      //console.log(`SL=${this.scanLine} C=${this.cycle} V=${this.v.toString(16)}`);
      if (++this.scanLine === 262) {
        this.scanLine = 0;

        if (this.isRenderingEnabled()) {
          this.v = this.t;
          return this.frameObj;
        }
      }
    }

    return null;
  }
}