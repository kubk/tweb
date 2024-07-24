import {onMount} from 'solid-js';
import {EmoticonsDropdown} from '../../../emoticonsDropdown';
import StickersTab from '../../../emoticonsDropdown/tabs/stickers';
import rootScope from '../../../../lib/rootScope';
import './stickerTabBody.scss';
import wrapSticker from '../../../wrappers/sticker';
import {getMiddleware} from '../../../../helpers/middleware';
import {scaleImageData} from '../../lib/scaleImageData';
import {useCanvasManager} from '../../canvasManagerContext';


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

        await wrapSticker({
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
          onLoad: (el) => {
            setTimeout(() => {
              const data = el.getContext('2d').getImageData(0, 0, el.offsetWidth*window.devicePixelRatio, el.offsetHeight*window.devicePixelRatio);
              const size = 300;
              const scaled = scaleImageData(data, size);
              canvasManager.addSticker(scaled, size);
            })
          }
        });
      }
    });
    emoticonsDropdown.onButtonClick();
  })

  return <div class="stickersTabBody night"
    ref={wrapperRef!}>
    <div ref={stickerContainer!} class={'hiddenStickerContainer'}/>
  </div>
}
