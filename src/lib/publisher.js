/**
 * Publisher — handles exporting HTML content to various destinations.
 *
 * Supported targets:
 *  1. Download (single HTML file to user's Downloads folder)
 *  2. Batch ZIP (all 3 HTMLs per lead × all leads in a campaign, organized by folder)
 *  3. GitHub push (requires user config: repo, branch, token, base path)
 *
 * The GitHub flow is designed for a Next.js site where HTML files live in `/public/research/[slug]/index.html`
 * and Cloudflare Pages auto-deploys on push.
 */

import JSZip from 'jszip';

// ---- Settings storage ----
const PUBLISH_CONFIG_KEY = 'xtrusio_publish_config';

export function loadPublishConfig() {
  try {
    const raw = localStorage.getItem(PUBLISH_CONFIG_KEY);
    if (!raw) return getDefaultConfig();
    return { ...getDefaultConfig(), ...JSON.parse(raw) };
  } catch {
    return getDefaultConfig();
  }
}

export function savePublishConfig(config) {
  localStorage.setItem(PUBLISH_CONFIG_KEY, JSON.stringify(config));
}

function getDefaultConfig() {
  return {
    provider: 'github',        // 'github' | 'download'
    owner: '',                 // github org/user
    repo: '',                  // repo name
    branch: 'main',
    token: '',                 // personal access token (stored locally only)
    auditsPath: 'public/research',       // audits go here: /public/research/[slug]/index.html → /research/[slug]
    articlesPath: 'public/blog',         // articles: /public/blog/[slug]/index.html → /blog/[slug]
    comparisonsPath: 'public/compare',   // comparisons: /public/compare/[slug]/index.html → /compare/[slug]
    siteBaseUrl: 'https://gaurav.imapro.in',  // for URL computation
  };
}

// ---- Slug helpers ----
export function slugify(s) {
  return (s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 80);
}

function pathForContent(lead, contentType, config) {
  const companySlug = slugify(lead.company);
  switch (contentType) {
    case 'audit':
      return `${config.auditsPath}/${companySlug}/index.html`;
    case 'article': {
      const titleSlug = slugify(lead.articleTitle || lead.mirrorKeyword || companySlug);
      return `${config.articlesPath}/${titleSlug}/index.html`;
    }
    case 'comparison':
      return `${config.comparisonsPath}/${companySlug}-vs-alternatives/index.html`;
    default:
      return `public/misc/${companySlug}-${contentType}.html`;
  }
}

function urlForContent(lead, contentType, config) {
  const filePath = pathForContent(lead, contentType, config);
  // Strip `public/` prefix since Next.js serves /public/X at /X
  const urlPath = filePath.replace(/^public\//, '/').replace(/\/index\.html$/, '/');
  return `${config.siteBaseUrl.replace(/\/$/, '')}${urlPath}`;
}

// ---- Download a single HTML file ----
export function downloadHtml(html, filename) {
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ---- Batch ZIP of all content for a campaign ----
export async function downloadCampaignZip(campaign, config = loadPublishConfig()) {
  const zip = new JSZip();
  let count = 0;

  for (const lead of campaign.leads) {
    for (const [field, type] of [
      ['auditHtml', 'audit'],
      ['articleHtml', 'article'],
      ['comparisonHtml', 'comparison'],
    ]) {
      if (!lead[field]) continue;
      const filePath = pathForContent(lead, type, config);
      zip.file(filePath, lead[field]);
      count++;
    }
  }

  if (count === 0) {
    throw new Error('No HTML content to export. Generate content first.');
  }

  // Add a README with publish instructions
  const readme = `# Xtrusio Outreach Engine — Campaign Export

Campaign: ${campaign.name}
Generated: ${new Date().toISOString()}
Files: ${count}

## How to publish

1. Drop the \`public/\` folder contents into your Next.js site's \`public/\` folder.
2. Commit and push to your repo.
3. Cloudflare Pages / Vercel will auto-deploy.

## URL structure

- Audits:      ${config.siteBaseUrl}/research/[company-slug]/
- Articles:    ${config.siteBaseUrl}/blog/[title-slug]/
- Comparisons: ${config.siteBaseUrl}/compare/[company]-vs-alternatives/
`;
  zip.file('README.md', readme);

  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `xtrusio-${slugify(campaign.name)}-${new Date().toISOString().slice(0, 10)}.zip`;
  a.click();
  URL.revokeObjectURL(url);
  return count;
}

// ---- GitHub push ----
/**
 * Create or update a file via GitHub Contents API.
 * Uses PAT (token) — never leaves the user's browser except to GitHub directly.
 */
async function githubPutFile({ owner, repo, branch, token, path, content, message }) {
  const apiBase = `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURI(path)}`;

  // First, check if file exists to get its SHA (needed for updates)
  let sha = null;
  try {
    const getRes = await fetch(`${apiBase}?ref=${encodeURIComponent(branch)}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
      },
    });
    if (getRes.ok) {
      const data = await getRes.json();
      sha = data.sha;
    }
  } catch {
    // file doesn't exist — that's fine for create
  }

  // Encode content as base64 (GitHub API requirement)
  const b64 = btoa(unescape(encodeURIComponent(content)));

  const putRes = await fetch(apiBase, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: message || `Xtrusio: publish ${path}`,
      content: b64,
      branch,
      ...(sha ? { sha } : {}),
    }),
  });

  if (!putRes.ok) {
    const err = await putRes.text();
    throw new Error(`GitHub API ${putRes.status}: ${err}`);
  }
  const result = await putRes.json();
  return result;
}

/**
 * Publish a single piece of content to GitHub, returning the public URL.
 */
export async function publishToGithub(lead, contentType, config = loadPublishConfig()) {
  if (!config.token || !config.owner || !config.repo) {
    throw new Error('GitHub not configured. Set owner, repo, and token in Publish Settings.');
  }

  const field = {
    audit: 'auditHtml',
    article: 'articleHtml',
    comparison: 'comparisonHtml',
  }[contentType];

  const html = lead[field];
  if (!html) throw new Error(`No ${contentType} HTML to publish for ${lead.company}.`);

  const path = pathForContent(lead, contentType, config);

  await githubPutFile({
    owner: config.owner,
    repo: config.repo,
    branch: config.branch,
    token: config.token,
    path,
    content: html,
    message: `Xtrusio: publish ${contentType} for ${lead.company}`,
  });

  return urlForContent(lead, contentType, config);
}

/**
 * Publish all content for a single lead.
 * Returns a map of contentType → url for successes, and errors for failures.
 */
export async function publishLead(lead, config = loadPublishConfig()) {
  const results = { audit: null, article: null, comparison: null };
  const errors = {};

  for (const type of ['audit', 'article', 'comparison']) {
    const field = { audit: 'auditHtml', article: 'articleHtml', comparison: 'comparisonHtml' }[type];
    if (!lead[field]) continue;
    try {
      const url = await publishToGithub(lead, type, config);
      results[type] = url;
    } catch (e) {
      errors[type] = e.message;
    }
  }

  return { results, errors };
}

export { urlForContent, pathForContent };
