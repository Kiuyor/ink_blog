// 自动生成 OG 分享图（水墨装饰风 / ink 主题）
// 构建期运行：读取 src/content/posts/*.md 的 frontmatter，用 satori 渲染 SVG，
// 再用 @resvg/resvg-js 光栅化为 PNG，输出到 public/og/<slug>.png（astro build 会一并拷进 dist）。
// 字体：构建时从 CDN 下载 Noto Sans SC（含中文），缓存到 node_modules/.cache 避免重复下载。

import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import sharp from "sharp";
import satori from "satori";
import { Resvg } from "@resvg/resvg-js";

const ROOT = process.cwd();
const POSTS_DIR = path.join(ROOT, "src/content/posts");
const OG_DIR = path.join(ROOT, "public/og");
const FONT_CACHE = path.join(ROOT, "node_modules/.cache/og-fonts");
const AVATAR_PATH = path.join(ROOT, "src/assets/images/ink-avatar.png");

const WIDTH = 1200;
const HEIGHT = 630;

// Noto Sans SC（简体子集 OTF，含中文）。satori 需要 ttf/otf，故用 OTF 而非 woff2。
const FONT_URLS = {
  400: [
    "https://cdn.jsdelivr.net/gh/notofonts/noto-cjk@main/Sans/SubsetOTF/SC/NotoSansSC-Regular.otf",
    "https://raw.githubusercontent.com/notofonts/noto-cjk/main/Sans/SubsetOTF/SC/NotoSansSC-Regular.otf",
  ],
  700: [
    "https://cdn.jsdelivr.net/gh/notofonts/noto-cjk@main/Sans/SubsetOTF/SC/NotoSansSC-Bold.otf",
    "https://raw.githubusercontent.com/notofonts/noto-cjk/main/Sans/SubsetOTF/SC/NotoSansSC-Bold.otf",
  ],
};

// 极简 hyperscript：satori 接受 { type, props } 结构，无需引入 React
const h = (type, props = {}, ...children) => ({
  type,
  props: { ...props, children: children.length > 1 ? children : children[0] },
});

async function fetchFont(weight) {
  fs.mkdirSync(FONT_CACHE, { recursive: true });
  const cacheFile = path.join(FONT_CACHE, `noto-sc-${weight}.otf`);
  if (fs.existsSync(cacheFile)) return fs.readFileSync(cacheFile);
  let lastErr;
  for (const url of FONT_URLS[weight]) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      fs.writeFileSync(cacheFile, buf);
      return buf;
    } catch (e) {
      lastErr = e;
    }
  }
  throw new Error(`无法下载 Noto Sans SC (${weight}): ${lastErr?.message}`);
}

async function getFonts() {
  const [regular, bold] = await Promise.all([fetchFont(400), fetchFont(700)]);
  return [
    { name: "Noto Sans SC", type: "otf", weight: 400, data: regular },
    { name: "Noto Sans SC", type: "otf", weight: 700, data: bold },
  ];
}

async function avatarDataUri() {
  if (!fs.existsSync(AVATAR_PATH)) return null;
  const cacheFile = path.join(FONT_CACHE, "avatar.jpg");
  if (!fs.existsSync(cacheFile)) {
    fs.mkdirSync(FONT_CACHE, { recursive: true });
    // 转 JPEG 并把透明区域平铺到暗色圆盘背景上，避免 satori + 透明 PNG 不可见
    await sharp(AVATAR_PATH)
      .flatten({ background: "#16161f" })
      .resize(160, 160)
      .jpeg({ quality: 90 })
      .toFile(cacheFile);
  }
  const b64 = fs.readFileSync(cacheFile).toString("base64");
  return `data:image/jpeg;base64,${b64}`;
}

function ogElement({ title, description, avatar }) {
  const brandChildren = [];
  if (avatar) {
    brandChildren.push(
      h(
        "div",
        {
          style: {
            width: 84,
            height: 84,
            borderRadius: "50%",
            backgroundColor: "#16161f",
            border: "2px solid #C77DFF",
            overflow: "hidden",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          },
        },
        h("img", { src: avatar, width: 80, height: 80 }),
      ),
    );
  }
  brandChildren.push(
    h(
      "div",
      { style: { display: "flex", flexDirection: "column" } },
      h("div", { style: { fontSize: "32px", fontWeight: 700, color: "#ffffff", lineHeight: 1.1 } }, "ink_blog"),
      h("div", { style: { fontSize: "20px", color: "#C77DFF", letterSpacing: "6px", marginTop: "4px" } }, "磨叽的墨迹"),
    ),
  );

  const titleBlock = [
    h("div", { style: { width: "120px", height: "8px", backgroundColor: "#9370DB", borderRadius: "4px" } }),
    h(
      "div",
      {
        style: {
          fontSize: "64px",
          fontWeight: 700,
          color: "#ffffff",
          lineHeight: 1.25,
          maxWidth: "1000px",
          wordBreak: "break-word",
        },
      },
      title,
    ),
  ];
  if (description) {
    titleBlock.push(
      h(
        "div",
        {
          style: {
            fontSize: "26px",
            color: "rgba(255,255,255,0.6)",
            maxWidth: "920px",
            lineHeight: 1.45,
            wordBreak: "break-word",
          },
        },
        description,
      ),
    );
  }

  return h(
    "div",
    {
      style: {
        width: WIDTH,
        height: HEIGHT,
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#0d0d14",
        position: "relative",
        padding: "80px",
        fontFamily: "Noto Sans SC",
        overflow: "hidden",
        boxSizing: "border-box",
      },
    },
    // 右上紫色光晕
    h("div", {
      style: {
        position: "absolute",
        top: "-220px",
        right: "-200px",
        width: "640px",
        height: "640px",
        borderRadius: "50%",
        background: "radial-gradient(circle at center, rgba(147,112,219,0.38) 0%, rgba(147,112,219,0) 70%)",
      },
    }),
    // 左下墨晕
    h("div", {
      style: {
        position: "absolute",
        bottom: "-180px",
        left: "-140px",
        width: "520px",
        height: "520px",
        borderRadius: "50%",
        background: "radial-gradient(circle at center, rgba(80,50,120,0.45) 0%, rgba(80,50,120,0) 70%)",
      },
    }),
    // 品牌行
    h("div", { style: { display: "flex", alignItems: "center", gap: "20px" } }, ...brandChildren),
    h("div", { style: { flex: 1 } }),
    // 标题块
    h("div", { style: { display: "flex", flexDirection: "column", gap: "22px" } }, ...titleBlock),
    // 底部落款
    h(
      "div",
      {
        style: {
          position: "absolute",
          bottom: "56px",
          right: "80px",
          fontSize: "22px",
          color: "rgba(255,255,255,0.4)",
          letterSpacing: "2px",
        },
      },
      "墨 · 写字的地方",
    ),
  );
}

async function generateOg({ title, description, outFile, fonts, avatar }) {
  const svg = await satori(ogElement({ title, description, avatar }), {
    width: WIDTH,
    height: HEIGHT,
    fonts,
  });
  const resvg = new Resvg(svg, { fitTo: { mode: "width", value: WIDTH } });
  const png = resvg.render().asPng();
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, png);
}

async function main() {
  fs.mkdirSync(OG_DIR, { recursive: true });
  const fonts = await getFonts();
  const avatar = await avatarDataUri();

  const files = fs.readdirSync(POSTS_DIR).filter((f) => f.endsWith(".md"));
  let count = 0;
  for (const file of files) {
    const raw = fs.readFileSync(path.join(POSTS_DIR, file), "utf8");
    const { data } = matter(raw);
    if (data.draft) {
      console.log(`[og] 跳过草稿: ${file}`);
      continue;
    }
    const slug = data.slug || file.replace(/\.md$/, "");
    const title = data.title || slug;
    const description = data.description || "";
    const outFile = path.join(OG_DIR, `${slug}.png`);
    await generateOg({ title, description, outFile, fonts, avatar });
    console.log(`[og] 生成: ${slug}.png`);
    count++;
  }

  // 默认图：首页 / 关于页等无文章上下文的页面使用
  const defaultOut = path.join(OG_DIR, "default.png");
  await generateOg({
    title: "磨叽的墨迹",
    description: "墨水写字的地方 · ink_blog",
    outFile: defaultOut,
    fonts,
    avatar,
  });
  console.log(`[og] 生成: default.png`);
  console.log(`[og] 完成 — 共 ${count} 篇文章 + 1 张默认图`);
}

main().catch((e) => {
  console.error("[og] 生成失败:", e);
  process.exit(1);
});
