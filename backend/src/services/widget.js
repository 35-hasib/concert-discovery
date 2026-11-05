import { TICKETNETWORK_THEME_CSS } from "./ticketnetwork.js";

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

const TICKETNETWORK_HINTS = `
  <link rel="preconnect" href="https://venuefiles.s3.amazonaws.com" />
  <link rel="preconnect" href="https://ajax.googleapis.com" />
  <link rel="preconnect" href="https://www.ticketnetwork.com" />
  <link rel="preconnect" href="https://www.tn-apis.com" crossorigin />
  <link rel="dns-prefetch" href="https://www.tn-apis.com" />
  <link rel="preload" as="style" href="https://venuefiles.s3.amazonaws.com/css/csctn-results-v3.css" />
  <link rel="preload" as="script" href="https://ajax.googleapis.com/ajax/libs/jquery/3.5.1/jquery.min.js" />
  <link rel="preload" as="script" href="https://venuefiles.s3.amazonaws.com/js/csctn-results-v3.js" />
  <link rel="preload" as="script" href="https://www.ticketnetwork.com/e/csctn-results-v3.js" />
  <link rel="preload" as="script" href="https://www.ticketnetwork.com/e/csctn-jquery-datepicker.js" />
`;

const TICKETNETWORK_PROXY_PATH = "/embed/widget/_events";
const TICKETNETWORK_MAX_PER_PAGE = 100;

const TICKETNETWORK_AUTOLOAD_SCRIPT = `
<script>
(function () {
  var waiting = false;
  var retryTimer = 0;

  function release() {
    waiting = false;
    window.clearTimeout(retryTimer);
    window.setTimeout(loadAll, 250);
  }

  function loadAll() {
    if (waiting) return;
    var more = document.querySelector(".tner-more");
    if (!more || more.style.display === "none") return;
    if (!document.querySelector(".tner-row")) return;
    waiting = true;
    more.click();
    retryTimer = window.setTimeout(release, 6000);
  }

  function start() {
    if (window.jQuery) window.jQuery(document).ajaxComplete(release);
    window.setInterval(loadAll, 900);
    window.setTimeout(loadAll, 700);
    window.setTimeout(loadAll, 1800);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
</script>`;

const TICKETNETWORK_PROXY_SCRIPT = `
<script>
(function () {
  var searchUrl = "https://www.tn-apis.com/catalog/v2/events/search";
  var attempts = 0;
  function install() {
    attempts += 1;
    if (!window.jQuery || !window.jQuery.ajaxPrefilter) {
      if (attempts < 1500) window.setTimeout(install, 20);
      return;
    }
    window.jQuery.ajaxPrefilter(function (options) {
      var url = options.url || "";
      if (url.indexOf(searchUrl) === 0) {
        options.url = ${JSON.stringify(TICKETNETWORK_PROXY_PATH)} + url.slice(searchUrl.length);
        options.crossDomain = true;
      }
    });
  }
  install();
})();
</script>`;

function expandTicketNetworkPageSize(code) {
  return code.replace(
    /(params\.perPage\s*=\s*)(["'])\d+\2/g,
    `$1$2${TICKETNETWORK_MAX_PER_PAGE}$2`
  );
}

function ticketNetworkPrefetchPath(code) {
  const filters = /params\.filters\s*=\s*"([^"]+)"/.exec(code)?.[1];
  if (!filters) return "";
  const specialFilters = /params\.specialFilters\s*=\s*"([^"]*)"/.exec(code)?.[1] || "";
  const perPage = /params\.perPage\s*=\s*"([^"]+)"/.exec(code)?.[1] || "24";
  return `${TICKETNETWORK_PROXY_PATH}?${filters}${specialFilters}&perPage=${encodeURIComponent(perPage)}&page=1`;
}

const RESIZE_SCRIPT = `
(function () {
  var lastHeight = 0;
  var scheduled = false;
  var readySent = false;
  var isTicketNetwork = !!document.querySelector(".tner-container");

  function post(message) {
    try {
      window.parent.postMessage(message, "*");
    } catch (error) {}
  }

  function markReady() {
    if (readySent) return;
    readySent = true;
    post({ type: "cd-widget-ready" });
  }

  function hasContent() {
    if (!isTicketNetwork) return document.readyState === "complete";
    return !!document.querySelector(".tner-row, .tner-no-results, .tner-no-results-text");
  }

  function checkReady() {
    if (readySent || !hasContent()) return;
    schedule();
    window.setTimeout(markReady, 60);
  }

  function report() {
    scheduled = false;
    if (!document.body) return;
    var height = Math.ceil(document.body.getBoundingClientRect().height);
    if (!height || Math.abs(height - lastHeight) < 2) return;
    lastHeight = height;
    post({ type: "cd-widget-height", height: height });
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
    var observer = new ResizeObserver(function () {
      schedule();
      checkReady();
    });
    observer.observe(document.documentElement);
    if (document.body) observer.observe(document.body);
  }

  if ("MutationObserver" in window && document.body) {
    new MutationObserver(function () {
      prepareLinks();
      schedule();
      checkReady();
    }).observe(document.body, { childList: true, subtree: true });
  }

  window.addEventListener("load", function () { prepareLinks(); report(); checkReady(); });
  window.addEventListener("resize", schedule);
  document.addEventListener("DOMContentLoaded", function () { prepareLinks(); report(); checkReady(); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(report);
  setTimeout(report, 100);
  setTimeout(report, 700);
  setTimeout(report, 1800);
  setTimeout(checkReady, 1200);
  setTimeout(checkReady, 3000);
  setTimeout(checkReady, 7000);
  setTimeout(function () {
    if (!readySent) post({ type: "cd-widget-timeout" });
  }, 30000);
})();
`;

const HTTPS_TICKETNETWORK_HOSTS =
  /(^|[^A-Za-z0-9:])(?:https?:)?\/\/((?:www\.)?tn-apis\.com|venuefiles\.s3\.amazonaws\.com|ajax\.googleapis\.com|(?:www\.)?ticketnetwork\.com|ticketnetwork\.7eer\.net)/gi;

function normalizeTicketNetworkUrls(code) {
  return code.replace(HTTPS_TICKETNETWORK_HOSTS, (_match, prefix, host) => `${prefix}https://${host}`);
}

function stripLegacyTheme(code) {
  return code.replace(/\n*<style id=["']cd-schedule-theme["']>[\s\S]*?<\/style>\s*$/i, "").trimEnd();
}

export function buildWidgetDocument(rawCode, title) {
  const normalized = stripLegacyTheme(normalizeTicketNetworkUrls(rawCode));
  const hasTicketNetwork = /csctn-results-v3|tn-apis\.com|tner-container/i.test(normalized);
  const code = hasTicketNetwork ? expandTicketNetworkPageSize(normalized) : normalized;
  const prefetchPath = hasTicketNetwork ? ticketNetworkPrefetchPath(code) : "";
  const prefetchScript = prefetchPath
    ? `<script>fetch(${JSON.stringify(prefetchPath).replace(/</g, "\\u003c")}, { headers: { Accept: "application/json" } }).catch(function () {});</script>`
    : "";
  const themedCode = hasTicketNetwork
    ? `${code}\n<style id="cd-schedule-theme">${TICKETNETWORK_THEME_CSS}</style>\n${TICKETNETWORK_AUTOLOAD_SCRIPT}`
    : code;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta http-equiv="Content-Security-Policy" content="${WIDGET_CSP}" />
<meta http-equiv="X-UA-Compatible" content="IE=edge" />
<title>${escapeHtml(title || "Concert Schedule")}</title>
${hasTicketNetwork ? TICKETNETWORK_HINTS + TICKETNETWORK_PROXY_SCRIPT + prefetchScript : ""}
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
${themedCode}
<script>${RESIZE_SCRIPT}</script>
</body>
</html>`;
}
