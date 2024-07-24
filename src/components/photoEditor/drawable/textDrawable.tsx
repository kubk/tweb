import {Drawable} from './drawable';
import {clamp} from '../lib/clamp';
import {getNextId} from '../lib/getNextId';
import {ResizeHandle} from '../lib/resizeHandle';

export type TextAlign = 'left' | 'center' | 'right';
export type TextStyle = 'plain' | 'outline' | 'background';

type Line = { text: string; width: number };

const caret = '|';
const borderRadius = 10;
const handleRadius = 4;

export class TextDrawable extends Drawable {
  public readonly id: number;
  isDragging = false;
  isSelected = false;
  private lastMouseX: number | null = null;
  private lastMouseY: number | null = null;
  private maxWidth = 0;
  private height = 0;
  private lines: Line[] = [];
  private currentLine = 0;
  private lineHeight: number;
  private resizingHandle: ResizeHandle | null = null;
  private innerPadding!: number;
  private outerPadding = 10;
  private angle = 0;
  private isRotating = false;

  constructor(
    private x: number,
    private y: number,
    initialText: string,
    private fontSize: number,
    private fontFamily: string,
    private color: string,
    private textAlign: TextAlign,
    private textStyle: TextStyle,
    private onRemove: (id: number) => void,
    private updateCursor: (cursor: string) => void
  ) {
    super();
    this.id = getNextId();
    this.updatePaddings();
    this.lineHeight = this.fontSize + this.innerPadding;
    this.lines.push({text: initialText, width: 0});
    this.calculateDimensions();
    // @ts-ignore
    window['text' + this.id] = this;
  }

  private updatePaddings() {
    const ratio = this.fontSize / 24;
    this.innerPadding = Math.round(8 * ratio);
  }

  private calculateDimensions() {
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    if(!tempCtx) throw new Error('Unable to create temporary canvas context');

    tempCtx.font = this.font;

    this.maxWidth = 0;
    this.lines.forEach((line, index) => {
      const metrics = tempCtx.measureText(line.text);
      line.width = metrics.width + this.innerPadding * 2;
      this.maxWidth = Math.max(this.maxWidth, line.width);
    });

    tempCtx.font = this.caretFont;
    const caretWidth = tempCtx.measureText(caret).width;
    this.maxWidth = Math.max(this.maxWidth, caretWidth + this.innerPadding * 2);

    this.height = this.lineHeight * this.lines.length + this.innerPadding;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.translate(this.x + this.maxWidth / 2, this.y + this.height / 2);
    ctx.rotate((this.angle * Math.PI) / 180);
    ctx.translate(-(this.x + this.maxWidth / 2), -(this.y + this.height / 2));

    ctx.font = this.font;
    const textHeight = this.fontSize;

    this.lines.forEach((line, index) => {
      let xOffsetAlignment = this.x + this.innerPadding;
      let rectangleX = this.x;
      if(this.textAlign === 'center') {
        xOffsetAlignment =
          this.x + (this.maxWidth - line.width) / 2 + this.innerPadding;
        rectangleX = this.x + (this.maxWidth - line.width) / 2;
      } else if(this.textAlign === 'right') {
        xOffsetAlignment =
          this.x + this.maxWidth - line.width + this.innerPadding;
        rectangleX = this.x + this.maxWidth - line.width;
      }

      if(this.textStyle === 'background') {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.roundRect(
          rectangleX,
          this.y + index * this.lineHeight,
          line.width,
          this.lineHeight,
          borderRadius
        );
        ctx.fill();
      }

      const textYPosition = this.y + index * this.lineHeight + textHeight;
      if(this.textStyle === 'outline') {
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 6;
        ctx.lineJoin = 'round';
        ctx.miterLimit = 2;
        ctx.strokeText(line.text, xOffsetAlignment, textYPosition);
      }

      ctx.fillStyle = (() => {
        switch(this.textStyle) {
          case 'outline':
            return this.color === '#FFFFFF' ? '#222' : '#FFFFFF';
          case 'background':
            return this.color === '#FFFFFF' ? '#222' : '#FFFFFF';
          case 'plain':
            return this.color;
          default:
            return this.textStyle satisfies never;
        }
      })();

      ctx.fillText(line.text, xOffsetAlignment, textYPosition);

      if(index === this.currentLine && this.isSelected) {
        const textMetrics = ctx.measureText(line.text);
        const caretX = xOffsetAlignment + textMetrics.width;
        const yPosition =
          textYPosition - textMetrics.actualBoundingBoxAscent * 0.05;

        ctx.font = this.caretFont;
        ctx.fillStyle = '#222';
        ctx.fillText(caret, caretX, yPosition);

        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.lineJoin = 'round';
        ctx.miterLimit = 2;
        ctx.strokeText(caret, caretX, yPosition);
      }
    });

    if(this.isSelected) {
      this.drawBoundingBox(ctx);
      this.drawHandles(ctx);
    }

    ctx.restore();
  }

  private drawBoundingBox(ctx: CanvasRenderingContext2D) {
    ctx.strokeStyle = 'rgba(255, 255, 255, 1)';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(
      this.x - this.outerPadding,
      this.y - this.outerPadding,
      this.maxWidth + this.outerPadding * 2,
      this.height + this.outerPadding * 2
    );
    ctx.setLineDash([]);
  }

  private drawHandles(ctx: CanvasRenderingContext2D) {
    const handles: [ResizeHandle, number, number][] = [
      ['top-left', this.x - this.outerPadding, this.y - this.outerPadding],
      [
        'top-right',
        this.x + this.maxWidth + this.outerPadding,
        this.y - this.outerPadding
      ],
      [
        'bottom-left',
        this.x - this.outerPadding,
        this.y + this.height + this.outerPadding
      ],
      [
        'bottom-right',
        this.x + this.maxWidth + this.outerPadding,
        this.y + this.height + this.outerPadding
      ],
      [
        'top-center',
        this.x + this.maxWidth / 2,
        this.y - this.outerPadding - 15
      ]
    ];

    handles.forEach(([handle, hx, hy]) => {
      this.drawHandle(ctx, hx, hy);
    });
  }

  private drawHandle(ctx: CanvasRenderingContext2D, x: number, y: number) {
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(x, y, handleRadius, 0, Math.PI * 2);
    ctx.fill();
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

  onMouseMove(x: number, y: number, ctx: CanvasRenderingContext2D) {
    if(this.lastMouseY === null || this.lastMouseX === null) return;

    if(this.isRotating) {
      this.rotateText(x, y);
    } else if(this.resizingHandle) {
      this.resizeText(x, y);
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

  onMouseUp() {
    this.isDragging = false;
    this.resizingHandle = null;
    this.isRotating = false;
  }

  containsPoint(x: number, y: number) {
    const centerX = this.x + this.maxWidth / 2;
    const centerY = this.y + this.height / 2;
    const angleRad = (this.angle * Math.PI) / 180;

    const rotatedX =
      centerX +
      (x - centerX) * Math.cos(-angleRad) -
      (y - centerY) * Math.sin(-angleRad);
    const rotatedY =
      centerY +
      (x - centerX) * Math.sin(-angleRad) +
      (y - centerY) * Math.cos(-angleRad);

    const handleOffset = handleRadius + 2;
    const isWithinX =
      rotatedX >= this.x - handleOffset &&
      rotatedX <= this.x + this.maxWidth + handleOffset;
    const isWithinY =
      rotatedY >= this.y - handleOffset &&
      rotatedY <= this.y + this.height + handleOffset;

    return (isWithinX && isWithinY) || !!this.getHandleAtPosition(x, y);
  }

  onKeyPress(event: KeyboardEvent) {
    const key = event.key;

    if(key === 'Escape') {
      this.isSelected = false;
    } else if(key === 'Enter') {
      if(this.lines[this.currentLine].text === '') return;
      this.lines.splice(this.currentLine + 1, 0, {text: '', width: 0});
      this.currentLine++;
    } else if(key === 'Backspace') {
      if(event.metaKey || event.ctrlKey) {
        this.onRemove(this.id);
        return;
      }

      if(this.lines[this.currentLine].text.length > 0) {
        this.lines[this.currentLine].text = this.lines[
        this.currentLine
        ].text.slice(0, -1);
      } else if(this.currentLine > 0) {
        const previousLine = this.lines[this.currentLine - 1].text;
        this.lines.splice(this.currentLine, 1);
        this.currentLine--;
        this.lines[this.currentLine].text = previousLine;
      } else {
        this.onRemove(this.id);
      }
    } else if(key.length === 1) {
      this.lines[this.currentLine].text += key;
    }

    this.calculateDimensions();
  }

  updateFontSize(size: number) {
    this.fontSize = size;
    this.updatePaddings();
    this.lineHeight = this.fontSize + this.innerPadding;
    this.calculateDimensions();
  }

  updateFontFamily(font: string) {
    this.fontFamily = font;
    this.calculateDimensions();
  }

  updateFontColor(color: string) {
    this.color = color;
  }

  updateTextStyle(style: TextStyle) {
    this.textStyle = style;
  }

  updateTextAlign(align: TextAlign) {
    this.textAlign = align;
  }

  private get font() {
    return `${this.fontSize}px ${this.fontFamily}`;
  }

  private get caretFont() {
    return `${this.fontSize}px Arial, sans-serif`;
  }

  private getHandleAtPosition(x: number, y: number): ResizeHandle | null {
    const centerX = this.x + this.maxWidth / 2;
    const centerY = this.y + this.height / 2;
    const angleRad = (this.angle * Math.PI) / 180;

    const handles: [ResizeHandle, number, number][] = [
      ['top-left', this.x - this.outerPadding, this.y - this.outerPadding],
      [
        'top-right',
        this.x + this.maxWidth + this.outerPadding,
        this.y - this.outerPadding
      ],
      [
        'bottom-left',
        this.x - this.outerPadding,
        this.y + this.height + this.outerPadding
      ],
      [
        'bottom-right',
        this.x + this.maxWidth + this.outerPadding,
        this.y + this.height + this.outerPadding
      ],
      ['top-center', centerX, this.y - this.outerPadding - 15]
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

  private resizeText(mouseX: number, mouseY: number) {
    if(this.lastMouseX === null || this.lastMouseY === null) return;

    const dx = mouseX - this.lastMouseX;
    const dy = mouseY - this.lastMouseY;
    let newWidth = this.maxWidth;
    let newHeight = this.height;
    let newX = this.x;
    let newY = this.y;

    const aspectRatio = this.maxWidth / this.height;

    switch(this.resizingHandle) {
      case 'top-left':
        newWidth = this.maxWidth - dx;
        newHeight = this.height - dy;
        newX = this.x + dx;
        newY = this.y + dy;
        break;
      case 'top-right':
        newWidth = this.maxWidth + dx;
        newHeight = this.height - dy;
        newY = this.y + dy;
        break;
      case 'bottom-left':
        newWidth = this.maxWidth - dx;
        newHeight = this.height + dy;
        newX = this.x + dx;
        break;
      case 'bottom-right':
        newWidth = this.maxWidth + dx;
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

    const scale = newWidth / this.maxWidth;
    if(this.resizingHandle?.includes('left')) {
      newX = this.x + (this.maxWidth - newWidth);
    }
    if(this.resizingHandle?.includes('top')) {
      newY = this.y + (this.height - newHeight);
    }

    this.x = newX;
    this.y = newY;
    this.maxWidth = newWidth;
    this.height = newHeight;
    this.fontSize = clamp(10, 120, this.fontSize * scale);
    this.updatePaddings();
    this.lineHeight = this.fontSize + this.innerPadding;

    this.lastMouseX = mouseX;
    this.lastMouseY = mouseY;

    this.calculateDimensions();
  }

  private rotateText(mouseX: number, mouseY: number) {
    const centerX = this.x + this.maxWidth / 2;
    const centerY = this.y + this.height / 2;
    const angle = Math.atan2(mouseY - centerY, mouseX - centerX);
    this.angle = ((angle * 180) / Math.PI + 90) % 360;
  }

  clone() {
    const clone = new TextDrawable(
      this.x,
      this.y,
      '',
      this.fontSize,
      this.fontFamily,
      this.color,
      this.textAlign,
      this.textStyle,
      this.onRemove,
      this.updateCursor
    );
    clone.lines = JSON.parse(JSON.stringify(this.lines));
    clone.currentLine = this.currentLine;
    clone.angle = this.angle;
    clone.calculateDimensions();
    return clone;
  }
}
