import {JSXElement} from 'solid-js';
import './cropRow.scss';
import RowTsx from '../../../rowTsx';

export const CropRow = (props: {
  icon: JSXElement;
  title: string;
  onClick: () => void;
  isSelected: boolean;
}) => {
  return (
    <div class={'cropRowWrapper'}>
      <RowTsx
        fullWidth={true}
        isSelected={props.isSelected}
        title={
          <div class={'cropRowTitle'}>
            <span class={'cropIcon'}>{props.icon}</span>
            <span>{props.title}</span>
          </div>
        }
        clickable={() => {
          props.onClick()
        }} />
    </div>
  );
};
