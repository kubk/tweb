import img from "./img/colorSwitcher.png";
import "./colorSwitcher.scss";

export const ColorSwitcherIcon = (props: {
  isSelected: boolean;
  onClick: () => void;
}) => {
  return (
    <div
      class={"colorSwitcher"}
      onClick={props.onClick}
      classList={{
        isSelected: props.isSelected,
      }}
    >
      <img src={img} alt={"switcher"} />
    </div>
  );
};
