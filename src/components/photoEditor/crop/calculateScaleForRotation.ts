export const calculateScaleForRotation = (
  angle: number,
  canvas: {
    width: number;
    height: number;
  },
) => {
  const normalizedAngle = ((angle % 360) + 360) % 360;
  const rotationRad = normalizedAngle * (Math.PI / 180);
  const sin = Math.abs(Math.sin(rotationRad));
  const cos = Math.abs(Math.cos(rotationRad));
  const newWidth = canvas.width * cos + canvas.height * sin;
  const newHeight = canvas.width * sin + canvas.height * cos;

  return Math.max(newWidth / canvas.width, newHeight / canvas.height);
};
