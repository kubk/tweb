import {render} from 'solid-js/web';
import {CanvasManagerProvider, PhotoEditor} from './photoEditor';

export const appendPhotoEditor = () => {
  const photoEditor = document.createElement('div');
  photoEditor.style.position = 'fixed';
  photoEditor.style.inset = '0';
  photoEditor.style.zIndex = '10';

  document.body.append(photoEditor);

  render(
    () => (
      <CanvasManagerProvider>
        <PhotoEditor onDoneClick={() => {}} onClose={() => {
          // remove the photoEditor div
          photoEditor.remove();
        }} />
      </CanvasManagerProvider>
    ),
    photoEditor
  );
}
