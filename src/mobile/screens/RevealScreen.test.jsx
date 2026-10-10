import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import RevealScreen from './RevealScreen.jsx';

const noop = () => {};

describe('intake results preview', () => {
  it('starts a four-part story with the real recommendation count', () => {
    const html = renderToStaticMarkup(<RevealScreen
      myProducts={[{ id: 'one', name: 'First match', category: 'pad' }, { id: 'two', name: 'Second match', category: 'app' }]}
      topAreas={['Period', 'Sleep']}
      onContinue={noop}
      onBack={noop}
      onGoBrowse={noop}
    />);
    expect(html).toContain('Story 1 of 4');
    expect(html).toContain('2 picks');
    expect(html).toContain('YOUR ECOSYSTEM');
    expect(html).not.toContain('0 products');
  });

  it('does not promise an Ecosystem when no confident products were found', () => {
    const html = renderToStaticMarkup(<RevealScreen myProducts={[]} onContinue={noop} onBack={noop} onGoBrowse={noop} />);
    expect(html).toContain('Story 1 of 1');
    expect(html).toContain('No strong match yet.');
    expect(html).not.toContain('Save my Ecosystem');
    expect(html).toContain('Edit answers');
  });
});
