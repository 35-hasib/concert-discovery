import { Router } from "express";

import { asyncHandler } from "../http.js";
import { getSettings } from "../services/settings.js";

const router = Router();

router.get(
  "/",
  asyncHandler(async (_req, res) => {
    res.json({ settings: await getSettings() });
  })
);

export default router;
