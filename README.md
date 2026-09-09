# Koushik Shanbhag — personal site

A plain HTML/CSS/JS site with a blog. No build step, no framework, no database.
Blog posts are markdown files in `content/blog`, editable by hand or through
the `/admin` panel (Sveltia CMS), which commits changes straight to this repo.

## 1. Fill in your details

Everything is placeholder text right now. Search for and replace:

- Your name/tagline/bio in `index.html`
- Social links (`YOUR-GITHUB-USERNAME`, `YOUR-USERNAME`, `you@example.com`) in
  `index.html`
- The "Work" list in `index.html`
- The two dummy posts in `content/blog/` (edit, delete, or replace them)

## 2. Point the site at your repo

Two files need your actual GitHub username and repo name:

- `assets/blog.js` — the `SITE` object at the top (`owner`, `repo`, `branch`)
- `admin/config.yml` — the `repo:` line under `backend`

This is what lets the homepage/blog pages fetch posts, and lets the admin
panel know where to commit new ones.

## 3. Push to GitHub and enable Pages

1. Create a new repo on GitHub and push this folder to it.
   - If you want the site at `https://<username>.github.io`, name the repo
     `<username>.github.io` and use branch `main`.
   - Otherwise any repo name works; the site will be at
     `https://<username>.github.io/<repo-name>/` (in that case, use relative
     paths — the ones in this project already use `/absolute` paths assuming
     a root domain, so if you use a project page, change the leading `/` in
     `href`/`src` attributes to relative paths, e.g. `assets/style.css`).
2. In the repo, go to **Settings → Pages**, set the source to your `main`
   branch, root folder.
3. Wait a minute, then visit the URL GitHub gives you.

## 4. Set up the admin panel (write posts from the browser)

The admin panel at `/admin` uses **Sveltia CMS** with the `github` backend.
As the sole user of your own site, the simplest login method is a **personal
access token (PAT)** — no extra server or OAuth app needed:

1. On GitHub, go to **Settings → Developer settings → Personal access
   tokens → Fine-grained tokens**, and create one scoped to just this repo
   with **read and write access to Contents**.
2. Visit `https://<your-site>/admin/`. Sveltia CMS will prompt you to sign
   in with GitHub — choose the personal access token option and paste the
   token in.
3. You should see a "Writing" collection. Create, edit, or delete posts from
   there — every change is committed directly to `content/blog` in this repo.

If you'd rather have a "Login with GitHub" button (nicer if you ever edit
from your phone, or if more than one person will publish), you can instead
deploy a small free OAuth relay — see
[sveltia-cms-auth](https://github.com/sveltia/sveltia-cms-auth) for a
one-click Cloudflare Workers deploy. This is optional; the PAT method above
works fine for a single-author site and needs no extra deployment.

## Notes

- `.nojekyll` is required so GitHub Pages serves the `content/` and
  `admin/` folders as-is, without Jekyll trying to process them.
- The blog pages fetch posts client-side from the GitHub API, so newly
  published posts appear within a minute or two — no rebuild required.
- Everything is plain files: if you'd rather skip the CMS entirely, just add
  or edit `.md` files in `content/blog` by hand and push.
