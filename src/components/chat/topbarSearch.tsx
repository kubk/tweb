/*
 * https://github.com/morethanwords/tweb
 * Copyright (C) 2019-2021 Eduard Kuzmenko
 * https://github.com/morethanwords/tweb/blob/master/LICENSE
 */

import {createEffect, createSignal, onCleanup, JSX, createMemo, onMount, splitProps, on, untrack, batch} from 'solid-js';
import InputSearch from '../inputSearch';
import {ButtonIconTsx, createListTransition, createMiddleware} from '../stories/viewer';
import classNames from '../../helpers/string/classNames';
import PopupElement from '../popups';
import PopupDatePicker from '../popups/datePicker';
import rootScope from '../../lib/rootScope';
import apiManagerProxy from '../../lib/mtproto/mtprotoworker';
import appDialogsManager from '../../lib/appManagers/appDialogsManager';
import {ChannelsChannelParticipants, Message} from '../../layer';
import getPeerId from '../../lib/appManagers/utils/peers/getPeerId';
import Scrollable from '../scrollable';
import {resolveElements} from '@solid-primitives/refs';
import liteMode from '../../helpers/liteMode';
import placeCaretAtEnd from '../../helpers/dom/placeCaretAtEnd';
import {createLoadableList} from '../sidebarRight/tabs/statistics';
import {Middleware} from '../../helpers/middleware';
import {NULL_PEER_ID} from '../../lib/mtproto/mtproto_config';
import whichChild from '../../helpers/dom/whichChild';
import appImManager from '../../lib/appManagers/appImManager';
import attachListNavigation from '../../helpers/dom/attachListNavigation';
import blurActiveElement from '../../helpers/dom/blurActiveElement';
import I18n, {i18n} from '../../lib/langPack';
import wrapEmojiText from '../../lib/richTextProcessor/wrapEmojiText';
import stringMiddleOverflow from '../../helpers/string/stringMiddleOverflow';
import appNavigationController, {NavigationItem} from '../appNavigationController';
import getTextWidth from '../../helpers/canvas/getTextWidth';
import {FontFull} from '../../config/font';
import Row from '../row';
import wrapPeerTitle from '../wrappers/peerTitle';
import getParticipantPeerId from '../../lib/appManagers/utils/chats/getParticipantPeerId';
import {avatarNew} from '../avatarNew';
import getPeerActiveUsernames from '../../lib/appManagers/utils/peers/getPeerActiveUsernames';
import cancelEvent from '../../helpers/dom/cancelEvent';
import {attachClickEvent} from '../../helpers/dom/clickEvent';
import AppSelectPeers from '../appSelectPeers';

export const ScrollableYTsx = (props: {
  children: JSX.Element,
  onScrolledBottom?: () => void,
  onScrolledTop?: () => void,
} & JSX.HTMLAttributes<HTMLDivElement>) => {
  const [, rest] = splitProps(props, ['onScrolledBottom', 'onScrolledTop']);
  let container: HTMLDivElement;
  const ret = (
    <div ref={container} {...rest}>
      {props.children}
    </div>
  );

  const scrollable = new Scrollable(undefined, undefined, undefined, undefined, container);
  scrollable.onScrolledBottom = props.onScrolledBottom;
  scrollable.onScrolledTop = props.onScrolledTop;

  onCleanup(() => {
    scrollable.destroy();
  });

  return ret;
};

export function AnimationList(props: {
  children: JSX.Element
  animationOptions: KeyframeAnimationOptions,
  keyframes: Keyframe[],
  animateOnlyReplacement?: boolean
}) {
  const transitionList = createListTransition(resolveElements(() => props.children).toArray, {
    exitMethod: 'keep-index',
    onChange: ({added, removed, finishRemoved}) => {
      const options = props.animationOptions;
      if(!liteMode.isAvailable('animations')) {
        options.duration = 0;
      }

      const keyframes = props.keyframes;
      queueMicrotask(() => {
        if(!props.animateOnlyReplacement || removed.length) {
          for(const element of added) {
            element.animate(keyframes, options);
          }
        }

        if(props.animateOnlyReplacement && !added.length) {
          finishRemoved(removed);
          return;
        }

        const reversedKeyframes = keyframes.slice().reverse();
        const promises: Promise<any>[] = [];
        for(const element of removed) {
          const animation = element.animate(reversedKeyframes, options);
          promises.push(animation.finished);
        }

        Promise.all(promises).then(() => finishRemoved(removed));
      });
    }
  }) as unknown as JSX.Element;

  return transitionList;
}

type LoadOptions = {middleware: Middleware, peerId: PeerId, threadId: number, query: string, fromPeerId?: PeerId};

const renderHistoryResult = ({middleware, peerId, fromSavedDialog, messages, query, fromPeerId}: LoadOptions & {fromSavedDialog: boolean, messages: (Message.message | Message.messageService)[]}) => {
  const promises = messages.map(async(message) => {
    const loadPromises: Promise<any>[] = [];
    const {dom} = appDialogsManager.addDialogAndSetLastMessage({
      peerId: fromSavedDialog ? rootScope.myId : (fromPeerId || peerId),
      container: false,
      avatarSize: 'abitbigger',
      meAsSaved: false,
      message,
      query,
      // noIcons: this.noIcons,
      wrapOptions: {
        middleware
      },
      loadPromises,
      threadId: fromSavedDialog ? ((message as Message.message).saved_peer_id ? getPeerId((message as Message.message).saved_peer_id) : rootScope.myId) : undefined,
      autonomous: true
    });

    await Promise.all(loadPromises);
    return dom.containerEl;
  });

  return Promise.all(promises);
};

const createSearchLoader = (options: LoadOptions) => {
  const {middleware, peerId, threadId, query, fromPeerId} = options;
  const fromSavedDialog = !!(peerId === rootScope.myId && threadId);
  let lastMessage: Message.message | Message.messageService, loading = false;
  const loadMore = async() => {
    if(loading) {
      return;
    }
    loading = true;

    const offsetId = lastMessage?.mid || 0;
    const offsetPeerId = lastMessage?.peerId || NULL_PEER_ID;
    const result = await rootScope.managers.appMessagesManager.getHistory({
      peerId,
      threadId,
      query,
      inputFilter: {_: 'inputMessagesFilterEmpty'},
      offsetId,
      offsetPeerId,
      limit: 30,
      fromPeerId
    });
    if(!middleware()) {
      return;
    }

    const messages = result.history.map((mid) => apiManagerProxy.getMessageByPeer(peerId, mid));
    const rendered = await renderHistoryResult({...options, fromSavedDialog, messages});
    if(!middleware()) {
      return;
    }

    setF((value) => {
      value.count = result.count;
      value.values.push(...messages);
      lastMessage = messages[messages.length - 1];
      if(result.isEnd.top) {
        value.loadMore = undefined;
      }

      value.rendered.push(...rendered);
      return value;
    });
    loading = false;
  };

  const [f, setF] = createLoadableList<Message.message | Message.messageService>({loadMore});
  return f;
};

const createParticipantsLoader = (options: LoadOptions) => {
  const {middleware, peerId, query} = options;
  let loading = false, offset = 0;
  const loadMore = async() => {
    if(loading) {
      return;
    }
    loading = true;

    const result = await rootScope.managers.appProfileManager.getParticipants({
      id: peerId.toChatId(),
      filter: {_: 'channelParticipantsSearch', q: query},
      limit: 30,
      offset,
      forMessagesSearch: true
    });
    if(!middleware()) {
      return;
    }

    const peerIds = result.participants.map(getParticipantPeerId);
    const promises = peerIds.map(async(peerId) => {
      const title = await wrapPeerTitle({peerId});
      const peer = apiManagerProxy.getPeer(peerId);
      const username = getPeerActiveUsernames(peer)[0];
      const row = new Row({
        title: (
          <span>
            <b>{title}</b> {username && <span class="secondary">{`@${username}`}</span>}
          </span>
        ) as HTMLElement,
        clickable: true
      });

      row.container.classList.add('topbar-search-left-sender');

      const size = 40;
      const avatar = avatarNew({peerId, size, middleware});
      row.createMedia(`${size}`).append(avatar.node);
      await avatar.readyThumbPromise;

      return row.container;
    });

    const rendered = await Promise.all(promises);
    if(!middleware()) {
      return;
    }

    setF((value) => {
      value.count = (result as ChannelsChannelParticipants.channelsChannelParticipants).count ?? peerIds.length;
      const newLength = value.values.push(...peerIds);
      offset = newLength;
      if(newLength >= value.count) {
        value.loadMore = undefined;
      }

      value.rendered.push(...rendered);
      return value;
    });
    loading = false;
  };

  const [f, setF] = createLoadableList<PeerId>({loadMore});
  return f;
};

export default function TopbarSearch(props: {
  peerId: PeerId,
  threadId?: number,
  canFilterSender?: boolean,
  query?: string,
  onClose?: () => void,
  onDatePick?: (timestamp: number) => void
}) {
  const query = props.query || 'pizza';

  const [isInputFocused, setIsInputFocused] = createSignal(false);
  const [value, setValue] = createSignal(query);
  const [count, setCount] = createSignal<number>();
  const [list, setList] = createSignal<{element: HTMLElement, type: 'messages' | 'senders'}>();
  const [messages, setMessages] = createSignal<(Message.message | Message.messageService)[]>();
  const [sendersPeerIds, setSendersPeerIds] = createSignal<PeerId[]>();
  const [loadMore, setLoadMore] = createSignal<() => Promise<void>>();
  const [target, setTarget] = createSignal<HTMLElement>(undefined, {equals: false});
  const [filteringSender, setFilteringSender] = createSignal<boolean>(false);
  const [filterPeerId, setFilterPeerId] = createSignal<PeerId>();
  const [senderInputEntity, setSenderInputEntity] = createSignal<HTMLElement>();
  const isActive = createMemo(() => /* true ||  */isInputFocused());
  const shouldHaveListNavigation = createMemo(() => (isInputFocused() && count() && list()) || undefined);

  onMount(() => {
    placeCaretAtEnd(inputSearch.input);
  });

  createEffect<() => void>((_detach) => {
    _detach?.();
    const {element} = shouldHaveListNavigation() || {};
    if(!element) {
      return;
    }

    const {detach} = attachListNavigation({
      list: element.firstElementChild as HTMLElement,
      type: 'y',
      onSelect: (target) => {
        const shouldBlur = !!(!filteringSender() || filterPeerId());
        setTarget(target as HTMLElement);
        if(shouldBlur) {
          blurActiveElement();
        }
      },
      activeClassName: 'menu-open',
      cancelMouseDown: true
    });

    return detach;
  });

  const navigationItem: NavigationItem = {
    type: 'topbar-search',
    onPop: () => {
      if(isActive()) {
        blurActiveElement();
        return false;
      }

      props.onClose?.();
    }
  };
  appNavigationController.pushItem(navigationItem);
  onCleanup(() => {
    appNavigationController.removeItem(navigationItem);
  });

  const inputSearch = new InputSearch({
    placeholder: 'Search',
    onChange: (value) => {
      setValue(value);
    },
    onClear: (e) => {
      if(filterPeerId()) {
        cancelEvent(e);
        setFilterPeerId(undefined);
        return;
      }

      if(filteringSender()) {
        cancelEvent(e);
        setFilteringSender(false);
        return;
      }

      props.onClose?.();
    },
    onFocusChange: setIsInputFocused,
    alwaysShowClear: true,
    noBorder: true
  });
  inputSearch.container.classList.add('topbar-search-input-container');
  inputSearch.input.classList.add('topbar-search-input');
  onCleanup(() => {
    inputSearch.remove();
  });
  inputSearch.value = query;

  const fromText = I18n.format('Search.From', true);
  const fromWidth = getTextWidth(fromText, FontFull);
  const fromSpan = (<span class={classNames('topbar-search-input-from', filteringSender() && 'is-visible')}>{fromText}</span>);
  inputSearch.container.append(fromSpan as HTMLElement);
  createEffect<HTMLElement>((_element) => {
    const filtering = filteringSender();
    if(_element) {
      _element.classList.remove('scale-in');
      void _element.offsetWidth;
      _element.classList.add('scale-out');
      setTimeout(() => {
        _element.remove();
      }, 200);
    }

    const element = senderInputEntity();
    if(element) {
      element.classList.add('topbar-search-input-entity', 'scale-in');
      const detach = attachClickEvent(element, (e) => {
        cancelEvent(e);
        setFilterPeerId();
      }, {cancelMouseDown: true});
      onCleanup(detach);
      inputSearch.container.append(element);
    }

    inputSearch.container.style.setProperty('--padding-placeholder', (filtering ? fromWidth : 0) + 'px');
    inputSearch.container.style.setProperty('--padding-sender', (element ? element.offsetWidth + 6 : 0) + 'px');
    inputSearch.setPlaceholder(filtering && !element ? 'Search.Member' : 'Search');
    return element;
  });

  createEffect(async() => {
    const peerId = filterPeerId();
    const middleware = createMiddleware().get();
    let element: HTMLElement;
    if(peerId) {
      const entity = untrack(() => AppSelectPeers.renderEntity({
        key: peerId,
        middleware,
        avatarSize: 30,
        meAsSaved: false
      }));
      element = entity.element;
      await Promise.all(entity.promises);
      if(!middleware()) {
        return;
      }
    }

    setSenderInputEntity(element);
  });

  const inputSearchTools = document.createElement('div');
  inputSearchTools.classList.add('topbar-search-input-tools');
  inputSearch.clearBtn.replaceWith(inputSearchTools);

  const arrowButton = (direction: 'up' | 'down') => {
    return (
      <ButtonIconTsx
        icon={direction}
        class={classNames(
          'input-search-part',
          'topbar-search-input-arrow',
          (!count() || (filteringSender() && !filterPeerId())) && 'hide'
        )}
        noRipple
        onClick={() => {
          let _target = target();
          if(!_target) {
            _target = scrollableDiv.querySelector<HTMLElement>('.chatlist-chat');
            setTarget(_target);
            return;
          }

          if(direction === 'down') {
            _target = _target.previousElementSibling as HTMLElement;
          } else {
            _target = _target.nextElementSibling as HTMLElement;
          }

          if(!_target || !_target.classList.contains('chatlist-chat')) {
            return;
          }

          setTarget(_target);
        }}
      />
    );
  };

  const inputUpButton = arrowButton('up');
  const inputDownButton = arrowButton('down');

  inputSearchTools.append(inputUpButton as HTMLElement, inputDownButton as HTMLElement, inputSearch.clearBtn);

  createEffect(() => {
    const {peerId, threadId} = props;
    const query = value();
    const fromPeerId = filterPeerId();
    const isSender = filteringSender() && !fromPeerId;
    const middleware = createMiddleware().get();

    const loader = (isSender ? createParticipantsLoader : createSearchLoader)({
      middleware,
      peerId,
      threadId,
      query,
      fromPeerId
    });

    let ref: HTMLDivElement;
    const list = (
      <div
        ref={ref}
        class="topbar-search-left-chatlist chatlist"
      >
        {count() === 0 ? (
          <div class="topbar-search-left-results-empty">
            {i18n('Search.Empty', [wrapEmojiText(stringMiddleOverflow(query, 18))])}
          </div>
        ) : (
          <>
            <div>
              {loader().rendered}
            </div>
            {loader().rendered && <div class="topbar-search-left-results-padding" />}
          </>
        )}
      </div>
    );

    setLoadMore(() => undefined);
    setMessages();
    setSendersPeerIds();

    let first = true;
    const onLoad = () => {
      if(first) {
        inputSearch.toggleLoading(false);
        setList({element: ref, type: isSender ? 'senders' : 'messages'});
        scrollableDiv.scrollTop = 0;
        first = false;
      }
    };

    createEffect(
      on(
        () => loader(),
        ({rendered, values, loadMore}) => {
          setCount(rendered.length);
          setLoadMore(() => loadMore);
          if(isSender) setSendersPeerIds(values as any);
          else setMessages(values as any);
          onLoad();
        },
        {defer: true}
      )
    );

    inputSearch.toggleLoading(true);
    untrack(() => loader().loadMore());
  });

  createEffect(
    on(
      target,
      (target) => {
        const idx = whichChild(target);
        if(idx === -1) {
          return;
        }

        if(filteringSender() && !filterPeerId()) {
          const peerId = sendersPeerIds()[idx];
          batch(() => {
            setFilterPeerId(peerId);
            inputSearch.onChange(inputSearch.value = '');
          });
          return;
        }

        const previousActive = target.parentElement.querySelector('.active');
        if(previousActive) {
          previousActive.classList.remove('active');
        }

        target.classList.add('active');

        const message = messages()[idx];
        appImManager.chat.setMessageId(message.mid);
      },
      {defer: true}
    )
  );

  const calculateHeight = createMemo(() => {
    if(!isActive()) {
      return;
    }

    const length = count();
    if(length === undefined) {
      return;
    }

    const paddingVertical = 8 * 2;
    let height: number;
    if(length === 0) {
      height = 43;
    } else if(list().type === 'senders') {
      height = 1 + paddingVertical + length * 48;
    } else {
      height = 1 + paddingVertical + length * 56;
    }

    return Math.min(271, height);
  });

  let scrollableDiv: HTMLDivElement;
  return (
    <div class="topbar-search-container">
      <div
        class={classNames('topbar-search-left-container', isActive() && 'is-focused')}
        // style={calculateHeight() ? {height: calculateHeight() + 'px'} : undefined}
      >
        <div class="topbar-search-left-background">
          {/* <div class="topbar-search-left-background-shadow"></div> */}
        </div>
        {inputSearch.container}
        <ScrollableYTsx
          ref={scrollableDiv}
          class="topbar-search-left-results"
          style={calculateHeight() ? {height: calculateHeight() + 'px'} : undefined}
          onScrolledBottom={() => {
            loadMore()?.();
          }}
        >
          <div class="topbar-search-left-delimiter"></div>
          <AnimationList
            animationOptions={{duration: 200, easing: 'ease-in-out'}}
            keyframes={[{opacity: 0}, {opacity: 1}]}
            animateOnlyReplacement
          >
            {list()?.element}
          </AnimationList>
        </ScrollableYTsx>
      </div>
      <div class="topbar-search-right-container">
        {props.canFilterSender && !filteringSender() && (
          <ButtonIconTsx
            icon="newprivate"
            ref={(element) => {
              const detach = attachClickEvent(element, (e) => {
                cancelEvent(e);
                inputSearch.onChange(inputSearch.value = '');
                setFilteringSender(true);
                placeCaretAtEnd(inputSearch.input, true);
              }, {cancelMouseDown: true});
              onCleanup(detach);
            }}
          />
        )}
        {props.onDatePick && (
          <ButtonIconTsx
            icon="calendar"
            onClick={() => {
              PopupElement.createPopup(
                PopupDatePicker,
                new Date(),
                props.onDatePick
              ).show();
            }}
          />
        )}
      </div>
    </div>
  );
}