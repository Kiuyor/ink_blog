/**
 * FAQ / HowTo structured-data extraction for GEO (Generative Engine Optimization).
 *
 * Parses the RAW markdown `body` of a post and derives schema.org JSON-LD nodes
 * (FAQPage / HowTo) that mirror content visible to readers. No extra deps.
 *
 * Authoring conventions supported (all rendered visibly via the `faq` / `howto`
 * admonition directives, so the JSON-LD always reflects on-page text):
 *
 *   :::faq
 *   **问：问题一？**
 *   答案一，可多行。
 *
 *   **问：问题二？**
 *   答案二。
 *   :::
 *
 *   :::howto{title="如何部署"}
 *   1. 第一步：打开终端
 *   2. 第二步：运行命令
 *   3. 第三步：完成
 *   :::
 *
 * Also auto-detected:
 *   - Any `:::tip` / `:::note` / ... block whose body contains `问：`/`Q:` Q&A.
 *   - A heading containing 步骤 / 教程 / 操作指南 followed by an ordered list.
 */

export interface FaqItem {
	question: string;
	answer: string;
}

export interface HowToStep {
	name: string;
	text: string;
}

export interface HowToData {
	name: string;
	steps: HowToStep[];
}

export interface StructuredData {
	faq: FaqItem[];
	howTo: HowToData | null;
}

const DIRECTIVE_BLOCK_RE = /:::\s*([a-zA-Z0-9_-]+)(?:\{([^}]*)\})?([\s\S]*?):::/g;

const FAQ_TYPES = new Set(["faq"]);
const HOWTO_TYPES = new Set(["how-to", "howto"]);
const ADMONITION_TYPES = new Set(["tip", "note", "important", "warning", "caution"]);

// A question marker at the start of a line, e.g. "**问：...**", "Q: ...", "### 问：...".
const QUESTION_RE = /^\s*(?:#{1,6}\s*)?(?:\*{0,2})(?:问|Q|Question|question)\s*[:：]\s*(.+?)(?:\*{0,2})\s*$/;

// Ordered-list item: "1. ...", "1) ...", "1、 ...".
const ORDERED_LIST_RE = /^\s*\d+[.)、]\s+(.+)$/;

function parseAttrs(attrStr?: string): Record<string, string> {
	const attrs: Record<string, string> = {};
	if (!attrStr) return attrs;
	const re = /(\w+)\s*=\s*"([^"]*)"/g;
	let m: RegExpExecArray | null;
	while ((m = re.exec(attrStr)) !== null) {
		attrs[m[1]] = m[2];
	}
	return attrs;
}

/** Strip the most common Markdown inline syntax so JSON-LD text reads cleanly. */
function toPlainText(s: string): string {
	return s
		.replace(/\*\*(.+?)\*\*/g, "$1")
		.replace(/\*(.+?)\*/g, "$1")
		.replace(/_(.+?)_/g, "$1")
		.replace(/`(.+?)`/g, "$1")
		.replace(/\[(.+?)\]\([^)]*\)/g, "$1")
		.replace(/\s+/g, " ")
		.trim();
}

function splitFaqItems(block: string): FaqItem[] {
	const items: FaqItem[] = [];
	let currentQ: string | null = null;
	let answerLines: string[] = [];

	const flush = () => {
		if (currentQ !== null) {
			const answer = toPlainText(answerLines.join(" "));
			if (answer) items.push({ question: currentQ, answer });
			currentQ = null;
			answerLines = [];
		}
	};

	for (const line of block.split("\n")) {
		const qm = line.match(QUESTION_RE);
		if (qm) {
			flush();
			currentQ = toPlainText(qm[1]);
		} else if (currentQ !== null) {
			answerLines.push(line);
		}
	}
	flush();
	return items;
}

function stepSplit(text: string): HowToStep {
	const m = text.match(/^(.{1,30})[:：]\s*(.+)$/);
	if (m) {
		return { name: toPlainText(m[1]), text: toPlainText(m[2]) };
	}
	const plain = toPlainText(text);
	return { name: plain, text: plain };
}

function parseSteps(text: string): HowToStep[] {
	const steps: HowToStep[] = [];
	for (const line of text.split("\n")) {
		const m = line.match(ORDERED_LIST_RE);
		if (m) steps.push(stepSplit(m[1]));
	}
	return steps;
}

/** Detect a "步骤 / 教程 / 操作指南" heading followed by an ordered list. */
function extractHeadingHowTo(body: string, fallbackTitle: string): HowToData | null {
	const lines = body.split("\n");
	for (let i = 0; i < lines.length; i++) {
		const h = lines[i].match(/^#{2,4}\s+(.*)$/);
		if (h && /步骤|教程|操作指南|部署步骤|使用步骤/.test(h[1])) {
			const collected: string[] = [];
			let j = i + 1;
			while (j < lines.length && !/^#{1,6}\s+/.test(lines[j])) {
				const m = lines[j].match(ORDERED_LIST_RE);
				if (m) collected.push(m[1]);
				j++;
			}
			if (collected.length) {
				return { name: toPlainText(h[1]) || fallbackTitle || "教程", steps: collected.map(stepSplit) };
			}
		}
	}
	return null;
}

export function extractStructuredData(body: string, fallbackTitle = ""): StructuredData {
	const faq: FaqItem[] = [];
	let howTo: HowToData | null = null;

	const blocks: { name: string; attrs: Record<string, string>; inner: string }[] = [];
	let m: RegExpExecArray | null;
	DIRECTIVE_BLOCK_RE.lastIndex = 0;
	while ((m = DIRECTIVE_BLOCK_RE.exec(body)) !== null) {
		blocks.push({
			name: m[1].toLowerCase(),
			attrs: parseAttrs(m[2]),
			inner: m[3],
		});
	}

	// --- FAQPage ---
	for (const b of blocks) {
		if (FAQ_TYPES.has(b.name)) {
			const items = splitFaqItems(b.inner);
			if (items.length === 0 && b.attrs.title) {
				faq.push({ question: b.attrs.title, answer: toPlainText(b.inner) });
			} else {
				faq.push(...items);
			}
		} else if (ADMONITION_TYPES.has(b.name) && /问\s*[:：]|Q\s*[:：]|Question\s*[:：]/i.test(b.inner)) {
			// A tip/note etc. that actually contains Q&A -> surface it as FAQ too.
			faq.push(...splitFaqItems(b.inner));
		}
	}

	// --- HowTo ---
	for (const b of blocks) {
		if (HOWTO_TYPES.has(b.name)) {
			const steps = parseSteps(b.inner);
			if (steps.length) {
				howTo = { name: b.attrs.title || fallbackTitle || "教程", steps };
			}
		}
	}
	if (!howTo) {
		howTo = extractHeadingHowTo(body, fallbackTitle);
	}

	return { faq, howTo };
}
