import {Drawable} from './drawable';
import {DrawingOptions} from './options';
import {catmullRomSpline} from './catmullRomSpline';

const getDistance = (x1: number, y1: number, x2: number, y2: number) => {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
};

const drawSmoothLine = (
  ctx: CanvasRenderingContext2D,
  points: SmoothedPenPoint[]
) => {
  if(points.length < 4) return;

  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);

  for(let i = 0; i < points.length - 3; i++) {
    const p0 = i > 0 ? points[i - 1] : points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2];

    for(let t = 0; t <= 1; t += 0.1) {
      const pt = catmullRomSpline(p0, p1, p2, p3, t);
      ctx.lineTo(pt.x, pt.y);
    }
  }

  ctx.stroke();
};

type SmoothedPenPoint = {
  x: number;
  y: number;
  lineWidth: number;
  isArrowPoint?: boolean;
};

type Mode = 'line' | 'arrow';

export class SmoothedPenTool extends Drawable {
  points: SmoothedPenPoint[] = [];
  private color: string;
  private size: number;
  private lastTime = 0;
  private velocities: number[] = [];
  private currentLineWidth = 5;

  private constructor(private mode: Mode, options: DrawingOptions) {
    super();
    this.color = options.color;
    this.size = Math.max(3, options.size);
  }

  static line(options: DrawingOptions) {
    return new SmoothedPenTool('line', options)
  }

  static arrow(options: DrawingOptions) {
    return new SmoothedPenTool('arrow', options)
  }

  getAverageVelocity() {
    if(this.velocities.length === 0) return 0;
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
      maxLineWidth - velocity * velocityFactor
    );
    return this.currentLineWidth * 0.9 + targetLineWidth * 0.1;
  }

  onMouseMove(x: number, y: number) {
    const currentTime = Date.now();
    const timeDelta = currentTime - this.lastTime;
    const lastPoint = this.points[this.points.length - 1] || {x: x, y: y};
    const distance = getDistance(lastPoint.x, lastPoint.y, x, y);
    const velocity = distance / timeDelta;

    this.velocities.push(velocity);
    if(this.velocities.length > 5) this.velocities.shift();

    const avgVelocity = this.getAverageVelocity();
    const lineWidth = this.calcNewLineWidth(avgVelocity);
    this.currentLineWidth = lineWidth;

    this.points.push({x: x, y: y, lineWidth: lineWidth});
    this.lastTime = currentTime;
  }

  private calculateAverageAngle(points: SmoothedPenPoint[]): number {
    let sumX = 0;
    let sumY = 0;
    for(let i = 1; i < points.length; i++) {
      sumX += points[i].x - points[i - 1].x;
      sumY += points[i].y - points[i - 1].y;
    }
    return Math.atan2(sumY, sumX);
  }

  private drawArrow(
    ctx: CanvasRenderingContext2D,
    fromX: number,
    fromY: number,
    toX: number,
    toY: number
  ) {
    const lastPoints = this.points.slice(-10);
    const angle = this.calculateAverageAngle(lastPoints);
    const headLength = Math.max(
      this.size * 3,
      Math.min(30, getDistance(fromX, fromY, toX, toY) * 0.3)
    );

    ctx.save();
    ctx.strokeStyle = this.color;
    ctx.lineWidth = this.size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(
      toX - headLength * Math.cos(angle - Math.PI / 6),
      toY - headLength * Math.sin(angle - Math.PI / 6)
    );
    ctx.moveTo(toX, toY);
    ctx.lineTo(
      toX - headLength * Math.cos(angle + Math.PI / 6),
      toY - headLength * Math.sin(angle + Math.PI / 6)
    );
    ctx.stroke();

    ctx.restore();
  }

  private getArrowStartPoint(): SmoothedPenPoint {
    // use up to 20% of the total points with min 2, max 10
    const numPoints = Math.min(
      10,
      Math.max(2, Math.floor(this.points.length * 0.2))
    );
    return this.points[this.points.length - numPoints];
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.strokeStyle = this.color;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(this.points[0].x, this.points[0].y);
    for(let i = 1; i < this.points.length; i++) {
      ctx.lineWidth = this.points[i].lineWidth;
      ctx.lineTo(this.points[i].x, this.points[i].y);
      if(this.points[i].isArrowPoint) {
        ctx.moveTo(this.points[i].x, this.points[i].y);
      }
    }
    ctx.stroke();

    drawSmoothLine(
      ctx,
      this.points.filter((p) => !p.isArrowPoint)
    );
  }

  onMouseUp(ctx: CanvasRenderingContext2D) {
    if(this.mode === 'arrow' && this.points.length >= 2) {
      const endPoint = this.points[this.points.length - 1];
      const startPoint = this.getArrowStartPoint();
      this.drawArrow(ctx, startPoint.x, startPoint.y, endPoint.x, endPoint.y);

      const lastPoints = this.points.slice(-10);
      const angle = this.calculateAverageAngle(lastPoints);
      const headLength = Math.max(
        this.size * 3,
        Math.min(
          30,
          getDistance(startPoint.x, startPoint.y, endPoint.x, endPoint.y) * 0.3
        )
      );

      this.points.push(
        {
          x: endPoint.x - headLength * Math.cos(angle - Math.PI / 6),
          y: endPoint.y - headLength * Math.sin(angle - Math.PI / 6),
          lineWidth: this.size,
          isArrowPoint: true
        },
        {
          x: endPoint.x,
          y: endPoint.y,
          lineWidth: this.size,
          isArrowPoint: true
        },
        {
          x: endPoint.x - headLength * Math.cos(angle + Math.PI / 6),
          y: endPoint.y - headLength * Math.sin(angle + Math.PI / 6),
          lineWidth: this.size,
          isArrowPoint: true
        }
      );
    }
  }

  clone() {
    const newPen = new SmoothedPenTool(this.mode, {
      color: this.color,
      size: this.size
    });
    newPen.points = this.points.slice();
    return newPen;
  }
}
