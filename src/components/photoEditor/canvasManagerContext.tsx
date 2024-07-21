import {CanvasManager} from './canvasManager';
import {assert} from './lib/assert';
import {createContext, JSXElement, useContext} from 'solid-js';


const CanvasManagerContext = createContext<CanvasManager | null>(null);

export const CanvasManagerProvider = (props: { children: JSXElement; image: HTMLImageElement }) => {
  const canvasManager = new CanvasManager(props.image);

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
