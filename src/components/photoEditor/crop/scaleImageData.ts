export function scaleImageData(sourceImageData: ImageData, targetSize = 300): ImageData {
  const sourceCanvas = document.createElement('canvas');
  sourceCanvas.width = sourceImageData.width;
  sourceCanvas.height = sourceImageData.height;
  const sourceCtx = sourceCanvas.getContext('2d');
  sourceCtx.putImageData(sourceImageData, 0, 0);

  const scale = Math.min(targetSize / sourceImageData.width, targetSize / sourceImageData.height);
  const scaledWidth = Math.round(sourceImageData.width * scale);
  const scaledHeight = Math.round(sourceImageData.height * scale);

  const targetCanvas = document.createElement('canvas');
  targetCanvas.width = targetSize;
  targetCanvas.height = targetSize;
  const targetCtx = targetCanvas.getContext('2d');

  const offsetX = (targetSize - scaledWidth) / 2;
  const offsetY = (targetSize - scaledHeight) / 2;

  targetCtx.drawImage(sourceCanvas, 0, 0, sourceImageData.width, sourceImageData.height,
    offsetX, offsetY, scaledWidth, scaledHeight);

  return targetCtx.getImageData(0, 0, targetSize, targetSize);
}
