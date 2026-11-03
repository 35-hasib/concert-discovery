import { ImagePlus, Loader2, Trash2, UploadCloud } from "lucide-react";
import { useRef, useState } from "react";

import { assetUrl, uploadImage } from "../../lib/api";
import { cn } from "../../lib/utils";

export const uploadImageFile = uploadImage;

export function ImagePicker({
  label,
  value,
  onChange,
  hint,
  kind = "image",
  aspect = "aspect-[16/10]",
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
  hint?: string;
  kind?: "image" | "favicon";
  aspect?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);

  async function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setError("");
    setUploading(true);
    try {
      const url = await uploadImageFile(file, kind);
      onChange(url);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <span className="field-label">{label}</span>
      <div
        className={cn(
          "relative overflow-hidden rounded-xl border-2 border-dashed transition",
          dragOver ? "border-ember-500 bg-ember-50/50" : "border-ink-950/15 bg-sand-50/60",
          value ? "border-solid border-ink-950/10 bg-white" : ""
        )}
        onDragOver={(event) => {
          event.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragOver(false);
          void handleFiles(event.dataTransfer.files);
        }}
      >
        {value ? (
          <div
            className={cn(
              "relative w-full",
              kind === "favicon" ? "aspect-square max-w-[160px]" : aspect
            )}
          >
            <img
              src={assetUrl(value)}
              alt={label}
              className="absolute inset-0 h-full w-full object-cover"
            />
          </div>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex w-full flex-col items-center justify-center gap-2 px-6 py-10 text-center"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-ember-600 shadow-sm">
              <UploadCloud className="h-5 w-5" />
            </span>
            <span className="text-sm font-semibold text-ink-800">Click or drop an image</span>
            <span className="text-xs text-ink-600">
              JPG, PNG, WebP, AVIF or GIF · max 8 MB · stored in Cloudinary
            </span>
          </button>
        )}

        {uploading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-white/85 text-xs font-medium text-ink-700">
            <Loader2 className="h-6 w-6 animate-spin text-ember-500" />
            Uploading…
          </div>
        ) : null}
      </div>

      <div className="mt-2 flex items-center gap-3">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="text-xs font-semibold text-ember-600 transition hover:text-ember-700 disabled:opacity-50"
        >
          {value ? "Replace image" : "Choose image"}
        </button>
        {value ? (
          <button
            type="button"
            onClick={() => onChange("")}
            className="inline-flex items-center gap-1 text-xs font-semibold text-ink-600 transition hover:text-red-600"
          >
            <Trash2 className="h-3.5 w-3.5" /> Remove
          </button>
        ) : null}
      </div>
      {hint ? <p className="field-hint">{hint}</p> : null}
      {error ? <p className="field-error">{error}</p> : null}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
        className="hidden"
        onChange={(event) => {
          void handleFiles(event.target.files);
          event.target.value = "";
        }}
      />
    </div>
  );
}

export function MultiImagePicker({
  values,
  onChange,
  max = 8,
}: {
  values: string[];
  onChange: (urls: string[]) => void;
  max?: number;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError("");
    setUploading(true);
    try {
      const remaining = Math.max(0, max - values.length);
      const selected = Array.from(files).slice(0, remaining);
      const urls: string[] = [];
      for (const file of selected) {
        urls.push(await uploadImageFile(file));
      }
      onChange([...values, ...urls]);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap gap-3">
        {values.map((src) => (
          <div
            key={src}
            className="group relative h-24 w-32 overflow-hidden rounded-xl border border-ink-950/10 bg-white"
          >
            <img src={assetUrl(src)} alt="Article image" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => onChange(values.filter((value) => value !== src))}
              className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-ink-950/70 text-white opacity-0 transition group-hover:opacity-100 hover:bg-red-600"
              aria-label="Remove image"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}

        {values.length < max ? (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex h-24 w-32 flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-ink-950/15 bg-sand-50/60 text-xs font-semibold text-ink-600 transition hover:border-ember-500/50 hover:text-ember-600 disabled:opacity-60"
          >
            {uploading ? (
              <Loader2 className="h-5 w-5 animate-spin text-ember-500" />
            ) : (
              <ImagePlus className="h-5 w-5" />
            )}
            {uploading ? "Uploading" : "Add image"}
          </button>
        ) : null}
      </div>
      <p className="field-hint">
        Optional gallery images shown below the article and stored in Cloudinary.{" "}
        {values.length}/{max}
      </p>
      {error ? <p className="field-error">{error}</p> : null}
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
        className="hidden"
        onChange={(event) => {
          void handleFiles(event.target.files);
          event.target.value = "";
        }}
      />
    </div>
  );
}
