import type { APIContext } from "astro";
import { buildLlmsFullTxt } from "@utils/llms-txt";

export async function GET(context: APIContext) {
	const siteBase = (context.site?.href ?? "https://blog.suchitems.top/").replace(/\/$/, "");
	const locale = context.currentLocale || "zh";
	const text = await buildLlmsFullTxt(siteBase, locale);
	return new Response(text, {
		headers: { "Content-Type": "text/plain; charset=utf-8" },
	});
}
