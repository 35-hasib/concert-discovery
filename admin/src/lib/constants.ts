export const GENRES = [
  "Rock",
  "Pop",
  "Country",
  "Hip-Hop / Rap",
  "R&B",
  "Electronic",
  "Jazz / Blues",
  "Classical",
  "Alternative",
  "Latin",
  "Metal",
  "Other",
] as const;

export const BLOG_STATUSES = ["DRAFT", "PUBLISHED"] as const;

export const ADMIN_PAGE_SIZE = 12;

export const DEFAULT_SITE_NAME = "Concert Discovery";

export const SOCIAL_PLATFORMS = [
  { key: "twitter", label: "X / Twitter", placeholder: "https://x.com/yourhandle" },
  { key: "facebook", label: "Facebook", placeholder: "https://facebook.com/yourpage" },
  { key: "instagram", label: "Instagram", placeholder: "https://instagram.com/yourhandle" },
  { key: "youtube", label: "YouTube", placeholder: "https://youtube.com/@yourchannel" },
  { key: "tiktok", label: "TikTok", placeholder: "https://tiktok.com/@yourhandle" },
] as const;
