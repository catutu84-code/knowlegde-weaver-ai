const TARGET = 1500;

/** Splits a chapter's markdown into reading pages, never breaking a block in half. */
export function paginate(content: string, target = TARGET): string[] {
  const blocks = content.split(/\n{2,}/).filter((b) => b.trim());
  if (blocks.length === 0) return [content];
  const pages: string[] = [];
  let current: string[] = [];
  let size = 0;
  for (const block of blocks) {
    if (size > 0 && size + block.length > target) {
      pages.push(current.join("\n\n"));
      current = [];
      size = 0;
    }
    current.push(block);
    size += block.length;
  }
  if (current.length) pages.push(current.join("\n\n"));
  return pages;
}
