// Fits image into canvas if image is bigger, centering it
export const fitImageIntoCanvas = (
  canvasWidth: number,
  canvasHeight: number,
  imageWidth: number,
  imageHeight: number
): { width: number; height: number } => {
  const minSideRatio = Math.min(
    canvasWidth / imageWidth,
    canvasHeight / imageHeight,
    1
  );
  const width = imageWidth * minSideRatio;
  const height = imageHeight * minSideRatio;

  return {
    width,
    height
  };
};
