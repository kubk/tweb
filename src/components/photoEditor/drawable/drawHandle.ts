export const handleRadius = 4;

export const drawHandle = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
  // outline
  ctx.fillStyle = '#222';
  ctx.beginPath();
  ctx.arc(x, y, handleRadius + 1, 0, Math.PI * 2);
  ctx.fill();

  // handle
  ctx.fillStyle = 'white';
  ctx.beginPath();
  ctx.arc(x, y, handleRadius, 0, Math.PI * 2);
  ctx.fill();
}
