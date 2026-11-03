import { ListTree } from "lucide-react";

import type { TocItem } from "../lib/types";
import { cn } from "../lib/utils";

export function TableOfContents({
  toc,
  className,
  compact = false,
}: {
  toc: TocItem[];
  className?: string;
  compact?: boolean;
}) {
  if (toc.length < 3) return null;

  return (
    <nav
      aria-label="Table of contents"
      className={cn(
        "rounded-2xl border border-ink-950/[0.07] bg-white",
        compact ? "p-4" : "p-5",
        className
      )}
    >
      <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-ink-600">
        <ListTree className="h-3.5 w-3.5 text-ember-600" />
        In this article
      </p>
      <ol className="mt-3 space-y-2 text-sm">
        {toc.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              className={cn(
                "block leading-snug text-ink-600 transition hover:text-ember-600",
                item.level === 3 && "pl-4 text-[13px]"
              )}
            >
              {item.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
