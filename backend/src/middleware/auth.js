import jwt from "jsonwebtoken";

import { HttpError } from "../http.js";
import { prisma } from "../prisma.js";

function secret() {
  const value = process.env.JWT_SECRET;
  if (!value) throw new Error("JWT_SECRET is not configured.");
  return value;
}

export function signToken(admin) {
  return jwt.sign(
    { sub: admin.id, email: admin.email, name: admin.name, role: admin.role },
    secret(),
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d", issuer: "concert-discovery" }
  );
}

export async function authRequired(req, _res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : "";
    if (!token) throw new HttpError(401, "Authentication required.");

    let payload;
    try {
      payload = jwt.verify(token, secret(), { issuer: "concert-discovery" });
    } catch {
      throw new HttpError(401, "Your session has expired. Please sign in again.");
    }

    if (!payload?.sub) throw new HttpError(401, "Authentication required.");

    const admin = await prisma.admin.findUnique({ where: { id: payload.sub } });
    if (!admin) throw new HttpError(401, "Account not found.");

    req.admin = { sub: admin.id, email: admin.email, name: admin.name, role: admin.role };
    next();
  } catch (error) {
    next(error);
  }
}

export function publicAdmin(admin) {
  return { id: admin.id, name: admin.name, email: admin.email, role: admin.role };
}
