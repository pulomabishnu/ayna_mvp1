import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import RevealScreen from './RevealScreen.jsx';

const noop = () => {};

describe('intake results preview', () => {
  it('shows actual matched products before account creation without empty statistics', () => {
    const html = renderToStaticMarkup(<RevealScreen
      myProducts={[{ id: 'one', name: 'First match', category: 'pad' }, { id: 'two', name: 'Second match', category: 'app' }]}
      topAreas={['Period', 'Sleep']}
      onContinue={noop}
      onBack={noop}
      onGoBrowse={noop}
    />);
    expect(html).toContain('First match');
    expect(html).toContain('Second match');
    expect(html).toContain('Create an account to save my Ecosystem');
    expect(html).not.toContain('0 products');
  });

  it('does not promise an Ecosystem when no confident products were found', () => {
    const html = renderToStaticMarkup(<RevealScreen myProducts={[]} onContinue={noop} onBack={noop} onGoBrowse={noop} />);
    expect(html).toContain('could not find a confident product match');
    expect(html).not.toContain('Create an account to save my Ecosystem');
    expect(html).toContain('Update my answers');
  });
});
