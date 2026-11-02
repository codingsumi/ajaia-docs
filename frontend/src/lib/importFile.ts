type JSONContent = {
  type: string;
  attrs?: Record<string, unknown>;
  content?: JSONContent[];
  text?: string;
};

const ALLOWED_EXTENSIONS = [".txt", ".md"] as const;

export function getFileExtension(filename: string): string {
  const index = filename.lastIndexOf(".");
  if (index < 0) return "";
  return filename.slice(index).toLowerCase();
}

export function isAllowedImportFile(filename: string): boolean {
  return (ALLOWED_EXTENSIONS as readonly string[]).includes(getFileExtension(filename));
}

export function titleFromFilename(filename: string): string {
  const extension = getFileExtension(filename);
  const base = extension ? filename.slice(0, -extension.length) : filename;
  const cleaned = base.trim() || "Imported document";
  return cleaned;
}

function paragraphNode(text: string): JSONContent {
  const trimmed = text.replace(/\r/g, "");
  if (!trimmed) {
    return { type: "paragraph" };
  }
  return {
    type: "paragraph",
    content: [{ type: "text", text: trimmed }],
  };
}

function headingNode(level: 1 | 2 | 3, text: string): JSONContent {
  return {
    type: "heading",
    attrs: { level },
    content: text ? [{ type: "text", text }] : undefined,
  };
}

function listItemNode(text: string): JSONContent {
  return {
    type: "listItem",
    content: [paragraphNode(text)],
  };
}

/**
 * Minimal plain-text / Markdown → Tiptap JSON converter.
 * Supports paragraphs, #/##/### headings, bullet lists, and numbered lists.
 */
export function textToTiptapJSON(raw: string, extension: string): JSONContent {
  const text = raw.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  if (!text.trim()) {
    throw new Error("File is empty");
  }

  if (extension === ".txt") {
    const blocks = text.split(/\n{2,}/).map((block) => block.trim()).filter(Boolean);
    return {
      type: "doc",
      content: blocks.length > 0 ? blocks.map((block) => paragraphNode(block)) : [paragraphNode("")],
    };
  }

  // .md — line-oriented lightweight parse
  const lines = text.split("\n");
  const content: JSONContent[] = [];
  let paragraphLines: string[] = [];
  let bulletItems: string[] = [];
  let orderedItems: string[] = [];

  function flushParagraph() {
    if (paragraphLines.length === 0) return;
    content.push(paragraphNode(paragraphLines.join("\n").trim()));
    paragraphLines = [];
  }

  function flushBullets() {
    if (bulletItems.length === 0) return;
    content.push({
      type: "bulletList",
      content: bulletItems.map(listItemNode),
    });
    bulletItems = [];
  }

  function flushOrdered() {
    if (orderedItems.length === 0) return;
    content.push({
      type: "orderedList",
      content: orderedItems.map(listItemNode),
    });
    orderedItems = [];
  }

  function flushLists() {
    flushBullets();
    flushOrdered();
  }

  for (const line of lines) {
    const heading = /^(#{1,3})\s+(.*)$/.exec(line);
    const bullet = /^[-*]\s+(.*)$/.exec(line);
    const ordered = /^(\d+)\.\s+(.*)$/.exec(line);

    if (heading) {
      flushParagraph();
      flushLists();
      const level = Math.min(heading[1].length, 3) as 1 | 2 | 3;
      content.push(headingNode(level, heading[2].trim()));
      continue;
    }

    if (bullet) {
      flushParagraph();
      flushOrdered();
      bulletItems.push(bullet[1].trim());
      continue;
    }

    if (ordered) {
      flushParagraph();
      flushBullets();
      orderedItems.push(ordered[2].trim());
      continue;
    }

    if (line.trim() === "") {
      flushParagraph();
      flushLists();
      continue;
    }

    flushLists();
    paragraphLines.push(line);
  }

  flushParagraph();
  flushLists();

  if (content.length === 0) {
    throw new Error("File did not contain importable content");
  }

  return { type: "doc", content };
}

export async function readImportFile(file: File): Promise<{ title: string; content: JSONContent }> {
  if (!isAllowedImportFile(file.name)) {
    throw new Error("Only .txt and .md files are supported");
  }

  const extension = getFileExtension(file.name);
  const raw = await file.text();
  const content = textToTiptapJSON(raw, extension);
  return {
    title: titleFromFilename(file.name),
    content,
  };
}
