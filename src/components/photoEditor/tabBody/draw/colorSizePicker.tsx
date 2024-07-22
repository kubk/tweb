import {createSignal, For, JSXElement, Signal} from 'solid-js';
import {ColorSwitcherIcon} from './colorSwitcherIcon';
import {ColorPicker} from '../../colorPicker/colorPicker';
import {rgbToHex} from '../../lib/colorUtils';
import {PredefinedColor} from './predefinedColor';
import {PositiveSlider} from '../positiveSlider';
import './colorSizePicker.scss';

type ColorPickerMode = 'predefined' | 'custom';

export const ColorSizePicker = (props: {
  size: Signal<number>;
  currentColor: () => string;
  onChangeColor: (color: string) => void;
  currentColorSignal: Signal<string>;
  sizeMin?: number;
  sizeMax?: number;
  betweenSlot?: JSXElement;
}) => {
  const [size, setSize] = props.size;
  const [colorPickerMode, setColorPickerMode] =
    createSignal<ColorPickerMode>('predefined');
  const sizeMin = props.sizeMin ?? 1;
  const sizeMax = props.sizeMax ?? 30;

  const predefinedColors = [
    {r: 255, g: 255, b: 255},
    {r: 254, g: 68, b: 56},
    {r: 255, g: 137, b: 1}, // orange
    {r: 255, g: 214, b: 10}, // yellow
    {r: 51, g: 199, b: 89}, // green
    {r: 98, g: 229, b: 224}, // neon
    {r: 10, g: 132, b: 255},
    {r: 189, g: 92, b: 243}
  ];

  const colorSwitcher = (
    <ColorSwitcherIcon
      isSelected={colorPickerMode() === 'custom'}
      onClick={() => {
        setColorPickerMode(
          colorPickerMode() === 'custom' ? 'predefined' : 'custom'
        );
      }}
    />
  );

  return (
    <>
      {colorPickerMode() === 'custom' && (
        <div>
          <ColorPicker
            hueSlot={colorSwitcher}
            colorSignal={props.currentColorSignal}
          />
        </div>
      )}
      {colorPickerMode() === 'predefined' && (
        <div class={'predefinedColorList'}>
          <div class={'colors'}>
            <For each={predefinedColors}>
              {(predefinedColor) => {
                const colorHex = rgbToHex(predefinedColor);
                return (
                  <PredefinedColor
                    onClick={() => {
                      props.onChangeColor(colorHex);
                    }}
                    color={predefinedColor}
                    isSelected={() => props.currentColor() === colorHex}
                  />
                );
              }}
            </For>
            {colorSwitcher}
          </div>
        </div>
      )}

      {props.betweenSlot}

      <div class="sizeSlider">
        <PositiveSlider
          min={sizeMin}
          max={sizeMax}
          value={size()}
          name="Size"
          color={props.currentColor()}
          onChange={setSize}
        />
      </div>
    </>
  );
};
