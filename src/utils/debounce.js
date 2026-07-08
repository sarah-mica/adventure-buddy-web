export function createDebouncer() {
  const timers = {};
  return function debounce(key, fn, delay = 500) {
    clearTimeout(timers[key]);
    timers[key] = setTimeout(fn, delay);
  };
}
