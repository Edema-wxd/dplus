"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, UploadCloud, Link2 } from "lucide-react";

// ── types ─────────────────────────────────────────────────

type PortfolioImage = { url: string; alt: string; isMain: boolean };

type PortfolioItem = {
  id: number;
  title: string;
  client: string | null;
  description: string | null;
  tags: string[];
  images: PortfolioImage[];
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
};

type FormState = {
  title: string;
  client: string;
  description: string;
  tagInput: string;
  tags: string[];
  imageUrlInput: string;
  images: PortfolioImage[];
  isPublished: boolean;
};

type UploadStatus = { id: string; name: string; progress: "uploading" | "done" | "error"; error?: string };

const EMPTY_FORM: FormState = {
  title: "",
  client: "",
  description: "",
  tagInput: "",
  tags: [],
  imageUrlInput: "",
  images: [],
  isPublished: false,
};

// ── helpers ───────────────────────────────────────────────

function itemToForm(item: PortfolioItem): FormState {
  return {
    title: item.title,
    client: item.client ?? "",
    description: item.description ?? "",
    tagInput: "",
    tags: item.tags,
    imageUrlInput: "",
    images: item.images,
    isPublished: item.isPublished,
  };
}

// ── main page ─────────────────────────────────────────────

export default function AdminContentPage() {
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [panelOpen, setPanelOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PortfolioItem | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<PortfolioItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [uploads, setUploads] = useState<UploadStatus[]>([]);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // ── load ──────────────────────────────────────────────

  useEffect(() => {
    fetchItems();
  }, []);

  async function fetchItems() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/portfolio");
      if (!res.ok) throw new Error("Failed to load");
      setItems(await res.json());
    } catch {
      toast.error("Failed to load portfolio items");
    } finally {
      setLoading(false);
    }
  }

  // ── panel helpers ─────────────────────────────────────

  function openNew() {
    setEditingItem(null);
    setForm(EMPTY_FORM);
    setPanelOpen(true);
  }

  function openEdit(item: PortfolioItem) {
    setEditingItem(item);
    setForm(itemToForm(item));
    setPanelOpen(true);
  }

  function closePanel() {
    setPanelOpen(false);
    setEditingItem(null);
  }

  // close panel on outside click
  useEffect(() => {
    if (!panelOpen) return;
    function handler(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        closePanel();
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [panelOpen]);

  // ── form field helpers ────────────────────────────────

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function addTag() {
    const tag = form.tagInput.trim();
    if (!tag || form.tags.includes(tag)) {
      setField("tagInput", "");
      return;
    }
    setForm((prev) => ({ ...prev, tags: [...prev.tags, tag], tagInput: "" }));
  }

  function removeTag(tag: string) {
    setField("tags", form.tags.filter((t) => t !== tag));
  }

  function addImageUrl() {
    const url = form.imageUrlInput.trim();
    if (!url) return;
    const isMain = form.images.length === 0;
    setForm((prev) => ({
      ...prev,
      images: [...prev.images, { url, alt: "", isMain }],
      imageUrlInput: "",
    }));
  }

  const handleFileUpload = useCallback(async (files: FileList) => {
    const fileArray = Array.from(files);
    const newUploads: UploadStatus[] = fileArray.map((f) => ({
      id: Math.random().toString(36).slice(2),
      name: f.name,
      progress: "uploading",
    }));
    setUploads((prev) => [...prev, ...newUploads]);

    await Promise.all(
      fileArray.map(async (file, i) => {
        const uploadId = newUploads[i].id;
        try {
          const fd = new FormData();
          fd.append("file", file);
          const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error ?? "Upload failed");

          setForm((prev) => {
            const isMain = prev.images.length === 0;
            return {
              ...prev,
              images: [...prev.images, { url: data.url, alt: "", isMain }],
            };
          });
          setUploads((prev) =>
            prev.map((u) => (u.id === uploadId ? { ...u, progress: "done" } : u))
          );
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Upload failed";
          setUploads((prev) =>
            prev.map((u) => (u.id === uploadId ? { ...u, progress: "error", error: msg } : u))
          );
          toast.error(`Failed to upload ${file.name}: ${msg}`);
        }
      })
    );

    // clear completed uploads after a short delay
    setTimeout(() => {
      setUploads((prev) => prev.filter((u) => u.progress !== "done"));
    }, 2000);

    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  function removeImage(idx: number) {
    setForm((prev) => {
      const next = prev.images.filter((_, i) => i !== idx);
      if (next.length && !next.some((img) => img.isMain)) next[0].isMain = true;
      return { ...prev, images: next };
    });
  }

  function setMainImage(idx: number) {
    setForm((prev) => ({
      ...prev,
      images: prev.images.map((img, i) => ({ ...img, isMain: i === idx })),
    }));
  }

  // ── save ──────────────────────────────────────────────

  async function handleSave() {
    if (!form.title.trim()) {
      toast.error("Title is required");
      return;
    }
    setSaving(true);
    const payload = {
      title: form.title.trim(),
      client: form.client.trim() || null,
      description: form.description.trim() || null,
      tags: form.tags,
      images: form.images,
      isPublished: form.isPublished,
    };

    try {
      let res: Response;
      if (editingItem) {
        res = await fetch(`/api/admin/portfolio/${editingItem.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch("/api/admin/portfolio", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Save failed");
      }

      const saved: PortfolioItem = await res.json();
      setItems((prev) =>
        editingItem
          ? prev.map((i) => (i.id === saved.id ? saved : i))
          : [saved, ...prev]
      );
      toast.success(editingItem ? "Project updated" : "Project created");
      closePanel();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  // ── toggle published ──────────────────────────────────

  async function handleTogglePublished(item: PortfolioItem) {
    const next = !item.isPublished;
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, isPublished: next } : i))
    );
    try {
      const res = await fetch(`/api/admin/portfolio/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublished: next }),
      });
      if (!res.ok) throw new Error();
      const updated: PortfolioItem = await res.json();
      setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
      toast.success(next ? "Project published" : "Project unpublished");
    } catch {
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, isPublished: item.isPublished } : i))
      );
      toast.error("Failed to update publish status");
    }
  }

  // ── delete ────────────────────────────────────────────

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/portfolio/${deleteTarget.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      setItems((prev) => prev.filter((i) => i.id !== deleteTarget.id));
      toast.success("Project deleted");
      setDeleteTarget(null);
    } catch {
      toast.error("Failed to delete project");
    } finally {
      setDeleting(false);
    }
  }

  // ── render ─────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Content</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage portfolio projects
          </p>
        </div>
        <Button onClick={openNew}>+ New Project</Button>
      </div>

      {/* table */}
      <div className="rounded-xl border border-border bg-background overflow-hidden">
        {loading ? (
          <div className="px-5 py-12 text-center text-sm text-muted-foreground">
            Loading…
          </div>
        ) : items.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-muted-foreground">
            No portfolio projects yet.{" "}
            <button onClick={openNew} className="underline hover:text-foreground">
              Add the first one
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3 w-16">Image</th>
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3 hidden sm:table-cell">Client</th>
                  <th className="px-4 py-3 hidden md:table-cell">Tags</th>
                  <th className="px-4 py-3 text-center">Published</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {items.map((item) => {
                  const thumb = item.images.find((i) => i.isMain) ?? item.images[0];
                  return (
                    <tr key={item.id} className="hover:bg-muted/40 transition-colors">
                      {/* thumbnail */}
                      <td className="px-4 py-3">
                        {thumb ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={thumb.url}
                            alt={thumb.alt || item.title}
                            className="h-10 w-14 rounded object-cover bg-muted"
                          />
                        ) : (
                          <div className="h-10 w-14 rounded bg-muted flex items-center justify-center text-muted-foreground text-xs">
                            —
                          </div>
                        )}
                      </td>

                      {/* title */}
                      <td className="px-4 py-3 font-medium text-foreground max-w-[180px] truncate">
                        {item.title}
                      </td>

                      {/* client */}
                      <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell max-w-[140px] truncate">
                        {item.client ?? "—"}
                      </td>

                      {/* tags */}
                      <td className="px-4 py-3 hidden md:table-cell">
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {item.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                            >
                              {tag}
                            </span>
                          ))}
                          {item.tags.length > 3 && (
                            <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                              +{item.tags.length - 3}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* published toggle */}
                      <td className="px-4 py-3 text-center">
                        <button
                          role="switch"
                          aria-checked={item.isPublished}
                          onClick={() => handleTogglePublished(item)}
                          className={`relative inline-flex h-5 w-9 cursor-pointer items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                            item.isPublished ? "bg-green-500" : "bg-muted-foreground/30"
                          }`}
                        >
                          <span
                            className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${
                              item.isPublished ? "translate-x-4" : "translate-x-1"
                            }`}
                          />
                        </button>
                      </td>

                      {/* actions */}
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEdit(item)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => setDeleteTarget(item)}
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── slide-in panel ──────────────────────────────── */}
      {panelOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* backdrop */}
          <div className="flex-1 bg-black/40" />

          {/* panel */}
          <div
            ref={panelRef}
            className="w-full max-w-md bg-background border-l border-border flex flex-col shadow-xl overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <h2 className="text-base font-semibold text-foreground">
                {editingItem ? "Edit Project" : "New Project"}
              </h2>
              <button
                onClick={closePanel}
                className="text-muted-foreground hover:text-foreground text-xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="flex-1 space-y-5 px-6 py-5">
              {/* title */}
              <Field label="Title *">
                <Input
                  value={form.title}
                  onChange={(e) => setField("title", e.target.value)}
                  placeholder="Cross-cultural Executive Gifts"
                />
              </Field>

              {/* client */}
              <Field label="Client">
                <Input
                  value={form.client}
                  onChange={(e) => setField("client", e.target.value)}
                  placeholder="Fortune 500 Energy Corporation"
                />
              </Field>

              {/* description */}
              <Field label="Description">
                <textarea
                  value={form.description}
                  onChange={(e) => setField("description", e.target.value)}
                  placeholder="Short description of the project…"
                  rows={4}
                  className="border-input placeholder:text-muted-foreground dark:bg-input/30 flex w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] resize-none"
                />
              </Field>

              {/* tags */}
              <Field label="Tags">
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      value={form.tagInput}
                      onChange={(e) => setField("tagInput", e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === ",") {
                          e.preventDefault();
                          addTag();
                        }
                      }}
                      placeholder="Add tag and press Enter"
                    />
                    <Button type="button" variant="outline" size="sm" onClick={addTag}>
                      Add
                    </Button>
                  </div>
                  {form.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {form.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs text-foreground"
                        >
                          {tag}
                          <button
                            onClick={() => removeTag(tag)}
                            className="ml-0.5 text-muted-foreground hover:text-foreground leading-none"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </Field>

              {/* images */}
              <Field label="Images">
                <div className="space-y-3">

                  {/* Drop zone / file picker */}
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (e.dataTransfer.files.length) handleFileUpload(e.dataTransfer.files);
                    }}
                    className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border hover:border-foreground/30 bg-muted/30 hover:bg-muted/50 cursor-pointer transition-colors py-6 px-4 text-center"
                  >
                    <UploadCloud className="w-6 h-6 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-muted-foreground">PNG, JPG, WebP, GIF — max 10 MB each</p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.length) handleFileUpload(e.target.files);
                    }}
                  />

                  {/* In-flight uploads */}
                  {uploads.length > 0 && (
                    <ul className="space-y-1.5">
                      {uploads.map((u) => (
                        <li
                          key={u.id}
                          className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-xs"
                        >
                          {u.progress === "uploading" && (
                            <Loader2 className="w-3.5 h-3.5 shrink-0 animate-spin text-muted-foreground" />
                          )}
                          {u.progress === "done" && (
                            <span className="w-3.5 h-3.5 shrink-0 rounded-full bg-green-500 flex items-center justify-center text-white text-[8px]">✓</span>
                          )}
                          {u.progress === "error" && (
                            <span className="w-3.5 h-3.5 shrink-0 rounded-full bg-destructive flex items-center justify-center text-white text-[8px]">✕</span>
                          )}
                          <span className={`flex-1 truncate ${u.progress === "error" ? "text-destructive" : "text-muted-foreground"}`}>
                            {u.progress === "uploading" ? `Uploading ${u.name}…` : u.progress === "error" ? (u.error ?? "Failed") : u.name}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {/* Paste URL fallback */}
                  <div>
                    <button
                      type="button"
                      onClick={() => setShowUrlInput((v) => !v)}
                      className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Link2 className="w-3.5 h-3.5" />
                      {showUrlInput ? "Hide URL input" : "Paste URL instead"}
                    </button>

                    {showUrlInput && (
                      <div className="flex gap-2 mt-2">
                        <Input
                          value={form.imageUrlInput}
                          onChange={(e) => setField("imageUrlInput", e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              addImageUrl();
                            }
                          }}
                          placeholder="https://…"
                          type="url"
                        />
                        <Button type="button" variant="outline" size="sm" onClick={addImageUrl}>
                          Add
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Saved images list */}
                  {form.images.length > 0 && (
                    <ul className="space-y-1.5">
                      {form.images.map((img, idx) => (
                        <li
                          key={idx}
                          className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-xs"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={img.url}
                            alt=""
                            className="h-8 w-12 rounded object-cover bg-muted shrink-0"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = "none";
                            }}
                          />
                          <span className="flex-1 truncate text-muted-foreground">
                            {img.url}
                          </span>
                          <button
                            onClick={() => setMainImage(idx)}
                            className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium transition-colors ${
                              img.isMain
                                ? "bg-green-100 text-green-700"
                                : "text-muted-foreground hover:text-foreground"
                            }`}
                            title="Set as main image"
                          >
                            {img.isMain ? "Main" : "Set main"}
                          </button>
                          <button
                            onClick={() => removeImage(idx)}
                            className="shrink-0 text-muted-foreground hover:text-destructive"
                          >
                            ×
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </Field>

              {/* published */}
              <div className="flex items-center gap-3">
                <input
                  id="is-published"
                  type="checkbox"
                  checked={form.isPublished}
                  onChange={(e) => setField("isPublished", e.target.checked)}
                  className="h-4 w-4 rounded border-input accent-primary"
                />
                <label
                  htmlFor="is-published"
                  className="text-sm font-medium text-foreground select-none cursor-pointer"
                >
                  Published
                </label>
              </div>
            </div>

            {/* footer */}
            <div className="flex items-center justify-end gap-3 border-t border-border px-6 py-4">
              <Button variant="outline" onClick={closePanel} disabled={saving}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Saving…" : editingItem ? "Save Changes" : "Create Project"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── delete confirm dialog ────────────────────────── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => !deleting && setDeleteTarget(null)}
          />
          <div className="relative z-10 w-full max-w-sm rounded-xl border border-border bg-background p-6 shadow-xl">
            <h3 className="text-base font-semibold text-foreground">Delete project?</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{deleteTarget.title}</span>{" "}
              will be permanently removed. This cannot be undone.
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? "Deleting…" : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Field wrapper ────────────────────────────────────────

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-foreground">{label}</label>
      {children}
    </div>
  );
}
