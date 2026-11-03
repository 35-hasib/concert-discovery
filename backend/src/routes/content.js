import { Router } from "express";

import { asyncHandler } from "../http.js";
import { prisma } from "../prisma.js";
import { escapeXml, siteUrl } from "../utils.js";
import { publishedWhere } from "./blogs.js";

const router = Router();

router.get(["/health", "/api/health"], (_req, res) => {
  res.json({ ok: true });
});

router.get(
  "/sitemap.xml",
  asyncHandler(async (_req, res) => {
    const base = siteUrl();
    const blogs = await prisma.blog.findMany({
      where: publishedWhere(),
      select: { slug: true, updatedAt: true },
      orderBy: { publishedAt: "desc" },
    });
    const now = new Date().toISOString();
    const staticRoutes = [
      ["/", "daily", "1.0"],
      ["/tours", "daily", "0.9"],
      ["/contact", "yearly", "0.3"],
      ["/privacy", "yearly", "0.3"],
      ["/terms", "yearly", "0.3"],
    ];
    const urls = [
      ...staticRoutes.map(
        ([path, frequency, priority]) =>
          `<url><loc>${escapeXml(base + path)}</loc><lastmod>${now}</lastmod><changefreq>${frequency}</changefreq><priority>${priority}</priority></url>`
      ),
      ...blogs.map(
        (blog) =>
          `<url><loc>${escapeXml(`${base}/tours/${blog.slug}`)}</loc><lastmod>${blog.updatedAt.toISOString()}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>`
      ),
    ];

    res.type("application/xml").send(
      `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.join("")}</urlset>`
    );
  })
);

router.get("/robots.txt", (_req, res) => {
  const base = siteUrl();
  res.type("text/plain").send(
    [`User-agent: *`, `Allow: /`, `Disallow: /admin/`, `Disallow: /api/`, `Disallow: /embed/`, ``, `Sitemap: ${base}/sitemap.xml`, `Host: ${base}`, ``].join("\n")
  );
});

export default router;
