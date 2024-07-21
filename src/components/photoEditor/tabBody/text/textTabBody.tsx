import { ColorSizePicker } from "../draw/colorSizePicker";
import "./textTabBody.scss";
import {
  TextAlignCenterIcon,
  TextAlignLeftIcon,
  TextAlignRightIcon,
  TextPlainIcon,
  TextWithBackgroundIcon,
  TextWithOutlineIcon,
} from "./icons";
import { For, JSXElement } from "solid-js";
import { TextAlign, TextStyle } from "../../drawable/textDrawable";
import { useCanvasManager } from "../../photoEditor";

export const fonts: Array<{ title: string; fontFamily: string }> = [
  {
    title: "Roboto",
    fontFamily: "Roboto, sans-serif",
  },
  {
    title: "Typewriter",
    fontFamily: "Courier, monospace",
  },
  {
    title: "Avenir Next",
    fontFamily: "Avenir Next",
  },
  {
    title: "Courier New",
    fontFamily: "Courier New",
  },
  {
    title: "Noteworthy",
    fontFamily: "Noteworthy",
  },
  {
    title: "Georgia",
    fontFamily: "Georgia",
  },
  {
    title: "Papyrus",
    fontFamily: "Papyrus",
  },
  {
    title: "Snell Roundhand",
    fontFamily: "Snell Roundhand",
  },
];

export const TextTabBody = () => {
  const canvasManager = useCanvasManager();
  const [textColor, setTextColor] = canvasManager.textColor;
  const [textStyle] = canvasManager.textStyle;
  const [textAlign] = canvasManager.textAlign;

  const aligns: Array<{ icon: JSXElement; align: TextAlign }> = [
    { icon: <TextAlignLeftIcon />, align: "left" },
    {
      icon: <TextAlignCenterIcon />,
      align: "center",
    },
    { icon: <TextAlignRightIcon />, align: "right" },
  ];

  const textStyles: Array<{ icon: JSXElement; style: TextStyle }> = [
    { icon: <TextPlainIcon />, style: "plain" },
    {
      icon: <TextWithOutlineIcon />,
      style: "outline",
    },
    { icon: <TextWithBackgroundIcon />, style: "background" },
  ];

  return (
    <div class={"textTabBody"}>
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
                    onClick={() => {
                      const [, setTextAlign] = canvasManager.textAlign;
                      setTextAlign(align.align);
                    }}
                    classList={{ isSelected: textAlign() === align.align }}
                  >
                    {align.icon}
                  </div>
                )}
              </For>
            </div>

            <div class="textPropertyList">
              <For each={textStyles}>
                {(style) => (
                  <div
                    class="textPropertyItem"
                    onClick={() => {
                      canvasManager.textStyle[1](style.style);
                    }}
                    classList={{ isSelected: textStyle() === style.style }}
                  >
                    {style.icon}
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
            return (
              <div
                class="fontListRow"
                style={{ "font-family": font.fontFamily }}
                onClick={() => {
                  setTextFont(font.fontFamily);
                }}
                classList={{
                  isSelected: textFont() === font.fontFamily,
                }}
              >
                {font.title}
              </div>
            );
          }}
        </For>
      </div>
    </div>
  );
};
