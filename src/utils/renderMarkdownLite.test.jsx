import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { renderMarkdownLite } from './renderMarkdownLite.jsx';

const html = (t) => renderToStaticMarkup(renderMarkdownLite(t));

describe('renderMarkdownLite', () => {
  it('renders italics instead of literal asterisks', () => {
    expect(html('what works best for *your* body')).toBe('<p style="margin:0.15rem 0">what works best for <em>your</em> body</p>');
    expect(html('try _gentle_ heat')).toContain('try <em>gentle</em> heat');
  });

  it('renders bold and bold italic', () => {
    expect(html('**Movement** and __heat__')).toContain('<strong>Movement</strong> and <strong>heat</strong>');
    expect(html('***really*** matters')).toContain('<strong><em>really</em></strong> matters');
    expect(html('**Rest** when *you* need it')).toContain('<strong>Rest</strong> when <em>you</em> need it');
  });

  it('leaves maths, snake_case and lone asterisks alone', () => {
    expect(html('2 * 3 * 4')).toContain('2 * 3 * 4');
    expect(html('use file_name_here')).toContain('use file_name_here');
    expect(html('a * b')).not.toContain('<em>');
  });

  it('keeps lists working, with emphasis inside items', () => {
    const out = html('- **Heat** on your belly\n* *Gentle* walks');
    expect(out).toContain('<ul');
    expect(out).toContain('<li><strong>Heat</strong> on your belly</li>');
    expect(out).toContain('<li><em>Gentle</em> walks</li>');
  });

  it('never renders raw HTML from the model', () => {
    const out = html('<img src=x onerror=alert(1)> *hi*');
    expect(out).not.toContain('<img');
    expect(out).toContain('&lt;img');
    expect(out).toContain('<em>hi</em>');
  });

  it('only links http(s) urls', () => {
    expect(html('[ok](https://a.example)')).toContain('href="https://a.example"');
    expect(html('[bad](javascript:alert(1))')).not.toContain('href');
  });
});
