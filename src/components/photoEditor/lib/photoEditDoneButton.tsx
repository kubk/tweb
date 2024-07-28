import './photoEditDoneButton.scss';
import {useCanvasManager} from '../canvasManagerContext';
import {putPreloader} from '../../putPreloader';
import {createEffect, on, Show} from 'solid-js'

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
  const canvasManager = useCanvasManager();
  const [isImageImporting] = canvasManager.isImageImporting;
  let doneButtonRef: HTMLDivElement;

  createEffect(on(isImageImporting, (isImageImporting) => {
    if(isImageImporting) {
      putPreloader(doneButtonRef);
    }
  }))

  return (
    <div class={'photoEditDoneButton'} ref={doneButtonRef!} onClick={props.onClick}>
      <Show when={!isImageImporting()} >
        <Icon />
      </Show>
    </div>
  );
};
