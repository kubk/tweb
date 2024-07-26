import {onMount} from 'solid-js';
import {EmoticonsDropdown} from '../../../emoticonsDropdown';
import StickersTab from '../../../emoticonsDropdown/tabs/stickers';
import rootScope from '../../../../lib/rootScope';
import './stickerTabBody.scss';
import wrapSticker from '../../../wrappers/sticker';
import {getMiddleware} from '../../../../helpers/middleware';
import {scaleImageData} from '../../lib/scaleImageData';
import {useCanvasManager} from '../../canvasManagerContext';
import {waitUntilImageLoaded, waitUntilVideoLoaded} from '../../lib/waitUntilTagLoaded';

export const StickerTabBody = () => {
  let wrapperRef: HTMLDivElement;
  let stickerContainer: HTMLDivElement;
  const canvasManager = useCanvasManager();

  onMount(() => {
    const emoticonsDropdown = new EmoticonsDropdown({
      customParentElement: wrapperRef,
      tabsToRender: [new StickersTab(rootScope.managers)],
      fitToParent: true,
      preventCloseOnOut: true,
      overrideTabId: 0,
      onStickerClick: async(docId) => {
        const doc = await rootScope.managers.appDocsManager.getDoc(docId)
        stickerContainer.style.width = doc.w + 'px'
        stickerContainer.style.height = doc.h + 'px'

        const maxSide = Math.max(canvasManager.canvasWidth, canvasManager.canvasHeight)
        const size = Math.min(300, maxSide);

        const wrapResult = await wrapSticker({
          doc,
          div: stickerContainer,
          group: '',
          width: doc.w,
          height: doc.h,
          play: false,
          middleware: getMiddleware().get(),
          managers: rootScope.managers,
          needFadeIn: false,
          withThumb: false,
          onAnimatedSticker: (stickerCanvas) => {
            setTimeout(() => {
              // Animated stickers get rendered into canvas element instead of HTMLImageElement/HTMLVideoElement
              // So we apply this canvas image to the photo editor
              const data = stickerCanvas.getContext('2d')
              .getImageData(0, 0, stickerCanvas.offsetWidth * window.devicePixelRatio, stickerCanvas.offsetHeight * window.devicePixelRatio);
              const scaled = scaleImageData(data, size);
              canvasManager.addSticker({
                type: 'imageData', data: scaled
              }, size);
            })
          }
        }).then(result => result.render)

        if(!wrapResult || !Array.isArray(wrapResult)) return;

        const resultElement = wrapResult[0];

        if(resultElement instanceof HTMLImageElement) {
          waitUntilImageLoaded(resultElement).then(() => {
            canvasManager.addSticker({
              type: 'tag', data: resultElement
            }, size)
          })
        } else if(resultElement instanceof HTMLVideoElement) {
          waitUntilVideoLoaded(resultElement).then(() => {
            canvasManager.addSticker({
              type: 'tag', data: resultElement
            }, size);

            setTimeout(() => {
              canvasManager.draw();
            }, 500)
          })
        }
      }
    });
    emoticonsDropdown.onButtonClick();
  })

  return <div class="stickersTabBody night"
    ref={wrapperRef!}>
    <div ref={stickerContainer!} class={'hiddenStickerContainer'}/>
  </div>
}
