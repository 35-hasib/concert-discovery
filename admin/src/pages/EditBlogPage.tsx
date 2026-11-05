import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { BlogForm, type BlogFormValues } from "../components/admin/BlogForm";
import { SpinnerBlock } from "../components/Spinner";
import { api, errorMessage } from "../lib/api";
import type { Blog } from "../lib/types";
import { dateOnly, formatDate, formatDateTimeLocal } from "../lib/utils";

export function EditBlogPage() {
  const { id } = useParams();
  const [blog, setBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const data = await api<{ blog: Blog }>(`/admin/blogs/${id}`);
        if (!cancelled) setBlog(data.blog);
      } catch (loadError) {
        if (!cancelled) setError(errorMessage(loadError));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="admin-card">
        <SpinnerBlock label="Loading blog..." />
      </div>
    );
  }

  if (error || !blog) {
    return (
      <div className="admin-card px-6 py-16 text-center">
        <p className="text-sm text-red-600">{error || "Blog post not found."}</p>
        <Link to="/blogs" className="btn-outline btn-sm mt-4">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to blogs
        </Link>
      </div>
    );
  }

  const initial: BlogFormValues = {
    title: blog.title,
    slug: blog.slug,
    excerpt: blog.excerpt,
    artistName: blog.artistName,
    tourName: blog.tourName,
    genre: blog.genre,
    tourYear:
      blog.tourYear != null
        ? String(blog.tourYear)
        : String(
            new Date(
              blog.tourStartDate || blog.publishedAt || Date.now()
            ).getUTCFullYear()
          ),
    tourStartDate: dateOnly(blog.tourStartDate),
    tourEndDate: dateOnly(blog.tourEndDate),
    featuredImage: blog.featuredImage,
    additionalImages: blog.additionalImages,
    supportingArtists: blog.supportingArtists,
    previousTour: blog.previousTour,
    albums: blog.albums,
    tourCities: blog.tourCities,
    content: blog.content,
    widgetEnabled: blog.widgetEnabled,
    widgetCode: blog.widgetCode,
    scheduleArtistQuery: blog.scheduleArtistQuery,
    scheduleEndDate: dateOnly(blog.scheduleEndDate),
    scheduleAffiliateUrl: blog.scheduleAffiliateUrl,
    schedulePerPage: blog.schedulePerPage,
    metaTitle: blog.metaTitle,
    metaDescription: blog.metaDescription,
    seoKeywords: blog.seoKeywords,
    status: blog.status,
    featured: blog.featured,
    publishedAt: formatDateTimeLocal(blog.publishedAt),
  };

  return (
    <BlogForm
      key={blog.id}
      mode="edit"
      blogId={blog.id}
      initial={initial}
      createdAtLabel={formatDate(blog.createdAt)}
      updatedAtLabel={formatDate(blog.updatedAt)}
    />
  );
}
