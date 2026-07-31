import I18nKey from "@i18n/i18nKey";
import { i18n } from "@i18n/translation";

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
 * Locale-aware URL builder. Kept as i18n infrastructure so extra locales can be
 * re-enabled later, but the site currently ships Chinese only, so this behaves as
 * a plain BASE_URL-prefixed builder (no `/en` prefix). To re-enable a prefixed
 * locale, restore the prefix branch here and add the locale to `astro.config.mjs`.
 * For static assets (favicons, fonts, OG images) use the plain `url()` instead.
 */
export function getLocaleUrl(path: string, _locale?: string): string {
	return joinUrl("", import.meta.env.BASE_URL, path);
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
