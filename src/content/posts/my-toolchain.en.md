---
title: My Writing Toolchain
published: 2026-07-30
description: From writing Markdown in Obsidian to pushing to GitHub and auto-deploying — a record of the tools and workflow behind this blog.
image: ''
tags: [Tools, Writing]
category: Writing
draft: false
lang: en
---

For this blog, my toolchain follows one principle: **content is always plain text, and publishing should be as close to zero-click as possible**.

## Writing: Obsidian

I open the entire repo (including `src/content/posts`) directly as an Obsidian vault. New posts use the core "Templates" plugin to insert the `post` template, which lays out the frontmatter skeleton automatically — I only need to fill in the title and body.

::tip{title="Why Obsidian instead of an online CMS"}
I'm the sole author, and plain Markdown is the most comfortable way to write; Obsidian also lets me edit the `.md` files in the repo directly. When I'm done, I push and it goes live — no intermediate conversion layer.
::

## Content Format: Plain Markdown

Every post is just a `src/content/posts/*.md` file, with frontmatter fields like title, date, tags, category, and draft status. The rich-text features (KaTeX formulas, code blocks, admonitions, GitHub cards) are also written by hand in Markdown syntax — the editor offers no WYSIWYG, but in exchange the files will still open ten years from now and render fine under a different engine.

## Versioning and Deployment: Git + GitHub + Vercel

1. Write locally and commit to the `master` branch on GitHub
2. Vercel detects the push and automatically pulls and builds
3. The build script quietly does two nice things along the way:
   - **Auto-generates OG share images** from post frontmatter (`scripts/gen-og.mjs`), so sharing to social platforms is no longer a gray box
   - Runs **Pagefind** to build the on-site search index (with Chinese word-segmentation compensation)

## Analytics and Interaction: Privacy First

- **Umami (self-hosted)**: visit analytics with no third-party cookies — the data lives on my own server
- **Giscus**: GitHub Discussions–based comments, so readers can leave a message with their GitHub account

## What I Want to Optimize Next

- Make it easy for non-technical friends to contribute too
- Add a few more preset theme colors

---

Tools are a means; leaving a trace is the end. This chain is light enough that I hope to keep writing for a long time.
