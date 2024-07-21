import {batch, createSignal, For, onCleanup, onMount, Signal} from 'solid-js';
import './anglePicker.scss';
import {clamp} from '../clamp';
import {useCanvasManager} from '../../canvasManagerContext';

export type AngleDot = {
  angle: number;
  isMajor: boolean;
  isCurrent: boolean;
  isCurrentSelected: boolean;
  opacity: number;
};

const CurrentAngleIcon = () => {
  return (
    <svg
      width="6"
      height="4"
      viewBox="0 0 6 4"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M2.29289 0.707106L0.28033 2.71967C-0.192143 3.19214 0.142482 4 0.81066 4H5.18934C5.85752 4 6.19214 3.19214 5.71967 2.71967L3.70711 0.707107C3.31658 0.316583 2.68342 0.316582 2.29289 0.707106Z"
        fill="white"
      />
    </svg>
  );
};

const majorStep = 15;
const width = 45;

export const AnglePicker = (props: { rotationAngle: Signal<number> }) => {
  const canvasManager = useCanvasManager();
  let controlRef: HTMLDivElement | undefined;
  const [rotationAngle, setRotationAngle] = props.rotationAngle;
  const [angleDots, setAngleDots] = createSignal<AngleDot[]>([]);
  const [initialTouchX, setInitialTouchX] = createSignal<number | null>(null);
  const [initialAngle, setInitialAngle] = createSignal<number | null>(null);

  onMount(() => {
    const onMouseMove = (event: MouseEvent) => {
      const controlRect = controlRef!.getBoundingClientRect();
      const touchX = clamp(
        event.pageX - controlRect.left,
        0,
        controlRect.width
      );
      const initTouch = initialTouchX();
      if(initTouch === null) {
        return;
      }
      const deltaX = touchX - initTouch;
      const angleDelta = Math.floor(180 * (deltaX / controlRect.width));

      const initAngle = initialAngle();
      if(initAngle === null) {
        return;
      }
      const newAngle = initAngle - angleDelta;
      batch(() => {
        setRotationAngle(newAngle);
        updateAngleDots();
      });
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      controlRef!.addEventListener('mousedown', onMouseDown, {once: true});
    };

    const onMouseDown = (event: MouseEvent) => {
      const controlRect = controlRef!.getBoundingClientRect();
      const touchX = clamp(
        event.pageX - controlRect.left,
        0,
        controlRect.width
      );
      batch(() => {
        setInitialTouchX(touchX);
        setInitialAngle(rotationAngle());
      });

      onMouseMove(event);

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp, {once: true});
    };

    controlRef!.addEventListener('mousedown', onMouseDown, {once: true});

    updateAngleDots();

    canvasManager.onResetRotationAngle = () => {
      batch(() => {
        setRotationAngle(0);
        setInitialTouchX(null);
        setInitialAngle(null);
        updateAngleDots();
      });
    };

    onCleanup(() => {
      controlRef!.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    });
  });

  const createAngleDots = (angle: number): AngleDot[] => {
    const result: AngleDot[] = [];
    angle /= 2;
    let index = angle - width;

    while(index <= angle + width) {
      let currentAngle = angle + index;
      if(Math.abs(currentAngle) >= 360) {
        currentAngle = -(currentAngle % 360);
      }
      const distance = Math.abs(index - angle);
      const opacity = 1.2 - distance / width;
      const angleDot = {
        angle: currentAngle,
        opacity: opacity,
        isCurrentSelected: distance / width === 0,
        isCurrent: index === angle,
        isMajor: !(currentAngle % majorStep)
      };
      result.push(angleDot);
      index++;
    }

    return result;
  };

  const updateAngleDots = () => {
    const dots = createAngleDots(rotationAngle());
    setAngleDots(dots);
  };

  return (
    <div class="anglePicker">
      <div class="angleList" ref={controlRef!}>
        <div class="currentAngleIcon">
          <CurrentAngleIcon />
        </div>
        <For each={angleDots()}>
          {(step) => {
            return (
              <div class="angleStep">
                <div
                  class="label"
                  classList={{
                    currentSelected: step.isCurrentSelected
                  }}
                  style={{opacity: step.opacity}}
                >
                  {step.isMajor && (
                    <>
                      <span>{step.angle}</span>
                      <span class="angleSign" />
                    </>
                  )}
                </div>
                <div
                  classList={{
                    isMajor: step.isMajor,
                    isCurrent: step.isCurrent
                  }}
                  class="circle"
                />
              </div>
            );
          }}
        </For>
      </div>
    </div>
  );
};
