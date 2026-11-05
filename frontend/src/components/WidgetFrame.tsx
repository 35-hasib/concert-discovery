import { useEffect, useRef, useState } from "react";

import { cn } from "../lib/utils";
import { Spinner } from "./Spinner";

const SANDBOX =
  "allow-scripts allow-popups allow-popups-to-escape-sandbox allow-forms allow-modals allow-downloads";

export function WidgetFrame({
  src,
  srcDoc,
  title,
  className,
}: {
  src?: string;
  srcDoc?: string;
  title: string;
  className?: string;
}) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const readyRef = useRef(false);
  const latestHeightRef = useRef(560);
  const [height, setHeight] = useState(560);
  const [ready, setReady] = useState(false);
  const [slow, setSlow] = useState(false);
  const [failed, setFailed] = useState(false);
  const [shouldLoad, setShouldLoad] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    readyRef.current = false;
    latestHeightRef.current = 560;
    setHeight(560);
    setReady(false);
    setSlow(false);
    setFailed(false);
    setShouldLoad(false);
    setAttempt(0);
  }, [src, srcDoc]);

  useEffect(() => {
    const node = wrapperRef.current;
    if (!node || (!src && !srcDoc)) return;
    if (!("IntersectionObserver" in window)) {
      setShouldLoad(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { rootMargin: "900px 0px" }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [src, srcDoc]);

  useEffect(() => {
    if (!shouldLoad || ready) return;
    const slowTimer = window.setTimeout(() => setSlow(true), 8000);
    const failedTimer = window.setTimeout(() => setFailed(true), 30000);
    return () => {
      window.clearTimeout(slowTimer);
      window.clearTimeout(failedTimer);
    };
  }, [shouldLoad, ready]);

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (!frameRef.current || event.source !== frameRef.current.contentWindow) return;
      const data = event.data as { type?: string; height?: number } | null;
      if (!data) return;
      if (data.type === "cd-widget-height" && typeof data.height === "number") {
        const next = Math.max(240, Math.min(60000, Math.ceil(data.height)));
        latestHeightRef.current = next;
        setHeight(readyRef.current ? next : Math.max(560, next));
      }
      if (data.type === "cd-widget-ready") {
        readyRef.current = true;
        if (latestHeightRef.current >= 400) setHeight(latestHeightRef.current);
        setReady(true);
        setSlow(false);
        setFailed(false);
      }
      if (data.type === "cd-widget-timeout") {
        setFailed(true);
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  function retry() {
    readyRef.current = false;
    latestHeightRef.current = 560;
    setHeight(560);
    setReady(false);
    setSlow(false);
    setFailed(false);
    setAttempt((value) => value + 1);
  }

  return (
    <div
      ref={wrapperRef}
      className={cn(
        "relative overflow-hidden rounded-[3px] border border-[#dddddd] bg-white transition-[height] duration-300 ease-out",
        className
      )}
      style={{ height }}
      aria-busy={!ready && !failed}
    >
      <div
        className={cn(
          "absolute inset-0 z-10 flex flex-col bg-white transition-opacity duration-300",
          ready ? "pointer-events-none opacity-0" : "opacity-100"
        )}
        aria-hidden={ready}
      >
        <div className="border-b border-[#e5e5e5] bg-[#f7f7f7] px-4 py-4">
          <div className="grid grid-cols-3 gap-2">
            <span className="skeleton h-9 rounded-[4px]" />
            <span className="skeleton h-9 rounded-[4px]" />
            <span className="skeleton h-9 rounded-[4px]" />
          </div>
        </div>
        <div className="flex-1 divide-y divide-[#eeeeee]">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className="grid grid-cols-[74px_minmax(0,1fr)_82px] items-center gap-3 px-4 py-4"
            >
              <div className="space-y-1.5">
                <div className="skeleton h-2.5 w-9" />
                <div className="skeleton h-3.5 w-7" />
                <div className="skeleton h-2 w-8" />
              </div>
              <div className="space-y-2">
                <div className="skeleton h-3.5 w-3/4" />
                <div className="skeleton h-2.5 w-1/2" />
              </div>
              <div className="skeleton ml-auto h-9 w-20 rounded-[3px]" />
            </div>
          ))}
        </div>
        {failed ? (
          <div
            className="flex flex-col items-center gap-2 border-t border-[#eeeeee] px-4 py-3 text-center"
            role="status"
            aria-live="polite"
          >
            <p className="text-[11px] font-medium text-[#777777]">
              The official ticket feed is taking longer than expected.
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={retry}
                className="inline-flex h-8 items-center justify-center rounded-[3px] bg-[#1791c7] px-3 text-[10px] font-bold uppercase tracking-[0.06em] text-white transition hover:bg-[#127794]"
              >
                Try again
              </button>
              <a
                href="https://www.ticketnetwork.com/tickets/"
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-8 items-center justify-center rounded-[3px] border border-[#cccccc] bg-white px-3 text-[10px] font-bold uppercase tracking-[0.06em] text-[#535353] transition hover:border-[#1791c7] hover:text-[#1791c7]"
              >
                Open TicketNetwork
              </a>
            </div>
          </div>
        ) : (
          <div
            className="flex items-center justify-center gap-2 border-t border-[#eeeeee] px-4 py-3 text-[11px] font-medium text-[#777777]"
            role="status"
            aria-live="polite"
          >
            <Spinner className="h-3.5 w-3.5 text-ember-500" />
            {slow ? "Still loading official dates…" : "Loading official dates…"}
          </div>
        )}
      </div>
      {shouldLoad ? (
        <iframe
          key={attempt}
          ref={frameRef}
          src={src}
          srcDoc={srcDoc}
          title={title}
          sandbox={SANDBOX}
          allow="clipboard-write; encrypted-media; fullscreen; payment"
          referrerPolicy="strict-origin-when-cross-origin"
          loading="eager"
          scrolling="no"
          className="block h-full w-full border-0 bg-white"
        />
      ) : null}
    </div>
  );
}
