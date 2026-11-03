import { API_ORIGIN } from "./api";
import type { TocItem } from "./types";

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/['’"]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, 90);
}

export function prepareArticle(rawHtml: string) {
  const doc = new DOMParser().parseFromString(rawHtml, "text/html");
  const toc: TocItem[] = [];
  const used = new Map<string, number>();

  doc.querySelectorAll('img[src^="/uploads/"]').forEach((image) => {
    image.setAttribute("src", `${API_ORIGIN}${image.getAttribute("src")}`);
  });

  doc.querySelectorAll("h2, h3").forEach((heading) => {
    const text = (heading.textContent || "").trim();
    if (!text) return;
    let id = slugify(text) || `section-${toc.length + 1}`;
    const count = used.get(id) || 0;
    used.set(id, count + 1);
    if (count > 0) id = `${id}-${count + 1}`;
    heading.id = id;
    toc.push({ id, text, level: heading.tagName === "H3" ? 3 : 2 });
  });

  return { html: doc.body.innerHTML, toc };
}
