import {ColorSizePicker} from '../draw/colorSizePicker';
import './textTabBody.scss';
import {
  TextAlignCenterIcon,
  TextAlignLeftIcon,
  TextAlignRightIcon,
  TextPlainIcon,
  TextWithBackgroundIcon,
  TextWithOutlineIcon
} from './icons';
import {For, JSXElement, onMount} from 'solid-js';
import {TextAlign, TextStyle} from '../../drawable/textDrawable';
import {useCanvasManager} from '../../canvasManagerContext';
import RowTsx from '../../../rowTsx';
import {loadFallbackFontsOnce} from './loadFallbackFontsOnce';

export const fonts: Array<{ title: string; fontFamily: string }> = [
  {
    title: 'Roboto',
    fontFamily: 'Roboto, sans-serif'
  },
  {
    title: 'Typewriter',
    fontFamily: 'Courier, Special Elite'
  },
  {
    title: 'Avenir Next',
    fontFamily: 'Avenir Next, Nunito'
  },
  {
    title: 'Courier New',
    fontFamily: 'Courier New, Special Elite'
  },
  {
    title: 'Noteworthy',
    fontFamily: 'Noteworthy, Architects Daughter'
  },
  {
    title: 'Georgia',
    fontFamily: 'Georgia'
  },
  {
    title: 'Papyrus',
    fontFamily: 'Papyrus'
  },
  {
    title: 'Snell Roundhand',
    fontFamily: 'Snell Roundhand, Dancing Script'
  }
];

export const TextTabBody = () => {
  const canvasManager = useCanvasManager();
  const [textColor, setTextColor] = canvasManager.textColor;
  const [textStyle] = canvasManager.textStyle;
  const [textAlign] = canvasManager.textAlign;

  const aligns: Array<{ icon: JSXElement; align: TextAlign }> = [
    {icon: <TextAlignLeftIcon />, align: 'left'},
    {
      icon: <TextAlignCenterIcon />,
      align: 'center'
    },
    {icon: <TextAlignRightIcon />, align: 'right'}
  ];

  const textStyles: Array<{ icon: JSXElement; style: TextStyle }> = [
    {icon: <TextPlainIcon />, style: 'plain'},
    {
      icon: <TextWithOutlineIcon />,
      style: 'outline'
    },
    {icon: <TextWithBackgroundIcon />, style: 'background'}
  ];

  onMount(() => {
    loadFallbackFontsOnce()
  })

  return (
    <div class={'textTabBody'}>
      <ColorSizePicker
        sizeMin={10}
        sizeMax={48}
        size={canvasManager.textSize}
        currentColor={textColor}
        onChangeColor={setTextColor}
        currentColorSignal={canvasManager.textColor}
        betweenSlot={
          <div class="textPropertyRow">
            <div class="textPropertyList">
              <For each={aligns}>
                {(align) => (
                  <div
                    class="textPropertyItem"
                  >
                    <RowTsx
                      isFlex={true}
                      title={align.icon}
                      isSelected={textAlign() === align.align}
                      clickable={() => {
                        const [, setTextAlign] = canvasManager.textAlign;
                        setTextAlign(align.align);
                      }} />
                  </div>
                )}
              </For>
            </div>

            <div class="textPropertyList">
              <For each={textStyles}>
                {(style) => (
                  <div
                    class="textPropertyItem"
                  >
                    <RowTsx
                      isFlex={true}
                      title={style.icon}
                      isSelected={textStyle() === style.style}
                      clickable={() => {
                        canvasManager.textStyle[1](style.style);
                      }} />
                  </div>
                )}
              </For>
            </div>
          </div>
        }
      />

      <div class="fontList">
        <div class="label">Font</div>
        <For each={fonts}>
          {(font) => {
            const [textFont, setTextFont] = canvasManager.textFont;
            return <div style={{'font-family': font.fontFamily}} class={'night'}>
              <RowTsx title={font.title} isSelected={textFont() === font.fontFamily} clickable={() => {
                setTextFont(font.fontFamily);
              }}/>
            </div>
          }}
        </For>
      </div>
    </div>
  );
};
