import { Link } from "react-router-dom";

import { assetUrl } from "../lib/api";
import { cn } from "../lib/utils";

type LogoProps = {
  className?: string;
  href?: string;
  name?: string;
  src?: string;
};

export function Logo({ className, href = "/", name = "Concert Discovery", src }: LogoProps) {
  return (
    <Link to={href} className={cn("group flex items-center gap-3", className)}>
      {src ? (
        <img
          src={assetUrl(src)}
          alt={name}
          className="h-10 w-auto max-w-[190px] object-contain object-left"
        />
      ) : (
        <>
          <span className="relative flex h-10 w-10 items-center justify-center">
            <span className="absolute inset-0 rounded-full bg-ember-500/10" />
            <svg viewBox="0 0 40 40" className="relative h-9 w-9" aria-hidden="true">
              <circle cx="20" cy="20" r="18" fill="none" stroke="currentColor" strokeOpacity="0.12" />
              <path d="M25.2 9.2V24.4C25.2 28 22.4 30.8 19.2 30.8C16.2 30.8 14 28.9 14 26.4C14 23.8 16.4 21.8 19.3 21.8C20 21.8 20.6 21.9 21.2 22.1V12.3L25.2 9.2Z" fill="#1791C7" />
              <path d="M27.4 14.6L35 16.8V20.1L27.4 17.9V14.6Z" fill="#6ECCE9" />
            </svg>
          </span>
          <div className="flex flex-col">
            <span className="font-display text-lg uppercase leading-none tracking-tight text-ink-950">
              {name}
            </span>
            <span className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.3em] text-ink-600">
              Discover Tours • Explore Artists
            </span>
          </div>
        </>
      )}
    </Link>
  );
}

export function LogoLight({ className, href = "/", name = "Concert Discovery", src }: LogoProps) {
  return (
    <Link to={href} className={cn("group flex items-center gap-3", className)}>
      {src ? (
        <img
          src={assetUrl(src)}
          alt={name}
          className="h-10 w-auto max-w-[190px] object-contain object-left"
        />
      ) : (
        <>
          <span className="relative flex h-10 w-10 items-center justify-center">
            <span className="absolute inset-0 rounded-full bg-white/10" />
            <svg viewBox="0 0 40 40" className="relative h-9 w-9" aria-hidden="true">
              <circle cx="20" cy="20" r="18" fill="none" stroke="white" strokeOpacity="0.24" />
              <path d="M25.2 9.2V24.4C25.2 28 22.4 30.8 19.2 30.8C16.2 30.8 14 28.9 14 26.4C14 23.8 16.4 21.8 19.3 21.8C20 21.8 20.6 21.9 21.2 22.1V12.3L25.2 9.2Z" fill="#6ECCE9" />
              <path d="M27.4 14.6L35 16.8V20.1L27.4 17.9V14.6Z" fill="#EAF7FC" />
            </svg>
          </span>
          <div className="flex flex-col">
            <span className="font-display text-lg uppercase leading-none tracking-tight text-white">
              {name}
            </span>
            <span className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.3em] text-white/60">
              Discover Tours • Explore Artists • Find Tickets
            </span>
          </div>
        </>
      )}
    </Link>
  );
}
