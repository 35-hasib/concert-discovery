import { createHash } from "crypto";
import { readFile } from "fs/promises";
import path from "path";
import sharp from "sharp";

import { HttpError } from "../http.js";

const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"]);

export const UPLOAD_DIR = path.join(process.cwd(), "storage", "uploads");
const FILE_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(webp|png)$/;

function cloudinaryConfig() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();

  if (!cloudName || !apiKey || !apiSecret) {
    throw new HttpError(500, "Image storage is not configured.");
  }

  return {
    cloudName,
    apiKey,
    apiSecret,
    folder: process.env.CLOUDINARY_FOLDER?.trim().replace(/^\/+|\/+$/g, "") || "concert-discovery",
  };
}

function signCloudinary(params, secret) {
  const payload = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");
  return createHash("sha1").update(`${payload}${secret}`).digest("hex");
}

async function uploadToCloudinary(output, extension, kind, config) {
  const timestamp = Math.floor(Date.now() / 1000);
  const folder = `${config.folder}/${kind === "favicon" ? "favicons" : "images"}`;
  const signature = signCloudinary({ folder, timestamp }, config.apiSecret);

  const form = new FormData();
  form.append(
    "file",
    new Blob([output], { type: kind === "favicon" ? "image/png" : "image/webp" }),
    `upload.${extension}`
  );
  form.append("api_key", config.apiKey);
  form.append("timestamp", String(timestamp));
  form.append("folder", folder);
  form.append("signature", signature);

  const endpoint = `https://api.cloudinary.com/v1_1/${encodeURIComponent(config.cloudName)}/image/upload`;
  let lastError = null;

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    let response;
    try {
      response = await fetch(endpoint, {
        method: "POST",
        body: form,
        signal: AbortSignal.timeout(30_000),
      });
    } catch (error) {
      lastError = error;
      if (attempt < 3) {
        await new Promise((resolve) => setTimeout(resolve, attempt * 500));
        continue;
      }
      break;
    }

    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.secure_url) {
      console.error("Cloudinary upload failed:", {
        status: response.status,
        message: data?.error?.message || "Unknown Cloudinary error",
      });
      throw new HttpError(502, "Image upload failed. Please try again.");
    }

    return {
      url: data.secure_url,
      publicId: data.public_id || "",
    };
  }

  console.error("Cloudinary upload failed:", lastError);
  throw new HttpError(502, "Image upload failed. Please try again.");
}

export async function saveImage(file, kind = "image") {
  if (!file || !file.buffer) throw new HttpError(400, "No file was provided.");
  if (!ALLOWED_MIME.has(file.mimetype)) {
    throw new HttpError(400, "Unsupported image type. Use JPG, PNG, WebP, AVIF or GIF.");
  }
  if (file.size > MAX_BYTES) throw new HttpError(400, "Image is too large. Maximum size is 8 MB.");

  const config = cloudinaryConfig();
  let pipeline = sharp(file.buffer, { animated: true }).rotate();
  let extension = "webp";

  if (kind === "favicon") {
    pipeline = pipeline.resize(64, 64, { fit: "cover" }).png();
    extension = "png";
  } else {
    const metadata = await sharp(file.buffer).metadata();
    if (!metadata.width || !metadata.height) throw new HttpError(400, "The uploaded file is not a valid image.");
    pipeline = pipeline
      .resize({ width: 1920, height: 1920, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82 });
  }

  const output = await pipeline.toBuffer();
  return uploadToCloudinary(output, extension, kind, config);
}

export async function readUpload(filename) {
  if (!FILE_PATTERN.test(filename)) return null;
  try {
    return await readFile(path.join(UPLOAD_DIR, path.basename(filename)));
  } catch {
    return null;
  }
}
