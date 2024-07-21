import {Point} from './options';
import {Drawable} from './drawable';
import {IS_SAFARI} from '../../../environment/userAgent';
import fastblur from '../../../vendor/fastBlur';

type Mode = 'eraser' | 'blur';

export class EraserTool extends Drawable {
  points: Point[] = [];
  private size: number;

  constructor(
    private mode: Mode,
    private options: {
      size: number;
      width: number;
      height: number;
      imageData: ImageData;
    }
  ) {
    super();
    this.size = options.size;
  }

  onMouseMove(x: number, y: number) {
    this.points.push({x, y});
  }

  draw(ctx: CanvasRenderingContext2D) {
    if(this.points.length === 0) return;

    const originalImageData = this.options.imageData;
    const canvasWidth = this.options.width;
    const canvasHeight = this.options.height;

    const size = this.size;

    const offscreenCanvas = document.createElement('canvas');
    offscreenCanvas.width = canvasWidth;
    offscreenCanvas.height = canvasHeight;
    const offscreenCtx = offscreenCanvas.getContext('2d', {
      willReadFrequently: true
    });

    if(!offscreenCtx) return;

    offscreenCtx.putImageData(originalImageData, 0, 0);

    if(this.mode === 'blur') {
      if(IS_SAFARI) {
        offscreenCtx.drawImage(offscreenCanvas, 0, 0);
        fastblur(offscreenCtx, 0, 0, canvasWidth, canvasHeight, 8, 2);
      } else {
        offscreenCtx.filter = `blur(10px)`;
        offscreenCtx.drawImage(offscreenCanvas, 0, 0);
        offscreenCtx.filter = 'none';
      }
    }

    ctx.beginPath();

    ctx.moveTo(this.points[0].x, this.points[0].y);
    for(let i = 1; i < this.points.length; i++) {
      ctx.lineTo(this.points[i].x, this.points[i].y);
    }

    ctx.lineWidth = size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.strokeStyle =
      offscreenCtx.createPattern(offscreenCanvas, 'no-repeat') || '';
    ctx.stroke();
  }

  clone() {
    const newEraser = new EraserTool(this.mode, {
      ...this.options,
      size: this.size
    });
    newEraser.points = this.points.slice();
    return newEraser;
  }
}
