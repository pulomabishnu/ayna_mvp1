// Keep the pre-React boot error fallback external so production CSP can block
// inline scripts. textContent/replaceChildren ensure an error message is never
// interpreted as HTML.
window.onerror = function onAynaBootError(msg, url, line, col, err) {
  var root = document.getElementById('root');
  if (!root) return false;

  var wrap = document.createElement('div');
  wrap.style.padding = '2rem';
  wrap.style.fontFamily = 'sans-serif';

  var heading = document.createElement('h2');
  heading.textContent = 'Something went wrong';

  var detail = document.createElement('p');
  detail.textContent = 'Please reload the page and try again.';

  wrap.appendChild(heading);
  wrap.appendChild(detail);
  root.replaceChildren(wrap);
  return false;
};
