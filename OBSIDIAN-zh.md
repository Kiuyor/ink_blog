# 用 Obsidian 写博客（中文版设置）

本仓库已配置好「把 `src/content/posts` 当 Obsidian 库直接写」的写作流。
配套文件：

- `templates/post.md` —— 文章模板（frontmatter 已对齐 Astro 的 posts schema）
- `.obsidian/app.json` —— 本地库配置（已 gitignore，不进仓库）：忽略构建产物、新笔记默认落 `src/content/posts`、模板文件夹指向 `templates`
- `scripts/publish.sh` —— 一键发布（commit + push）

> 说明：`.obsidian/app.json` 用的是插件内部键名，跟界面语言无关；用中文版 Obsidian 打开同样生效，只是菜单文字变成中文。

---

## 第 1 步：把仓库当「库」打开

1. 菜单 `文件` → `打开文件夹作为库`（英文 Open folder as vault）
2. 选仓库根目录 `D:\DesktopProjects\blog\ink_blog`
3. 自动套用配置：
   - 新笔记默认位置 = `src/content/posts`（中文设置项叫「新建笔记位置」）
   - 忽略 `node_modules` / `dist` / `.workbuddy` / `public/og` / `*.mjs` / `pnpm-lock.yaml`（中文「文件和链接 → 不显示的文件/文件夹」）

## 第 2 步：启用「模板」核心插件

1. `设置` → `核心插件` → 找到 `模板`，打开开关
2. 进入 `模板` 设置，确认「模板文件夹位置」= `templates`（已预置，正常不用改；空白就手动填 `templates`）
3. 确认「日期格式」= `YYYY-MM-DD`（插值时 `{{date}}` 按此生成）

## 第 3 步：新建笔记并插入模板

1. `文件` → `新建笔记`（或 Ctrl/Cmd+N）
2. 打开 `命令面板`（Ctrl/Cmd+P）→ 输入 `模板：插入模板`（Templates: Insert template）→ 选 `post`
3. 模板铺好 frontmatter 后，填标题/正文；发布前把 `draft: true` 改成 `draft: false`
4. 本地预览：`pnpm build`；发布：见下方「发布」

---

## 文章模板字段说明

`templates/post.md` 的 frontmatter 对应 `src/content/config.ts` 的 schema：

| 字段 | 含义 | 说明 |
|---|---|---|
| `title` | 标题 | Obsidian 插入模板时自动填 `{{title}}` |
| `published` | 发布日期 | 自动填 `{{date}}`，格式 `YYYY-MM-DD` |
| `description` | 摘要 | 用于列表卡片与 SEO |
| `image` | 封面图 | 可选，留空则无 |
| `tags` | 标签 | 数组，如 `["随笔", "技术"]` |
| `category` | 分类 | 可选 |
| `draft` | 草稿 | `true` 不发布，`false` 才上线 |
| `lang` | 语言 | `zh_CN` / `en` 等，可选 |

## 发布

- 本机终端一键发布（设了 `INK_BLOG_PAT` 就走 token 注入，否则普通 push）：
  ```bash
  cd D:\DesktopProjects\blog\ink_blog
  INK_BLOG_PAT=ghp_xxx ./scripts/publish.sh "新文章：xxx"
  ```
- 或手动 push：
  ```bash
  git add -A
  git commit -m "post: xxx"
  git push origin master
  ```
- 推上去后 Vercel 自动重建，`scripts/gen-og.mjs` 会按新 frontmatter 自动生成 OG 分享图。

## 注意事项

- **文件名即 slug**，用 kebab-case（如 `my-first-post.md`）。
- **富文本靠手敲 Markdown**：KaTeX 公式、代码块、`:::note` / `:::tip` / `:::warning` 提示框、GitHub 卡片等，在 Obsidian 里仍是直接写 Markdown 语法，编辑器不提供可视化——Decap/思源也一样。
- `.obsidian/` 已被 gitignore，你的本地库设置不会污染仓库；模板与发布脚本是仓库文件，会随 push 上线。
