import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function Markdown({ children }: { children: string }) {
  return (
    <div className="prose prose-sm max-w-none text-[var(--color-fg)] [&_a]:text-[var(--color-primary)] [&_strong]:text-[var(--color-fg)] [&_code]:rounded [&_code]:bg-[var(--color-muted)] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-xs">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{children}</ReactMarkdown>
    </div>
  );
}
