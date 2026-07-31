import { getSortedPosts } from "@utils/content-utils";
import { siteConfig } from "@/config";
import { getLocaleUrl, getBaseSlug } from "@utils/url-utils";
import { siteSubtitle } from "@i18n/translation";

function localeShortOf(locale: string): "zh" | "en" {
	return locale.toLowerCase().startsWith("en") ? "en" : "zh";
}

/**
 * Build an `llms.txt` index (https://llmstxt.org) — a machine-readable table of
 * contents so LLMs / AI search can discover and cite the blog's articles.
 * Locale-filtered and uses locale-aware URLs.
 */
export async function buildLlmsTxt(siteBase: string, locale = "zh"): Promise<string> {
	const loc = localeShortOf(locale);
	const posts = (await getSortedPosts()).filter((p) => (p.data.lang || "zh") === loc);
	const lines: string[] = [];

	lines.push(`# ${siteConfig.title}`);
	lines.push("");
	const subtitle = siteSubtitle(loc);
	if (subtitle) {
		lines.push(`> ${subtitle}`);
		lines.push("");
	}
	lines.push(`Personal tech blog (language: ${loc === "en" ? "en" : "zh-CN"}).`);
	lines.push("");

	lines.push("## Posts");
	for (const post of posts) {
		const url = `${siteBase}${getLocaleUrl(`/posts/${getBaseSlug(post.id)}/`, loc)}`;
		const description = (post.data.description || "").trim();
		if (description) {
			lines.push(`- [${post.data.title}](${url}): ${description}`);
		} else {
			lines.push(`- [${post.data.title}](${url})`);
		}
	}

	lines.push("");
	lines.push("## Other");
	lines.push(`- [About](${siteBase}${getLocaleUrl("/about/", loc)})`);
	lines.push(`- [Archive](${siteBase}${getLocaleUrl("/archive/", loc)})`);
	lines.push(`- [RSS Feed](${siteBase}${getLocaleUrl("/rss.xml", loc)})`);

	return lines.join("\n");
}

/**
 * Build `llms-full.txt` — the entire blog content inlined (per the llms.txt spec's
 * optional companion file), so an LLM can read every article without extra fetches.
 */
export async function buildLlmsFullTxt(siteBase: string, locale = "zh"): Promise<string> {
	const loc = localeShortOf(locale);
	const posts = (await getSortedPosts()).filter((p) => (p.data.lang || "zh") === loc);
	const parts: string[] = [];

	parts.push(`# ${siteConfig.title} — full content`);
	parts.push("");
	const subtitle = siteSubtitle(loc);
	if (subtitle) parts.push(`> ${subtitle}`);
	parts.push("");

	for (const post of posts) {
		parts.push(`## ${post.data.title}`);
		if (post.data.description) parts.push(`*${post.data.description}*`);
		if (post.data.tags && post.data.tags.length > 0) {
			parts.push(`Tags: ${post.data.tags.join(", ")}`);
		}
		parts.push(`URL: ${siteBase}${getLocaleUrl(`/posts/${getBaseSlug(post.id)}/`, loc)}`);
		parts.push("");
		const body = typeof post.body === "string" ? post.body : String(post.body || "");
		parts.push(body);
		parts.push("");
		parts.push("---");
		parts.push("");
	}

	return parts.join("\n");
}
