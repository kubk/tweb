import {CloseIcon, RedoIcon, UndoIcon} from './icons';
import './panelHeader.scss';
import {useCanvasManager} from '../photoEditor';

export const PanelHeader = (props: { onClose: () => void }) => {
  const canvasManager = useCanvasManager();
  const [canUndo] = canvasManager.canUndo;
  const [canRedo] = canvasManager.canRedo;

  return (
    <div class={'panelHeader'}>
      <div class={'closeIcon'}>
        <CloseIcon onClick={props.onClose} />
      </div>
      <span class={'edit'}>Edit</span>
      <div class={'undoRedo'}>
        <div
          onClick={() => {
            canvasManager.undo();
          }}
        >
          <UndoIcon isDisabled={!canUndo()} />
        </div>

        <div
          onClick={() => {
            canvasManager.redo();
          }}
        >
          <RedoIcon isDisabled={!canRedo()} />
        </div>
      </div>
    </div>
  );
};
