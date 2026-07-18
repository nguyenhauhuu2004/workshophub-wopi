// components/WorkshopContent.tsx

import DOMPurify from "isomorphic-dompurify";

type WorkshopContentProps = {
  content: string;
  className?: string;
};

export default function WorkshopContent({
  content,
  className = "",
}: WorkshopContentProps) {
  const safeHtml = DOMPurify.sanitize(content);

  return (
    <article
      className={[
        "prose prose-neutral w-full max-w-none",
        "prose-headings:font-semibold",
        "prose-p:leading-7",
        "prose-img:h-auto prose-img:max-w-full prose-img:rounded-2xl",
        "prose-a:text-blue-600",
        "prose-blockquote:border-neutral-300",
        className,
      ].join(" ")}
      dangerouslySetInnerHTML={{
        __html: safeHtml,
      }}
    />
  );
}