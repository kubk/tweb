export function clamp(from: number, to: number, value: number) {
  return Math.max(from, Math.min(to, value));
}
