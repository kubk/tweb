export abstract class Drawable {
  onMouseDown(x: number, y: number): void {}
  onMouseMove(x: number, y: number, ctx: CanvasRenderingContext2D): void {}
  onMouseUp(): void {}

  containsPoint(x: number, y: number): boolean {
    return false;
  }

  abstract draw(ctx: CanvasRenderingContext2D): void;

  abstract clone(): Drawable;
}
