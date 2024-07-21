import "./photoEditDoneButton.scss";

const Icon = () => {
  return (
    <svg
      width="18"
      height="16"
      viewBox="0 0 18 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M2 9L6.5 14L16 2"
        stroke="white"
        stroke-width="2.66"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  );
};

export const PhotoEditDoneButton = (props: { onClick: () => void }) => {
  return (
    <div class={"photoEditDoneButton"} onClick={props.onClick}>
      <Icon />
    </div>
  );
};
