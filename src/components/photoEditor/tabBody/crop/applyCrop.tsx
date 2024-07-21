import "./applyCrop.scss";

export const ApplyCrop = (props: { title: string; onClick: () => void }) => {
  return (
    <div class={"applyCrop"} onClick={props.onClick}>
      <span>{props.title}</span>
    </div>
  );
};
