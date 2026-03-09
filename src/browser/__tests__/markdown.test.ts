import { describe, it, expect } from 'vitest';
import {
  escapeHtml,
  inlineFormat,
  renderMarkdown,
} from '../services/markdown';

describe('escapeHtml', () => {
  it('escapes ampersands', () => {
    expect(escapeHtml('a & b')).toBe('a &amp; b');
  });

  it('escapes angle brackets', () => {
    expect(escapeHtml('<div>')).toBe('&lt;div&gt;');
  });

  it('escapes double quotes', () => {
    expect(escapeHtml('"hello"')).toBe('&quot;hello&quot;');
  });

  it('escapes all special chars together', () => {
    expect(escapeHtml('<a href="x">&</a>')).toBe(
      '&lt;a href=&quot;x&quot;&gt;&amp;&lt;/a&gt;',
    );
  });

  it('returns empty string unchanged', () => {
    expect(escapeHtml('')).toBe('');
  });

  it('returns plain text unchanged', () => {
    expect(escapeHtml('hello world')).toBe('hello world');
  });
});

describe('inlineFormat', () => {
  it('renders bold with asterisks', () => {
    expect(inlineFormat('**bold**')).toBe('<strong>bold</strong>');
  });

  it('renders bold with underscores', () => {
    expect(inlineFormat('__bold__')).toBe('<strong>bold</strong>');
  });

  it('renders italic with asterisks', () => {
    expect(inlineFormat('*italic*')).toBe('<em>italic</em>');
  });

  it('renders italic with underscores', () => {
    expect(inlineFormat('_italic_')).toBe('<em>italic</em>');
  });

  it('renders inline code', () => {
    expect(inlineFormat('`code`')).toBe('<code>code</code>');
  });

  it('renders strikethrough', () => {
    expect(inlineFormat('~~deleted~~')).toBe('<del>deleted</del>');
  });

  it('renders links', () => {
    expect(inlineFormat('[text](http://x.com)')).toBe(
      '<a href="http://x.com">text</a>',
    );
  });

  it('renders images', () => {
    expect(inlineFormat('![alt](img.png)')).toBe(
      '<img src="img.png" alt="alt">',
    );
  });

  it('escapes HTML before formatting', () => {
    expect(inlineFormat('**<b>bold</b>**')).toBe(
      '<strong>&lt;b&gt;bold&lt;/b&gt;</strong>',
    );
  });
});

describe('renderMarkdown', () => {
  it('renders headings h1 through h6', () => {
    const md = '# H1\n## H2\n### H3\n#### H4\n##### H5\n###### H6';
    const result = renderMarkdown(md);
    expect(result).toContain('<h1>H1</h1>');
    expect(result).toContain('<h2>H2</h2>');
    expect(result).toContain('<h3>H3</h3>');
    expect(result).toContain('<h4>H4</h4>');
    expect(result).toContain('<h5>H5</h5>');
    expect(result).toContain('<h6>H6</h6>');
  });

  it('renders horizontal rules', () => {
    expect(renderMarkdown('---')).toContain('<hr>');
    expect(renderMarkdown('***')).toContain('<hr>');
    expect(renderMarkdown('___')).toContain('<hr>');
  });

  it('renders blockquotes', () => {
    expect(renderMarkdown('> quote')).toContain(
      '<blockquote>quote</blockquote>',
    );
  });

  it('renders unordered lists', () => {
    const md = '- item1\n- item2';
    const result = renderMarkdown(md);
    expect(result).toContain('<ul>');
    expect(result).toContain('<li>item1</li>');
    expect(result).toContain('<li>item2</li>');
    expect(result).toContain('</ul>');
  });

  it('renders ordered lists', () => {
    const md = '1. first\n2. second';
    const result = renderMarkdown(md);
    expect(result).toContain('<ol>');
    expect(result).toContain('<li>first</li>');
    expect(result).toContain('<li>second</li>');
    expect(result).toContain('</ol>');
  });

  it('renders fenced code blocks', () => {
    const md = '```\nvar x = 1;\n```';
    const result = renderMarkdown(md);
    expect(result).toContain('<pre><code>');
    expect(result).toContain('var x = 1;');
    expect(result).toContain('</code></pre>');
  });

  it('escapes HTML inside code blocks', () => {
    const md = '```\n<div>\n```';
    const result = renderMarkdown(md);
    expect(result).toContain('&lt;div&gt;');
  });

  it('renders paragraphs', () => {
    expect(renderMarkdown('hello')).toContain('<p>hello</p>');
  });

  it('renders empty lines as breaks', () => {
    expect(renderMarkdown('')).toContain('<br>');
  });

  it('applies inline formatting in paragraphs', () => {
    expect(renderMarkdown('**bold** text')).toContain(
      '<p><strong>bold</strong> text</p>',
    );
  });

  it('closes unclosed code blocks', () => {
    const md = '```\ncode';
    const result = renderMarkdown(md);
    expect(result).toContain('</code></pre>');
  });

  it('closes unclosed lists', () => {
    const md = '- item';
    const result = renderMarkdown(md);
    expect(result).toContain('</ul>');
  });

  it('switches from ul to ol', () => {
    const md = '- bullet\n1. number';
    const result = renderMarkdown(md);
    expect(result).toContain('</ul>');
    expect(result).toContain('<ol>');
  });

  it('handles inline formatting in headings', () => {
    expect(renderMarkdown('# **Bold** heading')).toContain(
      '<h1><strong>Bold</strong> heading</h1>',
    );
  });

  it('handles inline formatting in list items', () => {
    expect(renderMarkdown('- *italic item*')).toContain(
      '<li><em>italic item</em></li>',
    );
  });

  it('handles inline formatting in blockquotes', () => {
    expect(renderMarkdown('> **bold** quote')).toContain(
      '<blockquote><strong>bold</strong> quote</blockquote>',
    );
  });
});
