export class FrameObj {

  toBeRendered: number[][]; // 240 x 256 pixels
  bgPaletteIds: number[];
  spPaletteIds: number[];

  constructor(bgPaletteIds: number[], spPaletteIds: number[]) {
    this.toBeRendered = Array(240).fill(0).map(x => new Array());
    this.bgPaletteIds = bgPaletteIds;
    this.spPaletteIds = spPaletteIds;
  }

}

export type Sprite = number[][];

export interface Tile {
  sprite: Sprite;
  paletteId: number;
}

export type TileSize = 0 | 1 | 2 | 3 | 4| 5 | 6 | 7;