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
  const [height, setHeight] = useState(620);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(false);
    setHeight(620);
  }, [src, srcDoc]);

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (!frameRef.current || event.source !== frameRef.current.contentWindow) return;
      const data = event.data as { type?: string; height?: number } | null;
      if (!data || data.type !== "cd-widget-height" || typeof data.height !== "number") {
        return;
      }
      const next = Math.max(240, Math.min(12000, Math.ceil(data.height)));
      setHeight(next);
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[3px] border border-[#dddddd] bg-white",
        className
      )}
    >
      {!loaded ? (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-white/90">
          <Spinner className="h-6 w-6 text-ember-500" />
          <p className="text-xs font-medium text-[#777777]">Loading concert schedule…</p>
        </div>
      ) : null}
      <iframe
        ref={frameRef}
        src={src}
        srcDoc={srcDoc}
        title={title}
        sandbox={SANDBOX}
        allow="clipboard-write; encrypted-media; fullscreen; payment"
        referrerPolicy="strict-origin-when-cross-origin"
        loading="eager"
        scrolling="no"
        onLoad={() => setLoaded(true)}
        className="block w-full border-0 bg-white"
        style={{ height }}
      />
    </div>
  );
}
