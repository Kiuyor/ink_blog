#!/usr/bin/env node
/**
 * scripts/translate.mjs
 * 中英双语文章翻译脚本：读取 .zh.md（或任意 Markdown）→ 调用翻译后端 → 写出 .en.md。
 *
 * 后端自动选择（按 env，首个命中的即生效）：
 *   - 若设置了 DEEPLX_URL       → 使用 DeepLX（免费的 DeepL 兼容自建服务，如 http://localhost:1188）
 *   - 否则若设置了 DEEPL_API_KEY → 使用 DeepL
 *   - 否则若设置了 OPENAI_API_KEY → 使用 OpenAI 兼容接口
 *     （可指向 OpenAI / DeepSeek / 通义千问 / 本地 Ollama，只需改 OPENAI_BASE_URL）
 *
 * 环境变量：
 *   DEEPLX_URL         DeepLX 服务地址（如 http://localhost:1188），设置即启用 DeepLX 后端
 *   DEEPLX_TOKEN       DeepLX 访问令牌（部分自建实例需要，可选）
 *   OPENAI_API_KEY     OpenAI 兼容接口的 key（使用该后端时必填）
 *   OPENAI_BASE_URL    接口地址，默认 https://api.openai.com/v1
 *   OPENAI_MODEL       模型名，默认 gpt-4o-mini
 *   DEEPL_API_KEY      DeepL key（填了就优先走 DeepL）
 *   DEEPL_FREE         "false" 用付费域名 api.deepl.com，默认 true 用免费域名
 *   TARGET_LANG        目标语言，默认 EN
 *   SOURCE_LANG        源语言，默认 ZH
 *   TRANSLATE_TAGS     "false" 时不翻译 tags/category，默认 true
 *   DRY_RUN=1          只打印结果不写文件
 *   FORCE=1            覆盖已存在的 .en.md
 *   TEST=1             运行内部自测（脱网，校验代码块/数学公式/指令块的遮蔽还原）
 *
 * 用法：
 *   node scripts/translate.mjs                 # 批量：翻译所有缺 .en.md 的 .zh.md
 *   node scripts/translate.mjs <file.md>       # 翻译单个文件
 *   DRY_RUN=1 node scripts/translate.mjs       # 预览不落盘
 *   DEEPLX_URL=http://localhost:1188 node scripts/translate.mjs
 *   OPENAI_API_KEY=sk-... node scripts/translate.mjs
 *   DEEPL_API_KEY=xxx node scripts/translate.mjs
 */

import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const POSTS_DIR = path.join(process.cwd(), "src/content/posts");

const cfg = {
  openaiKey: process.env.OPENAI_API_KEY || "",
  openaiBase: (process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, ""),
  openaiModel: process.env.OPENAI_MODEL || "gpt-4o-mini",
  deeplKey: process.env.DEEPL_API_KEY || "",
  deeplFree: process.env.DEEPL_FREE !== "false",
  deeplxUrl: process.env.DEEPLX_URL || "",
  deeplxToken: process.env.DEEPLX_TOKEN || "",
  translateTags: (process.env.TRANSLATE_TAGS || "true") !== "false",
  targetLang: process.env.TARGET_LANG || "EN",
  sourceLang: process.env.SOURCE_LANG || "ZH",
  dryRun: process.env.DRY_RUN === "1",
  force: process.env.FORCE === "1",
};

function pickBackend() {
  if (!cfg._backend) {
    if (cfg.deeplxUrl) cfg._backend = "deeplx";
    else if (cfg.deeplKey) cfg._backend = "deepl";
    else if (cfg.openaiKey) cfg._backend = "openai";
    else throw new Error("未配置翻译后端：请设置 DEEPLX_URL、DEEPL_API_KEY 或 OPENAI_API_KEY");
  }
  return cfg._backend;
}

/* ----------------------------- OpenAI 兼容接口 ----------------------------- */

async function translateOpenAI(text, isFullFile) {
  const system = isFullFile
    ? [
        "You are a professional translator. Translate the following Chinese Markdown blog post into natural, fluent English.",
        "Rules:",
        "(1) Keep the YAML frontmatter and ALL its keys exactly; only translate the human-readable values of title/description and (if present) tags/category.",
        "(2) Preserve ALL code fences, inline code, KaTeX math ($...$ and $$...$$), HTML, links, and directive syntax such as :::note, :::tip, :::warning, :::caution, :::faq, :::howto{title=\"...\"}, ::tip{title=\"...\"}, ::github{repo=\"...\"} — do not translate directive keywords or parameter names, but you may translate the quoted title values and the visible text inside directive blocks.",
        "(3) Do not add or remove any headings, list items, or blank lines.",
        "(4) Return ONLY the translated Markdown file, with no code fence and no extra commentary.",
      ].join(" ")
    : "Translate the following Chinese text into natural, fluent English. Preserve any inline code, KaTeX math, links, and markup exactly. Return only the translation with no commentary.";
  const res = await fetch(`${cfg.openaiBase}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${cfg.openaiKey}` },
    body: JSON.stringify({
      model: cfg.openaiModel,
      messages: [
        { role: "system", content: system },
        { role: "user", content: text },
      ],
      temperature: 0.2,
    }),
  });
  if (!res.ok) throw new Error(`OpenAI 请求失败 ${res.status}: ${await res.text()}`);
  const json = await res.json();
  return json.choices?.[0]?.message?.content?.trim() ?? "";
}

/* --------------------------------- DeepL ----------------------------------- */

async function translateDeepl(text) {
  const endpoint = cfg.deeplFree
    ? "https://api-free.deepl.com/v2/translate"
    : "https://api.deepl.com/v2/translate";
  const params = new URLSearchParams();
  params.set("auth_key", cfg.deeplKey);
  params.set("text", text);
  params.set("target_lang", cfg.targetLang);
  params.set("source_lang", cfg.sourceLang);
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });
  if (!res.ok) throw new Error(`DeepL 请求失败 ${res.status}: ${await res.text()}`);
  const json = await res.json();
  return json.translations?.[0]?.text ?? "";
}

/* --------------------------------- DeepLX ---------------------------------- */
// 免费的 DeepL 兼容自建服务（如 OwO-Network/DeepLX）。
// 接口：POST {DEEPLX_URL}/translate
// 请求体：{ text, source_lang, target_lang, [token] }
// 响应体：{ code, data } 或纯字符串（不同实现略有差异，统一兜底解析）

async function translateDeeplX(text) {
  if (!cfg.deeplxUrl) throw new Error("未设置 DEEPLX_URL");
  const url = `${cfg.deeplxUrl.replace(/\/$/, "")}/translate`;
  const body = {
    text,
    source_lang: cfg.sourceLang,
    target_lang: cfg.targetLang,
  };
  if (cfg.deeplxToken) body.token = cfg.deeplxToken;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`DeepLX 请求失败 ${res.status}: ${await res.text()}`);
  const json = await res.json().catch(() => null);
  if (typeof json === "string") return json;
  if (json && typeof json.data === "string") return json.data;
  if (json && typeof json.text === "string") return json.text;
  throw new Error(`DeepLX 返回无法解析: ${JSON.stringify(json)}`);
}

// DeepL 与 DeepLX 共用同一套结构遮蔽逻辑，仅文本翻译后端不同，这里统一分发。
async function translateText(text) {
  const backend = pickBackend();
  if (backend === "deeplx") return translateDeeplX(text);
  if (backend === "deepl") return translateDeepl(text);
  throw new Error(`translateText 收到未知后端: ${backend}`);
}

/* ----------------------- 遮蔽 / 还原（DeepL 保护结构） ---------------------- */
// 把代码块、行内代码、数学公式替换成占位符，避免被机翻破坏结构。

function maskProtected(text) {
  const store = [];
  let out = text;
  out = out.replace(/```[\s\S]*?```/g, (m) => {
    store.push(m);
    return `ZP${store.length - 1}Z`;
  });
  out = out.replace(/`[^`\n]+`/g, (m) => {
    store.push(m);
    return `ZP${store.length - 1}Z`;
  });
  out = out.replace(/\$\$[\s\S]*?\$\$/g, (m) => {
    store.push(m);
    return `ZP${store.length - 1}Z`;
  });
  out = out.replace(/\$[^$\n]+?\$/g, (m) => {
    store.push(m);
    return `ZP${store.length - 1}Z`;
  });
  return { masked: out, store };
}

// 把指令行（以 :: 开头，如 :::note / ::tip{title="..."} / ::github{...}）整行替换成占位符，
// 还原时恢复原文，从而避免 DeepL 改坏指令关键字与参数名（代价：指令标题参数值不会被翻译）。
function maskDirectiveLines(text) {
  const store = [];
  const out = text
    .split("\n")
    .map((line) => {
      if (/^\s*::/.test(line)) {
        store.push(line);
        return `XD${store.length - 1}X`;
      }
      return line;
    })
    .join("\n");
  return { masked: out, store };
}

async function translateDeeplBody(body) {
  const { masked: m1, store: codeStore } = maskProtected(body);
  const { masked: m2, store: dirStore } = maskDirectiveLines(m1);
  const translated = await translateText(m2);
  let restored = translated.replace(/XD\s*(\d+)\s*X/g, (_, i) => dirStore[Number(i)] ?? "");
  restored = restored.replace(/ZP\s*(\d+)\s*Z/g, (_, i) => codeStore[Number(i)] ?? "");
  return restored;
}

async function translateDeeplFrontmatter(data) {
  const out = { ...data };
  if (out.title) out.title = await translateText(out.title);
  if (out.description) out.description = await translateText(out.description);
  if (cfg.translateTags) {
    if (Array.isArray(out.tags)) out.tags = await Promise.all(out.tags.map((t) => translateText(t)));
    if (out.category) out.category = await translateText(out.category);
  }
  return out;
}

/* --------------------------------- 主流程 ---------------------------------- */

function stripFence(s) {
  const m = s.match(/^```(?:markdown|md)?\s*\n([\s\S]*?)\n```$/i);
  return m ? m[1] : s;
}

function outPathFor(srcPath) {
  const dir = path.dirname(srcPath);
  const base = path
    .basename(srcPath)
    .replace(/\.zh\.md$/i, "")
    .replace(/\.md$/i, "");
  return path.join(dir, `${base}.en.md`);
}

async function translateFile(srcPath) {
  const raw = fs.readFileSync(srcPath, "utf8");
  const { data, content } = matter(raw);
  const backend = pickBackend();
  let newData;
  let newContent;

  if (backend === "openai") {
    const translated = await translateOpenAI(raw, true);
    const parsed = matter(stripFence(translated));
    newData = parsed.data;
    newContent = parsed.content;
    if (!newContent || !newData.title) {
      throw new Error("OpenAI 返回无法解析，请检查模型输出");
    }
  } else {
    newData = await translateDeeplFrontmatter(data);
    newContent = await translateDeeplBody(content);
  }

  newData.lang = "en";
  const outRaw = matter.stringify(newContent.trim() + "\n", newData);
  return outRaw;
}

async function run() {
  const arg = process.argv[2];
  const targets = [];
  if (arg) {
    targets.push(path.resolve(arg));
  } else {
    const files = fs.readdirSync(POSTS_DIR).filter((f) => /\.zh\.md$/i.test(f));
    for (const f of files) {
      const src = path.join(POSTS_DIR, f);
      const out = outPathFor(src);
      if (fs.existsSync(out) && !cfg.force) {
        console.log(`[skip] 已存在: ${path.basename(out)}`);
        continue;
      }
      targets.push(src);
    }
  }
  if (targets.length === 0) {
    console.log("没有需要翻译的文件。");
    return;
  }
  const backend = pickBackend();
  console.log(`后端: ${backend}`);
  for (const src of targets) {
    const out = outPathFor(src);
    console.log(`翻译: ${path.basename(src)} → ${path.basename(out)}`);
    const outRaw = await translateFile(src);
    if (cfg.dryRun) {
      console.log("---- DRY RUN 输出 ----");
      console.log(outRaw);
    } else {
      fs.writeFileSync(out, outRaw, "utf8");
      console.log(`  已写入 ${path.basename(out)}`);
    }
  }
}

/* ------------------------------- 内部自测 ---------------------------------- */

async function selfTest() {
  const sample = `---
title: 测试标题
tags: [写作]
---
# 一级标题
\`\`\`ts
const x = 1;
\`\`\`
行内 \`code\` 与 $E=mc^2$ 公式，块级：
$$
\\int x\\,dx
$$
:::note
中文备注内容
:::
::tip{title="提示标题"}
提示正文
:::`;
  const { masked: m1, store: cs } = maskProtected(sample);
  const { masked: m2, store: ds } = maskDirectiveLines(m1);
  let restored = m2.replace(/XD\s*(\d+)\s*X/g, (_, i) => ds[Number(i)] ?? "");
  restored = restored.replace(/ZP\s*(\d+)\s*Z/g, (_, i) => cs[Number(i)] ?? "");
  const ok = restored === sample;
  console.log(ok ? "SELF-TEST PASS" : "SELF-TEST FAIL");
  if (!ok) {
    console.log("IN:\n" + sample);
    console.log("OUT:\n" + restored);
    process.exit(1);
  }
}

/* --------------------------------- 入口 ----------------------------------- */

if (process.env.TEST === "1") {
  selfTest().then(() => process.exit(0));
} else {
  run().catch((e) => {
    console.error(e.message || e);
    process.exit(1);
  });
}
