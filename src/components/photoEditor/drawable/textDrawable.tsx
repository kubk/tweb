import {Drawable} from './drawable';
import {clamp} from '../lib/clamp';

export type TextAlign = 'left' | 'center' | 'right';
export type TextStyle = 'plain' | 'outline' | 'background';

type Line = { text: string; width: number };

const caret = '|';
const borderRadius = 10;
const handleRadius = 4;

// Used to generate unique IDs for each text drawable, so they can be removed
const getNextId = (() => {
  let id = 0;
  return () => id++;
})();

type ResizeHandle = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

export class TextDrawable extends Drawable {
  isDragging = false;
  isSelected = false;
  private lastMouseX: number | null = null;
  private lastMouseY: number | null = null;
  private maxWidth = 0;
  private height = 0;
  private lines: Line[] = [];
  private currentLine = 0;
  private lineHeight: number;
  public readonly id: number;
  private resizingHandle: ResizeHandle | null = null;
  private innerPadding!: number;
  private outerPadding = 10;

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
    // this.outerPadding = Math.round(10 * ratio);
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

    // Calculate caret width separately
    tempCtx.font = this.caretFont;
    const caretWidth = tempCtx.measureText(caret).width;
    this.maxWidth = Math.max(this.maxWidth, caretWidth + this.innerPadding * 2);

    this.height = this.lineHeight * this.lines.length + this.innerPadding;
  }

  draw(ctx: CanvasRenderingContext2D) {
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

      // Draw caret separately
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
      ctx.strokeStyle = 'rgba(255, 255, 255, 1)';
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.rect(
        this.x - this.outerPadding,
        this.y - this.outerPadding,
        this.maxWidth + this.outerPadding * 2,
        this.height + this.outerPadding * 2
      );
      ctx.stroke();
      ctx.setLineDash([]);

      this.drawHandle(
        ctx,
        this.x - this.outerPadding,
        this.y - this.outerPadding
      );
      this.drawHandle(
        ctx,
        this.x + this.maxWidth + this.outerPadding,
        this.y - this.outerPadding
      );
      this.drawHandle(
        ctx,
        this.x - this.outerPadding,
        this.y + this.height + this.outerPadding
      );
      this.drawHandle(
        ctx,
        this.x + this.maxWidth + this.outerPadding,
        this.y + this.height + this.outerPadding
      );
    }
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
        this.resizingHandle = handle;
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

    if(this.resizingHandle) {
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
      }
    } else if(this.containsPoint(x, y)) {
      this.updateCursor('move');
    } else {
      this.updateCursor('default');
    }
  }

  onMouseUp() {
    this.isDragging = false;
    this.resizingHandle = null;
  }

  containsPoint(x: number, y: number) {
    const handleOffset = handleRadius + 2;
    const isWithinX =
      x >= this.x - handleOffset && x <= this.x + this.maxWidth + handleOffset;
    const isWithinY =
      y >= this.y - handleOffset && y <= this.y + this.height + handleOffset;

    return (isWithinX && isWithinY) || !!this.getHandleAtPosition(x, y);
  }

  onKeyPress(event: KeyboardEvent) {
    const key = event.key;

    // If escape - diselect
    if(key === 'Escape') {
      this.isSelected = false;
    } else if(key === 'Enter') {
      // Prevent multiple empty lines
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
        // If we are at the first line and it is empty, remove the text
        // The same as iOS app behavior
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
      ]
    ];

    for(const [handle, hx, hy] of handles) {
      if(Math.sqrt((x - hx) ** 2 + (y - hy) ** 2) <= handleRadius) {
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

    // Aspect ratio
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
    clone.calculateDimensions();
    return clone;
  }
}
