export const WIDGET_CSP = [
  "default-src * data: blob: 'unsafe-inline' 'unsafe-eval'",
  "script-src * data: blob: 'unsafe-inline' 'unsafe-eval'",
  "style-src * 'unsafe-inline'",
  "img-src * data: blob:",
  "font-src * data:",
  "media-src * data: blob:",
  "connect-src *",
  "frame-src *",
  "object-src 'none'",
  "base-uri 'none'",
  "form-action https: http:",
].join("; ");


function escapeHtml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const STORAGE_SHIM = `
(function () {
  function memoryStorage() {
    var data = Object.create(null);
    return {
      getItem: function (key) { return Object.prototype.hasOwnProperty.call(data, key) ? data[key] : null; },
      setItem: function (key, value) { data[key] = String(value); },
      removeItem: function (key) { delete data[key]; },
      clear: function () { data = Object.create(null); },
      key: function (index) { var keys = Object.keys(data); return keys[index] || null; },
      get length() { return Object.keys(data).length; }
    };
  }
  ["localStorage", "sessionStorage"].forEach(function (name) {
    try {
      void window[name];
    } catch (error) {
      try {
        Object.defineProperty(window, name, { configurable: true, value: memoryStorage() });
      } catch (ignored) {}
    }
  });
})();
`;

const RESIZE_SCRIPT = `
(function () {
  var lastHeight = 0;
  var scheduled = false;

  function report() {
    scheduled = false;
    if (!document.body) return;
    var height = Math.ceil(document.body.getBoundingClientRect().height);
    if (!height || Math.abs(height - lastHeight) < 2) return;
    lastHeight = height;
    try {
      window.parent.postMessage({ type: "cd-widget-height", height: height }, "*");
    } catch (error) {}
  }

  function schedule() {
    if (scheduled) return;
    scheduled = true;
    window.setTimeout(report, 16);
  }

  function prepareLinks() {
    var links = document.querySelectorAll("a[href]");
    for (var i = 0; i < links.length; i += 1) {
      var link = links[i];
      var href = link.getAttribute("href") || "";
      if (/^https?:\\/\\//i.test(href) && !link.getAttribute("target")) {
        link.setAttribute("target", "_blank");
        link.setAttribute("rel", "noopener noreferrer");
      }
    }
  }

  document.addEventListener("click", function (event) {
    var target = event.target;
    while (target && target.tagName !== "A") target = target.parentElement;
    if (target && target.getAttribute) {
      var href = target.getAttribute("href") || "";
      if (/^https?:\\/\\//i.test(href) && !target.getAttribute("target")) {
        target.setAttribute("target", "_blank");
        target.setAttribute("rel", "noopener noreferrer");
      }
    }
  }, true);

  if ("ResizeObserver" in window) {
    var observer = new ResizeObserver(schedule);
    observer.observe(document.documentElement);
    if (document.body) observer.observe(document.body);
  }

  if ("MutationObserver" in window && document.body) {
    new MutationObserver(function () {
      prepareLinks();
      schedule();
    }).observe(document.body, { childList: true, subtree: true });
  }

  window.addEventListener("load", function () { prepareLinks(); report(); });
  window.addEventListener("resize", schedule);
  document.addEventListener("DOMContentLoaded", function () { prepareLinks(); report(); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(report);
  setTimeout(report, 100);
  setTimeout(report, 700);
  setTimeout(report, 1800);
})();
`;

export function buildWidgetDocument(code, title) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta http-equiv="Content-Security-Policy" content="${WIDGET_CSP}" />
<meta http-equiv="X-UA-Compatible" content="IE=edge" />
<title>${escapeHtml(title || "Concert Schedule")}</title>
<style>
  html, body { margin: 0; padding: 0; background: transparent; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    color: #101014;
    overflow-x: hidden;
    min-height: 40px;
  }
  *, *::before, *::after { box-sizing: border-box; }
  img, iframe { max-width: 100%; }
</style>
<script>${STORAGE_SHIM}</script>
</head>
<body>
${code}
<script>${RESIZE_SCRIPT}</script>
</body>
</html>`;
}
