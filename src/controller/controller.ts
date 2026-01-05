export interface Controller {
  read(): 0 | 1;
  write(data: number): void;
}