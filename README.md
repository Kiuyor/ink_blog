# 🪶 ink_blog

> 墨水（ink）用纯 Markdown 写的中英双语个人博客——零后端、隐私友好、构建期自动出封面图。

基于 [Fuwari](https://github.com/saicaca/fuwari) fork 的 [Astro](https://astro.build) 5 + Svelte 5 + Tailwind 3 静态博客。默认中文（`/`），英文在 `/en/`；文章用 `<base>.zh.md` / `<base>.en.md` 同源双语，主题色品红紫（hue 300）。

[![Node.js 22.x](https://img.shields.io/badge/node.js-22.x-brightgreen)](https://nodejs.org)
[![pnpm 9](https://img.shields.io/badge/pnpm-9-blue)](https://pnpm.io)
[![Astro 5.13](https://img.shields.io/badge/Astro-5.13-ff5d01)](https://astro.build)
[![License: MIT](https://img.shields.io/badge/license-MIT-green)](./LICENSE)

- 🌐 线上地址：**https://blog.suchitems.top/**
- 📦 源码仓库：**https://github.com/Kiuyor/ink_blog**

## ✨ 项目亮点

- **中英双语原生支持**：`/` 中文、`/en/` 英文，按 `base slug` 共享路由、语言切换器双向互链；`llms.txt` / `rss.xml` 均提供中英文两个版本。
- **构建期自动生成 OG 图**：`scripts/gen-og.mjs` 用 satori + `@resvg/resvg-js` 在 `pnpm build` 最前面把每篇文章渲染成 `public/og/<slug>.png`，无需手做封面图、社交分享卡片开箱即用。
- **可复用自动翻译脚本**：`scripts/translate.mjs` 三后端自动切换 —— `DEEPLX_URL` > `DEEPL_API_KEY` > `OpenAI 兼容接口`（可接 OpenAI / DeepSeek / 通义 / 本地 Ollama），批量把缺 `.en.md` 的 `.zh.md` 译为英文，并保护代码块 / 数学公式 / 指令块不被机翻破坏。
- **零后端、隐私友好**：统计用自托管 [Umami](https://umami.is)（无 Cookie），评论用 [Giscus](https://giscus.app)（GitHub issue 承载）；全文搜索用 [Pagefind](https://pagefind.app)，并针对中文注入分词镜像补偿。
- **Markdown 富文本**：Admonition 提示框、GitHub 仓库卡片、Expressive Code 增强代码块（行号 / 折叠 / 语言徽标 / 自定义复制按钮）、KaTeX 数学公式、文内目录、平滑页面过渡。
- **机器可读优化（GEO）**：文章页输出 JSON-LD（BlogPosting / FAQPage / HowTo），并提供 `/llms.txt`、`/llms-full.txt` 端点。

## 📦 环境要求

| 依赖 | 版本 |
|---|---|
| Node.js | `22.x`（Vercel 已钉死，避免自动升 24 导致原生包不匹配） |
| pnpm | `9.x`（仓库锁 `pnpm@9.14.4`，`preinstall` 强制 only-allow pnpm） |

## 🚀 快速开始（本地）

```bash
# 1. 安装依赖
pnpm install

# 2. 启动开发服务器（默认 http://localhost:4321）
pnpm dev
```

> 在 `src/config.ts` 里改站点标题、副标题、头像、导航、主题色、Umami / Giscus 配置。

## ✍️ 写作流（Obsidian）

仓库根目录可直接「Open folder as vault」。新文章用 Templates 插件的 `templates/post.md` 生成，落盘到 `src/content/posts/`：

- 文件名即 slug（建议 kebab-case，如 `my-first-post.md`）。
- 双语：写 `my-first-post.zh.md` 与 `my-first-post.en.md`，各自在 frontmatter 标 `lang: zh` / `lang: en`。
- 草稿：`draft: true` 时 `pnpm build` 不会发布；改 `false` 即上线。
- 发布：`scripts/publish.sh`（存在 `INK_BLOG_PAT` 环境变量时走 token 注入 commit + push）。

## 📝 文章 Frontmatter

```yaml
---
title: 我的第一篇文章
published: 2026-08-01      # 必填，发布日期
updated: 2026-08-02       # 可选，更新日期
description: 这篇文章讲了什么
image: ./cover.jpg        # 可选，文章封面（相对路径或 URL）
tags: [Writing, Tools]    # 可选
category: Notes           # 可选
draft: false              # true 时不发布
lang: zh                  # zh | en；与文件名后缀对应
---
```

## 🧩 Markdown 扩展语法

除 Astro 默认的 [GitHub Flavored Markdown](https://github.github.com/gfm/) 外，还支持：

- **提示框**：`:::note` / `:::tip` / `:::warning` / `:::caution` / `:::important`，以及 `:::faq` / `:::howto{title="..."}`。
- **GitHub 仓库卡片**：`::github{repo="owner/name"}`。
- **增强代码块**（Expressive Code）：行号、可折叠分区、语言徽标、自定义复制按钮。
- **数学公式**：行内 `$E=mc^2$` 与块级 `$$...$$`（KaTeX）。

## ⚡ 常用命令

所有命令在项目根目录运行：

| 命令 | 作用 |
|---|---|
| `pnpm install` | 安装依赖 |
| `pnpm dev` | 本地开发服务器（localhost:4321） |
| `pnpm build` | 完整生产构建：生成 OG 图 → `astro build` → 注入中文分词 → Pagefind 索引 |
| `pnpm preview` | 本地预览构建产物 |
| `pnpm check` | Astro 类型 / 错误检查 |
| `pnpm new-post <文件名>` | 新建文章（落 `src/content/posts/`） |
| `pnpm translate` | 自动翻译缺 `.en.md` 的中文文为英文（见下） |
| `pnpm format` / `pnpm lint` | Biome 格式化 / 检查 |

## 🌍 自动翻译（`scripts/translate.mjs`）

后端按环境变量自动选择，优先级：`DEEPLX_URL` > `DEEPL_API_KEY` > `OPENAI_API_KEY`。

```bash
# 批量：把缺 .en.md 的 .zh.md 全部译为英文
pnpm translate

# 指定单篇
node scripts/translate.mjs src/content/posts/my-post.zh.md

# 用自建 DeepLX（免费）
DEEPLX_URL=http://localhost:1188 pnpm translate

# 用 OpenAI 兼容接口（可指向 DeepSeek / 通义 / 本地 Ollama）
OPENAI_API_KEY=sk-xxx OPENAI_BASE_URL=https://api.openai.com/v1 OPENAI_MODEL=gpt-4o-mini pnpm translate
```

保护机制：DeepL / DeepLX 路径会把代码块、行内代码、数学公式、`:::` 指令行替换成占位符，翻译后还原，避免机翻破坏语法。更多选项见脚本顶部注释（`DRY_RUN` / `FORCE` / `TEST` 等）。

## 🧭 项目结构（节选）

- `src/config.ts`：站点 / 导航 / 个人资料 / Umami / Giscus / 主题色等全部配置。
- `src/content/posts/`：文章（`.zh.md` / `.en.md` 双语成对）。
- `src/content/spec/`：`about.md` / `about.en.md` 等单页内容。
- `src/pages/`：路由；英文版放在 `src/pages/en/`（Astro 静态构建非默认语言页需物理文件）。
- `src/i18n/`：字典与 `setActiveLocale` / `i18n` / `siteSubtitle` 等辅助。
- `scripts/`：`gen-og.mjs`（OG 图）、`segment-zh.mjs`（中文分词）、`translate.mjs`（翻译）、`new-post.js`、`publish.sh`。
- `astro.config.mjs`：i18n、Expressive Code、Swup 过渡、Markdown/Rehype 插件链路。

## 🛠️ 部署（Vercel）

`vercel.json` 已配置：`framework: astro`、`buildCommand: pnpm build`、`outputDirectory: dist`。

- 仓库源码在 **`master`** 分支，Vercel 的 **Production Branch 必须设为 `master`**（默认是 `main`，旧分支已无用）。
- `engines.node` 钉死 `22.x`，防止 Vercel 自动升 24 导致 `@resvg/resvg-js` 原生包不匹配。

## 🤝 贡献

这是墨水（ink）的个人博客仓库，欢迎 Issue 与建议；如需基于此二次开发，请先 Fork。

## 📄 License

本项目采用**双层授权**：

- **代码**（主题、脚本、配置等软件部分）：[MIT License](./LICENSE)。基于 [Fuwari](https://github.com/saicaca/fuwari) 二次开发，保留原版权 © 2024 saicaca，并追加 © 2026 ink。你可以自由使用、修改、再发布这部分代码。
- **博客内容**（`src/content/` 下的全部文章、文字与图片）：**版权所有 © 2026 ink，保留所有权利（All Rights Reserved）**。未经作者书面许可，不得转载、复制、改编或用于任何用途。
- **第三方资源**（字体、图标、依赖库）：遵循其各自的原始许可证。
