export abstract class Drawable {
  onMouseDown(mouseX: number, mouseY: number): void {}
  onMouseUp(): void {}
  onMouseMove(x: number, y: number, ctx: CanvasRenderingContext2D): void {}

  containsPoint(x: number, y: number): boolean {
    return false;
  }

  abstract draw(ctx: CanvasRenderingContext2D): void;

  abstract clone(): Drawable;
}
