import {JSXElement} from 'solid-js';
import './cropTabBody.scss';
import {
  CropFreeIcon,
  CropIcon169,
  CropIcon23,
  CropIcon32,
  CropIcon34,
  CropIcon43,
  CropIcon45,
  CropIcon54,
  CropIcon57,
  CropIcon75,
  CropIcon916,
  CropOriginalIcon,
  CropSquareIcon
} from './icons';
import {AspectRatio} from '../../drawable/cropAreaDrawable';
import {CropRow} from './cropRow';
import {ApplyCrop} from './applyCrop';
import {useCanvasManager} from '../../photoEditor';

export const CropTabBody = () => {
  const canvasManager = useCanvasManager();

  const fullScreenCrop: Array<{
    title: string;
    icon: JSXElement;
    type: AspectRatio;
  }> = [
    {title: 'Free', icon: <CropFreeIcon />, type: 'free'},
    {title: 'Original', icon: <CropOriginalIcon />, type: 'original'},
    {title: 'Square', icon: <CropSquareIcon />, type: 1}
  ];

  const digitIcons: Array<
    Array<{ title: string; icon: JSXElement; type: AspectRatio }>
  > = [
    [
      {title: '3:2', icon: <CropIcon32 />, type: 3 / 2},
      {title: '4:3', icon: <CropIcon43 />, type: 4 / 3},
      {title: '5:4', icon: <CropIcon54 />, type: 5 / 4},
      {title: '7:5', icon: <CropIcon75 />, type: 7 / 5},
      {title: '16:9', icon: <CropIcon169 />, type: 16 / 9}
    ],
    [
      {title: '2:3', icon: <CropIcon23 />, type: 2 / 3},
      {title: '3:4', icon: <CropIcon34 />, type: 3 / 4},
      {title: '4:5', icon: <CropIcon45 />, type: 4 / 5},
      {title: '5:7', icon: <CropIcon57 />, type: 5 / 7},
      {title: '9:16', icon: <CropIcon916 />, type: 9 / 16}
    ]
  ];

  return (
    <div class={'cropTab'}>
      <div class={'cropTabTitle'}>Aspect ratio</div>
      {fullScreenCrop.map((crop) => (
        <CropRow
          isSelected={canvasManager.cropAspectRatio[0]() === crop.type}
          icon={crop.icon}
          title={crop.title}
          onClick={() => {
            canvasManager.onChangeAspectRatio(crop.type);
          }}
        />
      ))}
      <div class={'twoColumn'}>
        {digitIcons[0].map((_, index) => {
          const [cropAspectRatio] = canvasManager.cropAspectRatio;
          const leftIcon = digitIcons[0];
          const rightIcon = digitIcons[1];

          return (
            <div class="doubleCropRow">
              <CropRow
                isSelected={cropAspectRatio() === leftIcon[index].type}
                title={leftIcon[index].title}
                icon={leftIcon[index].icon}
                onClick={() => {
                  canvasManager.onChangeAspectRatio(leftIcon[index].type);
                }}
              />
              <CropRow
                isSelected={cropAspectRatio() === rightIcon[index].type}
                title={rightIcon[index].title}
                icon={rightIcon[index].icon}
                onClick={() => {
                  canvasManager.onChangeAspectRatio(rightIcon[index].type);
                }}
              />
            </div>
          );
        })}
      </div>
      {canvasManager.isApplyCropVisible() && (
        <ApplyCrop
          title={'Apply Crop'}
          onClick={() => {
            canvasManager.applyCrop();
          }}
        />
      )}
    </div>
  );
};
