/*
 * Nov 9 (founder: "some people just stay on the loading screen"). Small fallbacks for phones on
 * iOS Safari before 15.4 and older Android browsers, which don't have these yet. Imported first
 * in main.jsx so they exist before any other module runs. Each one only fills a gap.
 */
/* eslint-disable no-extend-native */
function at(n) {
  const len = this.length >>> 0;
  let i = Math.trunc(Number(n)) || 0;
  if (i < 0) i += len;
  return i < 0 || i >= len ? undefined : this[i];
}
for (const C of [Array, String]) {
  if (!C.prototype.at) Object.defineProperty(C.prototype, 'at', { value: at, writable: true, configurable: true });
}
if (typeof Int8Array !== 'undefined') {
  const T = Object.getPrototypeOf(Int8Array);
  if (T?.prototype && !T.prototype.at) Object.defineProperty(T.prototype, 'at', { value: at, writable: true, configurable: true });
}
if (!Object.hasOwn) {
  Object.defineProperty(Object, 'hasOwn', { value: (o, k) => Object.prototype.hasOwnProperty.call(Object(o), k), writable: true, configurable: true });
}
if (!Array.prototype.findLast) {
  Object.defineProperty(Array.prototype, 'findLast', { value(fn, self) { for (let i = this.length - 1; i >= 0; i -= 1) if (fn.call(self, this[i], i, this)) return this[i]; return undefined; }, writable: true, configurable: true });
}
if (!Array.prototype.findLastIndex) {
  Object.defineProperty(Array.prototype, 'findLastIndex', { value(fn, self) { for (let i = this.length - 1; i >= 0; i -= 1) if (fn.call(self, this[i], i, this)) return i; return -1; }, writable: true, configurable: true });
}
if (typeof globalThis.structuredClone !== 'function') {
  globalThis.structuredClone = (v) => (v === undefined ? v : JSON.parse(JSON.stringify(v)));
}
