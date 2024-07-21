import { CloseIcon, RedoIcon, UndoIcon } from "./icons";
import "./panelHeader.scss";
import { useCanvasManager } from "../photoEditor";

export const PanelHeader = () => {
  const canvasManager = useCanvasManager();
  const [canUndo] = canvasManager.canUndo;
  const [canRedo] = canvasManager.canRedo;

  return (
    <div class={"panel-header"}>
      <CloseIcon />
      <span class={"edit"}>Edit</span>
      <div class={"undo-redo"}>
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
