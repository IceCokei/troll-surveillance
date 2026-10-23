export type Inline =
  | { t: 'text'; v: string }
  | { t: 'bold'; v: string }
  | { t: 'code'; v: string }
  | { t: 'link'; v: string; href: string };

export type Block =
  | { type: 'h1'; text: string }
  | { type: 'h2'; text: string }
  | { type: 'h3'; text: string }
  | { type: 'quote'; text: string }
  | { type: 'hr' }
  | { type: 'list'; items: { text: string; children: string[] }[] }
  | { type: 'table'; head: string[]; rows: string[][] }
  | { type: 'p'; text: string };

export function parseInline(s: string): Inline[] {
  const out: Inline[] = [];
  const re = /\*\*([^*]+)\*\*|`([^`]+)`|\[([^\]]+)\]\(([^)]+)\)|(https?:\/\/[^\s|]+)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(s))) {
    if (m.index > last) out.push({ t: 'text', v: s.slice(last, m.index) });
    if (m[1]) out.push({ t: 'bold', v: m[1] });
    else if (m[2]) out.push({ t: 'code', v: m[2] });
    else if (m[3]) out.push({ t: 'link', v: m[3], href: m[4] });
    else if (m[5]) out.push({ t: 'link', v: m[5].replace(/^https?:\/\//, ''), href: m[5] });
    last = m.index + m[0].length;
  }
  if (last < s.length) out.push({ t: 'text', v: s.slice(last) });
  return out;
}

export function parseMarkdown(md: string): Block[] {
  const lines = md.replace(/\r\n/g, '\n').split('\n');
  const blocks: Block[] = [];
  let i = 0;

  const isTable = (s: string) => /^\s*\|.*\|\s*$/.test(s);
  const cells = (s: string) =>
    s.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim());

  while (i < lines.length) {
    const line = lines[i];
    const raw = line.trimEnd();

    if (!raw.trim()) { i++; continue; }

    if (/^#\s+/.test(raw)) { blocks.push({ type: 'h1', text: raw.replace(/^#\s+/, '') }); i++; continue; }
    if (/^##\s+/.test(raw)) { blocks.push({ type: 'h2', text: raw.replace(/^##\s+/, '') }); i++; continue; }
    if (/^###\s+/.test(raw)) { blocks.push({ type: 'h3', text: raw.replace(/^###\s+/, '') }); i++; continue; }
    if (/^---\s*$/.test(raw)) { blocks.push({ type: 'hr' }); i++; continue; }
    if (/^>\s?/.test(raw)) {
      const buf: string[] = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) { buf.push(lines[i].replace(/^>\s?/, '')); i++; }
      blocks.push({ type: 'quote', text: buf.join(' ').trim() });
      continue;
    }
    if (isTable(raw)) {
      const head = cells(raw);
      i++;
      if (i < lines.length && /^\s*\|[\s:|-]+\|\s*$/.test(lines[i])) i++;
      const rows: string[][] = [];
      while (i < lines.length && isTable(lines[i])) { rows.push(cells(lines[i])); i++; }
      blocks.push({ type: 'table', head, rows });
      continue;
    }
    if (/^\s*[-*]\s+/.test(raw)) {
      const items: { text: string; children: string[] }[] = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
        const m = lines[i].match(/^(\s*)[-*]\s+(.*)$/)!;
        const indent = m[1].length;
        const text = m[2].trim();
        if (indent >= 2 && items.length) {
          items[items.length - 1].children.push(text);
          i++;
          // 连续的子项
          while (i < lines.length && /^\s{2,}[-*]\s+/.test(lines[i])) {
            items[items.length - 1].children.push(lines[i].replace(/^\s*[-*]\s+/, '').trim());
            i++;
          }
        } else {
          items.push({ text, children: [] });
          i++;
        }
      }
      blocks.push({ type: 'list', items });
      continue;
    }
    // 段落：吃掉到空行为止
    const buf: string[] = [];
    while (i < lines.length && lines[i].trim() && !/^(#{1,3}\s|>\s?|---\s*$|\s*[-*]\s+|\s*\|)/.test(lines[i])) {
      buf.push(lines[i].trim());
      i++;
    }
    blocks.push({ type: 'p', text: buf.join(' ') });
  }

  return blocks;
}
