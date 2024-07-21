import { Drawable } from "./drawable";
import { DrawingOptions } from "./options";

export class ArrowTool extends Drawable {
  private startX: number;
  private startY: number;
  private endX: number;
  private endY: number;
  private color: string;
  private size: number;

  constructor(startX: number, startY: number, options: DrawingOptions) {
    super();
    this.startX = startX;
    this.startY = startY;
    this.endX = startX;
    this.endY = startY;
    this.color = options.color;
    this.size = options.size;
  }

  onMouseMove(x: number, y: number) {
    this.endX = x;
    this.endY = y;
  }

  draw(ctx: CanvasRenderingContext2D) {
    const defaultLineCap = ctx.lineCap;
    ctx.lineCap = "round";

    const context = ctx,
      fromX = this.startX,
      fromY = this.startY,
      tox = this.endX,
      toy = this.endY;

    const dx = tox - fromX;
    const dy = toy - fromY;
    const headLength = Math.sqrt(dx * dx + dy * dy) * 0.2;
    const angle = Math.atan2(dy, dx);
    ctx.strokeStyle = this.color;
    ctx.lineWidth = this.size;

    context.beginPath();
    context.moveTo(fromX, fromY);
    context.lineTo(tox, toy);
    context.stroke();
    context.beginPath();
    context.moveTo(
      tox - headLength * Math.cos(angle - Math.PI / 6),
      toy - headLength * Math.sin(angle - Math.PI / 6),
    );
    context.lineTo(tox, toy);
    context.lineTo(
      tox - headLength * Math.cos(angle + Math.PI / 6),
      toy - headLength * Math.sin(angle + Math.PI / 6),
    );

    ctx.stroke();

    ctx.lineCap = defaultLineCap;
  }

  clone() {
    const arrow = new ArrowTool(this.startX, this.startY, {
      color: this.color,
      size: this.size,
    });
    arrow.endX = this.endX;
    arrow.endY = this.endY;
    return arrow;
  }
}
