/**
 * HTML Template Engine
 *
 * Converts content (markdown or plain text) into styled HTML pages ready to publish.
 * Three templates: audit, article, comparison.
 *
 * Design inspiration: gaurav.imapro.in/research — dark, technical, data-dense.
 * Each template outputs a fully self-contained HTML page (inline CSS, no external deps).
 */

// --- Lightweight markdown → HTML converter ---
// Handles: headings, bold, italic, links, code, inline code, lists, blockquotes, tables, hr, paragraphs.
export function mdToHtml(md) {
  if (!md) return '';
  let text = md.replace(/\r\n/g, '\n');

  // Strip markdown code block fences wrapping the whole thing
  text = text.replace(/^```(?:markdown|md|html)?\s*\n/, '').replace(/\n```\s*$/, '');

  const lines = text.split('\n');
  const out = [];
  let i = 0;

  const inlineProcess = (s) => {
    // Escape first
    let r = s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    // Code inline `x`
    r = r.replace(/`([^`]+)`/g, '<code>$1</code>');
    // Bold **x** or __x__
    r = r.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    r = r.replace(/__([^_]+)__/g, '<strong>$1</strong>');
    // Italic *x* or _x_
    r = r.replace(/(^|[^*])\*([^*\n]+)\*([^*]|$)/g, '$1<em>$2</em>$3');
    r = r.replace(/(^|[^_])_([^_\n]+)_([^_]|$)/g, '$1<em>$2</em>$3');
    // Links [text](url)
    r = r.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
    return r;
  };

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // Blank line
    if (trimmed === '') { i++; continue; }

    // Horizontal rule
    if (/^(-{3,}|_{3,}|\*{3,})$/.test(trimmed)) {
      out.push('<hr />');
      i++;
      continue;
    }

    // Headings
    const h = trimmed.match(/^(#{1,6})\s+(.+)$/);
    if (h) {
      const level = h[1].length;
      out.push(`<h${level}>${inlineProcess(h[2])}</h${level}>`);
      i++;
      continue;
    }

    // Blockquote
    if (trimmed.startsWith('> ')) {
      const q = [];
      while (i < lines.length && lines[i].trim().startsWith('> ')) {
        q.push(lines[i].trim().slice(2));
        i++;
      }
      out.push(`<blockquote><p>${inlineProcess(q.join(' '))}</p></blockquote>`);
      continue;
    }

    // Table (look ahead: current has | and next line is separator)
    if (trimmed.includes('|') && i + 1 < lines.length && /^\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)+\|?$/.test(lines[i + 1].trim())) {
      const headerCells = trimmed.replace(/^\||\|$/g, '').split('|').map(c => c.trim());
      i += 2;
      const rows = [];
      while (i < lines.length && lines[i].trim().includes('|') && lines[i].trim() !== '') {
        const cells = lines[i].trim().replace(/^\||\|$/g, '').split('|').map(c => inlineProcess(c.trim()));
        rows.push(cells);
        i++;
      }
      let tableHtml = '<div class="table-wrap"><table><thead><tr>';
      for (const h of headerCells) tableHtml += `<th>${inlineProcess(h)}</th>`;
      tableHtml += '</tr></thead><tbody>';
      for (const r of rows) {
        tableHtml += '<tr>' + r.map(c => `<td>${c}</td>`).join('') + '</tr>';
      }
      tableHtml += '</tbody></table></div>';
      out.push(tableHtml);
      continue;
    }

    // Unordered list
    if (/^[-*+]\s+/.test(trimmed)) {
      const items = [];
      while (i < lines.length && /^[-*+]\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^[-*+]\s+/, ''));
        i++;
      }
      out.push('<ul>' + items.map(it => `<li>${inlineProcess(it)}</li>`).join('') + '</ul>');
      continue;
    }

    // Ordered list
    if (/^\d+[.)]\s+/.test(trimmed)) {
      const items = [];
      while (i < lines.length && /^\d+[.)]\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+[.)]\s+/, ''));
        i++;
      }
      out.push('<ol>' + items.map(it => `<li>${inlineProcess(it)}</li>`).join('') + '</ol>');
      continue;
    }

    // Paragraph — collect until blank line or block element
    const para = [trimmed];
    i++;
    while (i < lines.length) {
      const nxt = lines[i].trim();
      if (nxt === '' || /^(#{1,6})\s/.test(nxt) || /^[-*+]\s/.test(nxt) || /^\d+[.)]\s/.test(nxt) || nxt.startsWith('> ') || (nxt.includes('|') && /^[-:|\s]+$/.test((lines[i+1]||'').trim()))) {
        break;
      }
      para.push(nxt);
      i++;
    }
    out.push(`<p>${inlineProcess(para.join(' '))}</p>`);
  }

  return out.join('\n');
}

// --- Shared CSS for all templates — dark, technical, professional ---
const baseCSS = `
  *, *::before, *::after { box-sizing: border-box; }
  html { scroll-behavior: smooth; }
  body {
    margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', system-ui, sans-serif;
    font-size: 16px;
    line-height: 1.7;
    color: #1a1a1a;
    background: #fafafa;
    -webkit-font-smoothing: antialiased;
  }
  .page {
    max-width: 780px;
    margin: 0 auto;
    padding: 60px 24px 120px;
  }
  .eyebrow {
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #8b5cf6;
    margin-bottom: 12px;
  }
  h1 {
    font-size: 42px;
    font-weight: 800;
    line-height: 1.15;
    margin: 0 0 16px;
    letter-spacing: -0.02em;
  }
  .lede {
    font-size: 19px;
    line-height: 1.6;
    color: #555;
    margin: 0 0 48px;
    font-weight: 400;
  }
  h2 {
    font-size: 26px;
    font-weight: 700;
    margin: 48px 0 16px;
    line-height: 1.3;
    letter-spacing: -0.01em;
    border-top: 1px solid #e5e5e5;
    padding-top: 32px;
  }
  h2:first-of-type { border-top: none; padding-top: 0; margin-top: 40px; }
  h3 { font-size: 20px; font-weight: 700; margin: 32px 0 12px; }
  h4 { font-size: 17px; font-weight: 700; margin: 24px 0 8px; }
  p { margin: 0 0 18px; }
  a { color: #8b5cf6; text-decoration: none; border-bottom: 1px solid transparent; transition: border 0.15s; }
  a:hover { border-bottom-color: #8b5cf6; }
  strong { font-weight: 700; color: #111; }
  code {
    background: #f4f4f6;
    padding: 2px 6px;
    border-radius: 4px;
    font-family: 'SF Mono', ui-monospace, Menlo, monospace;
    font-size: 0.9em;
    color: #6d28d9;
  }
  ul, ol { margin: 0 0 24px; padding-left: 24px; }
  li { margin-bottom: 8px; }
  blockquote {
    margin: 24px 0;
    padding: 16px 20px;
    background: #f4f3ff;
    border-left: 3px solid #8b5cf6;
    border-radius: 0 8px 8px 0;
  }
  blockquote p { margin: 0; color: #3b3b3b; font-size: 15px; }
  hr { border: none; border-top: 1px solid #e5e5e5; margin: 48px 0; }
  .table-wrap { overflow-x: auto; margin: 24px 0; }
  table { border-collapse: collapse; width: 100%; font-size: 14px; }
  th, td { padding: 12px 14px; text-align: left; border-bottom: 1px solid #e5e5e5; vertical-align: top; }
  th { background: #f9f9fb; font-weight: 700; color: #111; border-bottom: 2px solid #d1d1d6; }
  tbody tr:nth-child(even) { background: #fcfbff; }
  tbody tr:hover { background: #f4f3ff; }
  .callout {
    margin: 32px 0;
    padding: 20px 24px;
    background: linear-gradient(135deg, #f4f3ff 0%, #fef3ff 100%);
    border: 1px solid #d4d4f0;
    border-radius: 12px;
  }
  .callout strong { color: #6d28d9; }
  .tldr {
    background: #111;
    color: #eaeaea;
    padding: 28px 32px;
    border-radius: 12px;
    margin: 0 0 48px;
  }
  .tldr .eyebrow { color: #a78bfa; margin-bottom: 8px; }
  .tldr h2 { font-size: 18px; color: #fff; margin: 0 0 12px; border: none; padding: 0; }
  .tldr ul { margin: 0; padding-left: 20px; }
  .tldr li { color: #d4d4d8; margin-bottom: 6px; }
  .tldr strong { color: #fff; }
  .byline {
    display: flex;
    align-items: center;
    gap: 12px;
    margin: 32px 0 40px;
    padding-bottom: 24px;
    border-bottom: 1px solid #e5e5e5;
    font-size: 14px;
    color: #666;
  }
  .byline .avatar {
    width: 36px; height: 36px; border-radius: 50%;
    background: linear-gradient(135deg, #8b5cf6, #6366f1);
    display: inline-flex; align-items: center; justify-content: center;
    color: white; font-weight: 700; font-size: 13px;
  }
  .meta-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 16px;
    margin: 32px 0;
    padding: 24px;
    background: #fff;
    border: 1px solid #e5e5e5;
    border-radius: 12px;
  }
  .meta-grid .item {}
  .meta-grid .label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; color: #999; margin-bottom: 4px; font-weight: 600; }
  .meta-grid .value { font-size: 15px; font-weight: 600; color: #111; }
  .score {
    display: inline-block;
    padding: 4px 12px;
    border-radius: 999px;
    font-weight: 700;
    font-size: 13px;
  }
  .score.high { background: #dcfce7; color: #166534; }
  .score.med { background: #fef3c7; color: #854d0e; }
  .score.low { background: #fee2e2; color: #991b1b; }
  .cta-block {
    margin: 48px 0;
    padding: 32px;
    background: linear-gradient(135deg, #faf5ff 0%, #f3f4f6 100%);
    border: 1px solid #e5e5e5;
    border-radius: 16px;
    text-align: center;
  }
  .cta-block h3 { margin-top: 0; font-size: 22px; }
  .cta-block .btn {
    display: inline-block;
    padding: 14px 28px;
    background: #8b5cf6;
    color: white;
    font-weight: 700;
    border-radius: 8px;
    margin-top: 16px;
    border-bottom: none;
    transition: transform 0.15s, background 0.15s;
  }
  .cta-block .btn:hover { background: #7c3aed; transform: translateY(-1px); border-bottom: none; }
  footer {
    margin-top: 80px;
    padding-top: 24px;
    border-top: 1px solid #e5e5e5;
    font-size: 13px;
    color: #999;
    text-align: center;
  }
  footer a { color: #8b5cf6; }
  @media (max-width: 640px) {
    .page { padding: 32px 20px 80px; }
    h1 { font-size: 32px; }
    h2 { font-size: 22px; }
    .lede { font-size: 17px; }
  }
  @media print {
    body { background: white; }
    .page { padding: 0; }
    a { color: inherit; border-bottom: none; }
  }
`;

const pageHead = (title, description, keyword = '') => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}" />
  ${keyword ? `<meta name="keywords" content="${escapeHtml(keyword)}" />` : ''}
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:type" content="article" />
  <meta name="twitter:card" content="summary_large_image" />
  <style>${baseCSS}</style>
</head>
<body>
`;

const pageFoot = () => `
<footer>
  <p>Published via Xtrusio Outreach Engine · <a href="#">Read more research</a></p>
</footer>
</body>
</html>
`;

function escapeHtml(s) {
  if (!s) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function initials(name) {
  if (!name) return 'X';
  return name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('');
}

// --- AUDIT TEMPLATE ---
export function renderAuditHtml(lead) {
  const title = `${lead.company} — SEO & AI Visibility Audit`;
  const description = `Deep audit of ${lead.company}'s AI citation rate, content gaps, and ranking opportunities in ${lead.industry || 'their industry'}.`;
  const body = mdToHtml(lead.auditContent || '');

  return `${pageHead(title, description, lead.industry)}
<article class="page">
  <p class="eyebrow">Research Report · ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
  <h1>${escapeHtml(title)}</h1>
  <p class="lede">${escapeHtml(description)}</p>

  <div class="byline">
    <span class="avatar">XT</span>
    <span><strong>Xtrusio Research</strong> · Independent analysis · Not sponsored</span>
  </div>

  <div class="meta-grid">
    <div class="item"><p class="label">Target</p><p class="value">${escapeHtml(lead.company)}</p></div>
    <div class="item"><p class="label">Industry</p><p class="value">${escapeHtml(lead.industry || 'N/A')}</p></div>
    <div class="item"><p class="label">Decision Maker</p><p class="value">${escapeHtml(lead.decisionMaker || 'N/A')}</p></div>
    <div class="item"><p class="label">Recent Signal</p><p class="value">${escapeHtml(lead.signal || 'N/A')}</p></div>
  </div>

  ${body}

  <div class="cta-block">
    <h3>Want this audit run on YOUR company?</h3>
    <p>We publish one independent audit per week. Reply to request yours — or book a 20-minute walkthrough.</p>
    <a href="mailto:hello@xtrusio.com?subject=Audit Request" class="btn">Request Your Audit</a>
  </div>
</article>
${pageFoot()}`;
}

// --- ARTICLE TEMPLATE ---
export function renderArticleHtml(lead) {
  const title = lead.articleTitle || 'Industry Guide';
  const description = lead.searchIntent || `${lead.industry || 'Industry'} buyer's guide`;
  const body = mdToHtml(lead.articleContent || '');

  return `${pageHead(title, description, lead.mirrorKeyword)}
<article class="page">
  <p class="eyebrow">Industry Guide · ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
  <h1>${escapeHtml(title)}</h1>
  ${lead.mirrorKeyword ? `<p class="lede">A vendor-agnostic guide for buyers searching: <em>"${escapeHtml(lead.mirrorKeyword)}"</em></p>` : ''}

  <div class="byline">
    <span class="avatar">${initials('Xtrusio Research')}</span>
    <span><strong>Xtrusio Research Team</strong> · Updated ${new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
  </div>

  ${body}

  ${lead.conversionHook ? `
  <div class="cta-block">
    <h3>Get the ${escapeHtml(lead.conversionHook)}</h3>
    <p>Free, zero-friction — download and implement today.</p>
    <a href="#download" class="btn">Download Free</a>
  </div>
  ` : ''}
</article>
${pageFoot()}`;
}

// --- COMPARISON TEMPLATE ---
export function renderComparisonHtml(lead) {
  const title = `${lead.company} vs Alternatives — 2026 Comparison`;
  const description = `Objective comparison of ${lead.company} against top competitors in ${lead.industry || 'the category'}.`;
  const body = mdToHtml(lead.comparisonContent || '');

  return `${pageHead(title, description, lead.mirrorKeyword)}
<article class="page">
  <p class="eyebrow">Head-to-Head Comparison</p>
  <h1>${escapeHtml(title)}</h1>
  <p class="lede">${escapeHtml(description)}</p>

  <div class="byline">
    <span class="avatar">XT</span>
    <span><strong>Xtrusio Research</strong> · Analytical comparison · Independent</span>
  </div>

  ${body}

  <div class="callout">
    <strong>Try our interactive picker:</strong> Not sure which tool fits your team?
    <a href="#picker">Use our 2-minute decision helper →</a>
  </div>
</article>
${pageFoot()}`;
}
