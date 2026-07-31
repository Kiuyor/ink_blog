import I18nKey from "@i18n/i18nKey";
import { i18n } from "@i18n/translation";
import { LinkPreset, type NavBarLink } from "@/types/config";

// Resolved at call time (inside the page render, after setActiveLocale runs) so the
// preset names follow the active request locale. URLs are returned BARE ("/about/")
// and localized once by the caller (Navbar / NavMenuPanel) via getLocaleUrl — do NOT
// pre-resolve here, or locale prefixes would be applied twice.
export function getLinkPresets(): { [key in LinkPreset]: NavBarLink } {
	return {
		[LinkPreset.Home]: {
			name: i18n(I18nKey.home),
			url: "/",
		},
		[LinkPreset.About]: {
			name: i18n(I18nKey.about),
			url: "/about/",
		},
		[LinkPreset.Archive]: {
			name: i18n(I18nKey.archive),
			url: "/archive/",
		},
	};
}
