import {Drawable} from './drawable';
import {getNextId} from '../lib/getNextId';
import {ResizeHandle} from '../lib/resizeHandle';
import {assert} from '../lib/assert';

export const outerPadding = 6;
const handleRadius = 4;

export class StickerDrawable extends Drawable {
  public readonly id: number;
  isDragging = false;
  isSelected = false;
  private lastMouseX: number | null = null;
  private lastMouseY: number | null = null;
  private resizingHandle: ResizeHandle | null = null;
  private originalWidth: number;
  private originalHeight: number;
  private isRotating = false;
  private angle: number;

  private constructor(
    private x = 0,
    private y = 0,
    private image: HTMLImageElement | undefined,
    private imageData: ImageData | undefined,
    public width: number,
    public height: number,
    private updateCursor: (cursor: string) => void,
    private onRemove: (id: number) => void,
    angle: number
  ) {
    super();
    this.id = getNextId();
    this.angle = angle % 360;
    this.originalWidth = width;
    this.originalHeight = height;
  }

  static fromHtmlImage(
    x: number,
    y: number,
    img: HTMLImageElement,
    width: number,
    height: number,
    updateCursor: (cursor: string) => void,
    onRemove: (id: number) => void,
    angle = 0
  ) {
    return new StickerDrawable(
      x,
      y,
      img,
      undefined,
      width,
      height,
      updateCursor,
      onRemove,
      angle
    );
  }

  static fromImageData(
    x: number,
    y: number,
    imageData: ImageData,
    width: number,
    height: number,
    updateCursor: (cursor: string) => void,
    onRemove: (id: number) => void,
    angle = 0
  ) {
    return new StickerDrawable(
      x,
      y,
      undefined,
      imageData,
      width,
      height,
      updateCursor,
      onRemove,
      angle
    );
  }

  onMouseDown(mouseX: number, mouseY: number) {
    if(this.isSelected) {
      const handle = this.getHandleAtPosition(mouseX, mouseY);
      if(handle) {
        if(handle === 'top-center') {
          this.isRotating = true;
        } else {
          this.resizingHandle = handle;
        }
        this.lastMouseX = mouseX;
        this.lastMouseY = mouseY;
        return;
      }
    }

    if(this.containsPoint(mouseX, mouseY)) {
      this.isDragging = true;
      this.lastMouseX = mouseX;
      this.lastMouseY = mouseY;
    }
  }

  private updateCursorStyle(x: number, y: number) {
    const handle = this.getHandleAtPosition(x, y);
    if(handle) {
      switch(handle) {
        case 'top-left':
        case 'bottom-right':
          this.updateCursor('nwse-resize');
          break;
        case 'top-right':
        case 'bottom-left':
          this.updateCursor('nesw-resize');
          break;
        case 'top-center':
          this.updateCursor('grab');
          break;
      }
    } else if(this.containsPoint(x, y)) {
      this.updateCursor('grab');
    } else {
      this.updateCursor('default');
    }
  }

  onMouseMove(x: number, y: number, ctx: CanvasRenderingContext2D) {
    if(this.lastMouseY === null || this.lastMouseX === null) return;

    if(this.isRotating) {
      this.rotateImage(x, y);
    } else if(this.resizingHandle) {
      this.resizeImage(x, y);
    } else if(this.isDragging) {
      const dx = x - this.lastMouseX;
      const dy = y - this.lastMouseY;

      this.x += dx;
      this.y += dy;
    }

    this.lastMouseX = x;
    this.lastMouseY = y;

    this.updateCursorStyle(x, y);
  }

  containsPoint(x: number, y: number): boolean {
    const handleOffset = handleRadius + 2;
    const isWithinX =
      x >= this.x - handleOffset && x <= this.x + this.width + handleOffset;
    const isWithinY =
      y >= this.y - handleOffset && y <= this.y + this.height + handleOffset;

    return (isWithinX && isWithinY) || !!this.getHandleAtPosition(x, y);
  }

  private getHandleAtPosition(x: number, y: number): ResizeHandle | null {
    const centerX = this.x + this.width / 2;
    const centerY = this.y + this.height / 2;
    const angleRad = (this.angle * Math.PI) / 180;

    const handles: [ResizeHandle, number, number][] = [
      ['top-left', this.x - outerPadding, this.y - outerPadding],
      ['top-right', this.x + this.width + outerPadding, this.y - outerPadding],
      [
        'bottom-left',
        this.x - outerPadding,
        this.y + this.height + outerPadding
      ],
      [
        'bottom-right',
        this.x + this.width + outerPadding,
        this.y + this.height + outerPadding
      ],
      ['top-center', centerX, this.y - outerPadding - 15]
    ];

    for(const [handle, hx, hy] of handles) {
      const rotatedX =
        centerX +
        (hx - centerX) * Math.cos(angleRad) -
        (hy - centerY) * Math.sin(angleRad);
      const rotatedY =
        centerY +
        (hx - centerX) * Math.sin(angleRad) +
        (hy - centerY) * Math.cos(angleRad);
      if(
        Math.sqrt((x - rotatedX) ** 2 + (y - rotatedY) ** 2) <= handleRadius
      ) {
        return handle;
      }
    }

    return null;
  }

  private resizeImage(mouseX: number, mouseY: number) {
    if(this.lastMouseX === null || this.lastMouseY === null) return;

    const dx = mouseX - this.lastMouseX;
    const dy = mouseY - this.lastMouseY;
    let newWidth = this.width;
    let newHeight = this.height;
    let newX = this.x;
    let newY = this.y;

    const aspectRatio = this.originalWidth / this.originalHeight;

    switch(this.resizingHandle) {
      case 'top-left':
        newWidth = this.width - dx;
        newHeight = this.height - dy;
        newX = this.x + dx;
        newY = this.y + dy;
        break;
      case 'top-right':
        newWidth = this.width + dx;
        newHeight = this.height - dy;
        newY = this.y + dy;
        break;
      case 'bottom-left':
        newWidth = this.width - dx;
        newHeight = this.height + dy;
        newX = this.x + dx;
        break;
      case 'bottom-right':
        newWidth = this.width + dx;
        newHeight = this.height + dy;
        break;
    }

    if(newWidth / newHeight > aspectRatio) {
      newHeight = newWidth / aspectRatio;
    } else {
      newWidth = newHeight * aspectRatio;
    }

    const minSize = 10;
    if(newWidth < minSize || newHeight < minSize) {
      return;
    }

    if(this.resizingHandle?.includes('left')) {
      newX = this.x + (this.width - newWidth);
    }
    if(this.resizingHandle?.includes('top')) {
      newY = this.y + (this.height - newHeight);
    }

    this.x = newX;
    this.y = newY;
    this.width = newWidth;
    this.height = newHeight;

    this.lastMouseX = mouseX;
    this.lastMouseY = mouseY;
  }

  private rotateImage(mouseX: number, mouseY: number) {
    const centerX = this.x + this.width / 2;
    const centerY = this.y + this.height / 2;
    const angle = Math.atan2(mouseY - centerY, mouseX - centerX);
    this.angle = ((angle * 180) / Math.PI + 90) % 360;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
    ctx.rotate((this.angle * Math.PI) / 180);

    let toDraw: HTMLImageElement|HTMLCanvasElement;
    if(this.image) {
      toDraw = this.image;
    } else if(this.imageData) {
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = this.width;
      tempCanvas.height = this.height;
      const tempCtx = tempCanvas.getContext('2d');
      if(!tempCtx) return;
      const scaledImageData = this.scaleImageData(this.imageData, this.width, this.height);
      tempCtx.putImageData(scaledImageData, 0, 0);
      toDraw = tempCanvas;
    }
    if(!toDraw) return;

    ctx.drawImage(
      toDraw,
      -this.width / 2,
      -this.height / 2,
      this.width,
      this.height
    );

    ctx.restore();

    if(this.isSelected) {
      this.drawBoundingBox(ctx);
      this.drawHandles(ctx);
    }
  }

  private scaleImageData(imageData: ImageData, newWidth: number, newHeight: number): ImageData {
    const canvas = document.createElement('canvas');
    canvas.width = imageData.width;
    canvas.height = imageData.height;
    const ctx = canvas.getContext('2d');
    if(!ctx) return imageData;

    ctx.putImageData(imageData, 0, 0);

    const scaledCanvas = document.createElement('canvas');
    scaledCanvas.width = newWidth;
    scaledCanvas.height = newHeight;
    const scaledCtx = scaledCanvas.getContext('2d');

    if(!scaledCtx) return imageData;
    scaledCtx.drawImage(canvas, 0, 0, newWidth, newHeight);
    return scaledCtx.getImageData(0, 0, newWidth, newHeight);
  }

  private drawBoundingBox(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
    ctx.rotate((this.angle * Math.PI) / 180);
    ctx.strokeStyle = 'rgba(255, 255, 255, 1)';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(
      -this.width / 2 - outerPadding,
      -this.height / 2 - outerPadding,
      this.width + outerPadding * 2,
      this.height + outerPadding * 2
    );
    ctx.restore();
  }

  private drawHandles(ctx: CanvasRenderingContext2D) {
    const centerX = this.x + this.width / 2;
    const centerY = this.y + this.height / 2;
    const angleRad = (this.angle * Math.PI) / 180;

    const handles: [number, number][] = [
      [this.x - outerPadding, this.y - outerPadding],
      [this.x + this.width + outerPadding, this.y - outerPadding],
      [this.x - outerPadding, this.y + this.height + outerPadding],
      [this.x + this.width + outerPadding, this.y + this.height + outerPadding],
      [centerX, this.y - outerPadding - 15]
    ];

    handles.forEach(([hx, hy]) => {
      const rotatedX =
        centerX +
        (hx - centerX) * Math.cos(angleRad) -
        (hy - centerY) * Math.sin(angleRad);
      const rotatedY =
        centerY +
        (hx - centerX) * Math.sin(angleRad) +
        (hy - centerY) * Math.cos(angleRad);
      this.drawHandle(ctx, rotatedX, rotatedY);
    });
  }

  private drawHandle(ctx: CanvasRenderingContext2D, x: number, y: number) {
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(x, y, handleRadius, 0, Math.PI * 2);
    ctx.fill();
  }

  onMouseUp() {
    this.isDragging = false;
    this.resizingHandle = null;
    this.isRotating = false;
  }

  onKeyPress(event: KeyboardEvent) {
    const key = event.key;

    if(key === 'Escape') {
      this.isSelected = false;
    } else if(key === 'Backspace') {
      this.onRemove(this.id);
    }
  }

  clone() {
    return new StickerDrawable(
      this.x,
      this.y,
      this.image,
      this.imageData,
      this.width,
      this.height,
      this.updateCursor,
      this.onRemove,
      this.angle
    );
  }
}
