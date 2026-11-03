const rawApiUrl = import.meta.env.VITE_API_URL || "http://localhost:4100/api";

export const API_URL = rawApiUrl.replace(/\/$/, "");
export const API_ORIGIN = API_URL.replace(/\/api$/, "");

export class ApiError extends Error {
  status: number;
  fieldErrors?: Record<string, string>;

  constructor(message: string, status: number, fieldErrors?: Record<string, string>) {
    super(message);
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new ApiError(
      data?.error || "Something went wrong. Please try again.",
      response.status,
      data?.fieldErrors
    );
  }
  return data as T;
}

export function assetUrl(path: string | null | undefined) {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  if (path.startsWith("/uploads/")) return `${API_ORIGIN}${path}`;
  return path;
}

export function widgetUrl(slug: string) {
  return `${API_ORIGIN}/embed/widget/${encodeURIComponent(slug)}`;
}

export function siteUrl() {
  return (import.meta.env.VITE_SITE_URL || window.location.origin).replace(/\/$/, "");
}

export function absoluteUrl(path: string) {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  if (path.startsWith("/uploads/")) return `${API_ORIGIN}${path}`;
  return `${siteUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}
