import {IS_FIREFOX} from '../../../environment/userAgent';

export const canvasToFile = (canvas: HTMLCanvasElement): Promise<File> => {
  // For some reason blob leads to errors in Firefox
  if(IS_FIREFOX) {
    return canvasToFileViaDataUrl(canvas);
  } else {
    return canvasToFileViaBlob(canvas)
  }
}

const canvasToFileViaBlob = (canvas: HTMLCanvasElement): Promise<File> => {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(new File([blob], 'canvas_image.png'))
    })
  })
}

const canvasToFileViaDataUrl = (canvas: HTMLCanvasElement): Promise<File> => {
  return new Promise((resolve, reject) => {
    const dataURL = canvas.toDataURL('image/png');

    fetch(dataURL)
    .then(res => res.blob())
    .then(blob => {
      const file = new File([blob], 'canvas_image.png', {type: 'image/png'});
      resolve(file);
    })
    .catch(error => reject(error));
  })
}
