import {createEffect, Match, onCleanup, Switch} from 'solid-js';
import {CanvasManager} from './canvasManager';
import './photoEditor.scss';
import {EnhanceTabBody} from './tabBody/enhance/enhanceTabBody';
import {PanelHeader} from './panel/panelHeader';
import {PanelTabs} from './panel/panelTabs';
import {DrawTabBody} from './tabBody/draw/drawTabBody';
import {CropTabBody} from './tabBody/crop/cropTabBody';
import {PhotoEditDoneButton} from './lib/photoEditDoneButton';
import {CropRotatePanel} from './tabBody/crop/cropRotatePanel';
import {TextTabBody} from './tabBody/text/textTabBody';
import {StickerTabBody} from './tabBody/sticker/stickerTabBody';
import {useCanvasManager} from './canvasManagerContext';

type Props = {
  onDone: (canvas: HTMLCanvasElement) => void;
  onClose: () => void;
};

export const PhotoEditor = (props: Props) => {
  let canvasRef: HTMLCanvasElement | undefined;
  let canvasContainerRef: HTMLDivElement | undefined;
  const canvasManager = useCanvasManager();

  const [tab] = canvasManager.tab;

  createEffect(() => {
    canvasManager.init(canvasRef, canvasContainerRef);

    onCleanup(() => {
      canvasManager.dispose();
    });
  });

  return (
    <div class="tgPhotoEditor">
      <div ref={canvasContainerRef!} class="canvasWithRotatePanel">
        <div class="canvasWrapper">
          <canvas ref={canvasRef!} id="canvas" />
        </div>
        {tab() === 'crop' && <CropRotatePanel />}
      </div>
      <div class="panel">
        <PanelHeader onClose={props.onClose} />
        <PanelTabs />

        <Switch>
          <Match when={tab() === 'enhance'}>
            <EnhanceTabBody />
          </Match>
          <Match when={tab() === 'crop'}>
            <CropTabBody />
          </Match>
          <Match when={tab() === 'text'}>
            <TextTabBody />
          </Match>
          <Match when={tab() === 'draw'}>
            <DrawTabBody />
          </Match>
          <Match when={tab() === 'sticker'}>
            <StickerTabBody/>
          </Match>
        </Switch>

        <PhotoEditDoneButton
          onClick={() => {
            props.onDone(canvasRef);
          }}
        />
      </div>
    </div>
  );
};
