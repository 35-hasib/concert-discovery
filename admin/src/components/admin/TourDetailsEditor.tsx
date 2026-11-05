import { Disc3, MapPin, Plus, Route, Trash2, Users, X } from "lucide-react";
import { useState, type ReactNode } from "react";

import type { TourAlbum } from "../../lib/types";
import { ImagePicker } from "./ImagePicker";

function StringListField({
  label,
  hint,
  placeholder,
  values,
  onChange,
  icon,
}: {
  label: string;
  hint: string;
  placeholder: string;
  values: string[];
  onChange: (values: string[]) => void;
  icon: ReactNode;
}) {
  const [draft, setDraft] = useState("");

  function addDraft() {
    const additions = draft
      .split(/\r?\n|,/)
      .map((value) => value.trim())
      .filter(Boolean);
    if (additions.length === 0) return;
    onChange(Array.from(new Set([...values, ...additions])));
    setDraft("");
  }

  return (
    <div>
      <span className="field-label flex items-center gap-2">
        {icon} {label}
      </span>
      <div className="flex gap-2">
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              addDraft();
            }
          }}
          className="input"
          placeholder={placeholder}
        />
        <button
          type="button"
          onClick={addDraft}
          disabled={!draft.trim()}
          className="btn-outline shrink-0 px-3"
          aria-label={`Add ${label.toLowerCase()}`}
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
      {values.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {values.map((value) => (
            <span
              key={value}
              className="inline-flex items-center gap-1.5 rounded-full bg-sand-100 py-1.5 pl-3 pr-2 text-xs font-medium text-ink-800"
            >
              {value}
              <button
                type="button"
                onClick={() => onChange(values.filter((item) => item !== value))}
                className="flex h-5 w-5 items-center justify-center rounded-full text-ink-500 transition hover:bg-white hover:text-red-600"
                aria-label={`Remove ${value}`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      ) : null}
      <p className="field-hint">{hint}</p>
    </div>
  );
}

export function SupportingArtistsEditor({
  values,
  onChange,
}: {
  values: string[];
  onChange: (values: string[]) => void;
}) {
  return (
    <StringListField
      label="Supporting artists"
      hint="Appears in the intro summary as special guests and again in the Tour notes section."
      placeholder="e.g. Walk off the Earth"
      values={values}
      onChange={onChange}
      icon={<Users className="h-3.5 w-3.5 text-ember-600" />}
    />
  );
}

export function PreviousTourEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label htmlFor="previousTour" className="field-label flex items-center gap-2">
        <Route className="h-3.5 w-3.5 text-ember-600" /> Previous tour
      </label>
      <textarea
        id="previousTour"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="textarea min-h-[110px]"
        maxLength={2000}
        placeholder="e.g. The 2024–2025 world tour visited 42 cities across North America and Europe."
      />
      <p className="field-hint">
        Shown in the Tour notes section after the concert schedule. Leave blank to hide it.
      </p>
    </div>
  );
}

export function TourCitiesEditor({
  values,
  onChange,
}: {
  values: string[];
  onChange: (values: string[]) => void;
}) {
  return (
    <StringListField
      label="Tour cities"
      hint="Appears in the Cities on this tour section and in the sidebar city count."
      placeholder="e.g. Toronto"
      values={values}
      onChange={onChange}
      icon={<MapPin className="h-3.5 w-3.5 text-ember-600" />}
    />
  );
}

export function AlbumsEditor({
  albums,
  onChange,
}: {
  albums: TourAlbum[];
  onChange: (albums: TourAlbum[]) => void;
}) {
  function updateAlbum(index: number, patch: Partial<TourAlbum>) {
    onChange(albums.map((album, i) => (i === index ? { ...album, ...patch } : album)));
  }

  function removeAlbum(index: number) {
    onChange(albums.filter((_, i) => i !== index));
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="field-label mb-0 flex items-center gap-2">
          <Disc3 className="h-3.5 w-3.5 text-ember-600" /> Albums and popular tracks
        </span>
        <button
          type="button"
          onClick={() =>
            onChange([
              ...albums,
              { title: "", year: "", cover: "", description: "", tracks: [] },
            ])
          }
          disabled={albums.length >= 12}
          className="btn-outline btn-sm"
        >
          <Plus className="h-3.5 w-3.5" /> Add album
        </button>
      </div>

      {albums.length === 0 ? (
        <div className="mt-3 rounded-xl border border-dashed border-ink-950/15 bg-sand-50 px-4 py-6 text-center text-xs text-ink-600">
          No albums added yet. The first album appears in the public sidebar; all albums appear
          in the full-width discography section below the article.
        </div>
      ) : (
        <div className="mt-3 space-y-4">
          {albums.map((album, index) => (
            <div
              key={index}
              className="rounded-xl border border-ink-950/10 bg-sand-50/50 p-4"
            >
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-ink-600">
                  Album {index + 1}
                  {index === 0 ? " · sidebar feature" : ""}
                </p>
                <button
                  type="button"
                  onClick={() => removeAlbum(index)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-ink-600 transition hover:text-red-600"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Remove
                </button>
              </div>

              <div className="grid gap-4 sm:grid-cols-[150px_minmax(0,1fr)]">
                <ImagePicker
                  label="Album cover"
                  value={album.cover}
                  onChange={(url) => updateAlbum(index, { cover: url })}
                  aspect="aspect-square"
                />
                <div className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_110px]">
                    <div>
                      <label htmlFor={`album-title-${index}`} className="field-label">
                        Album name
                      </label>
                      <input
                        id={`album-title-${index}`}
                        value={album.title}
                        onChange={(event) =>
                          updateAlbum(index, { title: event.target.value })
                        }
                        className="input"
                        maxLength={200}
                        placeholder="e.g. Brave Enough"
                      />
                    </div>
                    <div>
                      <label htmlFor={`album-year-${index}`} className="field-label">
                        Release year
                      </label>
                      <input
                        id={`album-year-${index}`}
                        value={album.year}
                        onChange={(event) =>
                          updateAlbum(index, { year: event.target.value })
                        }
                        className="input"
                        maxLength={20}
                        placeholder="2016"
                      />
                    </div>
                  </div>
                  <div>
                    <label
                      htmlFor={`album-description-${index}`}
                      className="field-label"
                    >
                      Album description
                    </label>
                    <textarea
                      id={`album-description-${index}`}
                      value={album.description}
                      onChange={(event) =>
                        updateAlbum(index, { description: event.target.value })
                      }
                      className="textarea min-h-[70px]"
                      maxLength={1500}
                      placeholder="A short note about the album."
                    />
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <label htmlFor={`album-tracks-${index}`} className="field-label">
                  Popular tracks
                </label>
                <textarea
                  id={`album-tracks-${index}`}
                  value={album.tracks.join("\n")}
                  onChange={(event) =>
                    updateAlbum(index, {
                      tracks: event.target.value
                        .split(/\r?\n/)
                        .map((track) => track.trim())
                        .filter(Boolean),
                    })
                  }
                  className="textarea min-h-[90px] font-mono text-xs"
                  placeholder={"One track per line\nShatter Me\nCrystallize"}
                />
                <p className="field-hint">
                  Put each song on its own line. {album.tracks.length}/100 tracks.
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
      <p className="field-hint">
        Albums without a name are skipped when saving. Add up to 12 albums.
      </p>
    </div>
  );
}
