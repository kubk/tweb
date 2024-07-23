import {JSXElement} from 'solid-js';
import './cropRow.scss';

export const CropRow = (props: {
  icon: JSXElement;
  title: string;
  onClick: () => void;
  isSelected: boolean;
}) => {
  return (
    <div
      class={'cropRow'}
      classList={{selected: props.isSelected}}
      onClick={props.onClick}
    >
      <span class={'cropIcon'}>{props.icon}</span>
      <span>{props.title}</span>
    </div>
  );
};
