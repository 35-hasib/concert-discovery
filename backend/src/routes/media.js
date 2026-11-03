import { Router } from "express";

import { asyncHandler, HttpError } from "../http.js";
import { readUpload } from "../services/upload.js";

const router = Router();

router.get(
  "/uploads/:filename",
  asyncHandler(async (req, res) => {
    const data = await readUpload(req.params.filename);
    if (!data) throw new HttpError(404, "Not found.");
    const extension = req.params.filename.split(".").pop();
    res.set({
      "Content-Type": extension === "png" ? "image/png" : "image/webp",
      "Content-Length": String(data.byteLength),
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    });
    res.send(data);
  })
);

export default router;
