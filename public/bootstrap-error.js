// Keep the pre-React boot error fallback external so production CSP can block
// inline scripts. textContent/replaceChildren ensure an error message is never
// interpreted as HTML.
window.onerror = function onAynaBootError(msg, url, line, col, err) {
  var root = document.getElementById('root');
  if (!root) return false;

  var wrap = document.createElement('div');
  wrap.style.padding = '2rem';
  wrap.style.minHeight = '100vh';
  wrap.style.boxSizing = 'border-box';
  wrap.style.background = '#ffedac';
  wrap.style.color = '#3e2723';
  wrap.style.fontFamily = "'DM Sans', system-ui, sans-serif";

  var heading = document.createElement('h2');
  heading.textContent = 'Something went wrong';

  var detail = document.createElement('p');
  detail.textContent = 'Please reload the page and try again.';

  wrap.appendChild(heading);
  wrap.appendChild(detail);
  root.replaceChildren(wrap);
  return false;
};

// Branded boot screen (index.html): if the app still hasn't replaced it after
// 8 seconds, say so and offer a reload instead of an endless spinner.
window.setTimeout(function ayBootSlow() {
  var boot = document.getElementById('ay-boot');
  if (!boot) return;
  var slow = boot.querySelector('.ay-boot__slow');
  if (slow) slow.hidden = false;
  var link = slow && slow.querySelector('a');
  if (link) link.addEventListener('click', function (e) { e.preventDefault(); window.location.reload(); });
}, 8000);
