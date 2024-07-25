import ListenerSetter from '../helpers/listenerSetter';
import ButtonIcon from './buttonIcon';
import ButtonMenu, {ButtonMenuItemOptionsVerifiable} from './buttonMenu';
import filterAsync from '../helpers/array/filterAsync';

export const nestedMenuClass = 'btn-menu-nested';

export default async function ButtonMenuToggleNested({
  buttonOptions,
  buttons,
  onOpen,
  icon = 'more'
}: {
  buttonOptions?: Parameters<typeof ButtonIcon>[1],
  direction: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right',
  buttons: ButtonMenuItemOptionsVerifiable[],
  onOpen?: (element: HTMLElement) => any,
  icon?: string
}) {
  if(buttonOptions) {
    buttonOptions.asDiv = true;
  }
  const listenerSetter = new ListenerSetter();

  const f = (b: (typeof buttons[0])[]) => filterAsync(b, (button) => button?.verify ? button.verify() ?? false : true);

  const filteredButtons = await f(buttons);

  const el = await ButtonMenu({
    buttons: filteredButtons,
    listenerSetter
  })
  onOpen(el)
  el.classList.add(nestedMenuClass, 'bottom-right', 'active', 'was-open')

  return el;
}
