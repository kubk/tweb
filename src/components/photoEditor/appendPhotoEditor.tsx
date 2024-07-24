import {render} from 'solid-js/web';
import {PhotoEditor} from './photoEditor';
import {CanvasManagerProvider} from './canvasManagerContext';

type Props = {
  image: HTMLImageElement;
  onDone: (file: File, onClose: () => void) => void
};

export const appendPhotoEditor = (props: Props) => {
  const photoEditor = document.createElement('div');
  photoEditor.style.position = 'fixed';
  photoEditor.style.inset = '0';
  photoEditor.style.zIndex = '10';

  document.body.append(photoEditor);
  const onClose = () => {
    photoEditor.remove();
  };

  render(
    () => <CanvasManagerProvider image={props.image}>
      <PhotoEditor onDone={(canvas) => {
        canvas.toBlob((blob) => {
          const file = new File([blob], 'canvas_image.png');
          props.onDone(file, onClose);
        })
      }} onClose={onClose}/>
    </CanvasManagerProvider>,
    photoEditor
  );
}
