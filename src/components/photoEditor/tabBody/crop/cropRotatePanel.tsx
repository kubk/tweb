import { CropFlipIcon, CropRotateIcon } from "./icons";
import "./cropRotatePanel.scss";
import { AnglePicker } from "../../lib/angle-picker/anglePicker";
import { useCanvasManager } from "../../photoEditor";

export const CropRotatePanel = () => {
  const canvasManager = useCanvasManager();
  const freeAngle = canvasManager.freeAngle;

  return (
    <div class={"cropRotatePanel"}>
      <div
        class={"rotateButton"}
        onClick={() => {
          canvasManager.applyCropAction({ type: "rotate90" });
        }}
      >
        <CropRotateIcon />
      </div>

      <AnglePicker rotationAngle={freeAngle} />

      <div
        class={"rotateButton"}
        onClick={() => {
          canvasManager.applyCropAction({ type: "flip" });
        }}
      >
        <CropFlipIcon />
      </div>
    </div>
  );
};
