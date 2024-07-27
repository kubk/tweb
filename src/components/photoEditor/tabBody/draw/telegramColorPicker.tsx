import {onMount} from 'solid-js';
import {PhotoEditorColorPicker} from './photoEditorColorPicker';
import {ColorPickerColor} from '../../../colorPicker';

type Props = {
  onColorSwitcherClick: () => void,
  onChange: (color: ColorPickerColor) => void;
  defaultColorRgb: string;
};

export const TelegramColorPicker = (props: Props) => {
  let pickerRef: HTMLDivElement;

  onMount(() => {
    if(!pickerRef) return;
    const tgColorPicker = new PhotoEditorColorPicker({onColorSwitcherClick: props.onColorSwitcherClick});
    tgColorPicker.onChange = props.onChange;
    pickerRef.append(tgColorPicker.container)
    tgColorPicker.setColor(props.defaultColorRgb, true, true)
  })

  return <div class={'night photoEditorColorPicker'} ref={pickerRef!}/>
}
