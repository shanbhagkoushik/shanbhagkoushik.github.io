const SITE = {
  owner: "your-github-username",
  repo: "your-site-repo",
  branch: "main",
};

const API_ROOT = `https://api.github.com/repos/${SITE.owner}/${SITE.repo}/contents`;
const RAW_ROOT = `https://raw.githubusercontent.com/${SITE.owner}/${SITE.repo}/${SITE.branch}`;

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  }[character]));
}

function parseFrontmatter(text) {
  const match = text.match(/^---\s*[\r\n]([\s\S]*?)[\r\n]---\s*[\r\n]?([\s\S]*)$/);
  if (!match) return { data: {}, body: text.trim() };
  const data = {};
  match[1].split(/\r?\n/).forEach((line) => {
    const separator = line.indexOf(":");
    if (separator < 0) return;
    const key = line.slice(0, separator).trim();
    let value = line.slice(separator + 1).trim();
    value = value.replace(/^["']|["']$/g, "");
    data[key] = value;
  });
  return { data, body: match[2].trim() };
}

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

async function listMarkdown(directory) {
  const response = await fetch(`${API_ROOT}/${directory}?ref=${SITE.branch}`);
  if (!response.ok) throw new Error(`Could not load ${directory}`);
  const files = await response.json();
  return files.filter((file) => file.name.endsWith(".md"));
}

async function loadMarkdownFile(file) {
  const response = await fetch(`${RAW_ROOT}/${file.path}`);
  if (!response.ok) throw new Error(`Could not load ${file.path}`);
  const raw = await response.text();
  const parsed = parseFrontmatter(raw);
  return {
    ...parsed.data,
    body: parsed.body,
    file: file.name,
  };
}

async function loadCollection(directory) {
  const files = await listMarkdown(directory);
  const items = await Promise.all(files.map(loadMarkdownFile));
  return items.sort((a, b) => {
    const order = Number(a.order || 0) - Number(b.order || 0);
    return order || new Date(b.date || 0) - new Date(a.date || 0);
  });
}

function markdownToHtml(markdown = "") {
  return markdown.split(/\r?\n\r?\n/).filter(Boolean).map((block) => {
    const heading = block.match(/^(#{1,3})\s+(.+)$/);
    if (heading) return `<h${heading[1].length + 1}>${inlineMarkdown(heading[2])}</h${heading[1].length + 1}>`;
    if (/^>\s?/.test(block)) return `<blockquote>${inlineMarkdown(block.replace(/^>\s?/gm, ""))}</blockquote>`;
    if (/^(?:- |\* )/.test(block)) {
      const items = block.split(/\r?\n/).map((line) => `<li>${inlineMarkdown(line.replace(/^(?:- |\* )/, ""))}</li>`).join("");
      return `<ul>${items}</ul>`;
    }
    return `<p>${inlineMarkdown(block).replace(/\n/g, "<br>")}</p>`;
  }).join("");
}

function inlineMarkdown(text) {
  return escapeHtml(text)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>')
    .replace(/`(.+?)`/g, "<code>$1</code>");
}

function tagList(value = "") {
  return String(value).split(",").map((tag) => tag.trim()).filter(Boolean)
    .map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("");
}

function shellFooter() {
  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();
}

function renderCards(items, mount, kind) {
  if (!items.length) {
    mount.innerHTML = '<p class="empty-note">Nothing published here yet. Add an entry from Admin.</p>';
    return;
  }
  mount.innerHTML = items.map((item) => {
    const body = item.body ? markdownToHtml(item.body) : `<p>${escapeHtml(item.excerpt || "")}</p>`;
    const link = item.url ? `<a class="card-link" href="${escapeHtml(item.url)}">Open link ↗</a>` : "";
    return `<article class="content-card ${kind}-card">
      <div class="card-mark" aria-hidden="true">${escapeHtml(item.mark || "")}</div>
      <div class="card-content">
        <div class="card-heading"><h2>${escapeHtml(item.title || "Untitled")}</h2>${item.date ? `<time>${formatDate(item.date)}</time>` : ""}</div>
        ${item.subtitle ? `<p class="card-subtitle">${escapeHtml(item.subtitle)}</p>` : ""}
        ${item.tags ? `<div class="tag-list">${tagList(item.tags)}</div>` : ""}
        <div class="card-body">${body}</div>
        ${link}
      </div>
    </article>`;
  }).join("");
}

function renderWriting(items, mount) {
  if (!items.length) {
    mount.innerHTML = '<p class="empty-note">Nothing published here yet. Add a branch from Admin.</p>';
    return;
  }
  const groups = items.reduce((result, item) => {
    const key = item.series || "Unsorted writing";
    (result[key] ||= []).push(item);
    return result;
  }, {});
  mount.innerHTML = Object.entries(groups).map(([series, posts]) => `
    <section class="writing-branch">
      <div class="branch-heading">
        <span class="branch-kicker">Writing branch</span>
        <h2>${escapeHtml(series)}</h2>
        ${posts[0].seriesDescription ? `<p>${escapeHtml(posts[0].seriesDescription)}</p>` : ""}
      </div>
      <ol class="chapter-list">
        ${posts.sort((a, b) => Number(a.seriesOrder || 0) - Number(b.seriesOrder || 0)).map((post, index) => `
          <li><span class="chapter-number">${String(index).padStart(2, "0")}</span><a href="post.html?slug=${encodeURIComponent(post.slug || post.file.replace(/\.md$/, ""))}">${escapeHtml(post.title || "Untitled")}</a><time>${formatDate(post.date)}</time></li>
        `).join("")}
      </ol>
    </section>`).join("");
}

async function renderPage() {
  shellFooter();
  const page = document.body.dataset.page;
  const mount = document.querySelector("[data-content]");
  if (!mount) return;
  try {
    const pageFiles = await listMarkdown(`content/pages/${page}`);
    if (pageFiles[0]) {
      const pageData = await loadMarkdownFile(pageFiles[0]);
      const title = document.querySelector("[data-page-title]");
      const intro = document.querySelector("[data-page-intro]");
      if (title && pageData.title) title.textContent = pageData.title;
      if (intro && pageData.excerpt) intro.textContent = pageData.excerpt;
      if (page === "about") {
        mount.innerHTML = markdownToHtml(pageData.body);
        return;
      }
    }
    if (page === "writing") {
      renderWriting(await loadCollection("content/writing"), mount);
      return;
    }
    const collection = {
      projects: "content/projects",
      "open-source": "content/open-source",
      work: "content/work",
      education: "content/education",
      talks: "content/talks",
    }[page];
    renderCards(await loadCollection(collection), mount, page);
  } catch (error) {
    mount.innerHTML = '<p class="empty-note">Content is unavailable right now. Check the repository settings in Admin.</p>';
  }
}

document.addEventListener("DOMContentLoaded", renderPage);
