import "./colorPicker.css";
import {
  createEffect,
  createSignal,
  JSXElement,
  onCleanup,
  Signal,
} from "solid-js";
import { clamp } from "../lib/clamp";
import { hexToHsl, hexToRgb, hslToHex } from "../lib/colorUtils";

const SL_PICKER_WIDTH = 200;
const SL_PICKER_HEIGHT = 120;

const HUE_SLIDER_WIDTH = 304;
const MAX_HUE = 360;
const THUMB_WIDTH = 22;
const HUE_TO_PIXEL_RATIO = HUE_SLIDER_WIDTH / MAX_HUE;

export const ColorPicker = (props: {
  colorSignal: Signal<string>;
  hueSlot?: JSXElement;
}) => {
  const [color, setColor] = props.colorSignal;
  const [isDragging, setIsDragging] = createSignal(false);
  const [activeElement, setActiveElement] = createSignal<"hue" | "sl" | null>(
    null,
  );

  let hueRef: HTMLDivElement;
  let slRef: HTMLDivElement;

  const hsl = () => hexToHsl(color());
  const rgb = () => hexToRgb(color());

  const handleHueChange = (e: MouseEvent) => {
    const rect = hueRef.getBoundingClientRect();
    const x = clamp(
      0,
      HUE_SLIDER_WIDTH - THUMB_WIDTH,
      Math.max(0, Math.min(e.clientX - rect.left, rect.width)),
    );
    const newHue = Math.round((x / rect.width) * 360);
    const { s, l } = hsl();
    setColor(hslToHex(newHue, s, l));
  };

  const handleSLChange = (e: MouseEvent) => {
    const rect = slRef.getBoundingClientRect();
    const x = clamp(
      0,
      SL_PICKER_WIDTH - THUMB_WIDTH,
      Math.max(0, Math.min(e.clientX - rect.left, rect.width)),
    );
    const y = clamp(
      0,
      SL_PICKER_HEIGHT - THUMB_WIDTH,
      Math.max(0, Math.min(e.clientY - rect.top, rect.height)),
    );
    const newSaturation = Math.round((x / rect.width) * 100);
    const newLightness = Math.round(100 - (y / rect.height) * 100);
    const { h } = hsl();
    setColor(hslToHex(h, newSaturation, newLightness));
  };

  const handleMouseDown = (element: "hue" | "sl") => (e: MouseEvent) => {
    setIsDragging(true);
    setActiveElement(element);
    if (element === "hue") {
      handleHueChange(e);
    } else if (element === "sl") {
      handleSLChange(e);
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging()) {
      if (activeElement() === "hue") {
        handleHueChange(e);
      } else if (activeElement() === "sl") {
        handleSLChange(e);
      }
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setActiveElement(null);
  };

  createEffect(() => {
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    onCleanup(() => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    });
  });

  return (
    <div class={"colorPicker"}>
      <div class={"huePickerWithRow"}>
        <div
          ref={hueRef!}
          class={"hueSlider"}
          onMouseDown={handleMouseDown("hue")}
        >
          <div
            class={"hueThumb"}
            style={{
              transform: `translateX(${clamp(0, HUE_SLIDER_WIDTH - THUMB_WIDTH, hsl().h * HUE_TO_PIXEL_RATIO)}px)`,
            }}
          />
        </div>
        {props.hueSlot}
      </div>

      <div class={"slWithValues"}>
        <div
          ref={slRef!}
          class={"slPicker"}
          style={{
            background: `linear-gradient(to right, #fff, hsl(${hsl().h}, 100%, 50%))`,
            "background-image": `linear-gradient(rgba(0,0,0,0), #000), linear-gradient(to right, #fff, hsl(${hsl().h}, 100%, 50%))`,
          }}
          onMouseDown={handleMouseDown("sl")}
        >
          <div
            class={"slThumb"}
            style={{
              transform: `translate(${(hsl().s * SL_PICKER_WIDTH) / 100}px, ${SL_PICKER_HEIGHT - (hsl().l * SL_PICKER_HEIGHT) / 100}px)`,
              "background-color": `hsl(${hsl().h}, ${hsl().s}%, ${hsl().l}%)`,
            }}
          />
        </div>

        <div class={"values"}>
          <div class={"valueBox"}>
            <div class={"valueLabel"}>HEX</div>
            <div class={"value"}>{color().toUpperCase()}</div>
          </div>

          <div class={"valueBox"}>
            <div class={"valueLabel"}>RGB</div>
            {rgb() && (
              <div class={"value"}>{`${rgb().r}, ${rgb().g}, ${rgb().b}`}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
