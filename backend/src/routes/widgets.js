import { Router } from "express";

import { asyncHandler, HttpError } from "../http.js";
import { prisma } from "../prisma.js";
import { buildTicketNetworkWidgetCode } from "../services/ticketnetwork.js";
import { buildWidgetDocument, WIDGET_CSP } from "../services/widget.js";

const router = Router();


const TN_EVENTS_URL = "https://www.tn-apis.com/catalog/v2/events/search";
const TN_CACHE_TTL = 5 * 60 * 1000;
const TN_CACHE_STALE = 30 * 60 * 1000;
const TN_CACHE_MAX = 50;
const eventCache = new Map();
const inflight = new Map();

function cacheKey(query) {
  const params = new URLSearchParams(query);
  params.delete("consumerKey");
  params.delete("websiteConfigId");
  return [...params.entries()]
    .sort(([keyA, valueA], [keyB, valueB]) => keyA.localeCompare(keyB) || String(valueA).localeCompare(String(valueB)))
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join("&");
}

const TN_FETCH_ATTEMPTS = 5;
const TN_FETCH_TIMEOUT_MS = 8000;
const TN_HEDGE_DELAY_MS = 1200;

function fetchTicketNetworkEvents(url) {
  return new Promise((resolve, reject) => {
    const controllers = new Set();
    const timers = [];
    let launched = 0;
    let failures = 0;
    let settled = false;
    let lastError;

    function cleanup() {
      for (const timer of timers) clearTimeout(timer);
      for (const controller of controllers) controller.abort();
      controllers.clear();
    }

    function launch() {
      if (settled || launched >= TN_FETCH_ATTEMPTS) return;
      launched += 1;
      const controller = new AbortController();
      controllers.add(controller);
      const timer = setTimeout(() => controller.abort(), TN_FETCH_TIMEOUT_MS);

      fetch(url, { headers: { Accept: "application/json" }, signal: controller.signal })
        .then(async (response) => {
          clearTimeout(timer);
          if (!response.ok) throw new Error(`TicketNetwork responded with ${response.status}`);
          const data = await response.json();
          if (settled) return;
          settled = true;
          cleanup();
          resolve(data);
        })
        .catch((error) => {
          clearTimeout(timer);
          controllers.delete(controller);
          if (settled) return;
          lastError = error;
          failures += 1;
          if (failures >= TN_FETCH_ATTEMPTS) {
            settled = true;
            cleanup();
            reject(lastError);
          }
        });

      if (launched < TN_FETCH_ATTEMPTS) {
        timers.push(setTimeout(launch, TN_HEDGE_DELAY_MS));
      }
    }

    launch();
  });
}

async function loadTicketNetworkEvents(query) {
  const params = new URLSearchParams(query);
  if (!params.get("q")) throw new HttpError(400, "Missing event search query.");
  if (!params.get("consumerKey")) {
    params.set("consumerKey", process.env.TICKETNETWORK_CONSUMER_KEY || "fuTwxN_M6RKMaobcsfJ5qSvcVAUa");
  }
  if (!params.get("websiteConfigId")) {
    params.set("websiteConfigId", process.env.TICKETNETWORK_WEBSITE_CONFIG_ID || "12498");
  }

  return fetchTicketNetworkEvents(`${TN_EVENTS_URL}?${params.toString()}`);
}

function setEventCors(res) {
  res.set({
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Accept, Content-Type, X-Requested-With",
    "Access-Control-Max-Age": "600",
  });
}

router.options("/_events", (req, res) => {
  setEventCors(res);
  res.status(204).end();
});

router.get(
  "/_events",
  asyncHandler(async (req, res) => {
    setEventCors(res);
    const query = req.originalUrl.split("?")[1] || "";
    if (!query) throw new HttpError(400, "Missing event search query.");

    const key = cacheKey(query);
    const cached = eventCache.get(key);
    const now = Date.now();

    if (cached && now - cached.storedAt < TN_CACHE_TTL) {
      res.set("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
      res.json(cached.data);
      return;
    }

    let pending = inflight.get(key);
    if (!pending) {
      pending = loadTicketNetworkEvents(query)
        .then((data) => {
          eventCache.set(key, { data, storedAt: Date.now() });
          if (eventCache.size > TN_CACHE_MAX) {
            eventCache.delete(eventCache.keys().next().value);
          }
          return data;
        })
        .catch((error) => {
          if (cached && Date.now() - cached.storedAt < TN_CACHE_STALE) return cached.data;
          throw error;
        })
        .finally(() => inflight.delete(key));
      inflight.set(key, pending);
    }

    if (cached) {
      res.set("Cache-Control", "public, max-age=30, stale-while-revalidate=300");
      res.json(cached.data);
      pending.catch(() => {});
      return;
    }

    try {
      const data = await pending;
      res.set("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
      res.json(data);
    } catch (error) {
      throw new HttpError(503, "The official ticket feed is taking too long. Please try again.");
    }
  })
);

router.get(
  "/:slug",
  asyncHandler(async (req, res) => {
    const blog = await prisma.blog.findFirst({
      where: {
        slug: String(req.params.slug || "").slice(0, 160),
        status: "PUBLISHED",
        publishedAt: { lte: new Date() },
        widgetEnabled: true,
        OR: [{ widgetCode: { not: "" } }, { scheduleArtistQuery: { not: "" } }],
      },
      select: {
        id: true,
        title: true,
        widgetCode: true,
        scheduleArtistQuery: true,
        scheduleEndDate: true,
        scheduleAffiliateUrl: true,
        schedulePerPage: true,
        tourEndDate: true,
      },
    });
    if (!blog) throw new HttpError(404, "Concert schedule unavailable.");

    const code = blog.widgetCode.trim()
      ? blog.widgetCode
      : blog.scheduleArtistQuery.trim()
        ? buildTicketNetworkWidgetCode({
            blogId: blog.id,
            artistQuery: blog.scheduleArtistQuery,
            endDate: blog.scheduleEndDate || blog.tourEndDate,
            affiliateUrl: blog.scheduleAffiliateUrl,
            perPage: blog.schedulePerPage,
          })
        : "";
    if (!code.trim()) throw new HttpError(404, "Concert schedule unavailable.");

    res.set({
      "Content-Type": "text/html; charset=utf-8",
      "Content-Security-Policy": WIDGET_CSP,
      "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=600",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "strict-origin-when-cross-origin",
    });
    res.send(buildWidgetDocument(code, blog.title));
  })
);

export default router;
