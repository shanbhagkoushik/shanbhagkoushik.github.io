/**
 * Fetches blog posts straight from the GitHub repo's content/blog folder.
 * No build step, no database — posts are just markdown files with
 * frontmatter, added/edited via the /admin CMS (which commits to GitHub).
 *
 * >>> UPDATE THESE TWO LINES with your GitHub username and repo name <<<
 */
const SITE = {
  owner: "shanbhagkoushik",
  repo: "shanbhagkoushik.github.io",
  branch: "main",
};

const API_LIST_URL = `https://api.github.com/repos/${SITE.owner}/${SITE.repo}/contents/content/blog?ref=${SITE.branch}`;

function rawUrl(path) {
  return `https://raw.githubusercontent.com/${SITE.owner}/${SITE.repo}/${SITE.branch}/${path}`;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function safeUrl(value) {
  try {
    const url = new URL(value, window.location.href);
    if (["http:", "https:", "mailto:"].includes(url.protocol)) return url.href;
  } catch {
    // Fall through to a harmless link for malformed URLs.
  }
  return "#";
}

/** Very small frontmatter parser: expects
 * ---
 * key: value
 * ---
 * body...
 */
function parseFrontmatter(text) {
  const match = text.match(/^---\s*[\r\n]([\s\S]*?)[\r\n]---\s*[\r\n]?([\s\S]*)$/);
  if (!match) return { data: {}, body: text };
  const [, fmBlock, body] = match;
  const data = {};
  fmBlock.split(/\r?\n/).forEach((line) => {
    const idx = line.indexOf(":");
    if (idx === -1) return;
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();
    value = value.replace(/^["']|["']$/g, "");
    data[key] = value;
  });
  return { data, body: body.trim() };
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  return d.toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" });
}

/** Fetches and parses every post. Returns newest-first. */
async function fetchAllPosts() {
  const listRes = await fetch(API_LIST_URL);
  if (!listRes.ok) throw new Error(`GitHub API error: ${listRes.status}`);
  const files = await listRes.json();
  if (!Array.isArray(files)) throw new Error("GitHub API returned an invalid file list");
  const mdFiles = files.filter((f) => f.name.endsWith(".md"));

  const posts = await Promise.all(
    mdFiles.map(async (file) => {
      const raw = await fetch(rawUrl(`content/blog/${file.name}`)).then((r) => r.text());
      const { data, body } = parseFrontmatter(raw);
      return {
        title: data.title || file.name.replace(/\.md$/, ""),
        date: data.date || "",
        excerpt: data.excerpt || "",
        slug: data.slug || file.name.replace(/\.md$/, ""),
        body,
      };
    })
  );

  posts.sort((a, b) => new Date(b.date) - new Date(a.date));
  return posts;
}

async function fetchPostBySlug(slug) {
  const posts = await fetchAllPosts();
  return posts.find((p) => p.slug === slug) || null;
}

/** Renders a compact list of posts (used on the homepage + blog index). */
function renderPostList(posts, mountEl, { emptyMessage, postLinkBase = "blog/post.html" }) {
  mountEl.innerHTML = "";
  if (!posts.length) {
    const p = document.createElement("p");
    p.className = "empty-note";
    p.textContent = emptyMessage;
    mountEl.appendChild(p);
    return;
  }
  const ul = document.createElement("ul");
  ul.className = "entry-list";
  posts.forEach((post) => {
    const li = document.createElement("li");
    li.className = "entry";
    li.innerHTML = `
      <div class="entry-head">
        <a href="${escapeHtml(postLinkBase)}?slug=${encodeURIComponent(post.slug)}">${escapeHtml(post.title)}</a>
        <span class="entry-date">${escapeHtml(formatDate(post.date))}</span>
      </div>
      ${post.excerpt ? `<p class="entry-desc">${escapeHtml(post.excerpt)}</p>` : ""}
    `;
    ul.appendChild(li);
  });
  mountEl.appendChild(ul);
}

/** Minimal markdown-to-HTML for post bodies: headings, bold/italic, links,
 * paragraphs, blockquotes, code. Good enough for personal writing without
 * pulling in a dependency. */
function renderMarkdown(md) {
  const blocks = md.split(/\r?\n\r?\n/);
  return blocks
    .map((block) => {
      if (/^```/.test(block)) {
        const code = block.replace(/^```[a-z]*\r?\n?/i, "").replace(/```$/, "");
        return `<pre><code>${escapeHtml(code)}</code></pre>`;
      }
      if (/^>\s?/.test(block)) {
        const text = block.replace(/^>\s?/gm, "");
        return `<blockquote>${inline(text)}</blockquote>`;
      }
      const headingMatch = block.match(/^(#{1,3})\s+(.*)$/);
      if (headingMatch) {
        const level = headingMatch[1].length + 1; // start at h2
        return `<h${level}>${inline(headingMatch[2])}</h${level}>`;
      }
      return `<p>${inline(block).replace(/\n/g, "<br>")}</p>`;
    })
    .join("\n");

  function inline(text) {
    return escapeHtml(text)
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
      .replace(/\[(.+?)\]\((.+?)\)/g, (_, label, url) => `<a href="${escapeHtml(safeUrl(url))}">${label}</a>`)
      .replace(/`(.+?)`/g, "<code>$1</code>");
  }
}
