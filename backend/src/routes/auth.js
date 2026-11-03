import bcrypt from "bcryptjs";
import { Router } from "express";

import { asyncHandler, HttpError } from "../http.js";
import { authRequired, publicAdmin, signToken } from "../middleware/auth.js";
import { prisma } from "../prisma.js";
import { loginSchema, validate } from "../validation.js";

const router = Router();

const attempts = new Map();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 10;

function rateLimit(req, _res, next) {
  const key = req.ip || "unknown";
  const now = Date.now();
  const entry = attempts.get(key) || { count: 0, resetAt: now + WINDOW_MS };
  if (now > entry.resetAt) {
    entry.count = 0;
    entry.resetAt = now + WINDOW_MS;
  }
  entry.count += 1;
  attempts.set(key, entry);
  if (entry.count > MAX_ATTEMPTS) {
    return next(new HttpError(429, "Too many login attempts. Please wait and try again."));
  }
  next();
}

router.post(
  "/login",
  rateLimit,
  asyncHandler(async (req, res) => {
    const { data, errors } = validate(loginSchema, req.body);
    if (!data) throw new HttpError(422, "Check the highlighted fields.", errors);

    const admin = await prisma.admin.findUnique({ where: { email: data.email.toLowerCase() } });
    if (!admin) throw new HttpError(401, "Invalid email or password.");

    const valid = await bcrypt.compare(data.password, admin.passwordHash);
    if (!valid) throw new HttpError(401, "Invalid email or password.");

    attempts.delete(req.ip || "unknown");
    res.json({ token: signToken(admin), admin: publicAdmin(admin) });
  })
);

router.get(
  "/me",
  authRequired,
  asyncHandler(async (req, res) => {
    res.json({ admin: req.admin });
  })
);

export default router;
