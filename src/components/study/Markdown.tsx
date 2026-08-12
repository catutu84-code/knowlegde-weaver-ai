import { Fragment } from "react";

function inline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold text-foreground">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={i} className="rounded bg-muted px-1 py-0.5 text-[0.85em]">
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
      return <em key={i}>{part.slice(1, -1)}</em>;
    }
    return <Fragment key={i}>{part}</Fragment>;
  });
}

export function Markdown({ content }: { content: string | null | undefined }) {
  const lines = content.split("\n");
  const blocks: React.ReactNode[] = [];
  let list: string[] = [];

  const flush = () => {
    if (list.length) {
      blocks.push(
        <ul key={`ul-${blocks.length}`} className="my-3 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          {list.map((item, i) => (
            <li key={i}>{inline(item)}</li>
          ))}
        </ul>,
      );
      list = [];
    }
  };

  lines.forEach((rawLine, index) => {
    const line = rawLine.trimEnd();
    if (/^\s*([-*•]|\d+\.)\s+/.test(line)) {
      list.push(line.replace(/^\s*([-*•]|\d+\.)\s+/, ""));
      return;
    }
    flush();
    if (!line.trim()) return;
    if (line.startsWith("### ")) {
      blocks.push(
        <h4 key={index} className="mt-5 text-base font-semibold">
          {inline(line.slice(4))}
        </h4>,
      );
    } else if (line.startsWith("## ")) {
      blocks.push(
        <h3 key={index} className="mt-6 text-lg font-semibold">
          {inline(line.slice(3))}
        </h3>,
      );
    } else if (line.startsWith("# ")) {
      blocks.push(
        <h2 key={index} className="mt-6 text-xl font-bold">
          {inline(line.slice(2))}
        </h2>,
      );
    } else if (line.startsWith("> ")) {
      blocks.push(
        <blockquote key={index} className="my-3 border-l-2 border-primary pl-3 text-sm italic text-muted-foreground">
          {inline(line.slice(2))}
        </blockquote>,
      );
    } else {
      blocks.push(
        <p key={index} className="my-2 text-sm leading-relaxed text-muted-foreground">
          {inline(line)}
        </p>,
      );
    }
  });
  flush();

  return <div className="max-w-none">{blocks}</div>;
}
