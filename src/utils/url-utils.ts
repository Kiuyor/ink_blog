import I18nKey from "@i18n/i18nKey";
import { i18n } from "@i18n/translation";
import { getActiveLocaleShort } from "@i18n/translation";

export function pathsEqual(path1: string, path2: string) {
	const normalizedPath1 = path1.replace(/^\/|\/$/g, "").toLowerCase();
	const normalizedPath2 = path2.replace(/^\/|\/$/g, "").toLowerCase();
	return normalizedPath1 === normalizedPath2;
}

function joinUrl(...parts: string[]): string {
	const joined = parts.join("/");
	return joined.replace(/\/+/g, "/");
}

/**
 * Locale-aware URL builder. Prepends the `/en` prefix when the target locale is English.
 * Use this for *internal page routes* (home, posts, archive, about, rss, …).
 * For static assets (favicons, fonts, OG images) use the plain `url()` instead.
 */
export function getLocaleUrl(path: string, locale?: string): string {
	const loc = locale
		? locale.toLowerCase().startsWith("en")
			? "en"
			: "zh"
		: getActiveLocaleShort();
	const prefix = loc === "en" ? "/en" : "";
	return joinUrl("", import.meta.env.BASE_URL, prefix, path);
}

/** Strip a trailing language suffix (`.zh` / `.en` / `.zh_cn` / `.zh_tw`) from a
 *  content-collection id or slug. Handles both the dotted filename form
 *  (`hello-im-ink.zh.md`, as produced by `entry.id`) and a bare slug. */
export function getBaseSlug(slug: string): string {
	return slug.replace(/\.md$/i, "").replace(/\.(zh|en|zh_cn|zh_tw)$/i, "");
}

export function getPostUrlBySlug(slug: string, locale?: string): string {
	return getLocaleUrl(`/posts/${getBaseSlug(slug)}/`, locale);
}

export function getTagUrl(tag: string, locale?: string): string {
	if (!tag) return getLocaleUrl("/archive/", locale);
	return getLocaleUrl(`/archive/?tag=${encodeURIComponent(tag.trim())}`, locale);
}

export function getCategoryUrl(category: string | null, locale?: string): string {
	if (
		!category ||
		category.trim() === "" ||
		category.trim().toLowerCase() === i18n(I18nKey.uncategorized).toLowerCase()
	)
		return getLocaleUrl("/archive/?uncategorized=true", locale);
	return getLocaleUrl(`/archive/?category=${encodeURIComponent(category.trim())}`, locale);
}

export function getDir(path: string): string {
	const lastSlashIndex = path.lastIndexOf("/");
	if (lastSlashIndex < 0) {
		return "/";
	}
	return path.substring(0, lastSlashIndex + 1);
}

/** Plain URL builder for static assets under BASE_URL (never locale-prefixed). */
export function url(path: string) {
	return joinUrl("", import.meta.env.BASE_URL, path);
}
