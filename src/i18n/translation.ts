import { siteConfig } from "../config";
import type I18nKey from "./i18nKey";
import { en } from "./languages/en";
import { es } from "./languages/es";
import { id } from "./languages/id";
import { ja } from "./languages/ja";
import { ko } from "./languages/ko";
import { th } from "./languages/th";
import { tr } from "./languages/tr";
import { vi } from "./languages/vi";
import { zh_CN } from "./languages/zh_CN";
import { zh_TW } from "./languages/zh_TW";

export type Translation = {
	[K in I18nKey]: string;
};

// normalize any locale string ("zh_CN" / "zh-cn" / "zh" / "en_US" / "en") to a map key
function normalizeDictKey(lang: string): keyof typeof map {
	const s = lang.toLowerCase().replace("-", "_");
	if (s.startsWith("zh")) {
		return s === "zh_tw" ? "zh_tw" : "zh_cn";
	}
	if (s.startsWith("en")) return "en";
	if (s.startsWith("ja")) return "ja";
	if (s.startsWith("ko")) return "ko";
	if (s.startsWith("th")) return "th";
	if (s.startsWith("vi")) return "vi";
	if (s.startsWith("id")) return "id";
	if (s.startsWith("tr")) return "tr";
	if (s.startsWith("es")) return "es";
	return "zh_cn";
}

const map: { [key: string]: Translation } = {
	es: es,
	en: en,
	en_us: en,
	en_gb: en,
	en_au: en,
	zh_cn: zh_CN,
	zh_tw: zh_TW,
	ja: ja,
	ja_jp: ja,
	ko: ko,
	ko_kr: ko,
	th: th,
	th_th: th,
	vi: vi,
	vi_vn: vi,
	id: id,
	tr: tr,
	tr_tr: tr,
};

// The active locale for the *current request*. Set per-page by Layout/astro pages
// via setActiveLocale(Astro.currentLocale) so that i18n() returns the right UI strings
// during server render (and therefore correct text in the SSR HTML that Svelte islands hydrate from).
let activeLocale = normalizeDictKey(siteConfig.lang || "zh_CN");
// short form used for URLs / <html lang>: "zh" | "en"
let activeLocaleShort = activeLocale === "en" ? "en" : "zh";

export function setActiveLocale(lang?: string) {
	if (!lang) return;
	activeLocale = normalizeDictKey(lang);
	activeLocaleShort = activeLocale === "en" ? "en" : "zh";
}

export function getActiveLocaleShort(): string {
	return activeLocaleShort;
}

export function getTranslation(lang: string): Translation {
	return map[normalizeDictKey(lang)] || map.zh_cn;
}

export function i18n(key: I18nKey): string {
	return getTranslation(activeLocale)[key];
}
