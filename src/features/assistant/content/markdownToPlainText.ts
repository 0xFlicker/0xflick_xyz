import type { RootContent } from "mdast";
import { toString } from "mdast-util-to-string";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import { unified } from "unified";

const parser = unified().use(remarkParse).use(remarkGfm);

function textForBlock(node: RootContent): string[] {
  if (node.type === "list") {
    return node.children.map((item) =>
      toString(item, { includeHtml: false, includeImageAlt: false }),
    );
  }

  if (node.type === "blockquote") {
    return node.children.flatMap(textForBlock);
  }

  return [toString(node, { includeHtml: false, includeImageAlt: false })];
}

export function markdownToPlainText(markdown: string): string {
  const tree = parser.parse(markdown);

  return tree.children
    .flatMap(textForBlock)
    .map((text) => text.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join(" ");
}
