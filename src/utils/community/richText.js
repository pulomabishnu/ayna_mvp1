export const COMMUNITY_RICH_TEXT_VERSION = 1;
export const COMMUNITY_RICH_TEXT_MAX_CHARS = 2000;
const MAX_BLOCKS = 200;
const MAX_LIST_ITEMS = 200;
const MAX_SPANS = 500;

function cleanText(value) {
  return String(value ?? '').replace(/\u0000/g, '').replace(/\r\n?/g, '\n');
}

function normalizeSpans(input, budget) {
  const out = [];
  let remaining = Math.max(0, Number(budget) || 0);
  for (const raw of Array.isArray(input) ? input.slice(0, MAX_SPANS) : []) {
    if (!remaining) break;
    if (!raw || typeof raw !== 'object') continue;
    const text = cleanText(raw.text).replace(/\n+/g, ' ').slice(0, remaining);
    if (!text) continue;
    const bold = raw.bold === true;
    const previous = out[out.length - 1];
    if (previous && Boolean(previous.bold) === bold) previous.text += text;
    else out.push(bold ? { text, bold: true } : { text });
    remaining -= text.length;
  }
  return { spans: out, remaining };
}

function spansText(spans) {
  return (Array.isArray(spans) ? spans : []).map((span) => cleanText(span?.text)).join('');
}

export function sanitizeCommunityRichTextDoc(input, maxChars = COMMUNITY_RICH_TEXT_MAX_CHARS) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return null;
  const sourceBlocks = Array.isArray(input.blocks) ? input.blocks.slice(0, MAX_BLOCKS) : null;
  if (!sourceBlocks) return null;

  const blocks = [];
  let remaining = Math.max(0, Number(maxChars) || COMMUNITY_RICH_TEXT_MAX_CHARS);
  for (const rawBlock of sourceBlocks) {
    if (!remaining || !rawBlock || typeof rawBlock !== 'object') break;
    if (rawBlock.type === 'paragraph') {
      const normalized = normalizeSpans(rawBlock.spans, remaining);
      blocks.push({ type: 'paragraph', spans: normalized.spans });
      remaining = normalized.remaining;
      continue;
    }
    if (rawBlock.type === 'bulletList') {
      const items = [];
      for (const rawItem of Array.isArray(rawBlock.items) ? rawBlock.items.slice(0, MAX_LIST_ITEMS) : []) {
        if (!remaining) break;
        const normalized = normalizeSpans(rawItem?.spans, remaining);
        items.push({ spans: normalized.spans });
        remaining = normalized.remaining;
      }
      if (items.length) blocks.push({ type: 'bulletList', items });
    }
  }

  if (!blocks.length) blocks.push({ type: 'paragraph', spans: [] });
  return { version: COMMUNITY_RICH_TEXT_VERSION, blocks };
}

export function isCommunityRichTextDoc(value) {
  return Boolean(sanitizeCommunityRichTextDoc(value));
}

export function communityRichTextToPlainText(value) {
  const doc = sanitizeCommunityRichTextDoc(value);
  if (!doc) return '';
  const lines = [];
  for (const block of doc.blocks) {
    if (block.type === 'paragraph') lines.push(spansText(block.spans));
    else if (block.type === 'bulletList') block.items.forEach((item) => lines.push(`• ${spansText(item.spans)}`));
  }
  return lines.join('\n').replace(/\n{3,}/g, '\n\n').trimEnd();
}

export function plainTextToCommunityRichText(value, maxChars = COMMUNITY_RICH_TEXT_MAX_CHARS) {
  const text = cleanText(value).slice(0, maxChars);
  const lines = text.split('\n');
  const blocks = [];
  let currentList = null;
  const flushList = () => {
    if (currentList?.items.length) blocks.push(currentList);
    currentList = null;
  };

  for (const line of lines) {
    const bullet = line.match(/^\s*(?:[-*•])\s+(.*)$/);
    if (bullet) {
      if (!currentList) currentList = { type: 'bulletList', items: [] };
      currentList.items.push({ spans: bullet[1] ? [{ text: bullet[1] }] : [] });
      continue;
    }
    flushList();
    blocks.push({ type: 'paragraph', spans: line ? [{ text: line }] : [] });
  }
  flushList();
  return sanitizeCommunityRichTextDoc({ version: COMMUNITY_RICH_TEXT_VERSION, blocks }, maxChars);
}

export function truncateCommunityRichText(value, maxChars = COMMUNITY_RICH_TEXT_MAX_CHARS) {
  return sanitizeCommunityRichTextDoc(value, maxChars);
}

export function communityRichTextCharacterCount(value) {
  return communityRichTextToPlainText(value).length;
}
