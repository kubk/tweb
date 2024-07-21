import {clamp} from './clamp';

export type RGB = { r: number; g: number; b: number };

export const rgbToHex = (color: RGB): string => {
  const {r, g, b} = color;

  const validR = clamp(0, 255, r);
  const validG = clamp(0, 255, g);
  const validB = clamp(0, 255, b);

  const hexR = validR.toString(16).padStart(2, '0').toUpperCase();
  const hexG = validG.toString(16).padStart(2, '0').toUpperCase();
  const hexB = validB.toString(16).padStart(2, '0').toUpperCase();

  return `#${hexR}${hexG}${hexB}`;
};
