import React from 'react';

/**
 * Lightweight, zero-dependency Markdown parser with horizontally scrollable tables and clinical formatting.
 * Designed to render subtopic clinical notes with strict adherence to British English and responsive table containment.
 */

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
  if (!content) {
    return <div className="text-slate italic text-sm">No notes authored for this subtopic yet.</div>;
  }

  // Parse markdown blocks (Headers, Paragraphs, Lists, Blockquotes, Tables)
  const blocks = parseMarkdownBlocks(content);

  return (
    <div className={`prose-acepharm max-w-none text-ink space-y-4 leading-relaxed ${className}`}>
      {blocks.map((block, idx) => {
        if (block.type === 'h1') {
          return (
            <h1 key={idx} className="text-2xl font-bold text-ink tracking-tight pt-2 border-b border-border pb-2">
              {renderInline(block.content)}
            </h1>
          );
        }
        if (block.type === 'h2') {
          return (
            <h2 key={idx} className="text-xl font-bold text-ink tracking-tight pt-3 border-b border-border/60 pb-1.5 flex items-center gap-2">
              <span className="w-1.5 h-4 rounded bg-indigo inline-block" />
              {renderInline(block.content)}
            </h2>
          );
        }
        if (block.type === 'h3') {
          return (
            <h3 key={idx} className="text-lg font-semibold text-ink tracking-tight pt-2">
              {renderInline(block.content)}
            </h3>
          );
        }
        if (block.type === 'blockquote') {
          return (
            <blockquote
              key={idx}
              className="p-3.5 rounded-card bg-indigo/5 border-l-4 border-indigo text-slate text-sm space-y-1 my-2"
            >
              {renderInline(block.content)}
            </blockquote>
          );
        }
        if (block.type === 'ul') {
          return (
            <ul key={idx} className="list-disc pl-5 space-y-1.5 text-sm text-ink marker:text-indigo">
              {block.items.map((item: string, itemIdx: number) => (
                <li key={itemIdx}>{renderInline(item)}</li>
              ))}
            </ul>
          );
        }
        if (block.type === 'ol') {
          return (
            <ol key={idx} className="list-decimal pl-5 space-y-1.5 text-sm text-ink marker:font-semibold marker:text-slate">
              {block.items.map((item: string, itemIdx: number) => (
                <li key={itemIdx}>{renderInline(item)}</li>
              ))}
            </ol>
          );
        }
        if (block.type === 'table') {
          // CRITICAL: Non-Negotiable Horizontally Scrollable Table Container
          return (
            <div key={idx} className="my-4 rounded-card border border-border overflow-hidden shadow-sm bg-surface">
              <div className="overflow-x-auto w-full scrollbar-thin scrollbar-thumb-border scrollbar-track-canvas">
                <table className="w-full text-left text-xs sm:text-sm border-collapse min-w-[500px]">
                  <thead>
                    <tr className="bg-canvas border-b border-border text-slate font-semibold">
                      {block.headers.map((h: string, hIdx: number) => (
                        <th key={hIdx} scope="col" className="px-4 py-3 whitespace-nowrap">
                          {renderInline(h)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {block.rows.map((row: string[], rIdx: number) => (
                      <tr key={rIdx} className="hover:bg-canvas/50 transition-colors">
                        {row.map((cell: string, cIdx: number) => (
                          <td key={cIdx} className="px-4 py-3 align-top text-ink">
                            {renderInline(cell)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        }
        return (
          <p key={idx} className="text-sm text-ink leading-relaxed">
            {renderInline(block.content)}
          </p>
        );
      })}
    </div>
  );
};

/**
 * Parses inline formatting: **bold**, *italic*, `code`, and [link](url)
 */
function renderInline(text: string): React.ReactNode {
  if (!text) return null;

  // Split by bold (**...**), code (`...`), and links ([...](...))
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  const regex = /(\*\*.*?\*\*|`.*?`|\[.*?\]\(.*?\))/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    const start = match.index;
    const matchedStr = match[0];

    // Push preceding text
    if (start > lastIndex) {
      parts.push(text.substring(lastIndex, start));
    }

    if (matchedStr.startsWith('**') && matchedStr.endsWith('**')) {
      parts.push(
        <strong key={key++} className="font-bold text-ink">
          {matchedStr.slice(2, -2)}
        </strong>
      );
    } else if (matchedStr.startsWith('`') && matchedStr.endsWith('`')) {
      parts.push(
        <code key={key++} className="px-1.5 py-0.5 rounded bg-canvas border border-border text-xs font-mono text-indigo font-semibold">
          {matchedStr.slice(1, -1)}
        </code>
      );
    } else if (matchedStr.startsWith('[')) {
      const linkMatch = /\[(.*?)\]\((.*?)\)/.exec(matchedStr);
      if (linkMatch) {
        parts.push(
          <a
            key={key++}
            href={linkMatch[2]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo hover:text-indigo-deep underline font-medium"
          >
            {linkMatch[1]}
          </a>
        );
      }
    }

    lastIndex = start + matchedStr.length;
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts.length > 0 ? parts : text;
}

/**
 * Basic block-level parser for standard Markdown with GitHub Flavored Tables
 */
function parseMarkdownBlocks(text: string): any[] {
  const lines = text.split('\n');
  const blocks: any[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (!line.trim()) {
      i++;
      continue;
    }

    // Headers
    if (line.startsWith('# ')) {
      blocks.push({ type: 'h1', content: line.substring(2).trim() });
      i++;
      continue;
    }
    if (line.startsWith('## ')) {
      blocks.push({ type: 'h2', content: line.substring(3).trim() });
      i++;
      continue;
    }
    if (line.startsWith('### ')) {
      blocks.push({ type: 'h3', content: line.substring(4).trim() });
      i++;
      continue;
    }

    // Blockquote
    if (line.startsWith('> ')) {
      const bqLines = [line.substring(2).trim()];
      i++;
      while (i < lines.length && lines[i].startsWith('> ')) {
        bqLines.push(lines[i].substring(2).trim());
        i++;
      }
      blocks.push({ type: 'blockquote', content: bqLines.join(' ') });
      continue;
    }

    // Lists
    if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
      const items: string[] = [];
      while (i < lines.length && (lines[i].trim().startsWith('- ') || lines[i].trim().startsWith('* '))) {
        items.push(lines[i].trim().substring(2).trim());
        i++;
      }
      blocks.push({ type: 'ul', items });
      continue;
    }

    // Numbered list
    if (/^\d+\.\s/.test(line.trim())) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+\.\s/, '').trim());
        i++;
      }
      blocks.push({ type: 'ol', items });
      continue;
    }

    // Tables (| col | col |)
    if (line.includes('|') && (i + 1 < lines.length && (lines[i + 1].includes('---') || lines[i + 1].includes(':-')))) {
      const rawHeaderCells = line.split('|').map((h) => h.trim());
      // Filter out leading/trailing empty cells if row started/ended with |
      const headers = (line.trim().startsWith('|') && line.trim().endsWith('|'))
        ? rawHeaderCells.slice(1, -1)
        : rawHeaderCells.filter(Boolean);

      i += 2; // skip header and delimiter row

      const rows: string[][] = [];
      while (i < lines.length && lines[i].includes('|')) {
        const rawCells = lines[i].split('|').map((c) => c.trim());
        const row = (lines[i].trim().startsWith('|') && lines[i].trim().endsWith('|'))
          ? rawCells.slice(1, -1)
          : rawCells.filter(Boolean);

        if (row.length > 0) {
          rows.push(row);
        }
        i++;
      }
      blocks.push({ type: 'table', headers, rows });
      continue;
    }

    // Paragraph
    const pLines = [line];
    i++;
    while (i < lines.length && lines[i].trim() && !lines[i].startsWith('#') && !lines[i].startsWith('> ') && !lines[i].trim().startsWith('- ') && !lines[i].includes('|')) {
      pLines.push(lines[i]);
      i++;
    }
    blocks.push({ type: 'p', content: pLines.join(' ') });
  }

  return blocks;
}
