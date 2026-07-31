import type { APIContext } from "astro";
import { buildLlmsTxt } from "@utils/llms-txt";

export async function GET(context: APIContext) {
	const siteBase = (context.site?.href ?? "https://blog.suchitems.top/").replace(/\/$/, "");
	const locale = context.currentLocale || "en";
	const text = await buildLlmsTxt(siteBase, locale);
	return new Response(text, {
		headers: { "Content-Type": "text/plain; charset=utf-8" },
	});
}
