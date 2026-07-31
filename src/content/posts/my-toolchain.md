---
title: 我的写作工具链
published: 2026-07-30
description: 从在 Obsidian 里写 Markdown，到推上 GitHub 自动部署上线——记录我这个博客背后的工具与流程。
image: ''
tags: [工具, 写作]
category: 写作
draft: false
lang: ''
---

写这个博客，我的工具链追求一条原则：**内容永远是纯文本，发布尽量零点击**。

## 写作：Obsidian

整个仓库（含 `src/content/posts`）直接当 Obsidian 的 vault 打开。新文章用「模板」核心插件插入 `post` 模板，frontmatter 骨架自动铺好，我只需要填标题和正文。

::tip{title="为什么是 Obsidian 而不是在线 CMS"}
我是唯一作者，纯 Markdown 写作最顺手；Obsidian 又能直接编辑仓库里的 `.md`，写完推上去就上线，没有中间转换层。
::

## 内容格式：纯 Markdown

所有文章就是 `src/content/posts/*.md`，frontmatter 字段包含标题、日期、标签、分类、是否草稿等。富文本能力（KaTeX 公式、代码块、提示框、GitHub 卡片）也是直接手敲 Markdown 语法——编辑器不提供可视化，但换来的是十年后还能打开、换个引擎照样渲染。

## 版本与部署：Git + GitHub + Vercel

1. 本地写好，提交到 GitHub 的 `master` 分支
2. Vercel 监听到推送，自动拉取并构建
3. 构建脚本会顺手做两件省心事：
   - 用文章 frontmatter **自动生成 OG 分享图**（`scripts/gen-og.mjs`），发到社交平台不再是一张灰图
   - 跑 **Pagefind** 生成站内搜索索引（中文做了分词补偿）

## 统计与互动：隐私优先

- **Umami（自托管）**：访问统计，不埋第三方 Cookie，数据在我自己的服务器上
- **Giscus**：基于 GitHub Discussions 的评论，读者用 GitHub 账号即可留言

## 接下来想优化的

- 让非技术的朋友也能轻松投稿
- 主题色再多几套预设

---

工具是手段，留痕才是目的。这套链路够轻，我希望自己能一直写下去。
