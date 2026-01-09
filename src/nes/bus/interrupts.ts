export class Interrupts {

  private nmi = false;
  private irq = false;
  private _dmaProcessed = false;

  constructor() {}

  handleNmi(): boolean {
    return this.nmi;
  }

  handleIrq(): boolean {
    return this.irq;
  }

  get dmaProcessed(): boolean {
    return this._dmaProcessed;
  }

  setNmi(flag: boolean) {
    this.nmi = flag;
  }

  setIrq(flag: boolean) {
    this.irq = flag;
  }

  setDmaProcessed(flag: boolean) {
    this._dmaProcessed = flag;
  }
}