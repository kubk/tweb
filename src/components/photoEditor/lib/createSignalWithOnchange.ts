import {createSignal, Signal} from 'solid-js';

export const createSignalWithOnchange = <T extends any>(
  value: T,
  onChange: (value: T) => void
) => {
  const signal = createSignal(value);
  return [
    signal[0],
    (newValue: T) => {
      // @ts-ignore
      signal[1](newValue);
      onChange(newValue);
    }
  ] as Signal<T>;
};
