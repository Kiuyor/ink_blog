// scripts/segment-zh.mjs
// Post-build step: improves Pagefind's Chinese (zh-cn) search by injecting a
// hidden, space-segmented mirror of every [data-pagefind-body] element's text.
// Pagefind's built-in zh-cn indexer does not split Chinese into words, so a
// phrase like "墨迹" is indexed as one blob and cannot be matched by substring.
// We add a display:none copy with word boundaries (spaces) so each word becomes
// its own searchable token, without altering the visible page.
//
// Method: cheerio is used READ-ONLY to extract text from each data-pagefind-body
// (it tolerates the occasionally unbalanced markup Astro/expressive-code emit).
// The segmented mirror is then injected as a single hidden data-pagefind-body
// element right before </body> via a string replace, so the rest of the
// document is never re-serialized (which would otherwise corrupt it).

import fs from "node:fs";
import path from "node:path";
import * as cheerio from "cheerio";

const distDir = path.resolve("dist");

// --- Chinese word segmentation (built into Node via ICU) -------------------
let segmenter = null;
try {
	segmenter = new Intl.Segmenter("zh-CN", { granularity: "word" });
} catch {
	segmenter = null;
	console.warn("[segment-zh] Intl.Segmenter unavailable; falling back to char-level segmentation.");
}

function segmentText(text) {
	if (!segmenter) {
		// naive fallback: space between every CJK char
		return text
			.split("")
			.map((ch) => (/[　-鿿豈-﫿]/.test(ch) ? ch + " " : ch))
			.join("")
			.replace(/\s+/g, " ")
			.trim();
	}
	const tokens = [];
	for (const { segment } of segmenter.segment(text)) {
		if (!segment || /^\s+$/.test(segment)) continue;
		// drop pure punctuation / symbol segments (noise, never searched)
		if (/^[\\p{P}\\p{S}]+$/u.test(segment)) continue;
		tokens.push(segment);
	}
	return tokens.join(" ");
}

function escapeHtml(s) {
	return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Minimal HTML entity decode (so &gt; -> > before tokenizing).
function decodeEntities(s) {
	return s
		.replace(/&nbsp;/g, " ")
		.replace(/&amp;/g, "&")
		.replace(/&lt;/g, "<")
		.replace(/&gt;/g, ">")
		.replace(/&quot;/g, '"')
		.replace(/&#0*39;/g, "'")
		.replace(/&#0*38;/g, "&")
		.replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
		.replace(/&#x([0-9a-fA-F]+);/g, (_, n) => String.fromCodePoint(parseInt(n, 16)));
}

// Recursively collect all *.html under dist.
function walk(dir, out = []) {
	for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
		const f = path.join(dir, e.name);
		if (e.isDirectory()) walk(f, out);
		else if (e.name.endsWith(".html")) out.push(f);
	}
	return out;
}

const files = walk(distDir);
let processed = 0;

for (const file of files) {
	let html = fs.readFileSync(file, "utf8");
	if (!html.includes("data-pagefind-body")) continue;
	if (html.includes("pagefind-zh-seg")) continue; // already processed (idempotent)

	// Read-only text extraction of every indexed body on the page.
	const $ = cheerio.load(html, { decodeEntities: false });
	const parts = [];
	$("[data-pagefind-body]").each((_, el) => {
		const t = decodeEntities($(el).text()).replace(/<!--/g, " ").replace(/-->/g, " ");
		if (t.trim()) parts.push(t);
	});
	if (!parts.length) continue;

	const seg = segmentText(parts.join(" "));
	if (!seg) continue;

	// Inject a single hidden mirror body just before </body>. Pagefind will
	// concatenate it with the real bodies when indexing this page.
	const inject = `<div data-pagefind-body class="pagefind-zh-seg" style="display:none" aria-hidden="true">${escapeHtml(seg)}</div>`;
	html = html.replace(/<\/body>/i, `${inject}</body>`);
	fs.writeFileSync(file, html);
	processed++;
}

console.log(`[segment-zh] Injected hidden Chinese-segmented mirror into ${processed} HTML file(s).`);
