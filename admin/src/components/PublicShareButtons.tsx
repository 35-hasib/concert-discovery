import { Check, Link2, Share2 } from "lucide-react";
import { useState, type SVGProps } from "react";

import { cn } from "../lib/utils";

const ICON_PATHS = {
  x: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z",
  facebook:
    "M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047v-2.66c0-3.026 1.792-4.697 4.533-4.697 1.313 0 2.686.236 2.686.236v2.973H15.83c-1.491 0-1.956.93-1.956 1.886v2.262h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073Z",
} as const;

function SocialIcon({
  name,
  className,
  ...props
}: { name: keyof typeof ICON_PATHS } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
      {...props}
    >
      <path d={ICON_PATHS[name]} />
    </svg>
  );
}

export function PublicShareButtons({
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
          <Share2 className="h-3.5 w-3.5 text-[#127794]" /> Share
        </span>
      ) : null}

      {items.map((item) => (
        <a
          key={item.label}
          href={item.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={item.label}
          className="flex h-9 w-9 items-center justify-center rounded-[3px] border border-[#dddddd] bg-white text-[#777777] transition hover:border-[#1791c7] hover:bg-[#eaf7fc] hover:text-[#127794]"
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
            : "border-[#dddddd] bg-white text-[#777777] hover:border-[#1791c7] hover:bg-[#eaf7fc] hover:text-[#127794]"
        )}
      >
        {copied ? <Check className="h-3.5 w-3.5" /> : <Link2 className="h-3.5 w-3.5" />}
        {copied ? "Copied" : "Copy link"}
      </button>
    </div>
  );
}
