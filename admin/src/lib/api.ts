const rawApiUrl = import.meta.env.VITE_API_URL || "http://localhost:4100/api";

export const API_URL = rawApiUrl.replace(/\/$/, "");
export const API_ORIGIN = API_URL.replace(/\/api$/, "");
export const TOKEN_KEY = "cd_admin_token";
export const UNAUTHORIZED_EVENT = "cd-admin:unauthorized";

export class ApiError extends Error {
  status: number;
  fieldErrors?: Record<string, string>;

  constructor(message: string, status: number, fieldErrors?: Record<string, string>) {
    super(message);
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  auth?: boolean;
};

function handleUnauthorized() {
  setToken(null);
  window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
}

export async function api<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, auth = true, headers, ...rest } = options;
  const token = getToken();

  const response = await fetch(`${API_URL}${path}`, {
    ...rest,
    headers: {
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(auth && token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    if (response.status === 401 && auth) handleUnauthorized();
    throw new ApiError(
      data?.error || "Something went wrong. Please try again.",
      response.status,
      data?.fieldErrors
    );
  }

  return data as T;
}

export async function uploadImage(file: File, kind: "image" | "favicon" = "image") {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("kind", kind);

  const token = getToken();
  const response = await fetch(`${API_URL}/admin/upload`, {
    method: "POST",
    body: formData,
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    if (response.status === 401) handleUnauthorized();
    throw new ApiError(data?.error || "Upload failed.", response.status, data?.fieldErrors);
  }

  return data.url as string;
}

export function assetUrl(path: string | null | undefined) {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  if (path.startsWith("/uploads/")) return `${API_ORIGIN}${path}`;
  return path;
}

export function siteUrl() {
  return (import.meta.env.VITE_SITE_URL || "http://localhost:5173").replace(/\/$/, "");
}

export function publicSiteUrl(path = "/") {
  return `${siteUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}

export function errorMessage(error: unknown) {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return "Something went wrong. Please try again.";
}
