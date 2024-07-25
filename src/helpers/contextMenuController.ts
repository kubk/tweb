/*
 * https://github.com/morethanwords/tweb
 * Copyright (C) 2019-2021 Eduard Kuzmenko
 * https://github.com/morethanwords/tweb/blob/master/LICENSE
 */

import {ButtonMenuItemOptions} from '../components/buttonMenu';
import IS_TOUCH_SUPPORTED from '../environment/touchSupport';
import findUpClassName from './dom/findUpClassName';
import mediaSizes from './mediaSizes';
import OverlayClickHandler from './overlayClickHandler';
import overlayCounter from './overlayCounter';
import {nestedMenuClass} from '../components/buttonMenuToggleWithoutHandlers';

class ContextMenuController extends OverlayClickHandler {
  constructor() {
    super('menu', true);

    mediaSizes.addEventListener('resize', () => {
      if(this.element) {
        this.close();
      }

      /* if(openedMenu && (openedMenu.style.top || openedMenu.style.left)) {
        const rect = openedMenu.getBoundingClientRect();
        const {innerWidth, innerHeight} = window;

        console.log(innerWidth, innerHeight, rect);
      } */
    });
  }

  public isOpened() {
    return !!this.element;
  }

  private onMouseMove = (e: MouseEvent) => {
    const element = findUpClassName(e.target, 'btn-menu-item');
    const inner = (element as any)?.inner as ButtonMenuItemOptions['inner'];

    const rect = this.element.getBoundingClientRect();
    const {clientX, clientY} = e;

    const diffX = clientX >= rect.right ? clientX - rect.right : rect.left - clientX;
    const diffY = clientY >= rect.bottom ? clientY - rect.bottom : rect.top - clientY;

    const isTooFarFromMain = diffX >= 100 || diffY >= 100;

    const nestedMenu = findUpClassName(element, nestedMenuClass);
    if(nestedMenu) {
      const nestedRect = nestedMenu.getBoundingClientRect();
      const nestedDiffX = clientX >= nestedRect.right ? clientX - nestedRect.right : nestedRect.left - clientX;
      const nestedDiffY = clientY >= nestedRect.bottom ? clientY - nestedRect.bottom : nestedRect.top - clientY;
      const isTooFarFromNested = nestedDiffX >= 100 || nestedDiffY >= 100;
      if(isTooFarFromNested && isTooFarFromMain) {
        this.close();
      }
      return;
    }

    if(isTooFarFromMain) {
      this.close();
    }
  };

  public close() {
    if(this.element) {
      this.element.classList.remove('active');
      this.element.parentElement.classList.remove('menu-open');

      if(this.element.classList.contains('night')) {
        const element = this.element;
        setTimeout(() => {
          if(element.classList.contains('active')) {
            return;
          }

          element.classList.remove('night');
        }, 400);
      }
    }

    super.close();

    if(!IS_TOUCH_SUPPORTED) {
      window.removeEventListener('mousemove', this.onMouseMove);
    }
  }

  public openBtnMenu(element: HTMLElement, onClose?: () => void) {
    if(overlayCounter.isDarkOverlayActive) {
      element.classList.add('night');
    }

    super.open(element);

    this.element.classList.add('active', 'was-open');
    this.element.parentElement.classList.add('menu-open');

    if(onClose) {
      this.addEventListener('toggle', onClose, {once: true});
    }

    if(!IS_TOUCH_SUPPORTED) {
      window.addEventListener('mousemove', this.onMouseMove);
    }
  }
}

const contextMenuController = new ContextMenuController();
export default contextMenuController;
