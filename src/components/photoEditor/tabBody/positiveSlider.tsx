import './positiveSlider.scss';

export const PositiveSlider = (props: {
  value: number;
  min: number;
  max: number;
  name: string;
  color: string;
  isEffect?: boolean;
  isActiveValue?: boolean;
  onChange: (value: number) => void;
}) => {
  const percentage = () =>
    ((props.value - props.min) / (props.max - props.min)) * 100;

  return (
    <div class={'positiveSlider'}>
      <div
        class="slider-container"
        style={{
          '--color': props.color
        }}
      >
        <div class="slider-header">
          <span class="slider-name" classList={{isEffect: props.isEffect}}>
            {props.name}
          </span>
          <span
            class={'slider-value'}
            classList={{
              active: props.isActiveValue && props.value !== 0,
              isEffect: props.isEffect
            }}
          >
            {props.value}
          </span>
        </div>
        <div class="slider-track">
          <div
            class="slider-fill"
            style={{
              width: `${percentage()}%`
            }}
          />
          <div
            class="slider-thumb"
            style={{
              left: `calc(${percentage()}% - 10px)`
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
