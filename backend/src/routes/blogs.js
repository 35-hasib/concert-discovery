import { Router } from "express";

import { GENRES, PAGE_SIZE } from "../constants.js";
import { asyncHandler, first, HttpError, toPositiveInt } from "../http.js";
import { prisma } from "../prisma.js";
import { serializeBlog } from "../utils.js";

const router = Router();

export const publishedWhere = () => ({
  status: "PUBLISHED",
  publishedAt: { lte: new Date() },
});

function buildWhere({ q, genre }) {
  const where = publishedWhere();
  if (genre && GENRES.includes(genre)) where.genre = genre;
  const query = (q || "").trim().slice(0, 120);
  if (query) {
    where.OR = [
      { title: { contains: query, mode: "insensitive" } },
      { artistName: { contains: query, mode: "insensitive" } },
      { tourName: { contains: query, mode: "insensitive" } },
      { excerpt: { contains: query, mode: "insensitive" } },
    ];
  }
  return where;
}

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const page = toPositiveInt(req.query.page, 1);
    const pageSize = Math.min(48, toPositiveInt(req.query.pageSize, PAGE_SIZE));
    const sort = first(req.query.sort) === "oldest" ? "oldest" : "newest";
    const genre = GENRES.includes(first(req.query.genre)) ? first(req.query.genre) : "";
    const q = String(first(req.query.q) || "").slice(0, 120);
    const where = buildWhere({ q, genre });

    const [items, total] = await Promise.all([
      prisma.blog.findMany({
        where,
        orderBy: { publishedAt: sort === "oldest" ? "asc" : "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.blog.count({ where }),
    ]);

    res.json({
      items: items.map(serializeBlog),
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    });
  })
);

router.get(
  "/featured",
  asyncHandler(async (req, res) => {
    const limit = Math.min(12, toPositiveInt(req.query.limit, 3));
    let items = await prisma.blog.findMany({
      where: { ...publishedWhere(), featured: true },
      orderBy: { publishedAt: "desc" },
      take: limit,
    });
    if (!items.length) {
      items = await prisma.blog.findMany({
        where: publishedWhere(),
        orderBy: { publishedAt: "desc" },
        take: limit,
      });
    }
    res.json({ items: items.map(serializeBlog) });
  })
);

router.get(
  "/latest",
  asyncHandler(async (req, res) => {
    const limit = Math.min(24, toPositiveInt(req.query.limit, 6));
    const items = await prisma.blog.findMany({
      where: publishedWhere(),
      orderBy: { publishedAt: "desc" },
      take: limit,
    });
    res.json({ items: items.map(serializeBlog) });
  })
);

router.get(
  "/genres",
  asyncHandler(async (_req, res) => {
    const groups = await prisma.blog.groupBy({
      by: ["genre"],
      where: publishedWhere(),
      _count: { _all: true },
    });
    const counts = Object.fromEntries(groups.map((group) => [group.genre, group._count._all]));
    res.json({
      genres: GENRES.map((name) => ({ name, count: counts[name] || 0 })),
    });
  })
);

router.get(
  "/:slug",
  asyncHandler(async (req, res) => {
    const slug = String(req.params.slug || "").slice(0, 160);
    const blog = await prisma.blog.findFirst({ where: { slug, ...publishedWhere() } });
    if (!blog) throw new HttpError(404, "Tour announcement not found.");

    const [related, moreByArtist] = await Promise.all([
      prisma.blog.findMany({
        where: {
          ...publishedWhere(),
          id: { not: blog.id },
          OR: [{ genre: blog.genre }, ...(blog.artistName ? [{ artistName: blog.artistName }] : [])],
        },
        orderBy: [{ artistName: "asc" }, { publishedAt: "desc" }],
        take: 3,
      }),
      prisma.blog.findMany({
        where: {
          ...publishedWhere(),
          artistName: blog.artistName,
          id: { not: blog.id },
        },
        orderBy: { publishedAt: "desc" },
        take: 3,
      }),
    ]);

    let relatedItems = related;
    if (!relatedItems.length) {
      relatedItems = await prisma.blog.findMany({
        where: { ...publishedWhere(), id: { not: blog.id } },
        orderBy: { publishedAt: "desc" },
        take: 3,
      });
    }

    res.json({
      blog: serializeBlog(blog),
      related: relatedItems.map(serializeBlog),
      moreByArtist: moreByArtist.map(serializeBlog),
    });
  })
);

export default router;
