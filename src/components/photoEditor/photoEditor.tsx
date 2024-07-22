import {
  createContext,
  createEffect,
  JSXElement,
  Match,
  onCleanup,
  Switch,
  useContext
} from 'solid-js';
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
import {assert} from './lib/assert';

type Props = {
  onDoneClick: (canvasManager: CanvasManager) => void;
  onClose: () => void;
};

const CanvasManagerContext = createContext<CanvasManager | null>(null);

export const CanvasManagerProvider = (props: { children: JSXElement }) => {
  const canvasManager = new CanvasManager();

  return (
    <CanvasManagerContext.Provider value={canvasManager}>
      {props.children}
    </CanvasManagerContext.Provider>
  );
};

export const useCanvasManager = () => {
  const manager = useContext(CanvasManagerContext);
  assert(manager, 'PhotoEditor must be within CanvasManagerProvider');
  return manager;
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
        </Switch>

        <PhotoEditDoneButton
          onClick={() => {
            props.onDoneClick(canvasManager);
          }}
        />
      </div>
    </div>
  );
};
