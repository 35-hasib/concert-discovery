import type { Blog } from "../lib/types";
import { widgetUrl } from "../lib/api";
import { WidgetFrame } from "./WidgetFrame";

type ConcertScheduleProps = {
  blog: Pick<Blog, "id" | "slug" | "title" | "widgetEnabled" | "widgetCode" | "scheduleArtistQuery">;
  className?: string;
};

export function hasConcertSchedule(blog: Pick<Blog, "widgetEnabled" | "widgetCode" | "scheduleArtistQuery">) {
  return Boolean(
    blog.widgetEnabled &&
      (blog.scheduleArtistQuery?.trim() || blog.widgetCode?.trim())
  );
}

export function ConcertSchedule({ blog, className }: ConcertScheduleProps) {
  if (!hasConcertSchedule(blog)) return null;

  return (
    <WidgetFrame
      key={blog.id}
      src={widgetUrl(blog.slug)}
      title={`${blog.title} concert schedule`}
      className={className}
    />
  );
}
