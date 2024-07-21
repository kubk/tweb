import "./predefinedColor.scss";
import { RGB } from "../../lib/colorUtils";

const rgbToString = (color: RGB) => {
  return `${color.r}, ${color.g}, ${color.b}`;
};

export const PredefinedColor = (props: {
  isSelected: () => boolean;
  color: RGB;
  onClick: () => void;
}) => {
  return (
    <div
      class={`predefinedColor`}
      style={{ "--color": rgbToString(props.color) }}
      classList={{ active: props.isSelected() }}
      onClick={props.onClick}
    />
  );
};
