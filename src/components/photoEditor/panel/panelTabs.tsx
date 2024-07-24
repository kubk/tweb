import {TabIcon} from '../tabIcons/tabIcon';
import {CropIcon, DrawIcon, EnhanceIcon, TextIcon, StickersTabIcon} from '../tabIcons/icons';
import './panelTabs.scss';
import {useCanvasManager} from '../canvasManagerContext';

export const PanelTabs = () => {
  const canvasManager = useCanvasManager();
  const [tab] = canvasManager.tab;

  return (
    <div class="tab-buttons">

      <TabIcon
        onClick={() => {
          canvasManager.switchTab('enhance');
        }}
        isActive={tab() === 'enhance'}
      >
        <EnhanceIcon />
      </TabIcon>
      <TabIcon
        onClick={() => {
          canvasManager.switchTab('crop');
        }}
        isActive={tab() === 'crop'}
      >
        <CropIcon />
      </TabIcon>

      <TabIcon
        onClick={() => {
          canvasManager.switchTab('text');
        }}
        isActive={tab() === 'text'}
      >
        <TextIcon />
      </TabIcon>

      <TabIcon
        onClick={() => {
          canvasManager.switchTab('draw');
        }}
        isActive={tab() === 'draw'}
      >
        <DrawIcon />
      </TabIcon>

      <TabIcon isActive={tab() === 'sticker'} onClick={() => {
        canvasManager.switchTab('sticker');
      }}>
        <StickersTabIcon/>
      </TabIcon>
    </div>
  );
};
