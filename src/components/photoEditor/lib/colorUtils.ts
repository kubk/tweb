import {assert} from './assert';
import {clamp} from './clamp';

export type HSL = { h: number; s: number; l: number };
export type RGB = { r: number; g: number; b: number };

export const hexToHsl = (hex: string): HSL => {
  const rgb = hexToRgb(hex);
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h, s;
  const l = (max + min) / 2;

  if(max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch(max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    // @ts-ignore
    h /= 6;
  }
  // @ts-ignore
  return {h: h * 360, s: s * 100, l: l * 100};
};

export const hexToRgb = (hex: string): RGB => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  assert(result, 'Invalid hex color: ' + hex);
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  };
};

export const hslToHex = (h: number, s: number, l: number): string => {
  l /= 100;
  const a = (s * Math.min(l, 1 - l)) / 100;
  // @ts-ignore
  const f = (n) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color)
    .toString(16)
    .padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
};

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
