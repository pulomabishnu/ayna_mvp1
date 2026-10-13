import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import ArticleDetailScreen from './ArticleDetailScreen.jsx';

describe('article content and citations', () => {
  it('keeps body paragraphs and each original citation link', () => {
    const article = { title: 'A guide', body: <><p>First paragraph.</p><p>Second paragraph.</p><p><strong>Sources:</strong></p><ul><li><a href="https://example.org/study">Original study</a></li></ul></> };
    const html = renderToStaticMarkup(<ArticleDetailScreen article={article} />);
    expect(html).toContain('First paragraph.');
    expect(html).toContain('Second paragraph.');
    expect(html).toContain('href="https://example.org/study"');
    expect(html).toContain('Original study');
  });
  it('does not drop a plain-text body', () => {
    const html = renderToStaticMarkup(<ArticleDetailScreen article={{ title: 'Guide', body: 'Full article text.' }} />);
    expect(html).toContain('Full article text.');
  });
  it('shows the actual next suggested article title as the action', () => {
    const html = renderToStaticMarkup(<ArticleDetailScreen article={{ title: 'Guide', body: <p>Body</p> }} nextRead={{ label: 'Same topic', article: { title: 'Next guide' } }} />);
    expect(html).toContain('Next guide');
    expect(html).toContain('Next article');
  });
});
