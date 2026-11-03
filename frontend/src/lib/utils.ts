import { clsx, type ClassValue } from "clsx";

import type { ScheduleSummary } from "./types";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatDate(date: Date | string | null | undefined) {
  if (!date) return "";
  const value = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(value.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(value);
}

export function formatDateShort(date: Date | string | null | undefined) {
  if (!date) return "";
  const value = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(value.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(value);
}

export function formatDateRange(start: string | null, end: string | null) {
  if (!start && !end) return "";
  if (start && end) return `${formatDateShort(start)} – ${formatDateShort(end)}`;
  return formatDateShort(start || end);
}

export function stripHtml(html: string) {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export function readingTime(html: string) {
  const words = stripHtml(html).split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

export function remainingConcertsLabel(summary: ScheduleSummary | null | undefined) {
  const count = summary?.concertsRemaining ?? 0;
  return `${count} concert${count === 1 ? "" : "s"} remaining`;
}

export function nextConcertLabel(summary: ScheduleSummary | null | undefined) {
  const next = summary?.nextConcert;
  if (!next) return "Dates to be announced";
  const place = next.city || next.venue;
  const date = formatDateShort(next.date);
  if (place && date) return `${place} on ${date}`;
  return place || date || "Dates to be announced";
}
