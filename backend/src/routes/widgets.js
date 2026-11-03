import { Router } from "express";

import { asyncHandler, HttpError } from "../http.js";
import { prisma } from "../prisma.js";
import { buildWidgetDocument, WIDGET_CSP } from "../services/widget.js";

const router = Router();

router.get(
  "/:slug",
  asyncHandler(async (req, res) => {
    const blog = await prisma.blog.findFirst({
      where: {
        slug: String(req.params.slug || "").slice(0, 160),
        status: "PUBLISHED",
        publishedAt: { lte: new Date() },
        widgetEnabled: true,
        widgetCode: { not: "" },
      },
      select: { title: true, widgetCode: true },
    });
    if (!blog || !blog.widgetCode.trim()) {
      throw new HttpError(404, "Concert schedule unavailable.");
    }

    res.set({
      "Content-Type": "text/html; charset=utf-8",
      "Content-Security-Policy": WIDGET_CSP,
      "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=600",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "strict-origin-when-cross-origin",
    });
    res.send(buildWidgetDocument(blog.widgetCode, blog.title));
  })
);

export default router;
