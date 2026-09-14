import './v6QuizPersonalization.css';

const NAME_KEY = 'ayna_v6_first_name';
let timer = null;

function cleanText(node) {
  return String(node?.textContent || '').replace(/\s+/g, ' ').trim();
}

function firstName() {
  try {
    return String(window.sessionStorage.getItem(NAME_KEY) || '').trim().split(/\s+/)[0];
  } catch (_) {
    return '';
  }
}

function progressRatio(root) {
  const count = cleanText(root.querySelector('.ayna-count'));
  const match = count.match(/(\d+)\s*\/\s*(\d+)/);
  if (match) {
    const current = Number(match[1]);
    const total = Number(match[2]);
    if (total > 0) return Math.max(0, Math.min(1, current / total));
  }

  const segments = [...root.querySelectorAll('.ayna-intake-segment')];
  if (segments.length) {
    const active = segments.filter((segment) => segment.classList.contains('on')).length;
    return Math.max(0, Math.min(1, active / segments.length));
  }

  return 0.2;
}

function encouragement(name, ratio, heading) {
  if (/safety|new, rapidly worsening|concerning right now/i.test(heading)) {
    return `take your time, ${name}. this one matters.`;
  }
  if (/anything else/i.test(heading)) return `last little bit, ${name}.`;
  if (ratio >= 0.88) return `you’re almost there, ${name}.`;
  if (ratio >= 0.68) return `just a few more, ${name}.`;
  if (ratio >= 0.48) return `halfway there, ${name}.`;
  if (ratio >= 0.25) return `you’re doing great, ${name}.`;
  return `we’ve got you, ${name}.`;
}

function enhanceQuestion() {
  const root = document.querySelector('.ayna-intake-root');
  const question = root?.querySelector('.ayna-intake-question');
  if (!root || !question) return;

  // The synthetic first-name screen is itself the source of personalization.
  if (question.querySelector('.v6-name-step')) return;

  const name = firstName();
  if (!name) {
    question.querySelector('.v6-quiz-encouragement')?.remove();
    return;
  }

  const headingNode = question.querySelector('h1');
  const heading = cleanText(headingNode);
  if (!heading) return;

  let note = question.querySelector('.v6-quiz-encouragement');
  if (!note) {
    note = document.createElement('p');
    note.className = 'v6-quiz-encouragement';

    const subtitle = question.querySelector('.ayna-intake-subtitle');
    const hint = question.querySelector('.ayna-intake-hint');
    const anchor = hint || subtitle || headingNode;
    anchor?.insertAdjacentElement('afterend', note);
  }

  const message = encouragement(name, progressRatio(root), heading);
  if (note.textContent !== message) {
    note.textContent = message;
    note.animate?.(
      [
        { opacity: 0, transform: 'translateY(3px)' },
        { opacity: 1, transform: 'translateY(0)' },
      ],
      { duration: 220, easing: 'ease-out' }
    );
  }
}

function run() {
  window.clearTimeout(timer);
  timer = window.setTimeout(enhanceQuestion, 20);
}

function start() {
  enhanceQuestion();
  const observer = new MutationObserver(run);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  document.addEventListener('input', run, true);
  document.addEventListener('change', run, true);
  document.addEventListener('click', run, true);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', start, { once: true });
} else {
  start();
}
