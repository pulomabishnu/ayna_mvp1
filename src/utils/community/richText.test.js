import { afterEach, describe, expect, it } from 'vitest';
import {
  clearActiveCommunityRichTextDraft,
  communityRichTextToPlainText,
  getActiveCommunityRichTextDraftForBody,
  plainTextToCommunityRichText,
  sanitizeCommunityRichTextDoc,
  setActiveCommunityRichTextDraft,
} from './richText.js';

afterEach(() => clearActiveCommunityRichTextDraft());

describe('Community rich text document', () => {
  it('preserves supported bold spans and strips unknown structure', () => {
    const doc = sanitizeCommunityRichTextDoc({
      version: 1,
      onload: 'alert(1)',
      blocks: [
        {
          type: 'paragraph',
          html: '<script>alert(1)</script>',
          spans: [
            { text: 'important', bold: true, onclick: 'alert(1)' },
            { text: ' note', href: 'javascript:alert(1)' },
          ],
        },
        { type: 'script', spans: [{ text: 'never rendered' }] },
      ],
    });

    expect(doc).toEqual({
      version: 1,
      blocks: [{
        type: 'paragraph',
        spans: [{ text: 'important', bold: true }, { text: ' note' }],
      }],
    });
    expect(communityRichTextToPlainText(doc)).toBe('important note');
  });

  it('converts dash, star and bullet-prefixed lines into structured bullet lists', () => {
    const doc = plainTextToCommunityRichText('Intro\n- smarter recommendations\n* clearer evidence\n• safer matches\nDone');

    expect(doc.blocks.map((block) => block.type)).toEqual(['paragraph', 'bulletList', 'paragraph']);
    expect(doc.blocks[1].items.map((item) => item.spans[0].text)).toEqual([
      'smarter recommendations',
      'clearer evidence',
      'safer matches',
    ]);
    expect(communityRichTextToPlainText(doc)).toBe('Intro\n• smarter recommendations\n• clearer evidence\n• safer matches\nDone');
  });

  it('keeps mixed paragraphs, blank lines and bullet lists structured', () => {
    const doc = plainTextToCommunityRichText('First paragraph\n\n- one\n- two\nLast paragraph');
    expect(doc.blocks).toEqual([
      { type: 'paragraph', spans: [{ text: 'First paragraph' }] },
      { type: 'paragraph', spans: [] },
      { type: 'bulletList', items: [
        { spans: [{ text: 'one' }] },
        { spans: [{ text: 'two' }] },
      ] },
      { type: 'paragraph', spans: [{ text: 'Last paragraph' }] },
    ]);
  });

  it('treats old plain-text posts as plain text rather than Markdown', () => {
    const doc = plainTextToCommunityRichText('old **plain** post');
    expect(communityRichTextToPlainText(doc)).toBe('old **plain** post');
    expect(doc.blocks[0].spans).toEqual([{ text: 'old **plain** post' }]);
  });

  it('only reuses the active structured draft for the exact submitted body', () => {
    const draft = {
      version: 1,
      blocks: [{ type: 'paragraph', spans: [{ text: 'very', bold: true }, { text: ' important' }] }],
    };
    setActiveCommunityRichTextDraft(draft);

    expect(getActiveCommunityRichTextDraftForBody('very important')).toEqual(draft);
    expect(getActiveCommunityRichTextDraftForBody('different post')).toBeNull();
  });
});
