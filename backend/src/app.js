import cors from "cors";
import express from "express";
import multer from "multer";

import { HttpError } from "./http.js";
import adminRoutes from "./routes/admin.js";
import authRoutes from "./routes/auth.js";
import blogRoutes from "./routes/blogs.js";
import contentRoutes from "./routes/content.js";
import mediaRoutes from "./routes/media.js";
import settingsRoutes from "./routes/settings.js";
import widgetRoutes from "./routes/widgets.js";

const app = express();

const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:5173,http://localhost:5174")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.disable("x-powered-by");
app.use("/embed/widget", widgetRoutes);
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      callback(new HttpError(403, "Origin is not allowed."));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: false, limit: "2mb" }));
app.use((_req, res, next) => {
  res.set("X-Content-Type-Options", "nosniff");
  res.set("Referrer-Policy", "strict-origin-when-cross-origin");
  next();
});

app.use(mediaRoutes);
app.use(contentRoutes);
app.use("/api/blogs", blogRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);

app.use((_req, _res, next) => next(new HttpError(404, "Endpoint not found.")));

app.use((error, _req, res, _next) => {
  if (error instanceof multer.MulterError) {
    const message = error.code === "LIMIT_FILE_SIZE" ? "Image is too large. Maximum size is 8 MB." : error.message;
    return res.status(400).json({ error: message });
  }
  if (error instanceof SyntaxError && "body" in error) {
    return res.status(400).json({ error: "Invalid JSON body." });
  }
  if (error?.code === "P2002") {
    return res.status(409).json({ error: "A record with that unique value already exists." });
  }
  if (error?.code === "P2025") {
    return res.status(404).json({ error: "Record not found." });
  }

  const status = error instanceof HttpError ? error.status : 500;
  if (status >= 500) console.error(error);
  res.status(status).json({
    error: status >= 500 ? "Something went wrong. Please try again." : error.message,
    ...(error.details ? { fieldErrors: error.details } : {}),
  });
});

export default app;
