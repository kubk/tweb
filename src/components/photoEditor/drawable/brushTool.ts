import {Drawable} from './drawable';
import {DrawingOptions, Point} from './options';

const BRUSH_WIDTH = 10;
const BRUSH_HEIGHT = 30;
const STEP = 4;
const ROTATION = -Math.PI / 4; // -45 degrees

export class BrushTool extends Drawable {
  private points: Point[] = [];
  private color: string;
  private size: number;

  constructor(options: DrawingOptions) {
    super();
    this.color = options.color;
    this.size = options.size;
  }

  onMouseMove(x: number, y: number) {
    this.points.push({x, y});
  }

  draw(ctx: CanvasRenderingContext2D) {
    if(this.points.length < 2) return;

    for(let i = 1; i < this.points.length; i++) {
      const lastPoint = this.points[i - 1];
      const currentPoint = this.points[i];

      const dx = currentPoint.x - lastPoint.x;
      const dy = currentPoint.y - lastPoint.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dx, dy);

      for(let j = 0; j < distance; j += STEP) {
        const x = lastPoint.x + Math.sin(angle) * j;
        const y = lastPoint.y + Math.cos(angle) * j;

        ctx.save();

        ctx.fillStyle = this.color;
        ctx.strokeStyle = this.color;
        ctx.globalAlpha = 0.1;
        ctx.lineWidth = 0;
        ctx.globalCompositeOperation = 'source-over';

        ctx.translate(x, y);
        ctx.rotate(ROTATION);

        // Apply size to brush dimensions
        const brushWidth = (BRUSH_WIDTH * this.size) / 10;
        const brushHeight = (BRUSH_HEIGHT * this.size) / 10;

        ctx.fillRect(
          -brushWidth / 2,
          -brushHeight / 2,
          brushWidth,
          brushHeight
        );
        ctx.restore();
      }
    }
  }

  clone() {
    const newBrush = new BrushTool({color: this.color, size: this.size});
    newBrush.points = [...this.points];
    return newBrush;
  }
}
