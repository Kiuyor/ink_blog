---
title: How to Change the Production Branch in Vercel
published: 2026-07-31
description: Pushing code only triggers a Preview, not Production? You probably haven't set the Production branch correctly. The right entry is Settings → Environments, not the Git settings page.
image: ''
tags: [Vercel, Deployment, Tutorial]
category: Tech
draft: false
lang: en
---

Used to the straightforward "Production Branch" dropdown in Cloudflare Pages, when I switched back to Vercel and wanted to change the main branch, it was easy to dig through the Git settings page for ages without finding that option. This post records the correct entry point and a few ways to change it.

## The Problem

After pushing code to the `master` branch, Vercel only creates a **Preview** deployment and does not update the live Production environment. The usual cause: the project's Production branch still points elsewhere (for example, a leftover `main` from an old repo), and the branch you pushed isn't in the Production branch list.

> By the way: if you forked or imported an old repo, Vercel defaults to using the old repo's default branch as the Production branch, and you'll need to specify the new branch manually.

## The Correct Settings Entry

The Production branch is **not** in `Settings → Git` (many old tutorials and intuition point there, but the new Vercel moved it). It's here instead:

1. Open the Vercel project → **Settings** → **Environments**
2. Expand the **Production** item
3. Change the branch to the one you actually push to (e.g. `master`)
4. Click **Save**

After that, `git push origin master` will automatically trigger a Production deployment.

## Temporary Fix: Promote to Production

If you only occasionally need to promote a Preview deployment to production, you don't have to change the global setting:

1. Go to **Deployments**
2. Find the Preview build for the target branch (e.g. `master`)
3. Click the **⋯** menu on the right → choose **Promote to Production**

The effect is equivalent to changing the Production branch, except you have to click it manually each time.

## Command-Line Method

With the Vercel CLI installed and logged in, you can also do it in one line:

```bash
vercel project update --production-branch master
```

Handy to drop into a script or CI for batch processing.

## Summary

| Method | Entry | When to use |
|---|---|---|
| GUI (permanent) | Settings → Environments → Production → change branch → Save | Long-term fixed main branch |
| GUI (temporary) | Deployments → ⋯ → Promote to Production | Promote one preview to production |
| CLI | `vercel project update --production-branch <branch>` | Script / CI automation |

One key thing to remember: **the Production branch setting lives in Environments, not the Git settings page**. Find the right place and the problem is solved.
