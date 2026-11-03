import { Check, Link2, Share2 } from "lucide-react";
import { useState } from "react";

import { cn } from "../lib/utils";
import { SocialIcon } from "./SocialIcon";

export function ShareButtons({
  url,
  title,
  compact = false,
}: {
  url: string;
  title: string;
  compact?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy this link:", url);
    }
  }

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const items = [
    {
      label: "Share on X",
      href: `https://x.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
      icon: "x" as const,
    },
    {
      label: "Share on Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      icon: "facebook" as const,
    },
  ];

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2",
        compact ? "" : "rounded-[3px] border border-[#e5e5e5] bg-white p-4"
      )}
    >
      {!compact ? (
        <span className="mr-1 inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-[#777777]">
          <Share2 className="h-3.5 w-3.5 text-ember-600" /> Share
        </span>
      ) : null}

      {items.map((item) => (
        <a
          key={item.label}
          href={item.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={item.label}
          className="flex h-9 w-9 items-center justify-center rounded-[3px] border border-[#dddddd] bg-white text-[#777777] transition hover:border-ember-500 hover:bg-ember-50 hover:text-ember-600"
        >
          <SocialIcon name={item.icon} className="h-4 w-4" />
        </a>
      ))}

      <button
        type="button"
        onClick={copy}
        aria-label="Copy link"
        className={cn(
          "flex h-9 items-center gap-1.5 rounded-[3px] border px-3 text-xs font-semibold transition",
          copied
            ? "border-emerald-500/30 bg-emerald-50 text-emerald-700"
            : "border-[#dddddd] bg-white text-[#777777] hover:border-ember-500 hover:bg-ember-50 hover:text-ember-600"
        )}
      >
        {copied ? <Check className="h-3.5 w-3.5" /> : <Link2 className="h-3.5 w-3.5" />}
        {copied ? "Copied" : "Copy link"}
      </button>
    </div>
  );
}
