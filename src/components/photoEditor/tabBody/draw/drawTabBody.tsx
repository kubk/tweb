import { Tool } from "../../canvasManager";
import "./drawTabBody.scss";
import { For, JSXElement } from "solid-js";
import {
  PenArrowIcon,
  PenBlurIcon,
  PenBrushIcon,
  PenEraserIcon,
  PenIcon,
  PenNeonIcon,
} from "./icons";
import { ColorSizePicker } from "./colorSizePicker";
import { useCanvasManager } from "../../photoEditor";

export const DrawTabBody = () => {
  const canvasManager = useCanvasManager();
  const pens: Array<{ tool: Tool; icon: JSXElement; title: string }> = [
    {
      tool: "pen",
      icon: <PenIcon color={canvasManager.penColor[0]()} />,
      title: "Pen",
    },
    {
      tool: "arrow",
      icon: <PenArrowIcon color={canvasManager.arrowColor[0]()} />,
      title: "Arrow",
    },
    {
      tool: "brush",
      icon: <PenBrushIcon color={canvasManager.brushColor[0]()} />,
      title: "Brush",
    },
    {
      tool: "neon",
      icon: <PenNeonIcon color={canvasManager.neonColor[0]()} />,
      title: "Neon",
    },
    { tool: "blur", icon: <PenBlurIcon />, title: "Blur" },
    { tool: "eraser", icon: <PenEraserIcon />, title: "Eraser" },
  ];

  return (
    <div class={"drawTabBody"}>
      <ColorSizePicker
        size={canvasManager.drawSize}
        currentColor={() => canvasManager.currentDrawColor()}
        onChangeColor={(color) => {
          canvasManager.setDrawColor(color);
        }}
        currentColorSignal={canvasManager.currentDrawColorSignal()}
      />

      <div class="penListWrapper">
        <div class="title">Tool</div>
        <div class={"penList"}>
          <For each={pens}>
            {(pen) => {
              const [tool] = canvasManager.tool;
              return (
                <div
                  class="pen"
                  classList={{
                    selected: tool() === pen.tool,
                  }}
                  onClick={() => {
                    canvasManager.setTool(pen.tool);
                  }}
                >
                  <div
                    class={"penShadow"}
                    classList={{
                      selected: tool() === pen.tool,
                    }}
                  />
                  <div class={"penIcon"}>{pen.icon}</div>
                  {pen.title}
                </div>
              );
            }}
          </For>
        </div>
      </div>
    </div>
  );
};
