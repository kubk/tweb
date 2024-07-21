import './tabIcon.scss';
import {JSXElement} from 'solid-js';
import RowTsx from '../../rowTsx';

export const TabIcon = (props: {
  isActive: boolean;
  children: JSXElement;
  onClick: () => void;
}) => {
  return (
    <div
      class="editor-tab-icon"
      classList={{active: props.isActive}}
    >
      <RowTsx
        title={<div class={'tabIconWrapper'} classList={{active: props.isActive}}>
          {props.children}
        </div>}
        clickable={props.onClick}
      />

      {props.isActive && (
        <svg
          width="24"
          height="3"
          viewBox="0 0 24 3"
          fill="none"
          class={'active-border'}
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M0 3C0 2.06812 0 1.60218 0.152241 1.23463C0.355229 0.744577 0.744577 0.355229 1.23463 0.152241C1.60218 0 2.06812 0 3 0H21C21.9319 0 22.3978 0 22.7654 0.152241C23.2554 0.355229 23.6448 0.744577 23.8478 1.23463C24 1.60218 24 2.06812 24 3H0Z"
            fill="currentColor"
          />
        </svg>
      )}
    </div>
  );
};
