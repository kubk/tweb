import {Drawable} from './drawable';

export class Rectangle extends Drawable {
  constructor(
    public x: number,
    public y: number,
    public width: number,
    public height: number,
    public color: string
  ) {
    super();
    this.width = width;
    this.height = height;
    this.color = color;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.width, this.height);
  }

  onMouseMove(x: number, y: number, ctx: CanvasRenderingContext2D) {}

  containsPoint(x: number, y: number) {
    return (
      x >= this.x &&
      x <= this.x + this.width &&
      y >= this.y &&
      y <= this.y + this.height
    );
  }

  clone() {
    return new Rectangle(this.x, this.y, this.width, this.height, this.color);
  }
}
