import {Effects} from './effects';

const BRIGHTNESS_FACTOR = 2.55;
const CONTRAST_FACTOR = 1 / 255;
const SATURATION_FACTOR = 1 / 100;
const FADE_FACTOR = 1 / 100;
const HIGHLIGHTS_SHADOWS_FACTOR = 2.55;
const VIGNETTE_FACTOR = 1 / 100;
const GRAIN_FACTOR = 2.55;
const SHARPEN_FACTOR = 1 / 100;
const ENHANCE_FACTOR = 0.01;

export const applyEffects = (
  effects: Effects,
  touchedEffects: Set<keyof Effects>,
  imageData: ImageData,
  options: {
    imageWidth: number;
    imageHeight: number;
  }
) => {
  const data = new Uint8ClampedArray(imageData.data);
  const {imageWidth, imageHeight} = options;

  if(touchedEffects.size === 0) {
    return;
  }

  // Pre-compute effect values
  const brightness = effects.brightness * BRIGHTNESS_FACTOR;
  const contrast = effects.contrast * CONTRAST_FACTOR + 1;
  const saturation = effects.saturation * SATURATION_FACTOR + 1;
  const warmth = effects.warmth;
  const fade = 1 - effects.fade * FADE_FACTOR;
  const highlights = effects.highlights * HIGHLIGHTS_SHADOWS_FACTOR;
  const shadows = effects.shadows * HIGHLIGHTS_SHADOWS_FACTOR;
  const vignette = effects.vignette * VIGNETTE_FACTOR;
  const grain = effects.grain * GRAIN_FACTOR;
  const sharpen = effects.sharpen * SHARPEN_FACTOR;
  const enhance = effects.enhance * ENHANCE_FACTOR;

  // Pre-compute vignette values
  const centerX = imageWidth / 2;
  const centerY = imageHeight / 2;
  const maxDist = Math.sqrt(centerX * centerX + centerY * centerY);

  const touchedEffectsArray = Array.from(touchedEffects);

  for(let i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];

    const avg = (r + g + b) / 3;

    for(const effect of touchedEffectsArray) {
      switch(effect) {
        case 'brightness':
          r += brightness;
          g += brightness;
          b += brightness;
          break;
        case 'contrast':
          r = (r - 128) * contrast + 128;
          g = (g - 128) * contrast + 128;
          b = (b - 128) * contrast + 128;
          break;
        case 'saturation':
          r = avg + (r - avg) * saturation;
          g = avg + (g - avg) * saturation;
          b = avg + (b - avg) * saturation;
          break;
        case 'warmth':
          r += warmth;
          b -= warmth;
          break;
        case 'fade':
          r *= fade;
          g *= fade;
          b *= fade;
          break;
        case 'highlights':
          if(r > 128) r += highlights;
          if(g > 128) g += highlights;
          if(b > 128) b += highlights;
          break;
        case 'shadows':
          if(r < 128) r += shadows;
          if(g < 128) g += shadows;
          if(b < 128) b += shadows;
          break;
        case 'vignette':
          const x = (i / 4) % imageWidth;
          const y = Math.floor(i / 4 / imageWidth);
          const distX = Math.abs(x - centerX);
          const distY = Math.abs(y - centerY);
          const dist = Math.sqrt(distX * distX + distY * distY);
          const vignetteFactor = 1 - (dist / maxDist) * vignette;
          r *= vignetteFactor;
          g *= vignetteFactor;
          b *= vignetteFactor;
          break;
        case 'grain':
          const grainValue = (Math.random() - 0.5) * grain;
          r += grainValue;
          g += grainValue;
          b += grainValue;
          break;
        case 'sharpen':
          r += (r - avg) * sharpen;
          g += (g - avg) * sharpen;
          b += (b - avg) * sharpen;
          break;
        case 'enhance':
          r = (r - 128) * (1 + enhance) + 128;
          g = (g - 128) * (1 + enhance) + 128;
          b = (b - 128) * (1 + enhance) + 128;
          r = avg + (r - avg) * (1 + enhance);
          g = avg + (g - avg) * (1 + enhance);
          b = avg + (b - avg) * (1 + enhance);
          break;
      }
    }

    data[i] = r < 0 ? 0 : r > 255 ? 255 : r;
    data[i + 1] = g < 0 ? 0 : g > 255 ? 255 : g;
    data[i + 2] = b < 0 ? 0 : b > 255 ? 255 : b;
  }

  imageData.data.set(data);
};
