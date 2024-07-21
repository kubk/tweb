import { For } from "solid-js";
import { effectList, SliderType } from "../../effects/effects";
import { debounce } from "../../lib/debounce";
import "./enhanceTabBody.scss";
import { BidirectionalSlider } from "../bidirectionalSlider";
import { PositiveSlider } from "../positiveSlider";
import { useCanvasManager } from "../../photoEditor";

export const EnhanceTabBody = () => {
  const canvasManager = useCanvasManager();

  const debouncedApplyEffects = debounce(() => {
    canvasManager.applyEffects();
  }, 100);

  return (
    <div class={"enhance-panel"}>
      <For each={effectList}>
        {([key, info]) => {
          if (info.sliderType === SliderType.Bidirectional) {
            return (
              <BidirectionalSlider
                name={info.title}
                max={100}
                min={-100}
                value={canvasManager.effectsUi[key]}
                onChange={(value) => {
                  canvasManager.setUiEffectValue(key, value);
                  debouncedApplyEffects();
                }}
              />
            );
          } else {
            return (
              <PositiveSlider
                name={info.title}
                isEffect
                isActiveValue
                max={100}
                min={0}
                value={canvasManager.effectsUi[key]}
                onChange={(value) => {
                  canvasManager.setUiEffectValue(key, value);
                  debouncedApplyEffects();
                }}
                color={"rgba(78, 142, 229, 1)"}
              />
            );
          }
        }}
      </For>
    </div>
  );
};
