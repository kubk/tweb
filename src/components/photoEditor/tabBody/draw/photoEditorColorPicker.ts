import {ColorHsla, ColorRgba, hexaToHsla, hslaToRgba, rgbaToHexa, rgbaToHsla} from '../../../../helpers/color';
import InputField, {InputState} from '../../../inputField';
import attachGrabListeners from '../../../../helpers/dom/attachGrabListeners';
import clamp from '../../../../helpers/number/clamp';
import {ColorPickerColor} from '../../../colorPicker';
import img from './img/colorSwitcher.png';


// Modified ColorPicker with different SVG and different HTML element order
export class PhotoEditorColorPicker {
  private static BASE_CLASS = 'color-picker';
  public container: HTMLElement;

  private boxRect: DOMRect;
  // private boxDraggerRect: DOMRect;
  private hueRect: DOMRect;
  // private hueDraggerRect: DOMRect;

  private hue = 0;
  private saturation = 100;
  private lightness = 50;
  private alpha = 1;
  private elements: {
    box: SVGSVGElement,
    boxDragger: SVGSVGElement,
    sliders: HTMLElement,
    hue: SVGSVGElement,
    hueDragger: SVGSVGElement,
    saturation: SVGLinearGradientElement,
  } = {} as any;
  private hexInputField: InputField;
  private rgbInputField: InputField;
  public onChange: (color: ColorPickerColor) => void;

  constructor(props: { onColorSwitcherClick: () => void }) {
    this.container = document.createElement('div');
    this.container.classList.add(PhotoEditorColorPicker.BASE_CLASS);

    const html = `
 <div class="${PhotoEditorColorPicker.BASE_CLASS + '-sliders'}">
        <svg class="${PhotoEditorColorPicker.BASE_CLASS + '-color-slider'}" viewBox="0 0 380 24">
          <defs>
            <linearGradient id="hue" x1="100%" y1="0%" x2="0%" y2="0%">
              <stop offset="0%" stop-color="#f00"></stop>
              <stop offset="16.666%" stop-color="#f0f"></stop>
              <stop offset="33.333%" stop-color="#00f"></stop>
              <stop offset="50%" stop-color="#0ff"></stop>
              <stop offset="66.666%" stop-color="#0f0"></stop>
              <stop offset="83.333%" stop-color="#ff0"></stop>
              <stop offset="100%" stop-color="#f00"></stop>
            </linearGradient>
          </defs>
          <rect rx="12" ry="12" x="0" y="9" width="380" height="26" fill="url(#hue)"></rect>
          <svg class="${PhotoEditorColorPicker.BASE_CLASS + '-dragger'} ${PhotoEditorColorPicker.BASE_CLASS + '-color-slider-dragger'}" x="0" y="21">
            <circle r="13" fill="inherit" stroke="#fff" stroke-width="2"></circle>
          </svg>
        </svg>
        <div class='colorSwitcher isSelected' style="margin-bottom: -10px">
          <img src="${img}" alt='switcher' />
        </div>
      </div>
      <div class="${PhotoEditorColorPicker.BASE_CLASS + '-box-wrapper'}">
      <svg class="${PhotoEditorColorPicker.BASE_CLASS + '-box'}" viewBox="0 0 200 120">
        <defs>
          <linearGradient id="color-picker-saturation" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#fff"></stop>
            <stop offset="100%" stop-color="hsl(0,100%,50%)"></stop>
          </linearGradient>
          <linearGradient id="color-picker-brightness" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="rgba(0,0,0,0)"></stop>
            <stop offset="100%" stop-color="#000"></stop>
          </linearGradient>
          <pattern id="color-picker-pattern" width="100%" height="100%">
            <rect x="0" y="0" width="100%" height="100%" fill="url(#color-picker-saturation)"></rect>
            <rect x="0" y="0" width="100%" height="100%" fill="url(#color-picker-brightness)"></rect>
          </pattern>
        </defs>
        <rect rx="10" ry="10" x="0" y="0" width="200" height="120" fill="url(#color-picker-pattern)"></rect>
        <svg class="${PhotoEditorColorPicker.BASE_CLASS + '-dragger'} ${PhotoEditorColorPicker.BASE_CLASS + '-box-dragger'}" x="0" y="0">
          <circle r="10" fill="inherit" stroke="#fff" stroke-width="2"></circle>
        </svg>
      </svg>
      </div>
     
    `;

    this.container.innerHTML = html;

    this.elements.box = this.container.querySelector('.' + PhotoEditorColorPicker.BASE_CLASS + '-box')
    const boxWrapper = this.container.querySelector('.' + PhotoEditorColorPicker.BASE_CLASS + '-box-wrapper');
    const colorSwitcher = this.container.querySelector('.colorSwitcher');
    (colorSwitcher as HTMLDivElement).onclick = () => props.onColorSwitcherClick()

    this.elements.boxDragger = this.elements.box.lastElementChild as any;
    this.elements.saturation = this.elements.box.firstElementChild.firstElementChild as any;

    this.elements.sliders = this.container.querySelector('.' + PhotoEditorColorPicker.BASE_CLASS + '-sliders');

    this.elements.hue = this.elements.sliders.firstElementChild as any;
    this.elements.hueDragger = this.elements.hue.lastElementChild as any;

    this.hexInputField = new InputField({plainText: true, label: 'Appearance.Color.Hex'});
    this.rgbInputField = new InputField({plainText: true, label: 'Appearance.Color.RGB'});

    const inputs = document.createElement('div');
    inputs.className = PhotoEditorColorPicker.BASE_CLASS + '-inputs';
    inputs.append(this.hexInputField.container, this.rgbInputField.container);
    boxWrapper.append(inputs);

    this.setUpInputs();
    this.attachBoxListeners();
    this.attachHueListeners();
  }

  private setUpInputs() {
    this.hexInputField.input.addEventListener('input', () => {
      let value = this.hexInputField.value.replace(/#/g, '').slice(0, 6);

      const match = value.match(/([a-fA-F\d]+)/);
      const valid = match && match[0].length === value.length && [/* 3, 4,  */6].includes(value.length);
      this.hexInputField.setState(valid ? InputState.Neutral : InputState.Error);

      value = '#' + value;
      this.hexInputField.setValueSilently(value);

      if(valid) {
        this.setColor(value, false, true);
      }
    });

    // patched https://stackoverflow.com/a/34029238/6758968
    const rgbRegExp = /^(?:rgb)?\(?([01]?\d\d?|2[0-4]\d|25[0-5])(?:\W+)([01]?\d\d?|2[0-4]\d|25[0-5])\W+(?:([01]?\d\d?|2[0-4]\d|25[0-5])\)?)$/;
    this.rgbInputField.input.addEventListener('input', () => {
      const match = this.rgbInputField.value.match(rgbRegExp);
      this.rgbInputField.setState(match ? InputState.Neutral : InputState.Error);

      if(match) {
        this.setColor(rgbaToHsla(+match[1], +match[2], +match[3]), true, false);
      }
    });
  }

  private onGrabStart = () => {
    document.documentElement.style.cursor = this.elements.boxDragger.style.cursor = 'grabbing';
  };

  private onGrabEnd = () => {
    document.documentElement.style.cursor = this.elements.boxDragger.style.cursor = '';
  };

  private attachBoxListeners() {
    attachGrabListeners(this.elements.box as any, () => {
      this.onGrabStart();
      this.boxRect = this.elements.box.getBoundingClientRect();
      // this.boxDraggerRect = this.elements.boxDragger.getBoundingClientRect();
    }, (pos) => {
      this.saturationHandler(pos.x, pos.y);
    }, () => {
      this.onGrabEnd();
    });
  }

  private attachHueListeners() {
    attachGrabListeners(this.elements.hue as any, () => {
      this.onGrabStart();
      this.hueRect = this.elements.hue.getBoundingClientRect();
      // this.hueDraggerRect = this.elements.hueDragger.getBoundingClientRect();
    }, (pos) => {
      this.hueHandler(pos.x);
    }, () => {
      this.onGrabEnd();
    });
  }

  public setColor(color: ColorHsla | string, updateHexInput = true, updateRgbInput = true) {
    if(color === undefined) { // * set to red
      color = {
        h: 0,
        s: 100,
        l: 50,
        a: 1
      };
    } else if(typeof(color) === 'string') {
      if(color[0] === '#') {
        color = hexaToHsla(color);
      } else {
        const rgb = color.match(/[.?\d]+/g);
        color = rgbaToHsla(+rgb[0], +rgb[1], +rgb[2], rgb[3] === undefined ? 1 : +rgb[3]);
      }
    }

    // Set box
    this.boxRect = this.elements.box.getBoundingClientRect();

    const boxX = this.boxRect.width / 100 * color.s;
    const percentY = 100 - (color.l / (100 - color.s / 2)) * 100;
    const boxY = this.boxRect.height / 100 * percentY;

    this.saturationHandler(this.boxRect.left + boxX, this.boxRect.top + boxY, false);

    // Set hue
    this.hueRect = this.elements.hue.getBoundingClientRect();

    const percentHue = color.h / 360;
    const hueX = this.hueRect.left + this.hueRect.width * percentHue;

    this.hueHandler(hueX, false);

    // Set values
    this.hue = color.h;
    this.saturation = color.s;
    this.lightness = color.l;
    this.alpha = color.a;

    this.updatePicker(updateHexInput, updateRgbInput);
  };

  public getCurrentColor(): ColorPickerColor {
    const rgbaArray = hslaToRgba(this.hue, this.saturation, this.lightness, this.alpha);
    const hexa = rgbaToHexa(rgbaArray);
    const hex = hexa.slice(0, -2);

    return {
      hsl: `hsl(${this.hue}, ${this.saturation}%, ${this.lightness}%)`,
      rgb: `rgb(${rgbaArray[0]}, ${rgbaArray[1]}, ${rgbaArray[2]})`,
      hex: hex,
      hsla: `hsla(${this.hue}, ${this.saturation}%, ${this.lightness}%, ${this.alpha})`,
      rgba: `rgba(${rgbaArray[0]}, ${rgbaArray[1]}, ${rgbaArray[2]}, ${rgbaArray[3]})`,
      hexa: hexa,
      rgbaArray: rgbaArray
    };
  }

  public updatePicker(updateHexInput = true, updateRgbInput = true) {
    const color = this.getCurrentColor();
    this.elements.boxDragger.setAttributeNS(null, 'fill', color.hex);

    if(updateHexInput) {
      this.hexInputField.setValueSilently(color.hex);
      this.hexInputField.setState(InputState.Neutral);
    }

    if(updateRgbInput) {
      this.rgbInputField.setValueSilently(color.rgbaArray.slice(0, -1).join(', '));
      this.rgbInputField.setState(InputState.Neutral);
    }

    if(this.onChange) {
      this.onChange(color);
    }
  }

  private hueHandler(pageX: number, update = true) {
    const eventX = clamp(pageX - this.hueRect.left, 0, this.hueRect.width);

    const percents = eventX / this.hueRect.width;
    this.hue = Math.round(360 * percents);

    const hsla = `hsla(${this.hue}, 100%, 50%, ${this.alpha})`;

    this.elements.hueDragger.setAttributeNS(null, 'x', (percents * 100) + '%');
    this.elements.hueDragger.setAttributeNS(null, 'fill', hsla);

    this.elements.saturation.lastElementChild.setAttributeNS(null, 'stop-color', hsla);

    if(update) {
      this.updatePicker();
    }
  }

  private saturationHandler(pageX: number, pageY: number, update = true) {
    const maxX = this.boxRect.width;
    const maxY = this.boxRect.height;

    const eventX = clamp(pageX - this.boxRect.left, 0, maxX);
    const eventY = clamp(pageY - this.boxRect.top, 0, maxY);

    const posX = eventX / maxX * 100;
    const posY = eventY / maxY * 100;

    const boxDragger = this.elements.boxDragger;
    boxDragger.setAttributeNS(null, 'x', posX + '%');
    boxDragger.setAttributeNS(null, 'y', posY + '%');

    const saturation = clamp(posX, 0, 100);

    const lightnessX = 100 - saturation / 2;
    const lightnessY = 100 - clamp(posY, 0, 100);

    const lightness = clamp(lightnessY / 100 * lightnessX, 0, 100);

    this.saturation = saturation;
    this.lightness = lightness;

    if(update) {
      this.updatePicker();
    }
  };
}
