---
title: What You Can Write on This Blog (A Tour of Rich-Text Features)
published: 2026-07-30
description: A demo post showcasing the Markdown rich-text capabilities supported by this blog. You can copy the formatting directly when writing.
image: ''
tags: [Writing, Markdown]
category: Writing
draft: false
lang: en
---

This blog is built on **Astro + Expressive Code**, which makes it especially friendly for writing technical content. Below are a few common capabilities you can copy directly.

## 1. Admonitions

:::note
This is a regular note.
:::

:::tip
This is a tip — green.
:::

:::warning
This is a warning — yellow.
:::

:::caution
This is a caution — red.
:::

## 2. Code Blocks (with line numbers, copy button, and language badge)

```ts title="src/hello.ts" {2}
function greet(name: string): string {
  return `Hello, ${name}!`;
}

console.log(greet("ink"));
```

## 3. Math Formulas (KaTeX)

Inline like $E = mc^2$, and block-level:

$$
\int_{-\infty}^{\infty} e^{-x^2}\,dx = \sqrt{\pi}
$$

## 4. GitHub Card

::github{repo="kiuyor/ink_blog"}

## 5. Quotes and Dividers

> A blockquote to emphasize a key point.

---

## 6. FAQ

:::faq
**Q: Is this post a template I can copy directly?**
Yes — the formatting from admonitions to FAQ can be reused as-is; just swap in your own content.

**Q: Does it support Chinese search?**
Yes. On-site search is powered by Pagefind, with extra Chinese word-segmentation compensation, so common Chinese terms are matched accurately.
:::

## 7. Step-by-Step Example (HowTo)

:::howto{title="How to preview this blog locally"}
1. Step 1: Install dependencies — run `pnpm install`
2. Step 2: Start the dev server — run `pnpm dev`
3. Step 3: Open the local address in your browser to preview
:::

For writing technical articles, this set of capabilities is basically enough.
