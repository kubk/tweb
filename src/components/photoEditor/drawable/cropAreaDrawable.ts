import {Drawable} from './drawable';

const handleRadius = 4;
const handleDiameter = handleRadius * 2;

type DraggingHandle = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

export type AspectRatio = 'free' | 'original' | number;

function calculateCrop(
  canvasWidth: number,
  canvasHeight: number,
  ratio: number
): { x: number; y: number; width: number; height: number } {
  const width = Math.min(canvasWidth, canvasHeight * ratio);
  const height = Math.min(canvasHeight, canvasWidth / ratio);
  const x = (canvasWidth - width) / 2;
  const y = (canvasHeight - height) / 2;
  return {x, y, width, height};
}

export class CropAreaDrawable extends Drawable {
  draggingHandle?: DraggingHandle;
  draggingCrop = false;
  lastMouseX = 0;
  lastMouseY = 0;

  private aspectRatio: number | null = null;

  // TS doesn't see props are set via setter in constructor
  private cropX!: number;
  private cropY!: number;
  private cropWidth!: number;
  private cropHeight!: number;
  private initialCropX!: number;
  private initialCropY!: number;
  private initialCropWidth!: number;
  private initialCropHeight!: number;

  constructor(
    private canvasWidth: number,
    private canvasHeight: number,
    private updateCursor: (cursor: string) => void
  ) {
    super();

    this.setCropDimensions(0, 0, this.canvasWidth, this.canvasHeight);

    this.initialCropX = this.cropX;
    this.initialCropY = this.cropY;
    this.initialCropWidth = this.cropWidth;
    this.initialCropHeight = this.cropHeight;
  }

  acceptAspectRatio(aspectRatio: AspectRatio) {
    if(aspectRatio === 'free') {
      this.aspectRatio = null;
      return;
    }

    const ratio =
      aspectRatio === 'original' ?
        this.initialCropWidth / this.initialCropHeight :
        aspectRatio;

    const {x, y, width, height} = calculateCrop(
      this.canvasWidth,
      this.canvasHeight,
      ratio
    );

    this.setCropDimensions(x, y, width, height);
    this.aspectRatio = ratio;
  }

  private setCropDimensions(
    x: number,
    y: number,
    width: number,
    height: number
  ) {
    this.cropX = x + handleRadius;
    this.cropY = y + handleRadius;
    this.cropWidth = width - handleDiameter;
    this.cropHeight = height - handleDiameter;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    const cropY = this.cropY,
      cropX = this.cropX,
      cropWidth = this.cropWidth,
      cropHeight = this.cropHeight;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.fillRect(cropX, cropY, cropWidth, cropHeight);

    drawGrid(ctx, cropX, cropY, cropWidth, cropHeight);

    drawHandle(ctx, cropX, cropY);
    drawHandle(ctx, cropX + cropWidth, cropY);
    drawHandle(ctx, cropX, cropY + cropHeight);
    drawHandle(ctx, cropX + cropWidth, cropY + cropHeight);
  }

  onMouseMove(x: number, y: number, ctx: CanvasRenderingContext2D): void {
    const mouseX = Math.max(
      this.initialCropX,
      Math.min(x, this.canvasWidth - this.initialCropX)
    );
    const mouseY = Math.max(
      this.initialCropY,
      Math.min(y, this.canvasHeight - this.initialCropY)
    );

    if(this.draggingHandle) {
      this.handleResize(mouseX, mouseY);
    } else if(this.draggingCrop) {
      this.handleDrag(mouseX, mouseY);
    }

    this.lastMouseX = mouseX;
    this.lastMouseY = mouseY;
    this.setCursorStyle(x, y);
  }

  onMouseDown(mouseX: number, mouseY: number) {
    if(this.isInsideHandle(mouseX, mouseY, this.cropX, this.cropY)) {
      this.draggingHandle = 'top-left';
    } else if(
      this.isInsideHandle(
        mouseX,
        mouseY,
        this.cropX + this.cropWidth,
        this.cropY
      )
    ) {
      this.draggingHandle = 'top-right';
    } else if(
      this.isInsideHandle(
        mouseX,
        mouseY,
        this.cropX,
        this.cropY + this.cropHeight
      )
    ) {
      this.draggingHandle = 'bottom-left';
    } else if(
      this.isInsideHandle(
        mouseX,
        mouseY,
        this.cropX + this.cropWidth,
        this.cropY + this.cropHeight
      )
    ) {
      this.draggingHandle = 'bottom-right';
    } else if(this.isInsideCropArea(mouseX, mouseY)) {
      this.draggingCrop = true;
      this.lastMouseX = mouseX;
      this.lastMouseY = mouseY;
    }
  }

  onMouseUp() {
    this.draggingHandle = undefined;
    this.draggingCrop = false;
  }

  private handleResize(mouseX: number, mouseY: number) {
    if(this.draggingHandle === 'top-left') {
      this.cropWidth = this.cropX + this.cropWidth - mouseX;
      this.cropHeight = this.cropY + this.cropHeight - mouseY;
      this.cropX = mouseX;
      this.cropY = mouseY;
    } else if(this.draggingHandle === 'top-right') {
      this.cropWidth = mouseX - this.cropX;
      this.cropHeight = this.cropY + this.cropHeight - mouseY;
      this.cropY = mouseY;
    } else if(this.draggingHandle === 'bottom-left') {
      this.cropWidth = this.cropX + this.cropWidth - mouseX;
      this.cropHeight = mouseY - this.cropY;
      this.cropX = mouseX;
    } else if(this.draggingHandle === 'bottom-right') {
      this.cropWidth = mouseX - this.cropX;
      this.cropHeight = mouseY - this.cropY;
    }

    this.cropWidth = Math.max(this.cropWidth, 30);
    this.cropHeight = Math.max(this.cropHeight, 30);

    this.cropX = Math.max(this.cropX, this.initialCropX);
    this.cropY = Math.max(this.cropY, this.initialCropY);
    this.cropWidth = Math.min(
      this.cropWidth,
      this.canvasWidth - this.cropX - this.initialCropX
    );
    this.cropHeight = Math.min(
      this.cropHeight,
      this.canvasHeight - this.cropY - this.initialCropY
    );

    this.adjustToAspectRatioIfNeeded();
  }

  private handleDrag(mouseX: number, mouseY: number) {
    const dx = mouseX - this.lastMouseX;
    const dy = mouseY - this.lastMouseY;

    this.cropX = Math.max(
      this.initialCropX,
      Math.min(
        this.cropX + dx,
        this.canvasWidth - this.cropWidth - this.initialCropX
      )
    );
    this.cropY = Math.max(
      this.initialCropY,
      Math.min(
        this.cropY + dy,
        this.canvasHeight - this.cropHeight - this.initialCropY
      )
    );
  }

  private setCursorStyle(x: number, y: number) {
    if(
      this.isInsideHandle(x, y, this.cropX, this.cropY) ||
      this.isInsideHandle(
        x,
        y,
        this.cropX + this.cropWidth,
        this.cropY + this.cropHeight
      )
    ) {
      this.updateCursor('nwse-resize');
    } else if(
      this.isInsideHandle(x, y, this.cropX + this.cropWidth, this.cropY) ||
      this.isInsideHandle(x, y, this.cropX, this.cropY + this.cropHeight)
    ) {
      this.updateCursor('nesw-resize');
    } else if(this.isInsideCropArea(x, y)) {
      this.updateCursor('grab');
    } else {
      this.updateCursor('default');
    }
  }

  private isInsideCropArea(x: number, y: number): boolean {
    return (
      x >= this.cropX &&
      x <= this.cropX + this.cropWidth &&
      y >= this.cropY &&
      y <= this.cropY + this.cropHeight
    );
  }

  private isInsideHandle(
    x: number,
    y: number,
    handleX: number,
    handleY: number
  ) {
    return (
      x >= handleX - handleRadius &&
      x <= handleX + handleRadius &&
      y >= handleY - handleRadius &&
      y <= handleY + handleRadius
    );
  }

  private adjustToAspectRatioIfNeeded() {
    if(this.aspectRatio === null) return;

    const originalX = this.cropX;
    const originalY = this.cropY;
    const originalWidth = this.cropWidth;
    const originalHeight = this.cropHeight;

    const currentRatio = this.cropWidth / this.cropHeight;
    let newWidth = this.cropWidth;
    let newHeight = this.cropHeight;

    if(currentRatio > this.aspectRatio) {
      newWidth = this.cropHeight * this.aspectRatio;
    } else {
      newHeight = this.cropWidth / this.aspectRatio;
    }

    switch(this.draggingHandle) {
      case 'top-left':
        this.cropX = this.cropX + this.cropWidth - newWidth;
        this.cropY = this.cropY + this.cropHeight - newHeight;
        break;
      case 'top-right':
        this.cropY = this.cropY + this.cropHeight - newHeight;
        break;
      case 'bottom-left':
        this.cropX = this.cropX + this.cropWidth - newWidth;
        break;
      case 'bottom-right':
        break;
    }

    this.cropWidth = newWidth;
    this.cropHeight = newHeight;

    if(this.cropX < this.initialCropX) {
      this.cropX = this.initialCropX;
      this.cropWidth = originalX + originalWidth - this.cropX;
      this.cropHeight = this.cropWidth / this.aspectRatio;
    }
    if(this.cropY < this.initialCropY) {
      this.cropY = this.initialCropY;
      this.cropHeight = originalY + originalHeight - this.cropY;
      this.cropWidth = this.cropHeight * this.aspectRatio;
    }
    if(this.cropX + this.cropWidth > this.canvasWidth - this.initialCropX) {
      this.cropWidth = this.canvasWidth - this.cropX - this.initialCropX;
      this.cropHeight = this.cropWidth / this.aspectRatio;
    }
    if(this.cropY + this.cropHeight > this.canvasHeight - this.initialCropY) {
      this.cropHeight = this.canvasHeight - this.cropY - this.initialCropY;
      this.cropWidth = this.cropHeight * this.aspectRatio;
    }
  }

  getCroppedRectangleCoordinates(): {
    x: number;
    y: number;
    width: number;
    height: number;
    } {
    return {
      // x: this.cropX - handleRadius,
      // y: this.cropY - handleRadius,
      // width: this.cropWidth + handleDiameter,
      // height: this.cropHeight + handleDiameter,
      x: this.cropX,
      y: this.cropY,
      width: this.cropWidth,
      height: this.cropHeight
    };
  }

  clone(): Drawable {
    return new CropAreaDrawable(
      this.canvasWidth,
      this.canvasHeight,
      this.updateCursor
    );
  }
}

function drawGridCell(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number
) {
  ctx.strokeStyle = 'rgba(255, 255, 255, 1)';
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, width, height);
}

function drawGrid(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number
) {
  const rectWidth = width / 3;
  const rectHeight = height / 3;

  for(let row = 0; row < 3; row++) {
    for(let col = 0; col < 3; col++) {
      drawGridCell(
        ctx,
        x + col * rectWidth,
        y + row * rectHeight,
        rectWidth,
        rectHeight
      );
    }
  }
}

function drawHandle(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.fillStyle = 'white';
  ctx.beginPath();
  ctx.arc(x, y, handleRadius, 0, Math.PI * 2);
  ctx.fill();
}
