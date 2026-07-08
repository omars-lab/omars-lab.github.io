/// <reference types="jest" />
//
// Render test for the <MindMap> component (packages/blog-ui): linked nodes must
// render as real <a> anchors with the right href + target, and malformed mindmap
// text must throw at render (the build gate).

import React from 'react';
import { render } from '@testing-library/react';
import MindMap from '../../../packages/blog-ui/src/components/MindMap';

describe('<MindMap /> rendering', () => {
  it('renders a linked node as an anchor to a same-page heading', () => {
    const { container } = render(
      <MindMap title="Roles">{`
mindmap
  root((Roles))
    [The Starter](#the-starter)
`}</MindMap>,
    );
    const anchor = container.querySelector('a[href="#the-starter"]');
    expect(anchor).not.toBeNull();
    expect(anchor!.textContent).toContain('The Starter');
    // same-page link is NOT opened in a new tab
    expect(anchor!.getAttribute('target')).toBeNull();
  });

  it('opens an external link in a new tab with rel=noopener', () => {
    const { container } = render(
      <MindMap title="Roles">{`
mindmap
  root((Roles))
    [Docs](https://example.com/x)
`}</MindMap>,
    );
    const anchor = container.querySelector('a[href="https://example.com/x"]')!;
    expect(anchor.getAttribute('target')).toBe('_blank');
    expect(anchor.getAttribute('rel')).toContain('noopener');
  });

  it('renders a non-linked node as a plain group (no anchor)', () => {
    const { container } = render(
      <MindMap title="Roles">{`
mindmap
  root((Roles))
    Plain Node
`}</MindMap>,
    );
    // exactly the two linked-less nodes -> no anchors at all
    expect(container.querySelectorAll('a')).toHaveLength(0);
    expect(container.textContent).toContain('Plain Node');
  });

  it('exposes the title as the accessible SVG title', () => {
    const { container } = render(
      <MindMap title="My Mind Map">{`
mindmap
  root((R))
    A
`}</MindMap>,
    );
    expect(container.querySelector('svg title')!.textContent).toBe('My Mind Map');
  });

  it('applies the blog theme class when theme="blog"', () => {
    const { container } = render(
      <MindMap title="Roles" theme="blog">{`
mindmap
  root((Roles))
    A
`}</MindMap>,
    );
    // the figure carries a themeBlog class (css-modules stub returns the raw name)
    expect(container.querySelector('figure')!.className).toContain('themeBlog');
  });

  it('defaults to the mindnode theme (no blog class)', () => {
    const { container } = render(
      <MindMap title="Roles">{`
mindmap
  root((Roles))
    A
`}</MindMap>,
    );
    expect(container.querySelector('figure')!.className).not.toContain('themeBlog');
  });

  it('tints an accented node with the accent class', () => {
    const { container } = render(
      <MindMap title="Roles">{`
mindmap
  root((Roles))
    Ship:::green
`}</MindMap>,
    );
    // a rect with the accent-green class should exist
    const rects = [...container.querySelectorAll('rect')];
    expect(rects.some((r) => r.getAttribute('class')?.includes('accent-green'))).toBe(true);
  });

  it('throws on malformed mindmap text (build gate)', () => {
    // Suppress the expected React error boundary noise.
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() =>
      render(<MindMap title="Bad">{`not a mindmap at all`}</MindMap>),
    ).toThrow(/mindmap/i);
    spy.mockRestore();
  });
});
