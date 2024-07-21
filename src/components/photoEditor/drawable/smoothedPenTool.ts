import { Drawable } from "./drawable";
import { DrawingOptions } from "./options";
import { catmullRomSpline } from "./catmullRomSpline";

const getDistance = (x1: number, y1: number, x2: number, y2: number) => {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
};

const drawSmoothLine = (
  ctx: CanvasRenderingContext2D,
  points: PointWithWidth[],
) => {
  if (points.length < 4) return;

  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);

  for (let i = 0; i < points.length - 3; i++) {
    const p0 = i > 0 ? points[i - 1] : points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2];

    for (let t = 0; t <= 1; t += 0.1) {
      const pt = catmullRomSpline(p0, p1, p2, p3, t);
      ctx.lineTo(pt.x, pt.y);
    }
  }

  ctx.stroke();
};

type PointWithWidth = { x: number; y: number; lineWidth: number };

export class SmoothedPenTool extends Drawable {
  points: PointWithWidth[] = [];
  private color: string;
  private size: number;
  private lastTime = 0;
  private velocities: number[] = [];
  private currentLineWidth = 5;

  constructor(options: DrawingOptions) {
    super();
    this.color = options.color;
    this.size = options.size;
  }

  getAverageVelocity() {
    if (this.velocities.length === 0) return 0;
    return (
      this.velocities.reduce((sum, v) => sum + v, 0) / this.velocities.length
    );
  }

  calcNewLineWidth(velocity: number): number {
    const maxLineWidth = this.size;
    const minLineWidth = 0.5;
    const velocityFactor = 0.9;

    const targetLineWidth = Math.max(
      minLineWidth,
      maxLineWidth - velocity * velocityFactor,
    );

    // Smooth transition of line width
    return this.currentLineWidth * 0.9 + targetLineWidth * 0.1;
  }

  onMouseMove(x: number, y: number) {
    const currentTime = Date.now();
    const timeDelta = currentTime - this.lastTime;
    const lastPoint = this.points[this.points.length - 1] || { x: x, y: y };
    const distance = getDistance(lastPoint.x, lastPoint.y, x, y);
    const velocity = distance / timeDelta;

    this.velocities.push(velocity);
    if (this.velocities.length > 5) this.velocities.shift();

    const avgVelocity = this.getAverageVelocity();
    const lineWidth = this.calcNewLineWidth(avgVelocity);
    this.currentLineWidth = lineWidth;

    this.points.push({ x: x, y: y, lineWidth: lineWidth });
    this.lastTime = currentTime;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.strokeStyle = this.color;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    ctx.beginPath();
    ctx.moveTo(this.points[0].x, this.points[0].y);
    for (let i = 1; i < this.points.length; i++) {
      ctx.lineWidth = this.points[i].lineWidth;
      ctx.lineTo(this.points[i].x, this.points[i].y);
    }
    ctx.stroke();

    drawSmoothLine(ctx, this.points);
  }

  clone() {
    const newPen = new SmoothedPenTool({
      color: this.color,
      size: this.size,
    });
    newPen.points = this.points.slice();
    return newPen;
  }
}
