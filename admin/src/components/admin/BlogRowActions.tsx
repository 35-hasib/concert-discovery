import {
  AlertTriangle,
  ExternalLink,
  Eye,
  EyeOff,
  Loader2,
  Pencil,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

import { api, errorMessage } from "../../lib/api";
import { cn } from "../../lib/utils";
import { Spinner } from "../Spinner";

export function BlogRowActions({
  id,
  title,
  status,
  featured,
  onChanged,
}: {
  id: string;
  title: string;
  status: string;
  featured: boolean;
  onChanged: () => void;
}) {
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);

  async function patch(body: Record<string, unknown>, action: string) {
    setPending(action);
    setError("");
    try {
      await api(`/admin/blogs/${id}`, { method: "PATCH", body });
      onChanged();
      return true;
    } catch (updateError) {
      setError(errorMessage(updateError));
      return false;
    } finally {
      setPending(null);
    }
  }

  async function remove() {
    setPending("delete");
    setError("");
    try {
      await api(`/admin/blogs/${id}`, { method: "DELETE" });
      setDeleteOpen(false);
      onChanged();
    } catch (deleteError) {
      setError(errorMessage(deleteError));
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="flex items-center justify-end gap-0.5">
      {error ? (
        <div className="fixed bottom-5 right-5 z-[60] flex max-w-sm items-start gap-2 rounded-xl border border-red-200 bg-white px-4 py-3 text-xs text-red-700 shadow-lift">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span className="flex-1">{error}</span>
          <button type="button" onClick={() => setError("")} aria-label="Dismiss error">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : null}

      <Link
        to={`/preview/${id}`}
        className="btn-icon"
        title="Preview blog"
        aria-label={`Preview ${title}`}
      >
        <ExternalLink className="h-4 w-4" />
      </Link>

      <Link
        to={`/blogs/${id}/edit`}
        className="btn-icon"
        title="Edit blog"
        aria-label={`Edit ${title}`}
      >
        <Pencil className="h-4 w-4" />
      </Link>

      <button
        type="button"
        onClick={() => void patch({ featured: !featured }, "featured")}
        disabled={pending !== null}
        className={cn("btn-icon", featured && "text-amber-500")}
        title={featured ? "Remove featured status" : "Mark as featured"}
        aria-label={featured ? "Remove featured status" : "Mark as featured"}
      >
        {pending === "featured" ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Star className={cn("h-4 w-4", featured && "fill-current")} />
        )}
      </button>

      <button
        type="button"
        onClick={() =>
          void patch({ status: status === "PUBLISHED" ? "DRAFT" : "PUBLISHED" }, "status")
        }
        disabled={pending !== null}
        className="btn-icon"
        title={status === "PUBLISHED" ? "Unpublish" : "Publish"}
        aria-label={status === "PUBLISHED" ? "Unpublish" : "Publish"}
      >
        {pending === "status" ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : status === "PUBLISHED" ? (
          <EyeOff className="h-4 w-4" />
        ) : (
          <Eye className="h-4 w-4" />
        )}
      </button>

      <button
        type="button"
        onClick={() => setDeleteOpen(true)}
        className="btn-icon hover:bg-red-50 hover:text-red-600"
        title="Delete blog"
        aria-label={`Delete ${title}`}
      >
        <Trash2 className="h-4 w-4" />
      </button>

      {deleteOpen ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-ink-950/60 backdrop-blur-sm"
            onClick={() => (pending ? null : setDeleteOpen(false))}
            aria-label="Cancel delete"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={`delete-title-${id}`}
            className="relative w-full max-w-md rounded-[3px] border border-[#e5e5e5] bg-white p-6 shadow-2xl"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-red-50 text-red-600">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <h2
              id={`delete-title-${id}`}
              className="mt-4 font-display text-2xl font-normal uppercase text-[#535353]"
            >
              Delete this blog?
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-600">
              <span className="font-semibold text-ink-900">{title}</span> will be permanently
              deleted along with its article and concert schedule widget. This cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteOpen(false)}
                disabled={pending === "delete"}
                className="btn-outline btn-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void remove()}
                disabled={pending === "delete"}
                className="btn bg-red-600 px-4 py-2 text-xs text-white hover:bg-red-700"
              >
                {pending === "delete" ? (
                  <Spinner className="h-4 w-4" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                Delete permanently
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
