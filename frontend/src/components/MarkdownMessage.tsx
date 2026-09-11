import React from "react";
import { ExternalLink } from "lucide-react";

type MarkdownMessageProps = {
  content: string;
  isUser?: boolean;
};

export default function MarkdownMessage({
  content,
  isUser = false,
}: MarkdownMessageProps) {
  if (isUser) {
    return <div className="whitespace-pre-wrap break-words">{content}</div>;
  }

  // Parse inline elements (bold, italic, code, links)
  const renderInline = (text: string) => {
    // Regex chia văn bản thành các token: bold (**..**), code (`..`), link ([..](..)), italic (*..*)
    const tokenRegex =
      /(\*\*.*?\*\*|`.*?`|\[.*?\]\(.*?\)|\*.*?\*)/g;
    const parts = text.split(tokenRegex);

    return parts.map((part, index) => {
      // Bold: **text**
      if (part.startsWith("**") && part.endsWith("**") && part.length >= 4) {
        return (
          <strong key={index} className="font-semibold text-foreground">
            {part.slice(2, -2)}
          </strong>
        );
      }

      // Inline code: `text`
      if (part.startsWith("`") && part.endsWith("`") && part.length >= 2) {
        return (
          <code
            key={index}
            className="rounded-md bg-muted/80 px-1.5 py-0.5 font-mono text-[11px] text-primary"
          >
            {part.slice(1, -1)}
          </code>
        );
      }

      // Link: [label](url)
      const linkMatch = part.match(/^\[(.*?)\]\((.*?)\)$/);
      if (linkMatch) {
        const [, label, url] = linkMatch;
        return (
          <a
            key={index}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-0.5 font-medium text-primary underline underline-offset-2 hover:opacity-80"
          >
            {label}
            <ExternalLink className="size-2.5 opacity-70" />
          </a>
        );
      }

      // Italic: *text*
      if (part.startsWith("*") && part.endsWith("*") && part.length >= 2) {
        return (
          <em key={index} className="italic text-muted-foreground">
            {part.slice(1, -1)}
          </em>
        );
      }

      return part;
    });
  };

  // Chia content thành các block (dòng hoặc nhóm dòng)
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let currentList: { type: "ul" | "ol"; items: string[] } | null = null;

  const flushList = () => {
    if (!currentList) return;
    if (currentList.type === "ul") {
      elements.push(
        <ul key={`ul-${elements.length}`} className="my-2 space-y-1.5 pl-1">
          {currentList.items.map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
              <div className="flex-1 leading-relaxed">{renderInline(item)}</div>
            </li>
          ))}
        </ul>
      );
    } else {
      elements.push(
        <ol key={`ol-${elements.length}`} className="my-2 space-y-1.5 pl-1">
          {currentList.items.map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                {i + 1}
              </span>
              <div className="flex-1 leading-relaxed">{renderInline(item)}</div>
            </li>
          ))}
        </ol>
      );
    }
    currentList = null;
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    // Dòng trống
    if (!line) {
      flushList();
      elements.push(<div key={`empty-${i}`} className="h-2" />);
      continue;
    }

    // Horizontal Rule: ---
    if (line === "---" || line === "***" || line === "___") {
      flushList();
      elements.push(
        <hr key={`hr-${i}`} className="my-3 border-border/60" />
      );
      continue;
    }

    // Header 1: # Title
    if (line.startsWith("# ")) {
      flushList();
      elements.push(
        <h3
          key={`h1-${i}`}
          className="mt-3 mb-1 text-base font-bold text-foreground"
        >
          {renderInline(line.slice(2))}
        </h3>
      );
      continue;
    }

    // Header 2: ## Title
    if (line.startsWith("## ")) {
      flushList();
      elements.push(
        <h4
          key={`h2-${i}`}
          className="mt-2.5 mb-1 text-sm font-bold text-foreground"
        >
          {renderInline(line.slice(3))}
        </h4>
      );
      continue;
    }

    // Header 3: ### Title
    if (line.startsWith("### ")) {
      flushList();
      elements.push(
        <h5
          key={`h3-${i}`}
          className="mt-2 mb-0.5 text-xs font-bold uppercase tracking-wider text-muted-foreground"
        >
          {renderInline(line.slice(4))}
        </h5>
      );
      continue;
    }

    // Blockquote: > text
    if (line.startsWith("> ")) {
      flushList();
      elements.push(
        <div
          key={`quote-${i}`}
          className="my-2 rounded-xl border-l-3 border-primary bg-primary/5 px-3 py-2 text-xs italic text-muted-foreground"
        >
          {renderInline(line.slice(2))}
        </div>
      );
      continue;
    }

    // Unordered List: - item hoặc • item hoặc * item
    const bulletMatch = line.match(/^[-•*]\s+(.*)$/);
    if (bulletMatch) {
      if (!currentList || currentList.type !== "ul") {
        flushList();
        currentList = { type: "ul", items: [] };
      }
      currentList.items.push(bulletMatch[1]);
      continue;
    }

    // Ordered List: 1. item
    const numMatch = line.match(/^\d+\.\s+(.*)$/);
    if (numMatch) {
      if (!currentList || currentList.type !== "ol") {
        flushList();
        currentList = { type: "ol", items: [] };
      }
      currentList.items.push(numMatch[1]);
      continue;
    }

    // Đoạn văn bình thường
    flushList();
    elements.push(
      <p key={`p-${i}`} className="leading-relaxed">
        {renderInline(line)}
      </p>
    );
  }

  flushList();

  return <div className="space-y-1 text-[13px]">{elements}</div>;
}
