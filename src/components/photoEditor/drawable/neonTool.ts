import { Drawable } from "./drawable";
import { DrawingOptions } from "./options";

export class NeonTool extends Drawable {
  private path: Path2D = new Path2D();
  private renderLineWidth: number;
  private renderShadowRadius: number;
  private renderColor: string;
  private shadowColor: string;
  private isStarted = false;

  constructor(options: DrawingOptions) {
    super();
    this.renderLineWidth = options.size || 10;
    this.renderShadowRadius = 20;
    this.renderColor = "#ffffff";
    this.shadowColor = options.color;
  }

  onMouseMove(x: number, y: number) {
    if (!this.isStarted) {
      this.path.moveTo(x, y);
      this.isStarted = true;
    } else {
      this.path.lineTo(x, y);
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (!this.isStarted) return;

    ctx.shadowColor = this.shadowColor;
    ctx.shadowBlur = this.renderShadowRadius;
    ctx.strokeStyle = this.shadowColor;
    ctx.lineWidth = this.renderLineWidth * 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke(this.path);

    ctx.shadowBlur = 0;
    ctx.strokeStyle = this.renderColor;
    ctx.lineWidth = this.renderLineWidth;
    ctx.stroke(this.path);
  }

  clone() {
    const newNeonPen = new NeonTool({
      size: this.renderLineWidth,
      color: this.renderColor,
    });
    newNeonPen.path = new Path2D(this.path);
    newNeonPen.shadowColor = this.shadowColor;
    return newNeonPen;
  }
}
