import sanitizeHtml from "sanitize-html";

import { slugify, stripHtml } from "../utils.js";

const ALLOWED_TAGS = [
  "address",
  "article",
  "aside",
  "b",
  "blockquote",
  "br",
  "caption",
  "code",
  "del",
  "div",
  "em",
  "figcaption",
  "figure",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "hr",
  "i",
  "img",
  "li",
  "mark",
  "ol",
  "p",
  "pre",
  "s",
  "small",
  "span",
  "strong",
  "sub",
  "sup",
  "table",
  "tbody",
  "td",
  "tfoot",
  "th",
  "thead",
  "tr",
  "u",
  "ul",
];

const ALLOWED_STYLES = {
  "*": {
    "text-align": [/^(left|right|center|justify)$/],
  },
};

export function sanitizeArticle(html) {
  if (!html) return "";
  return sanitizeHtml(html, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: {
      a: ["href", "name", "target", "rel", "title"],
      img: ["src", "alt", "title", "width", "height"],
      p: ["style"],
      h1: ["style"],
      h2: ["style"],
      h3: ["style"],
      h4: ["style"],
      div: ["style"],
      span: ["style"],
      td: ["style", "colspan", "rowspan"],
      th: ["style", "colspan", "rowspan"],
      table: ["border", "cellpadding", "cellspacing"],
      ol: ["start", "type"],
      li: ["value"],
    },
    allowedStyles: ALLOWED_STYLES,
    allowedSchemes: ["http", "https", "mailto", "tel"],
    allowedSchemesByTag: {
      img: ["http", "https"],
      a: ["http", "https", "mailto", "tel"],
    },
    allowProtocolRelative: false,
    disallowedTagsMode: "discard",
    nonTextTags: ["script", "style", "textarea", "option", "noscript", "iframe", "object", "embed"],
    transformTags: {
      a: (tagName, attribs) => {
        const href = attribs.href || "";
        const isExternal = /^https?:\/\//i.test(href);
        const next = { ...attribs };
        if (isExternal) {
          next.rel = "noopener noreferrer nofollow";
          next.target = "_blank";
        }
        return { tagName, attribs: next };
      },
      img: (tagName, attribs) => {
        const next = { ...attribs };
        next.loading = "lazy";
        next.decoding = "async";
        return { tagName, attribs: next };
      },
    },
  });
}

function decodeEntities(text) {
  return text
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&nbsp;/gi, " ")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));
}

function escapeAttribute(value) {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

export function prepareArticle(rawHtml) {
  const safeHtml = sanitizeArticle(rawHtml);
  const toc = [];
  const used = new Map();

  const html = safeHtml.replace(
    /<h([23])(\s[^>]*)?>([\s\S]*?)<\/h\1>/gi,
    (match, level, attrs, inner) => {
      const text = decodeEntities(stripHtml(inner));
      if (!text) return match;
      let id = slugify(text) || `section-${toc.length + 1}`;
      const count = used.get(id) || 0;
      used.set(id, count + 1);
      if (count > 0) id = `${id}-${count + 1}`;
      toc.push({ id, text, level: Number(level) === 3 ? 3 : 2 });
      return `<h${level}${attrs || ""} id="${escapeAttribute(id)}">${inner}</h${level}>`;
    }
  );

  return { html, toc };
}
