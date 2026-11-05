import { Router } from "express";
import multer from "multer";

import { ADMIN_PAGE_SIZE, GENRES } from "../constants.js";
import { asyncHandler, first, HttpError, toPositiveInt } from "../http.js";
import { authRequired } from "../middleware/auth.js";
import { prisma } from "../prisma.js";
import { blogData } from "../services/admin-blogs.js";
import { buildTicketNetworkWidgetCode } from "../services/ticketnetwork.js";
import { buildWidgetDocument } from "../services/widget.js";
import { saveImage } from "../services/upload.js";
import { serializeBlog, serializeSettings } from "../utils.js";
import { blogSchema, settingsSchema, validate, widgetPreviewSchema } from "../validation.js";

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024, files: 1 },
});

function uploadImage(req, res, next) {
  upload.fields([
    { name: "file", maxCount: 1 },
    { name: "image", maxCount: 1 },
  ])(req, res, next);
}

router.use(authRequired);

router.get(
  "/dashboard",
  asyncHandler(async (_req, res) => {
    const [total, published, drafts, featured, recent] = await Promise.all([
      prisma.blog.count(),
      prisma.blog.count({ where: { status: "PUBLISHED" } }),
      prisma.blog.count({ where: { status: "DRAFT" } }),
      prisma.blog.count({ where: { featured: true } }),
      prisma.blog.findMany({ orderBy: { updatedAt: "desc" }, take: 5 }),
    ]);
    res.json({
      stats: { total, published, drafts, featured },
      recent: recent.map(serializeBlog),
    });
  })
);

router.get(
  "/blogs",
  asyncHandler(async (req, res) => {
    const page = toPositiveInt(req.query.page, 1);
    const pageSize = Math.min(48, toPositiveInt(req.query.pageSize, ADMIN_PAGE_SIZE));
    const q = String(first(req.query.q) || "").trim().slice(0, 120);
    const status = first(req.query.status) === "DRAFT" || first(req.query.status) === "PUBLISHED" ? first(req.query.status) : "";
    const genre = GENRES.includes(first(req.query.genre)) ? first(req.query.genre) : "";

    const where = {};
    if (status) where.status = status;
    if (genre) where.genre = genre;
    if (q) {
      where.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { artistName: { contains: q, mode: "insensitive" } },
        { tourName: { contains: q, mode: "insensitive" } },
      ];
    }

    const [items, total, draftCount, publishedCount, featuredCount] = await Promise.all([
      prisma.blog.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.blog.count({ where }),
      prisma.blog.count({ where: { status: "DRAFT" } }),
      prisma.blog.count({ where: { status: "PUBLISHED" } }),
      prisma.blog.count({ where: { featured: true } }),
    ]);

    res.json({
      items: items.map(serializeBlog),
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
      counts: {
        draft: draftCount,
        published: publishedCount,
        featured: featuredCount,
        all: draftCount + publishedCount,
      },
    });
  })
);

router.get(
  "/blogs/:id",
  asyncHandler(async (req, res) => {
    const blog = await prisma.blog.findUnique({ where: { id: req.params.id } });
    if (!blog) throw new HttpError(404, "Blog post not found.");
    res.json({ blog: serializeBlog(blog) });
  })
);

router.post(
  "/blogs",
  asyncHandler(async (req, res) => {
    const { data, errors } = validate(blogSchema, req.body);
    if (!data) throw new HttpError(422, "Check the highlighted fields.", errors);
    const blog = await prisma.blog.create({ data: await blogData(data) });
    res.status(201).json({ blog: serializeBlog(blog) });
  })
);

router.put(
  "/blogs/:id",
  asyncHandler(async (req, res) => {
    const existing = await prisma.blog.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new HttpError(404, "Blog post not found.");
    const { data, errors } = validate(blogSchema, req.body);
    if (!data) throw new HttpError(422, "Check the highlighted fields.", errors);
    const blog = await prisma.blog.update({
      where: { id: existing.id },
      data: await blogData(data, existing),
    });
    res.json({ blog: serializeBlog(blog) });
  })
);

router.patch(
  "/blogs/:id",
  asyncHandler(async (req, res) => {
    const existing = await prisma.blog.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new HttpError(404, "Blog post not found.");

    const merged = {
      ...serializeBlog(existing),
      ...req.body,
      additionalImages: Array.isArray(existing.additionalImages)
        ? existing.additionalImages
        : JSON.parse(existing.additionalImages || "[]"),
    };

    const { data, errors } = validate(blogSchema, merged);
    if (!data) throw new HttpError(422, "Check the highlighted fields.", errors);

    const blog = await prisma.blog.update({
      where: { id: existing.id },
      data: await blogData(data, existing),
    });
    res.json({ blog: serializeBlog(blog) });
  })
);

router.delete(
  "/blogs/:id",
  asyncHandler(async (req, res) => {
    const existing = await prisma.blog.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new HttpError(404, "Blog post not found.");
    await prisma.blog.delete({ where: { id: existing.id } });
    res.json({ ok: true });
  })
);

router.put(
  "/settings",
  asyncHandler(async (req, res) => {
    const { data, errors } = validate(settingsSchema, req.body);
    if (!data) throw new HttpError(422, "Check the highlighted fields.", errors);

    const values = {
      websiteName: data.websiteName,
      tagline: data.tagline,
      logo: data.logo,
      favicon: data.favicon,
      description: data.description,
      contactEmail: data.contactEmail,
      socialLinks: JSON.stringify(data.socialLinks || {}),
      defaultSeoTitle: data.defaultSeoTitle,
      defaultSeoDescription: data.defaultSeoDescription,
    };
    const setting = await prisma.setting.upsert({
      where: { id: 1 },
      create: { id: 1, ...values },
      update: values,
    });
    res.json({ settings: serializeSettings(setting) });
  })
);

router.post(
  "/upload",
  uploadImage,
  asyncHandler(async (req, res) => {
    const files = req.files || {};
    const file = files.file?.[0] || files.image?.[0];
    const kind = req.body?.kind === "favicon" || req.body?.type === "favicon" ? "favicon" : "image";
    const result = await saveImage(file, kind);
    res.status(201).json(result);
  })
);

router.post(
  "/widget-preview",
  asyncHandler(async (req, res) => {
    const { data, errors } = validate(widgetPreviewSchema, req.body);
    if (!data) throw new HttpError(422, "Check the highlighted fields.", errors);
    let code = data.code;
    if (!code.trim() && data.scheduleArtistQuery.trim()) {
      code = buildTicketNetworkWidgetCode({
        blogId: data.blogId,
        artistQuery: data.scheduleArtistQuery,
        endDate: data.scheduleEndDate,
        affiliateUrl: data.scheduleAffiliateUrl,
        perPage: data.schedulePerPage,
      });
    }
    if (!code.trim()) throw new HttpError(422, "Add an artist search query or widget code.");
    res.json({ html: buildWidgetDocument(code, data.title) });
  })
);

export default router;
