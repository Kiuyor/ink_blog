---
title: Vercel 里如何更改 Production 分支
published: 2026-07-31
description: 推代码只走 Preview、不进 Production？多半是 Production 分支没配对。正确的设置入口在 Settings → Environments，而不是 Git 设置页。
image: ''
tags: [Vercel, 部署, 教程]
category: 技术
draft: true
lang: ''
---

习惯了 Cloudflare Pages 的「 Production 分支」直白下拉，刚切回 Vercel 想改主干分支时，很容易在 Git 设置页里翻半天也找不到那个选项。本文记录一下正确的入口和几种改法。

## 问题现象

把代码推到 `master` 分支后，Vercel 只生成了一条 **Preview（预览）** 部署，并不会更新线上 Production 环境。原因通常是：项目的 Production 分支还指向别的（比如老仓库遗留下来的 `main`），而你推送的分支不在 Production 分支列表里。

> 顺带一提：如果你fork/导入的是旧仓库，Vercel 默认会沿用旧仓库的默认分支作为 Production 分支，新分支需要手动指定。

## 正确的设置入口

Production 分支**不在** `Settings → Git` 里（很多老教程和直觉都指向那，但新版 Vercel 把它挪走了），而是在：

1. 打开 Vercel 项目 → **Settings** → **Environments**
2. 点开 **Production** 那一项
3. 把分支改成你实际推送的分支（例如 `master`）
4. 点 **Save** 保存

改完之后，再 `git push origin master` 就会自动走 Production 部署了。

## 临时方案：Promote to Production

如果只是偶尔要把某一次 Preview 部署提升到生产环境，不必改全局设置：

1. 进入 **Deployments**
2. 找到目标分支（如 `master`）对应的 Preview 构建
3. 点右侧的 **⋯** 菜单 → 选择 **Promote to Production**

效果和改 Production 分支等价，只是每次都要手动点一次。

## 命令行方式

装有 Vercel CLI 并登录后，也可以一行搞定：

```bash
vercel project update --production-branch master
```

适合写进脚本或 CI 里批量处理。

## 小结

| 方式 | 入口 | 适用场景 |
|---|---|---|
| 图形界面（永久） | Settings → Environments → Production → 改分支 → Save | 长期固定主干分支 |
| 图形界面（临时） | Deployments → ⋯ → Promote to Production | 单次把某次预览提升为生产 |
| 命令行 | `vercel project update --production-branch <branch>` | 脚本 / CI 自动化 |

关键记一点：**Production 分支设置在 Environments，不在 Git 设置页**。找对地方，问题就解决了。
