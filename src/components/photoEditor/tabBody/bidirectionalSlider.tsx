import "./bidirectionalSlider.scss";

export const BidirectionalSlider = (props: {
  value: number;
  min: number;
  max: number;
  name: string;
  onChange: (value: number) => void;
  withHeader?: boolean;
}) => {
  const percentage = () =>
    ((props.value - props.min) / (props.max - props.min)) * 100;
  const isNegative = () => props.value < 0;
  const absValue = () => Math.abs(props.value);
  const withHeader = props.withHeader === undefined ? true : props.withHeader;

  return (
    <div class={"bidirectionalSlider"}>
      <div class="slider-container">
        {withHeader && (
          <div class="slider-header">
            <span class="slider-name">{props.name}</span>
            <span class={`slider-value ${props.value !== 0 ? "active" : ""}`}>
              {isNegative() ? "-" : ""}
              {absValue()}
            </span>
          </div>
        )}
        <div class="slider-track">
          <div
            class="slider-fill"
            style={{
              width: `${Math.abs(percentage() - 50)}%`,
              left: isNegative()
                ? `${50 - Math.abs(percentage() - 50)}%`
                : "50%",
            }}
          />
          <div
            class="slider-thumb"
            style={{
              left: `calc(${percentage()}% - 8px)`,
            }}
          />
          <input
            type="range"
            min={props.min}
            max={props.max}
            value={props.value}
            onInput={(e) => props.onChange(parseInt(e.target.value))}
            class="slider-input"
          />
        </div>
      </div>
    </div>
  );
};
