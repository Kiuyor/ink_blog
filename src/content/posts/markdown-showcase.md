---
title: 这个博客能写什么（富文本能力一览）
published: 2026-07-30
description: 占位草稿——用一篇 demo 展示本博客支持的 Markdown 富表达能力，方便你写作时参考。
image: ''
tags: [写作, Markdown]
category: 写作
draft: false 
lang: ''
---

> 占位草稿：这篇同时是"能力展示"，你可以直接照着抄格式，也可以删掉换成别的。

这个博客基于 **Astro + Expressive Code**，对写技术内容特别友好。下面是几种常用能力。

## 1. 提示框（Admonition）

:::note
这是一条普通备注（note）。
:::

:::tip
这是一条建议（tip），绿色。
:::

:::warning
这是一条警告（warning），黄色。
:::

:::caution
这是一条危险提示（caution），红色。
:::

## 2. 代码块（带行号、复制按钮、语言徽章）

```ts title="src/hello.ts" {2}
function greet(name: string): string {
  return `Hello, ${name}!`;
}

console.log(greet("墨水"));
```

## 3. 数学公式（KaTeX）

行内公式如 $E = mc^2$，块级公式：

$$
\int_{-\infty}^{\infty} e^{-x^2}\,dx = \sqrt{\pi}
$$

## 4. GitHub 卡片

::github{repo="kiuyor/ink_blog"}

## 5. 引用与分隔

> 引用一段话，强调重点。

---

## 6. 常见问题（FAQ）

:::faq
**问：这篇是模板还是真实内容？**
目前是占位草稿，你可以照着上面的格式替换成自己的文章。

**问：支持中文搜索吗？**
支持，已经接入中文分词，搜索中文词也能准确命中。
:::

## 7. 操作步骤示例（HowTo）

:::howto{title="如何本地预览这个博客"}
1. 第一步：安装依赖 —— 运行 `pnpm install`
2. 第二步：启动开发服务器 —— 运行 `pnpm dev`
3. 第三步：浏览器打开本地地址即可预览
:::

写完了。把这篇替换成你自己的内容，或直接删掉都行。
