import { Drawable } from "./drawable";
import { applyEffects } from "../effects/apply-effects";
import { Effects } from "../effects/effects";
import { assert } from "../lib/assert";
import { calculateScaleForRotation } from "../crop/calculateScaleForRotation";

export class ImageDrawable extends Drawable {
  private originalHtmlImage?: HTMLImageElement;
  private originalImageData?: ImageData;
  private angle: number;

  private constructor(
    public width: number,
    public height: number,
    public effects: Effects,
    public touchedEffects: Set<keyof Effects>,
    private processedCanvas: OffscreenCanvas,
    angle: number,
  ) {
    super();
    this.angle = angle % 360;

    // @ts-ignore
    window["img"] = this;
  }

  static fromImage(
    img: HTMLImageElement,
    width: number,
    height: number,
    effects: Effects,
    touchedEffects: Set<keyof Effects>,
    angle = 0,
  ) {
    const offscreenCanvas = new OffscreenCanvas(width, height);

    const self = new ImageDrawable(
      width,
      height,
      effects,
      touchedEffects,
      offscreenCanvas,
      angle,
    );
    self.originalHtmlImage = img;
    self.redrawProcessedCanvas();

    return self;
  }

  static fromImageData(
    imageData: ImageData,
    width: number,
    height: number,
    effects: Effects,
    touchedEffects: Set<keyof Effects>,
    angle = 0,
  ) {
    const processedCanvas = new OffscreenCanvas(width, height);

    const self = new ImageDrawable(
      width,
      height,
      effects,
      touchedEffects,
      processedCanvas,
      angle,
    );
    self.originalImageData = imageData;
    self.redrawProcessedCanvas();

    return self;
  }

  private redrawProcessedCanvasViaHtmlImg() {
    const ctx = this.processedCanvas.getContext("2d", {
      willReadFrequently: true,
    });
    if (!ctx) return;
    const img = this.originalHtmlImage;
    if (!img) return;

    // Rotating start
    ctx.save();
    ctx.translate(this.width / 2, this.height / 2);
    ctx.rotate((this.angle * Math.PI) / 180);
    const scale = calculateScaleForRotation(this.angle, {
      width: this.width,
      height: this.height,
    });
    ctx.scale(scale, scale);
    ctx.drawImage(
      img,
      -this.width / 2,
      -this.height / 2,
      this.width,
      this.height,
    );
    ctx.restore();
    // Rotating end

    const imageData = ctx.getImageData(0, 0, this.width, this.height);

    applyEffects(this.effects, this.touchedEffects, imageData, {
      imageWidth: this.width,
      imageHeight: this.height,
    });
    ctx.putImageData(imageData, 0, 0);
  }

  private redrawProcessedCanvasViaImageData() {
    const ctx = this.processedCanvas.getContext("2d", {
      willReadFrequently: true,
    });
    if (!ctx) return;
    const imageData = this.originalImageData;
    if (!imageData) return;

    // Rotating start
    ctx.save();
    ctx.translate(this.width / 2, this.height / 2);
    ctx.rotate((this.angle * Math.PI) / 180);
    const scale = calculateScaleForRotation(this.angle, {
      width: this.width,
      height: this.height,
    });
    ctx.scale(scale, scale);

    const tempCanvas = new OffscreenCanvas(this.width, this.height);
    const tempCtx = tempCanvas.getContext("2d");
    if (!tempCtx) return;
    tempCtx.putImageData(imageData, 0, 0);
    ctx.drawImage(tempCanvas, -this.width / 2, -this.height / 2);
    ctx.restore();
    // Rotating end

    const rotatedImageData = ctx.getImageData(0, 0, this.width, this.height);
    applyEffects(this.effects, this.touchedEffects, rotatedImageData, {
      imageWidth: this.width,
      imageHeight: this.height,
    });
    ctx.putImageData(rotatedImageData, 0, 0);
  }

  rotate(angle: number) {
    this.angle = angle;
    this.redrawProcessedCanvas();
  }

  rotate90(): { drawable: ImageDrawable; width: number; height: number } {
    const sourceWidth = this.width;
    const sourceHeight = this.height;
    const angle = -Math.PI / 2;

    const newWidth = Math.round(
      Math.abs(sourceWidth * Math.cos(angle)) +
        Math.abs(sourceHeight * Math.sin(angle)),
    );
    const newHeight = Math.round(
      Math.abs(sourceWidth * Math.sin(angle)) +
        Math.abs(sourceHeight * Math.cos(angle)),
    );

    const offscreenCanvas = new OffscreenCanvas(newWidth, newHeight);
    const ctx = offscreenCanvas.getContext("2d");
    assert(ctx, "Failed to get 2d context");

    ctx.translate(newWidth / 2, newHeight / 2);
    ctx.rotate(angle);
    ctx.drawImage(
      this.processedCanvas,
      -sourceWidth / 2,
      -sourceHeight / 2,
      sourceWidth,
      sourceHeight,
    );

    return {
      drawable: ImageDrawable.fromImageData(
        ctx.getImageData(0, 0, newWidth, newHeight),
        newWidth,
        newHeight,
        this.effects,
        this.touchedEffects,
      ),
      width: newWidth,
      height: newHeight,
    };
  }

  flip(): ImageDrawable {
    const offscreenCanvas = new OffscreenCanvas(this.width, this.height);
    const ctx = offscreenCanvas.getContext("2d");
    assert(ctx, "Failed to get 2d context");

    ctx.translate(this.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(this.processedCanvas, 0, 0);

    return ImageDrawable.fromImageData(
      ctx.getImageData(0, 0, this.width, this.height),
      this.width,
      this.height,
      this.effects,
      this.touchedEffects,
      0,
    );
  }

  redrawProcessedCanvas() {
    if (this.originalHtmlImage) {
      this.redrawProcessedCanvasViaHtmlImg();
    } else {
      this.redrawProcessedCanvasViaImageData();
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.drawImage(this.processedCanvas, 0, 0);
  }

  getImageData() {
    return this.processedCanvas
      .getContext("2d", { willReadFrequently: true })
      ?.getImageData(0, 0, this.width, this.height);
  }

  clone() {
    const offscreenCanvas = new OffscreenCanvas(this.width, this.height);

    const copy = new ImageDrawable(
      this.width,
      this.height,
      this.effects,
      this.touchedEffects,
      offscreenCanvas,
      this.angle,
    );
    if (this.originalImageData) {
      copy.originalImageData = this.originalImageData;
    }
    if (this.originalHtmlImage) {
      copy.originalHtmlImage = this.originalHtmlImage;
    }
    copy.redrawProcessedCanvas();

    return copy;
  }
}
