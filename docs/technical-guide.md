# ink_blog 技术文档

> 面向开发者 / 维护者的内部技术参考。博客本身的用户说明见 [README.md](../README.md)。
> 本文档内容与 `src/` 下的真实实现保持一致；如实现更新，请同步修订本文件。

---

## 1. 项目概述

`ink_blog` 是墨水（ink）的个人静态博客，基于 [Fuwari](https://github.com/saicaca/fuwari) fork，在 Astro 5 + Svelte 5 + Tailwind 3 之上做了较深的二次定制：**中英双语**、**构建期自动 OG 图**、**可复用翻译脚本**、**自托管隐私统计**、**机器可读优化（GEO）** 等。

### 技术栈

| 层 | 选型 |
|---|---|
| 框架 | Astro `5.13.10`（SSG 静态生成） |
| UI 组件 | Svelte `5.39`（Svelte 5 岛屿） |
| 样式 | Tailwind `3.4` + Stylus + `@tailwindcss/typography` |
| 代码块 | Expressive Code `0.41`（行号 / 折叠 / 语言徽标 / 自定义复制按钮） |
| 数学 | KaTeX（`remark-math` + `rehype-katex`） |
| 内容 | Astro Content Collections（`src/content/posts`、`src/content/spec`） |
| 搜索 | Pagefind `1.4`（构建期索引） |
| 统计 | Umami（自托管，无 Cookie） |
| 评论 | Giscus（GitHub Discussions 承载） |
| 部署 | Vercel（`vercel.json`，生产分支 `master`） |

### 架构图

```mermaid
flowchart TB
    subgraph 源码
        MD[src/content/posts/*.md<br/>.zh.md / .en.md]
        CFG[src/config.ts<br/>站点/导航/i18n/Umami/Giscus]
        PAGES[src/pages/**<br/>根路由 + src/pages/en/**]
    end

    subgraph 构建流水线[`pnpm build`]
        OG[scripts/gen-og.mjs<br/>satori → resvg → public/og/*.png]
        ASTRO[astro build<br/>SSG 渲染 HTML+资源]
        SEG[scripts/segment-zh.mjs<br/>注入中文分词隐藏镜像]
        PF[pagefind --site dist<br/>生成 /pagefind/ 索引]
        OG --> ASTRO --> SEG --> PF
    end

    subgraph 产物[dist/]
        HTML[静态 HTML 页面<br/>/ 中文, /en/ 英文]
        ASSETS[_astro/*.js|css|webp]
        OGIMG[og/*.png 封面图]
        IDX[/pagefind/ 搜索索引]
    end

    MD --> ASTRO
    CFG --> ASTRO
    PAGES --> ASTRO
    ASTRO --> HTML
    ASTRO --> ASSETS
    ASTRO --> OGIMG
    SEG --> IDX
    PF --> IDX

    HTML --> VERCEL[Vercel 静态托管<br/>blog.suchitems.top]
```

### 目录结构（节选）

```
src/
  config.ts              # 站点/导航/个人资料/Umami/Giscus/主题色 全部配置
  types/config.ts        # 上述配置的 TypeScript 类型
  content/
    posts/               # 文章：<base>.zh.md 与 <base>.en.md 成对
    spec/                # 单页内容：about.md / about.en.md 等
  i18n/
    translation.ts       # setActiveLocale / i18n / siteSubtitle 等核心助手
    i18nKey.ts           # 字典 key 枚举
    languages/           # en / zh_CN / zh_TW / ja / ko / ... 字典
  pages/
    [...slug].astro      # 文章页（按 base slug 去重生路由）
    llms.txt.ts          # /llms.txt（zh）
    llms-full.txt.ts     # /llms-full.txt（zh）
    rss.xml.ts           # /rss.xml（zh）
    en/                  # 英文物理页副本（见 §5 国际化约定）
  utils/
    url-utils.ts         # 语言感知 URL 构建、base slug 解析
    content-utils.ts     # 排序/标签/分类聚合
    llms-txt.ts          # llms.txt / llms-full.txt 构建器
    structured-data.ts   # 从正文抽取 FAQPage / HowTo JSON-LD
    date-utils.ts        # 日期格式化
  components/
    LanguageSwitcher.astro
    widget/Profile.astro
    misc/Markdown.astro, ImageWrapper.astro, Giscus.astro, PostMeta.astro
scripts/
  gen-og.mjs             # 构建期 OG 图
  segment-zh.mjs         # 中文分词注入（Pagefind 补偿）
  translate.mjs          # 中英双语自动翻译
  new-post.js            # 新建文章骨架
  publish.sh             # 提交 + 推送
```

---

## 2. 快速开始

```bash
# 环境：Node.js 22.x、pnpm 9.x
pnpm install            # 安装依赖（preinstall 强制 only-allow pnpm）
pnpm dev                # 本地开发：http://localhost:4321
pnpm build              # 完整生产构建（见下方四步链）
pnpm preview            # 本地预览 dist/
```

`pnpm build` 实际执行：

```bash
node scripts/gen-og.mjs && astro build && node scripts/segment-zh.mjs && pagefind --site dist
```

即：① 生成 OG 图 → ② Astro 静态渲染 → ③ 注入中文分词镜像 → ④ Pagefind 建立搜索索引。

---

## 3. 核心模块 API 参考

### 3.1 `@i18n/translation` — 国际化核心

| 函数 | 签名 | 说明 |
|---|---|---|
| `setActiveLocale` | `(lang?: string) => void` | 设定**当前请求**的激活语言（模块级变量）。`Layout`/页面 frontmatter 必须调用它（如 `setActiveLocale(Astro.currentLocale)`），否则 `i18n()` 默认回退到 `siteConfig.lang`。 |
| `getActiveLocaleShort` | `() => "zh" \| "en"` | 返回短语言码，用于 URL / `<html lang>`。 |
| `i18n` | `(key: I18nKey) => string` | 取当前激活语言下的 UI 文案。依赖 `activeLocale`，因此必须在 `setActiveLocale` 之后调用。 |
| `siteSubtitle` | `(localeShort?: "zh" \| "en") => string` | 语言感知的站点副标题：`en` 用 `siteConfig.subtitleEn`，否则用 `siteConfig.subtitle`；可显式传参（RSS/llms 构建器等非渲染上下文中使用）。 |
| `getTranslation` | `(lang: string) => Translation` | 取某语言的完整字典对象。 |
| `normalizeDictKey` | `(lang: string) => keyof map` | 把任意 locale 字符串（`zh_CN`/`zh-cn`/`zh`/`en_US`/...）归一化为字典 key（`zh_cn`/`en`/...）。 |

> ⚠️ `activeLocale` 是**模块级单例**。Astro 静态构建按页渲染，每页必须显式 `setActiveLocale(Astro.currentLocale)` 才能拿到正确的 UI 文案——这是该 i18n 方案最易踩的坑。

### 3.2 `@utils/url-utils` — URL 构建

| 函数 | 签名 | 说明 |
|---|---|---|
| `getLocaleUrl` | `(path: string, locale?: string) => string` | **内部页面**的语言感知 URL 构造器：`en` 时加 `/en` 前缀。注意静态资源（favicon/字体/OG 图）不要用它，改用 `url()`。 |
| `getBaseSlug` | `(slug: string) => string` | 去掉 `.md` 再去掉 `.zh`/`.en`/`.zh_cn`/`.zh_tw` 后缀，得到 base slug。用于把 `hello-im-ink.zh.md` 与 `hello-im-ink.en.md` 归一为同一路由。 |
| `getPostUrlBySlug` | `(slug: string, locale?: string) => string` | 由文章 id（含 `.zh.md`）生成文章页 URL，内部走 `getBaseSlug` + `getLocaleUrl`。 |
| `getTagUrl` | `(tag: string, locale?: string) => string` | 标签归档页 URL（`/archive/?tag=...`）。 |
| `getCategoryUrl` | `(category: string \| null, locale?: string) => string` | 分类归档页 URL（`/archive/?category=...` 或 `?uncategorized=true`）。 |
| `getDir` | `(path: string) => string` | 返回路径的目录部分。 |
| `url` | `(path: string) => string` | 基于 `BASE_URL` 的**静态资源** URL 构造器（永不带语言前缀）。 |
| `pathsEqual` | `(p1: string, p2: string) => boolean` | 归一化首尾斜杠后比较两条路径是否等价。 |

### 3.3 `@utils/content-utils` — 内容聚合

| 函数 | 签名 | 说明 |
|---|---|---|
| `getSortedPosts` | `() => Promise<CollectionEntry<"posts">[]>` | 按 `published` 倒序；顺带在 `data.nextSlug/prevSlug`（存的是 **`entry.id`**）与 `nextTitle/prevTitle` 上写入前后文（用于文章页上一篇/下一篇）。`PROD` 环境下过滤 `draft`，`DEV` 保留草稿。 |
| `getSortedPostsList` | `() => Promise<PostForList[]>` | 同上排序但只返回 `{ slug: post.id, data }`（`slug` 实为 `entry.id`，供列表页拼接 URL）。 |
| `getTagList` | `() => Promise<Tag[]>` | 聚合全部标签及计数，按名称排序。 |
| `getCategoryList` | `() => Promise<Category[]>` | 聚合分类及计数，含 `url`（经 `getCategoryUrl`）。未分类归入 `i18n(uncategorized)`。 |

> ⚠️ `nextSlug`/`prevSlug` 字段存的是 `entry.id`（如 `hello-im-ink.zh.md`，**带点带扩展名**），不是 slugified slug。拼接 URL 时务必经 `getPostUrlBySlug(entry.id)`。

### 3.4 `@utils/structured-data` — GEO 结构化数据

从文章**原始 Markdown** 抽取 `schema.org` JSON-LD 的 FAQPage / HowTo 节点，镜像页面可见内容（无额外依赖）。

```ts
interface FaqItem   { question: string; answer: string }
interface HowToStep { name: string; text: string }
interface HowToData { name: string; steps: HowToStep[] }
interface StructuredData { faq: FaqItem[]; howTo: HowToData | null }

extractStructuredData(body: string, fallbackTitle?: string): StructuredData
```

识别约定（与可见渲染一致，靠 `:::faq` / `:::howto{title="..."}` 指令块；也会从任意含 `问：`/`Q:` 的提示框、以及「步骤/教程/操作指南」标题后接的有序列表中抽取）。文章页 `src/pages/posts/[...slug].astro` 据此追加 `FAQPage` / `HowTo` JSON-LD。

### 3.5 `@utils/llms-txt` — 机器可读索引

```ts
buildLlmsTxt(siteBase: string, locale?: string): Promise<string>   // → /llms.txt 与 /en/llms.txt
buildLlmsFullTxt(siteBase: string, locale?: string): Promise<string> // → /llms-full.txt 与 /en/llms-full.txt
```

按 `locale`（默认 `zh`）过滤文章，输出 [llms.txt](https://llmstxt.org) 规范文件；标题用 `siteConfig.title`，副标题用 `siteSubtitle(loc)`，列表用 `getLocaleUrl` 生成语言感知链接。

### 3.6 `src/types/config.ts` — 配置类型（节选）

```ts
type SiteConfig = {
  title: string; subtitle: string; subtitleEn?: string;   // 英文副标题（/en/ 用）
  lang: "en"|"zh_CN"|"zh_TW"|"ja"|"ko"|"es"|"th"|"vi"|"tr"|"id";
  themeColor: { hue: number; fixed: boolean };           // 当前 hue=300（品红紫）
  banner: { enable; src; position?; credit: {enable; text; url?} };
  toc: { enable: boolean; depth: 1|2|3 };
  favicon: Favicon[];
};
enum LinkPreset { Home=0; Archive=1; About=2 }
type NavBarConfig = { links: (NavBarLink | LinkPreset)[] }
type ProfileConfig = { avatar?; name; bio?; links: {name; url; icon}[] }
type GiscusConfig = { enabled; repo; repoId; category; categoryId; mapping; strict; ... ; lang }
type UmamiConfig  = { enabled; src; websiteId }
```

完整字段以 `src/types/config.ts` 为准；实际取值见 `src/config.ts`。关闭评论/统计只需把对应 `enabled` 设为 `false`，无需删代码。

---

## 4. 脚本参考

### 4.1 `scripts/gen-og.mjs` — 构建期 OG 图

在 `pnpm build` 最前一步运行：读 `src/content/posts/*.md` 的 frontmatter，用 **satori** 渲染 SVG、**@resvg/resvg-js** 光栅化为 PNG，输出到 `public/og/<slug>.png`（astro build 一并拷入 `dist/og`）。另生成 `default.png` 供首页/关于页等无文章上下文的页面使用。

- 字体：构建时从 CDN 下载 **Noto Sans SC**（缓存于 `node_modules/.cache/og-fonts`，避免重复下载；因此构建机需要能访问 jsdelivr / github raw）。
- 头像：读取 `src/assets/images/ink-avatar.png`，转 JPEG 并平铺到暗色圆盘背景（避免 satori 下透明 PNG 不可见）。
- slug 取值：`data.slug || 文件名去 .md`。文章页按 `og/<base>.<localeShort>.png` 引用（`/en/` 用英文版 OG 图）。
- 草稿（`draft: true`）跳过。

### 4.2 `scripts/segment-zh.mjs` — 中文分词注入

Pagefind 对 `zh-cn` 无内置分词/词边界，短语会被当成一个整体难以命中。该脚本在 `astro build` 后遍历 `dist/**/*.html`，对每个 `data-pagefind-body` 用 `Intl.Segmenter("zh-CN", {granularity:"word"})`（Node 内置 ICU）抽取文本、按词空格切分，注入一个 `display:none` 的隐藏镜像 `<div data-pagefind-body class="pagefind-zh-seg">`，使每个词成为独立可搜 token，**不改变可见页面**。幂等（已注入则跳过）。切分只读 cheerio 抽取文本、用字符串替换注入，避免重新序列化破坏文档。

### 4.3 `scripts/translate.mjs` — 中英双语自动翻译

把 `.zh.md`（或任意 Markdown）译为英文并写出 `.en.md`。后端按环境变量**自动选择**，优先级：

```
DEEPLX_URL  >  DEEPL_API_KEY  >  OPENAI_API_KEY
```

| 环境变量 | 作用 |
|---|---|
| `DEEPLX_URL` | DeepLX 兼容服务地址（如 `http://localhost:1188`），设置即启用该后端 |
| `DEEPLX_TOKEN` | DeepLX 访问令牌（部分自建实例需要，可选） |
| `DEEPL_API_KEY` | 官方 DeepL key |
| `DEEPL_FREE` | `"false"` 用付费域名 `api.deepl.com`，默认 `true` 用免费域名 |
| `OPENAI_API_KEY` | OpenAI 兼容接口 key |
| `OPENAI_BASE_URL` | 接口地址，默认 `https://api.openai.com/v1`（可指向 DeepSeek / 通义 / 本地 Ollama） |
| `OPENAI_MODEL` | 模型名，默认 `gpt-4o-mini` |
| `TARGET_LANG` / `SOURCE_LANG` | 目标/源语言，默认 `EN` / `ZH` |
| `TRANSLATE_TAGS` | `"false"` 时不翻译 `tags`/`category`，默认 `true` |
| `DRY_RUN=1` | 只打印结果不写文件 |
| `FORCE=1` | 覆盖已存在的 `.en.md` |
| `TEST=1` | 脱网自测（遮蔽→还原 round-trip，校验代码块/数学/指令块不被破坏） |

用法：

```bash
pnpm translate                                   # 批量：翻译所有缺 .en.md 的 .zh.md
node scripts/translate.mjs src/content/posts/x.zh.md   # 单篇
DEEPLX_URL=http://localhost:1188 pnpm translate  # DeepLX 后端
OPENAI_API_KEY=sk-xxx pnpm translate             # OpenAI 兼容后端
DRY_RUN=1 pnpm translate                         # 预览
```

**结构保护**：DeepL / DeepLX 路径会把代码块、行内代码、数学公式（`$..$`/`$$..$$`）替换成 `ZP<n>Z` 占位符、把 `::` 开头的指令行替换成 `XD<n>X` 占位符再翻译，译后还原——避免机翻破坏语法。代价：指令块里的 `title="..."` 参数值**不会**被翻译。OpenAI 路径整篇直译、质量更高，同样在 system prompt 里约束保留所有语法。

### 4.4 `scripts/new-post.js` — 新建文章骨架

```bash
pnpm new-post my-first-post      # 生成 src/content/posts/my-first-post.md
```

创建带 frontmatter 模板（title/published/description/image/tags/category/draft/lang）的空文件，`lang` 留空、默认 `draft: false`。双语写作请改名成 `<base>.zh.md` 并另建 `<base>.en.md`。

### 4.5 `scripts/publish.sh` — 提交并推送

```bash
./scripts/publish.sh "commit message"     # 在本地机器运行（非沙箱）
```

`git add -A` + commit（无改动则跳过）+ `git push origin master`。若环境变量 `INK_BLOG_PAT` 存在，则用 `https://x-access-token:<PAT>@github.com/...` 临时注入后还原 remote（PAT 不落盘）。推送后 Vercel 自动重建。

---

## 5. 内容与国际化约定

### 5.1 双语内容模型

- 站点以**中文为默认语言**，`prefixDefaultLocale: false` → `/` 中文、`/en/` 英文。
- 文章用同名 base slug 成对存放：`<base>.zh.md` 与 `<base>.en.md`，各自 frontmatter 标 `lang: zh` / `lang: en`。
- 文章页 `getStaticPaths` 按 **base slug**（`getBaseSlug(entry.id)`）去重生路由，渲染期按 `Astro.currentLocale` 选对应语言版本，缺另一语言时回退同 base 任一版本。

### 5.2 非默认语言页必须提供物理文件

> ⚠️ **Astro i18n 静态构建不会自动生成非默认语言的页面。** `/en/*` 必须由 `src/pages/en/` 下的物理文件提供（复制根页、相对导入改别名 `@components/*`/`@utils/*`/`@i18n/*`/`@layouts/*`/`@constants/*`）。目前已有 `en/about.astro`、`en/archive.astro`、`en/[...page].astro`、`en/posts/[...slug].astro`、`en/llms.txt.ts`、`en/llms-full.txt.ts`、`en/rss.xml.ts`。

### 5.3 命名与查找陷阱（实测）

1. **`entry.slug` 被 slugify 去点**：`hello-im-ink.zh.md` → slug `hello-im-inkzh`（无点）。URL 拼接一律用 **`entry.id`**（`hello-im-ink.zh.md`，保留点+扩展名）+ `getBaseSlug`，不要依赖 `entry.slug`。
2. **`getEntry(collection, key)` 按 slug 匹配**（点被吞）：按 id 查找须 `getCollection(...)` 后自己 `find(e => e.id === ...)`，别直接 `getEntry("spec", "about.en.md")`。
3. **导航双重前缀**：`getLinkPresets()` 返回**裸路径**（`/about/`），由 Navbar/NavMenuPanel 用 `getLocaleUrl()` 统一解析一次；若预设自身已带 `/en` 前缀会被再包一层变成 `/en/en/`。

### 5.4 文章 frontmatter schema

由 `src/content/config.ts` 约束：

```yaml
title: 必填，字符串
published: 必填，日期
updated: 可选，日期
draft: 可选，默认 false（true 时生产构建不发布）
description: 可选，默认 ""
image: 可选，封面（相对路径或 URL）
tags: 可选，字符串数组
category: 可选，字符串（可为 null）
lang: 可选，通常 "zh" | "en"
# 以下为内部使用，由 getSortedPosts 填充：
prevTitle/prevSlug/nextTitle/nextSlug
```

### 5.5 Markdown 扩展语法

- 提示框：`:::note` / `:::tip` / `:::warning` / `:::caution` / `:::important`，以及 `:::faq`、`:::howto{title="..."}`。
- GitHub 卡片：`::github{repo="owner/name"}`。
- 增强代码块：行号、可折叠、语言徽标、自定义复制按钮（Expressive Code）。
- 数学：`$E=mc^2$`（行内）、`$$...$$`（块级，KaTeX）。

---

## 6. 部署

`vercel.json` 已配置：`framework: astro`、`buildCommand: pnpm build`、`outputDirectory: dist`、`installCommand: pnpm install`。

- 源码在 **`master`** 分支；Vercel 的 **Production Branch 必须设为 `master`**（默认是 `main`，旧分支已无用）。
- `engines.node` 钉死 `22.x`，防止 Vercel 自动升 24 导致 `@resvg/resvg-js` 原生包不匹配。
- 推送即触发构建；OG 图与中文分词在构建期由脚本生成，无需提交 `public/og`（已 gitignore）。

---

## 7. 常见问题（FAQ）

**Q：`/en/` 下某些页面 404？**
A：非默认语言页静态构建不会自动生成，确认 `src/pages/en/` 下是否有对应物理文件（§5.2）。

**Q：文章 URL 出现 `hello-im-inkzh` 这种无点 slug？**
A：误用了 `entry.slug`。一律改用 `entry.id` + `getBaseSlug`（§5.3-1）。

**Q：中文搜索命中率低？**
A：Pagefind 对 `zh-cn` 无分词，`scripts/segment-zh.mjs` 已在构建期注入隐藏分词镜像作为补偿；若仍不理想，可检查构建日志是否出现 `Intl.Segmenter unavailable`（回退到字符级切分）。

**Q：机翻把代码块/公式翻坏了？**
A：`translate.mjs` 对 DeepL/DeepLX 路径做了占位符遮蔽（§4.3）；建议优先用 OpenAI 兼容后端（整篇直译、质量更高）。翻译前用 `DRY_RUN=1` 预览。

**Q：换主题色 / 关评论 / 关统计？**
A：改 `src/config.ts` 的 `themeColor.hue` / `giscusConfig.enabled` / `umamiConfig.enabled` 即可，无需改代码或删依赖。

**Q：本地构建在清 `dist` 阶段进程被杀？**
A：这是本地开发沙箱环境（D 盘 safe-delete 拦截）的问题，云端 Vercel 构建不受影响。本地验证构建请关闭沙箱隔离运行 `pnpm build`。
