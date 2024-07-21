import { Drawable } from "./drawable";
import { DrawingOptions, Point } from "./options";

export class SimplePenTool extends Drawable {
  points: Point[] = [];
  private color: string;
  private size: number;

  constructor(options: DrawingOptions) {
    super();
    this.color = options.color;
    this.size = options.size;
  }

  onMouseMove(x: number, y: number) {
    this.points.push({ x, y });
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (this.points.length === 0) return;

    ctx.strokeStyle = this.color;
    ctx.lineWidth = this.size;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(this.points[0].x, this.points[0].y);
    for (let i = 1; i < this.points.length; i++) {
      ctx.lineTo(this.points[i].x, this.points[i].y);
    }
    ctx.stroke();
  }

  clone() {
    const newPen = new SimplePenTool({ color: this.color, size: this.size });
    newPen.points = this.points.slice();
    return newPen;
  }
}
