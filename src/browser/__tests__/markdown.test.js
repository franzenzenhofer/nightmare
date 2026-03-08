import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { Script, createContext } from 'vm';

function loadMarkdown() {
  const code = readFileSync(join(__dirname, '..', 'js', 'markdown.js'), 'utf8');
  const sandbox = {};
  createContext(sandbox);
  const script = new Script(code);
  script.runInContext(sandbox);
  return sandbox;
}

describe('escapeHtml', () => {
  it('escapes HTML special characters', () => {
    const mod = loadMarkdown();
    expect(mod.escapeHtml('<script>alert("xss")</script>')).toBe(
      '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
    );
  });

  it('escapes ampersands', () => {
    const mod = loadMarkdown();
    expect(mod.escapeHtml('A & B')).toBe('A &amp; B');
  });
});

describe('renderMarkdown', () => {
  const mod = loadMarkdown();
  const { renderMarkdown } = mod;

  it('renders headings', () => {
    expect(renderMarkdown('# Title')).toContain('<h1>Title</h1>');
    expect(renderMarkdown('## Subtitle')).toContain('<h2>Subtitle</h2>');
    expect(renderMarkdown('### H3')).toContain('<h3>H3</h3>');
  });

  it('renders bold text', () => {
    expect(renderMarkdown('**bold**')).toContain('<strong>bold</strong>');
    expect(renderMarkdown('__bold__')).toContain('<strong>bold</strong>');
  });

  it('renders italic text', () => {
    expect(renderMarkdown('*italic*')).toContain('<em>italic</em>');
    expect(renderMarkdown('_italic_')).toContain('<em>italic</em>');
  });

  it('renders inline code', () => {
    expect(renderMarkdown('use `console.log`')).toContain('<code>console.log</code>');
  });

  it('renders links', () => {
    expect(renderMarkdown('[click](http://example.com)')).toContain(
      '<a href="http://example.com">click</a>'
    );
  });

  it('renders images', () => {
    expect(renderMarkdown('![alt](image.png)')).toContain(
      '<img src="image.png" alt="alt">'
    );
  });

  it('renders fenced code blocks', () => {
    const result = renderMarkdown('```\nconst x = 1;\n```');
    expect(result).toContain('<pre><code>');
    expect(result).toContain('const x = 1;');
    expect(result).toContain('</code></pre>');
  });

  it('renders unordered lists', () => {
    const result = renderMarkdown('- item 1\n- item 2');
    expect(result).toContain('<ul>');
    expect(result).toContain('<li>item 1</li>');
    expect(result).toContain('<li>item 2</li>');
    expect(result).toContain('</ul>');
  });

  it('renders ordered lists', () => {
    const result = renderMarkdown('1. first\n2. second');
    expect(result).toContain('<ol>');
    expect(result).toContain('<li>first</li>');
    expect(result).toContain('<li>second</li>');
    expect(result).toContain('</ol>');
  });

  it('renders blockquotes', () => {
    expect(renderMarkdown('> quoted text')).toContain('<blockquote>quoted text</blockquote>');
  });

  it('renders horizontal rules', () => {
    expect(renderMarkdown('---')).toContain('<hr>');
    expect(renderMarkdown('***')).toContain('<hr>');
  });

  it('renders strikethrough', () => {
    expect(renderMarkdown('~~deleted~~')).toContain('<del>deleted</del>');
  });

  it('escapes HTML in code blocks', () => {
    const result = renderMarkdown('```\n<script>alert("xss")</script>\n```');
    expect(result).not.toContain('<script>');
    expect(result).toContain('&lt;script&gt;');
  });

  it('renders paragraphs for plain text', () => {
    expect(renderMarkdown('Hello world')).toContain('<p>Hello world</p>');
  });
});
