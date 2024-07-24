import {createSignal, Signal} from 'solid-js';
import {createMutable, modifyMutable, reconcile} from 'solid-js/store';
import {Drawable} from './drawable/drawable';
import {
  copyEffectsFromTo,
  createEffects,
  duplicateEffects,
  Effects
} from './effects/effects';
import {assert} from './lib/assert';
import {DrawingOptions} from './drawable/options';
import {SmoothedPenTool} from './drawable/smoothedPenTool';
import {ArrowTool} from './drawable/arrowTool';
import {BrushTool} from './drawable/brushTool';
import {NeonTool} from './drawable/neonTool';
import {BgImageDrawable} from './drawable/bgImageDrawable';
import {EraserTool} from './drawable/eraserTool';
import {fitImageIntoCanvas} from './lib/fitImageIntoCanvas';
import {AspectRatio, CropAreaDrawable} from './drawable/cropAreaDrawable';
import {TextAlign, TextDrawable, TextStyle} from './drawable/textDrawable';
import {fonts} from './tabBody/text/textTabBody';
import {createSignalWithOnchange} from './lib/createSignalWithOnchange';
import {outerPadding, StickerDrawable} from './drawable/stickerDrawable';
import {randomMinMax} from './lib/randomMinMax';

export type Tool = 'pen' | 'arrow' | 'brush' | 'neon' | 'blur' | 'eraser';

export type CropAction =
  | { type: 'rotate90' }
  | { type: 'flip' }
  | { type: 'rotate'; angle: number };

type Mode =
  | { name: 'idle' }
  | {
      name: 'drawing';
      currentLine?: Drawable;
    }
  | { name: 'dragging'; draggingObject: DraggableResizable }
  | { name: 'cropping'; cropArea?: CropAreaDrawable };

export type State = {
  drawables: Drawable[];
  imageData: ImageData;
  effects: Effects;
  width: number;
  height: number;
};

type DraggableResizable = TextDrawable | StickerDrawable;

const isDraggableResizable = (
  drawable: Drawable
): drawable is DraggableResizable => {
  return (
    drawable instanceof TextDrawable || drawable instanceof StickerDrawable
  );
};

const tabs = ['enhance', 'crop', 'text', 'draw', 'sticker'] as const;
type EditorTab = (typeof tabs)[number];

const drawingTools = ['pen', 'arrow', 'brush', 'neon'] as const;
type DrawingTool = (typeof drawingTools)[number];
const isDrawingTool = (tool: Tool): tool is DrawingTool => {
  return drawingTools.includes(tool as any);
};

const undoStackLimit = 15;

export class CanvasManager {
  undoStack: State[] = [];
  redoStack: State[] = [];
  tab = createSignal<EditorTab>('enhance');
  touchedEffects: Set<keyof Effects> = new Set();

  drawSize = createSignal<number>(15);
  penColor = createSignal<string>('#33C759');
  arrowColor = createSignal<string>('#FFD60A');
  brushColor = createSignal<string>('#FF8901');
  neonColor = createSignal<string>('#62E5E0');
  lastDrawableTool?: DrawingTool;

  textColor = createSignalWithOnchange<string>('#FFFFFF', (value) => {
    this.updateTextColor(value);
  });
  textFont = createSignalWithOnchange<string>(fonts[0].fontFamily, (value) => {
    this.onTextFontUpdate(value);
  });
  textAlign = createSignalWithOnchange<TextAlign>('left', (value) =>
    this.onTextAlignUpdate(value)
  );
  textStyle = createSignalWithOnchange<TextStyle>('background', (value) => {
    this.updateTextStyle(value);
  });
  textSize = createSignalWithOnchange<number>(24, (value) =>
    this.onTextSizeChange(value)
  );

  cropAspectRatio = createSignal<AspectRatio | null>(null);
  freeAngle = createSignalWithOnchange(0, (value) => {
    this.applyCropAction({type: 'rotate', angle: value});
  });

  tool = createSignal<Tool>('pen');

  mode = createMutable<Mode>({name: 'idle'});
  effectsUi = createMutable(createEffects());
  effectsApplied = createMutable(createEffects());

  drawables: Drawable[] = [];

  private canvas: HTMLCanvasElement | null = null;
  private canvasContainerRef: HTMLDivElement | null = null;

  onResetRotationAngle?: () => void;

  canUndo = createSignal(false);
  canRedo = createSignal(false);

  constructor(image: HTMLImageElement) {
    image.onload = () => {
      this.drawImage(image);
    };
  }

  init(
    canvas: HTMLCanvasElement | undefined,
    canvasContainerRef: HTMLDivElement | undefined
  ) {
    if(!canvas || this.canvas !== null) return;
    if(!canvasContainerRef) return;
    this.canvas = canvas;
    this.canvasContainerRef = canvasContainerRef;
    this.draw();
    this.setUpListeners();
  }

  switchTab(tab: EditorTab) {
    const [previousTab, setTab] = this.tab;

    if(tab === previousTab()) {
      return;
    }

    if(tab !== 'crop' && previousTab() === 'crop') {
      this.drawables = this.drawablesWithoutCropArea();
      this.draw();
    }

    if(
      (tab !== 'text' && previousTab() === 'text') ||
      (tab !== 'sticker' && previousTab() === 'sticker')
    ) {
      this.setCursor('default');
      this.drawables.forEach((drawable) => {
        if(isDraggableResizable(drawable)) {
          drawable.isSelected = false;
        }
      });
      this.draw();
    }

    setTab(tab);

    if(tab === 'crop') {
      const cropAreaDrawable = this.createCropAreaDrawable();
      const [, setAspectRatio] = this.cropAspectRatio;
      setAspectRatio('free');
      this.drawables.push(cropAreaDrawable);
      this.updateMode({name: 'cropping', cropArea: cropAreaDrawable});
      this.draw();
    } else if(tab === 'draw') {
      this.updateMode({name: 'drawing'});
    } else {
      this.updateMode({name: 'idle'});
    }
  }

  private createCropAreaDrawable() {
    return new CropAreaDrawable(
      this.canvasSafe.width,
      this.canvasSafe.height,
      (cursor) => {
        const [tab] = this.tab;
        if(tab() === 'crop') {
          this.setCursor(cursor);
        }
      }
    );
  }

  private setCursor = (cursor: string) => {
    this.canvasSafe.style.cursor = cursor;
  };

  setTool(tool: Tool) {
    const [, setTool] = this.tool;

    const previousTool = this.tool[0]();
    if(isDrawingTool(previousTool)) {
      this.lastDrawableTool = previousTool;
    }

    setTool(tool);
  }

  currentDrawColorSignal(): Signal<string> {
    const [tool] = this.tool;
    const signal = this.getDrawableTool(tool());
    if(signal) {
      return signal;
    }
    if(!this.lastDrawableTool) {
      return this.penColor;
    }
    return this.getDrawableTool(this.lastDrawableTool) || this.penColor;
  }

  private getDrawableTool(tool: Tool): Signal<string> | null {
    switch(tool) {
      case 'pen':
        return this.penColor;
      case 'arrow':
        return this.arrowColor;
      case 'brush':
        return this.brushColor;
      case 'neon':
        return this.neonColor;
      default:
        return null;
    }
  }

  currentDrawColor(): string {
    return this.currentDrawColorSignal()[0]();
  }

  setDrawColor(predefinedColor: string) {
    const [, setColor] = this.currentDrawColorSignal();
    setColor(predefinedColor);
  }

  private get canvasSafe() {
    assert(this.canvas !== null, 'Canvas is not initialized');
    return this.canvas;
  }

  private createTool(
    tool: Tool,
    options: DrawingOptions,
    mouseX: number,
    mouseY: number
  ) {
    switch(tool) {
      case 'pen':
        return new SmoothedPenTool(options);
      case 'arrow':
        return new ArrowTool(mouseX, mouseY, options);
      case 'brush':
        return new BrushTool(options);
      case 'neon':
        return new NeonTool(options);
      case 'blur':
      case 'eraser': {
        const mode = tool === 'blur' ? 'blur' : 'eraser';

        const imageData = (() => {
          if(mode === 'blur') {
            return this.getFullCanvasData();
          }
          if(mode === 'eraser') {
            const imageDrawable = this.getLastImageDrawable();
            return imageDrawable ? imageDrawable.getImageData() : null;
          }
          return mode satisfies never;
        })();

        if(!imageData) {
          return new SmoothedPenTool(options);
        }

        return new EraserTool(mode, {
          size: options.size,
          width: this.canvasWidth,
          height: this.canvasHeight,
          imageData: imageData
        });
      }
      default:
        return new SmoothedPenTool(options);
    }
  }

  private onMouseDown = (e: MouseEvent) => {
    const rect = this.canvasSafe.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const [tab] = this.tab;

    const mode = this.mode;
    if(mode.name === 'drawing') {
      const color = this.currentDrawColor();
      const [size] = this.drawSize;
      const [tool] = this.tool;
      const options = {color: color, size: size()};
      const currentLine = this.createTool(tool(), options, mouseX, mouseY);
      currentLine.onMouseMove(mouseX, mouseY);
      mode.currentLine = currentLine;
      this.drawables.push(currentLine);
      this.saveState();
    }

    if(mode.name === 'idle') {
      const currentTab = tab();
      if(currentTab !== 'text' && currentTab !== 'sticker') {
        return;
      }

      const objectToDrag = this.drawables
      .filter(isDraggableResizable)
      .find((drawable) => drawable.containsPoint(mouseX, mouseY));

      if(currentTab === 'sticker') {
        if(objectToDrag) {
          this.updateMode({name: 'dragging', draggingObject: objectToDrag});
          this.selectDrawable(objectToDrag);
          objectToDrag.onMouseDown(mouseX, mouseY);
          this.draw();
          this.saveState();
        }
      } else if(currentTab === 'text') {
        if(!objectToDrag) {
          this.addText(mouseX, mouseY);
          return;
        }

        this.selectDrawable(objectToDrag);
        this.updateMode({name: 'dragging', draggingObject: objectToDrag});
        objectToDrag.onMouseDown(mouseX, mouseY);
        this.draw();
        this.saveState();
      }
    }

    if(mode.name === 'cropping') {
      mode.cropArea?.onMouseDown(mouseX, mouseY);
    }
  };

  private selectDrawable(selected?: Drawable) {
    this.drawables.forEach((drawable) => {
      if(isDraggableResizable(drawable)) {
        drawable.isSelected = false;
      }
    });

    if(selected && isDraggableResizable(selected)) {
      selected.isSelected = true;
    }
  }

  private onMouseMove = (e: MouseEvent) => {
    if(!this.mode) {
      return;
    }

    const rect = this.canvasSafe.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const [tab] = this.tab;

    if(tab() === 'sticker' || tab() === 'text') {
      const hoveredResizable = this.drawables
      .filter(isDraggableResizable)
      .find((drawable) => drawable.containsPoint(mouseX, mouseY));

      if(hoveredResizable) {
        this.setCursor('grab');
        hoveredResizable.onMouseMove(mouseX, mouseY, this.ctx);
        this.draw();
      } else {
        this.setCursor(tab() === 'sticker' ? 'default' : 'crosshair');
      }
    }

    if(this.mode.name === 'drawing' && this.mode.currentLine) {
      this.mode.currentLine.onMouseMove(mouseX, mouseY, this.ctx);
      this.draw();
    } else if(this.mode.name === 'dragging') {
      if(this.mode.draggingObject) {
        this.mode.draggingObject.onMouseMove(mouseX, mouseY, this.ctx);
        this.selectDrawable(this.mode.draggingObject);
        this.draw();
      }
    } else if(this.mode.name === 'cropping') {
      this.mode.cropArea?.onMouseMove(mouseX, mouseY, this.ctx);
      this.draw();
    }
  };

  private onMouseUp = () => {
    const mode = this.mode;
    if(mode?.name === 'drawing' && mode.currentLine) {
      mode.currentLine = undefined;
    } else if(mode?.name === 'dragging' && mode.draggingObject) {
      mode.draggingObject.onMouseUp();
      this.updateMode({name: 'idle'});
    } else if(mode?.name === 'cropping') {
      mode.cropArea?.onMouseUp();
    }
  };

  private setUpListeners() {
    this.canvasSafe.addEventListener('mousedown', this.onMouseDown);
    this.canvasSafe.addEventListener('mousemove', this.onMouseMove);
    this.canvasSafe.addEventListener('mouseup', this.onMouseUp);
    document.addEventListener('keydown', this.onKeyDown);
  }

  onChangeAspectRatio(aspectRatio?: AspectRatio) {
    if(this.mode?.name !== 'cropping') {
      return;
    }

    if(!this.mode.cropArea) {
      const cropArea = this.createCropAreaDrawable();
      this.mode.cropArea = cropArea;
      this.drawables.push(cropArea);
    }

    const cropArea = this.mode.cropArea;
    const [prevAspectRatio, setAspectRatio] = this.cropAspectRatio;
    const actualAspectRatio = aspectRatio || prevAspectRatio();
    assert(actualAspectRatio);
    setAspectRatio(actualAspectRatio);
    cropArea.acceptAspectRatio(actualAspectRatio);
    this.draw();
  }

  applyCrop() {
    if(this.mode?.name !== 'cropping' || !this.mode.cropArea) {
      return;
    }
    const cropArea = this.mode.cropArea;
    this.drawables = this.drawablesWithoutCropArea();
    this.mode.cropArea = undefined;
    const {x, y, width, height} = cropArea.getCroppedRectangleCoordinates();
    this.draw();
    this.saveState();
    const croppedImageData = this.ctx.getImageData(x, y, width, height);

    const imageDrawable = BgImageDrawable.fromImageData(
      croppedImageData,
      width,
      height,
      this.effectsApplied,
      this.touchedEffects
    );
    this.drawables.push(imageDrawable);
    this.canvasSafe.width = width;
    this.canvasSafe.height = height;
    this.draw();

    this.onChangeAspectRatio();
  }

  applyCropAction(action: CropAction) {
    if(this.mode.name !== 'cropping') {
      return;
    }

    this.drawables = this.drawablesWithoutCropArea();
    this.mode.cropArea = undefined;
    this.draw();
    this.saveState();

    const imageDrawable = BgImageDrawable.fromImageData(
      this.getFullCanvasData(),
      this.canvasWidth,
      this.canvasHeight,
      this.effectsApplied,
      this.touchedEffects
    );

    if(action.type === 'rotate90') {
      const {width, drawable, height} = imageDrawable.rotate90();
      this.drawables.push(drawable);
      this.canvasSafe.width = width;
      this.canvasSafe.height = height;
      this.onResetRotationAngle?.();
    } else if(action.type === 'flip') {
      const newDrawable = imageDrawable.flip();
      this.drawables.push(newDrawable);
      this.onResetRotationAngle?.();
    } else if(action.type === 'rotate') {
      const id = this.getLastImageDrawable();
      assert(id);
      id.rotate(action.angle);
    }

    this.draw();

    this.onChangeAspectRatio();
  }

  get ctx() {
    const ctx = this.canvasSafe.getContext('2d', {
      willReadFrequently: true
    });
    assert(ctx, 'Canvas context is null');
    return ctx;
  }

  get canvasWidth() {
    return this.canvasSafe.width;
  }

  get canvasHeight() {
    return this.canvasSafe.height;
  }

  private drawablesWithoutCropArea() {
    return this.drawables.filter(
      (drawable) => !(drawable instanceof CropAreaDrawable)
    );
  }

  saveState() {
    this.undoStack.push({
      drawables: this.drawablesWithoutCropArea().map((drawable) =>
        drawable.clone()
      ),
      width: this.canvasWidth,
      height: this.canvasHeight,
      imageData: this.ctx.getImageData(
        0,
        0,
        this.canvasWidth,
        this.canvasHeight
      ),
      effects: duplicateEffects(this.effectsApplied)
    });
    if(this.undoStack.length > undoStackLimit) {
      this.undoStack.shift();
    }

    this.redoStack = [];
    this.redoStack.length = 0;

    this.syncHistoryWithSignals();
  }

  getFullCanvasData(): ImageData {
    return this.ctx.getImageData(0, 0, this.canvasWidth, this.canvasHeight);
  }

  undo() {
    if(this.undoStack.length > 0) {
      this.redoStack.push({
        drawables: this.drawables,
        imageData: this.getFullCanvasData(),
        effects: duplicateEffects(this.effectsApplied),
        width: this.canvasWidth,
        height: this.canvasHeight
      });
      const state = this.undoStack.pop();
      if(!state) {
        return;
      }
      this.drawables = state.drawables;
      copyEffectsFromTo(state.effects, this.effectsApplied);
      copyEffectsFromTo(state.effects, this.effectsUi);
      if(
        state.width !== this.canvasWidth ||
        state.height !== this.canvasHeight
      ) {
        this.canvasSafe.width = state.width;
        this.canvasSafe.height = state.height;
      }
      this.ctx.putImageData(state.imageData, 0, 0);

      // Allow clicking 'Undo' after cropping
      if(this.mode.name === 'cropping' && this.mode.cropArea) {
        this.mode.cropArea = undefined;
      }
    }

    this.syncHistoryWithSignals();
  }

  redo() {
    if(this.redoStack.length > 0) {
      this.undoStack.push({
        drawables: this.drawables,
        imageData: this.getFullCanvasData(),
        height: this.canvasHeight,
        width: this.canvasWidth,
        effects: duplicateEffects(this.effectsApplied)
      });
      const state = this.redoStack.pop();
      if(!state) {
        return;
      }
      this.drawables = state.drawables;
      copyEffectsFromTo(state.effects, this.effectsApplied);
      copyEffectsFromTo(state.effects, this.effectsUi);
      if(
        state.width !== this.canvasWidth ||
        state.height !== this.canvasHeight
      ) {
        this.canvasSafe.width = state.width;
        this.canvasSafe.height = state.height;
      }
      this.ctx.putImageData(state.imageData, 0, 0);
    }

    this.syncHistoryWithSignals();
  }

  private getLastImageDrawable(): BgImageDrawable | undefined {
    const imageDrawables: Array<BgImageDrawable> = this.drawables.filter(
      (drawable) => drawable instanceof BgImageDrawable
    ) as any;

    return imageDrawables.length ? imageDrawables.at(-1) : undefined;
  }

  applyEffects() {
    this.saveState();
    copyEffectsFromTo(this.effectsUi, this.effectsApplied);

    this.getLastImageDrawable()?.redrawProcessedCanvas();

    this.draw();
  }

  setUiEffectValue(key: keyof Effects, value: number) {
    this.effectsUi[key] = value;
    this.touchedEffects.add(key);
  }

  draw() {
    // Clear the canvas so dragging doesn't leave a trail
    this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
    this.drawables.forEach((drawable) => {
      drawable.draw(this.ctx);
    });
  }

  async drawImage(img: HTMLImageElement) {
    const containerWidth = this.canvasContainerRef?.clientWidth;
    const containerHeight = this.canvasContainerRef?.clientHeight;
    if(!containerWidth || !containerHeight) return;

    const {width, height} = fitImageIntoCanvas(
      containerWidth,
      // -100 to accommodate angle picker in helpers mode
      containerHeight - 100,
      img.width,
      img.height
    );

    this.canvasSafe.width = Math.min(width, containerWidth);
    this.canvasSafe.height = Math.min(height, containerHeight);

    this.drawables.push(
      BgImageDrawable.fromImage(
        img,
        width,
        height,
        this.effectsApplied,
        this.touchedEffects
      )
    );
    this.draw();
  }

  addSticker(data: ImageData, size: number) {
    this.saveState();

    const randomX = randomMinMax(outerPadding, this.canvasWidth - size);
    const randomY = randomMinMax(outerPadding, this.canvasHeight - size);

    const stickerDrawable = StickerDrawable.fromImageData(
      randomX,
      randomY,
      data,
      size,
      size,
      this.setCursor,
      this.onDraggableRemove
    );
    this.selectDrawable(stickerDrawable);
    this.drawables.push(stickerDrawable);
    this.draw();
  }

  isApplyCropVisible() {
    const mode = this.mode;
    if(mode?.name === 'cropping') {
      return !!mode.cropArea;
    }
    return false;
  }

  dispose() {
    if(!this.canvas) return;
    this.canvas.removeEventListener('mousedown', this.onMouseDown);
    this.canvas.removeEventListener('mousemove', this.onMouseMove);
    this.canvas.removeEventListener('mouseup', this.onMouseUp);
    document.removeEventListener('keydown', this.onKeyDown);
  }

  syncHistoryWithSignals() {
    this.canUndo[1](this.undoStack.length > 0);
    this.canRedo[1](this.redoStack.length > 0);
  }

  private addText(x: number, y: number) {
    this.saveState();
    const [textAlign] = this.textAlign;
    const [textSize] = this.textSize;
    const [textFont] = this.textFont;
    const [textStyle] = this.textStyle;
    const [textColor] = this.textColor;

    const textDrawable = new TextDrawable(
      x,
      y,
      '',
      textSize(),
      textFont(),
      textColor(),
      textAlign(),
      textStyle(),
      this.onDraggableRemove,
      this.setCursor
    );
    this.selectDrawable(textDrawable);
    this.drawables.push(textDrawable);
    this.draw();
  }

  private onDraggableRemove = (id: number) => {
    this.drawables = this.drawables.filter((drawable) =>
      isDraggableResizable(drawable) ? drawable.id !== id : true
    );
    this.draw();
  };

  private onKeyDown = (event: KeyboardEvent) => {
    const [tab] = this.tab;
    // Check for undo: Ctrl+Z (Windows/Linux) or Command+Z (Mac)
    if(
      (event.ctrlKey || event.metaKey) &&
      event.key.toLowerCase() === 'z' &&
      !event.shiftKey
    ) {
      event.preventDefault();
      this.undo();
      return;
    }

    // Check for redo: Ctrl+Shift+Z (Windows/Linux) or Command+Shift+Z (Mac)
    if(
      (event.ctrlKey || event.metaKey) &&
      event.shiftKey &&
      event.key.toLowerCase() === 'z'
    ) {
      event.preventDefault();
      this.redo();
      return;
    }

    if(tab() === 'text' || tab() === 'sticker') {
      const draggableResizableSelected = this.drawables.find(
        (drawable) => isDraggableResizable(drawable) && drawable.isSelected
      );
      if(
        draggableResizableSelected &&
        isDraggableResizable(draggableResizableSelected)
      ) {
        draggableResizableSelected.onKeyPress(event);
        this.draw();
      }
    }
  };

  private onTextAlignUpdate(textAlign: TextAlign) {
    this.findTextAndDo((selectedTextDrawable) => {
      selectedTextDrawable.updateTextAlign(textAlign);
    });
  }

  private onTextSizeChange(size: number) {
    this.findTextAndDo((selectedTextDrawable) => {
      selectedTextDrawable.updateFontSize(size);
    });
  }

  private onTextFontUpdate(value: string) {
    this.findTextAndDo((drawable) => {
      drawable.updateFontFamily(value);
    });
  }

  private updateTextStyle(style: TextStyle) {
    this.findTextAndDo((selectedTextDrawable) => {
      selectedTextDrawable.updateTextStyle(style);
    });
  }

  private updateTextColor(color: string) {
    this.findTextAndDo((selectedTextDrawable) => {
      selectedTextDrawable.updateFontColor(color);
    });
  }

  toFile(): Promise<File> {
    return new Promise((resolve) => {
      this.drawables = this.drawablesWithoutCropArea();
      this.drawables.forEach(drawable => {
        if(isDraggableResizable(drawable)) {
          drawable.isSelected = false;
        }
      })
      this.draw();
      this.canvas.toBlob((blob) => {
        resolve(new File([blob], 'canvas_image.png'))
      })
    })
  }

  private updateMode(newMode: Mode) {
    modifyMutable(this.mode, reconcile<Mode, Mode>(newMode));
  }

  private findTextAndDo(cb: (selectedTextDrawable: TextDrawable) => void) {
    const selectedTextDrawable = this.drawables.find(
      (drawable) => drawable instanceof TextDrawable && drawable.isSelected
    );
    if(!selectedTextDrawable) return;
    assert(selectedTextDrawable instanceof TextDrawable);
    cb(selectedTextDrawable);
    this.draw();
  }
}
