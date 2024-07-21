export type Effects = {
  enhance: number;
  brightness: number;
  contrast: number;
  saturation: number;
  warmth: number;
  fade: number;
  highlights: number;
  shadows: number;
  vignette: number;
  grain: number;
  sharpen: number;
};

export enum SliderType {
  Bidirectional,
  Positive,
}

export const effects: Record<
  keyof Effects,
  { title: string; sliderType: SliderType }
> = {
  enhance: {title: 'Enhance', sliderType: SliderType.Positive},
  brightness: {title: 'Brightness', sliderType: SliderType.Bidirectional},
  contrast: {title: 'Contrast', sliderType: SliderType.Bidirectional},
  saturation: {title: 'Saturation', sliderType: SliderType.Bidirectional},
  warmth: {title: 'Warmth', sliderType: SliderType.Bidirectional},
  fade: {title: 'Fade', sliderType: SliderType.Positive},
  highlights: {title: 'Highlights', sliderType: SliderType.Bidirectional},
  shadows: {title: 'Shadows', sliderType: SliderType.Bidirectional},
  vignette: {title: 'Vignette', sliderType: SliderType.Positive},
  grain: {title: 'Grain', sliderType: SliderType.Positive},
  sharpen: {title: 'Sharpen', sliderType: SliderType.Positive}
};

export const effectList = Object.entries(effects) as [
  keyof Effects,
  { title: string; sliderType: SliderType },
][];

export const copyEffectsFromTo = (fromEffects: Effects, toEffects: Effects) => {
  Object.assign(toEffects, fromEffects);
};

export const duplicateEffects = (effects: Effects): Effects => {
  return {...effects};
};

export const createEffects = (): Effects => {
  return {
    enhance: 0,
    brightness: 0,
    contrast: 0,
    saturation: 0,
    warmth: 0,
    fade: 0,
    highlights: 0,
    shadows: 0,
    vignette: 0,
    grain: 0,
    sharpen: 0
  };
};
