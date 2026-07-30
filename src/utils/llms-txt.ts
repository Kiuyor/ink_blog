import { getSortedPosts } from "@utils/content-utils";
import { siteConfig } from "@/config";

/**
 * Build an `llms.txt` index (https://llmstxt.org) — a machine-readable table of
 * contents so LLMs / AI search can discover and cite the blog's articles.
 * Uses absolute URLs derived from the configured `site`.
 */
export async function buildLlmsTxt(siteBase: string): Promise<string> {
	const posts = await getSortedPosts();
	const lines: string[] = [];

	lines.push(`# ${siteConfig.title}`);
	lines.push("");
	if (siteConfig.subtitle) {
		lines.push(`> ${siteConfig.subtitle}`);
		lines.push("");
	}
	lines.push(`Personal tech blog (language: ${siteConfig.lang}).`);
	lines.push("");

	lines.push("## Posts");
	for (const post of posts) {
		const url = `${siteBase}/posts/${post.slug}/`;
		const description = (post.data.description || "").trim();
		if (description) {
			lines.push(`- [${post.data.title}](${url}): ${description}`);
		} else {
			lines.push(`- [${post.data.title}](${url})`);
		}
	}

	lines.push("");
	lines.push("## Other");
	lines.push(`- [About](${siteBase}/about/)`);
	lines.push(`- [Archive](${siteBase}/archive/)`);
	lines.push(`- [RSS Feed](${siteBase}/rss.xml)`);

	return lines.join("\n");
}

/**
 * Build `llms-full.txt` — the entire blog content inlined (per the llms.txt spec's
 * optional companion file), so an LLM can read every article without extra fetches.
 */
export async function buildLlmsFullTxt(siteBase: string): Promise<string> {
	const posts = await getSortedPosts();
	const parts: string[] = [];

	parts.push(`# ${siteConfig.title} — full content`);
	parts.push("");
	if (siteConfig.subtitle) parts.push(`> ${siteConfig.subtitle}`);
	parts.push("");

	for (const post of posts) {
		parts.push(`## ${post.data.title}`);
		if (post.data.description) parts.push(`*${post.data.description}*`);
		if (post.data.tags && post.data.tags.length > 0) {
			parts.push(`Tags: ${post.data.tags.join(", ")}`);
		}
		parts.push(`URL: ${siteBase}/posts/${post.slug}/`);
		parts.push("");
		const body = typeof post.body === "string" ? post.body : String(post.body || "");
		parts.push(body);
		parts.push("");
		parts.push("---");
		parts.push("");
	}

	return parts.join("\n");
}
