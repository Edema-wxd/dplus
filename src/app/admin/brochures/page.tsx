"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  FileText,
  Loader2,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUploadThing } from "@/lib/uploadthing-client";

// ── types ─────────────────────────────────────────────────

type BrochurePage = { url: string; key: string; alt: string };

type Brochure = {
  id: number;
  slug: string;
  name: string;
  edition: string | null;
  description: string | null;
  pageRatio: number;
  pages: BrochurePage[];
  pdfUrl: string | null;
  pdfKey: string | null;
  pdfSizeBytes: number | null;
  pdfPageCount: number | null;
  isPublished: boolean;
  sortOrder: number;
};

type FormState = {
  name: string;
  edition: string;
  description: string;
  pageRatio: string;
  sortOrder: string;
  pages: BrochurePage[];
  pdfUrl: string | null;
  pdfKey: string | null;
  pdfSizeBytes: number | null;
  pdfPageCount: number | null;
  isPublished: boolean;
};

const EMPTY_FORM: FormState = {
  name: "",
  edition: "",
  description: "",
  pageRatio: "1.414",
  sortOrder: "0",
  pages: [],
  pdfUrl: null,
  pdfKey: null,
  pdfSizeBytes: null,
  pdfPageCount: null,
  isPublished: false,
};

// ── helpers ───────────────────────────────────────────────

function formatBytes(bytes: number) {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

/** Page count read from the PDF itself, so the site never guesses it. */
async function countPdfPages(file: File): Promise<number | null> {
  try {
    const text = new TextDecoder("latin1").decode(await file.arrayBuffer());
    const matches = text.match(/\/Type\s*\/Page(?!s)/g);
    return matches?.length ? matches.length : null;
  } catch {
    return null;
  }
}

function brochureToForm(b: Brochure): FormState {
  return {
    name: b.name,
    edition: b.edition ?? "",
    description: b.description ?? "",
    pageRatio: String(b.pageRatio),
    sortOrder: String(b.sortOrder),
    pages: b.pages,
    pdfUrl: b.pdfUrl,
    pdfKey: b.pdfKey,
    pdfSizeBytes: b.pdfSizeBytes,
    pdfPageCount: b.pdfPageCount,
    isPublished: b.isPublished,
  };
}

// ── page ──────────────────────────────────────────────────

export default function AdminBrochuresPage() {
  const [items, setItems] = useState<Brochure[]>([]);
  const [loading, setLoading] = useState(true);
  const [panelOpen, setPanelOpen] = useState(false);
  const [editing, setEditing] = useState<Brochure | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Brochure | null>(null);
  const [deleting, setDeleting] = useState(false);
  const pageInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/brochures");
      if (!res.ok) throw new Error();
      setItems(await res.json());
    } catch {
      toast.error("Could not load brochures");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // ── uploads ───────────────────────────────────────────

  const { startUpload: uploadPages, isUploading: uploadingPages } =
    useUploadThing("brochurePage", {
      onClientUploadComplete: (res) => {
        setForm((prev) => ({
          ...prev,
          pages: [
            ...prev.pages,
            ...res.map((f) => ({ url: f.ufsUrl, key: f.key, alt: "" })),
          ],
        }));
        toast.success(`${res.length} page${res.length === 1 ? "" : "s"} added`);
      },
      onUploadError: (e) => {
        toast.error(`Upload failed: ${e.message}`);
      },
    });

  const { startUpload: uploadPdf, isUploading: uploadingPdf } = useUploadThing(
    "brochurePdf",
    {
      onClientUploadComplete: (res) => {
        const file = res[0];
        if (!file) return;
        setForm((prev) => ({
          ...prev,
          pdfUrl: file.ufsUrl,
          pdfKey: file.key,
          pdfSizeBytes: file.size,
        }));
        toast.success("PDF attached");
      },
      onUploadError: (e) => {
        toast.error(`Upload failed: ${e.message}`);
      },
    }
  );

  async function handlePdfSelected(file: File) {
    const count = await countPdfPages(file);
    setForm((prev) => ({ ...prev, pdfPageCount: count }));
    await uploadPdf([file]);
  }

  // ── page list editing ─────────────────────────────────

  function movePage(index: number, delta: number) {
    setForm((prev) => {
      const next = [...prev.pages];
      const target = index + delta;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return { ...prev, pages: next };
    });
  }

  function removePage(index: number) {
    setForm((prev) => ({
      ...prev,
      pages: prev.pages.filter((_, i) => i !== index),
    }));
  }

  // ── open / save / delete ──────────────────────────────

  function openNew() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setPanelOpen(true);
  }

  function openEdit(brochure: Brochure) {
    setEditing(brochure);
    setForm(brochureToForm(brochure));
    setPanelOpen(true);
  }

  async function handleSave() {
    if (!form.name.trim()) {
      toast.error("Give the brochure a name");
      return;
    }
    setSaving(true);

    const payload = {
      name: form.name.trim(),
      edition: form.edition.trim(),
      description: form.description.trim(),
      pageRatio: Number(form.pageRatio) || 1.414,
      sortOrder: Number(form.sortOrder) || 0,
      pages: form.pages,
      pdfUrl: form.pdfUrl,
      pdfKey: form.pdfKey,
      pdfSizeBytes: form.pdfSizeBytes,
      pdfPageCount: form.pdfPageCount,
      isPublished: form.isPublished,
    };

    try {
      const res = await fetch(
        editing ? `/api/admin/brochures/${editing.id}` : "/api/admin/brochures",
        {
          method: editing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Save failed");

      toast.success(editing ? "Brochure saved" : "Brochure created");
      setPanelOpen(false);
      fetchItems();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function togglePublished(brochure: Brochure) {
    const next = !brochure.isPublished;
    setItems((prev) =>
      prev.map((b) => (b.id === brochure.id ? { ...b, isPublished: next } : b))
    );
    try {
      const res = await fetch(`/api/admin/brochures/${brochure.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublished: next }),
      });
      if (!res.ok) throw new Error();
      toast.success(next ? "Published" : "Unpublished");
    } catch {
      setItems((prev) =>
        prev.map((b) =>
          b.id === brochure.id ? { ...b, isPublished: !next } : b
        )
      );
      toast.error("Could not change this");
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/brochures/${deleteTarget.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      setItems((prev) => prev.filter((b) => b.id !== deleteTarget.id));
      toast.success("Brochure deleted");
      setDeleteTarget(null);
    } catch {
      toast.error("Could not delete this brochure");
    } finally {
      setDeleting(false);
    }
  }

  // ── render ────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Brochures</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Pages and PDFs shown on the brochures page
          </p>
        </div>
        <Button onClick={openNew}>+ New Brochure</Button>
      </div>

      <div className="rounded-xl border border-border bg-background overflow-hidden">
        {loading ? (
          <div className="px-5 py-12 text-center text-sm text-muted-foreground">
            Loading…
          </div>
        ) : items.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-muted-foreground">
            No brochures yet.{" "}
            <button onClick={openNew} className="underline hover:text-foreground">
              Add the first one
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3 w-20">Cover</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3 hidden sm:table-cell">Edition</th>
                  <th className="px-4 py-3 text-center">Pages</th>
                  <th className="px-4 py-3 text-center hidden md:table-cell">
                    PDF
                  </th>
                  <th className="px-4 py-3 text-center">Published</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {items.map((b) => (
                  <tr key={b.id} className="hover:bg-muted/40 transition-colors">
                    <td className="px-4 py-3">
                      {b.pages[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={b.pages[0].url}
                          alt=""
                          className="h-10 w-14 rounded object-cover bg-muted"
                        />
                      ) : (
                        <div className="h-10 w-14 rounded bg-muted" />
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium text-foreground max-w-[200px] truncate">
                      {b.name}
                      <span className="block text-xs font-normal text-muted-foreground truncate">
                        /brochures#{b.slug}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell max-w-[180px] truncate">
                      {b.edition ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-center text-muted-foreground tabular-nums">
                      {b.pages.length}
                    </td>
                    <td className="px-4 py-3 text-center hidden md:table-cell text-muted-foreground">
                      {b.pdfUrl
                        ? b.pdfSizeBytes
                          ? formatBytes(b.pdfSizeBytes)
                          : "Yes"
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => togglePublished(b)}
                        className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                          b.isPublished
                            ? "bg-dsp-green/15 text-dsp-green"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {b.isPublished ? "Live" : "Draft"}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button
                        onClick={() => openEdit(b)}
                        className="text-sm text-muted-foreground hover:text-foreground underline"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setDeleteTarget(b)}
                        className="ml-4 text-sm text-muted-foreground hover:text-dsp-red"
                        aria-label={`Delete ${b.name}`}
                      >
                        <Trash2 className="size-4 inline" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── editor panel ─────────────────────────────────── */}
      {panelOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
          <div className="h-full w-full max-w-2xl overflow-y-auto bg-background p-6 shadow-xl">
            <div className="flex items-start justify-between mb-6">
              <h2 className="text-lg font-semibold text-foreground">
                {editing ? `Edit ${editing.name}` : "New brochure"}
              </h2>
              <button
                onClick={() => setPanelOpen(false)}
                aria-label="Close"
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="space-y-5">
              <label className="block">
                <span className="text-sm font-medium text-foreground">Name</span>
                <Input
                  value={form.name}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, name: e.target.value }))
                  }
                  placeholder="Corporate Christmas"
                  className="mt-1.5"
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-foreground">
                  Edition
                </span>
                <Input
                  value={form.edition}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, edition: e.target.value }))
                  }
                  placeholder="Two thousand and twenty-six"
                  className="mt-1.5"
                />
                <span className="mt-1 block text-xs text-muted-foreground">
                  Sits under the name, in italics
                </span>
              </label>

              <label className="block">
                <span className="text-sm font-medium text-foreground">
                  Description
                </span>
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, description: e.target.value }))
                  }
                  rows={4}
                  className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="What is inside, and what people can ask for."
                />
              </label>

              <div className="grid grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-sm font-medium text-foreground">
                    Page shape
                  </span>
                  <Input
                    value={form.pageRatio}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, pageRatio: e.target.value }))
                    }
                    inputMode="decimal"
                    className="mt-1.5"
                  />
                  <span className="mt-1 block text-xs text-muted-foreground">
                    Width ÷ height. A4 landscape is 1.414, portrait 0.707.
                  </span>
                </label>

                <label className="block">
                  <span className="text-sm font-medium text-foreground">
                    Order
                  </span>
                  <Input
                    value={form.sortOrder}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, sortOrder: e.target.value }))
                    }
                    inputMode="numeric"
                    className="mt-1.5"
                  />
                  <span className="mt-1 block text-xs text-muted-foreground">
                    Lower numbers appear first
                  </span>
                </label>
              </div>

              {/* pages */}
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">
                    Pages ({form.pages.length})
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={uploadingPages}
                    onClick={() => pageInputRef.current?.click()}
                  >
                    {uploadingPages ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <UploadCloud className="size-4" />
                    )}
                    Add pages
                  </Button>
                  <input
                    ref={pageInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    hidden
                    onChange={(e) => {
                      const files = Array.from(e.target.files ?? []);
                      if (files.length) uploadPages(files);
                      e.target.value = "";
                    }}
                  />
                </div>

                <p className="mt-1 text-xs text-muted-foreground">
                  Uploaded in the order you select them. Use the arrows to
                  rearrange.
                </p>

                {form.pages.length > 0 && (
                  <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {form.pages.map((page, i) => (
                      <li
                        key={page.key || page.url}
                        className="rounded-lg border border-border p-2"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={page.url}
                          alt=""
                          className="w-full rounded bg-muted object-cover"
                          style={{ aspectRatio: Number(form.pageRatio) || 1.414 }}
                        />
                        <div className="mt-2 flex items-center justify-between">
                          <span className="text-xs tabular-nums text-muted-foreground">
                            {String(i + 1).padStart(2, "0")}
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => movePage(i, -1)}
                              disabled={i === 0}
                              aria-label={`Move page ${i + 1} earlier`}
                              className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                            >
                              <ArrowLeft className="size-3.5" />
                            </button>
                            <button
                              onClick={() => movePage(i, 1)}
                              disabled={i === form.pages.length - 1}
                              aria-label={`Move page ${i + 1} later`}
                              className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                            >
                              <ArrowRight className="size-3.5" />
                            </button>
                            <button
                              onClick={() => removePage(i)}
                              aria-label={`Remove page ${i + 1}`}
                              className="ml-1 text-muted-foreground hover:text-dsp-red"
                            >
                              <X className="size-3.5" />
                            </button>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* pdf */}
              <div>
                <span className="text-sm font-medium text-foreground">
                  Downloadable PDF
                </span>
                <div className="mt-2 flex items-center gap-3 rounded-lg border border-border p-3">
                  <FileText className="size-5 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1 text-sm">
                    {form.pdfUrl ? (
                      <>
                        <span className="block text-foreground">
                          Attached
                          {form.pdfPageCount
                            ? `, ${form.pdfPageCount} pages`
                            : ""}
                          {form.pdfSizeBytes
                            ? `, ${formatBytes(form.pdfSizeBytes)}`
                            : ""}
                        </span>
                        <a
                          href={form.pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-muted-foreground underline"
                        >
                          Open
                        </a>
                      </>
                    ) : (
                      <span className="text-muted-foreground">
                        No PDF attached
                      </span>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={uploadingPdf}
                    onClick={() => pdfInputRef.current?.click()}
                  >
                    {uploadingPdf ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : null}
                    {form.pdfUrl ? "Replace" : "Upload"}
                  </Button>
                  <input
                    ref={pdfInputRef}
                    type="file"
                    accept="application/pdf"
                    hidden
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handlePdfSelected(file);
                      e.target.value = "";
                    }}
                  />
                </div>
              </div>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.isPublished}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, isPublished: e.target.checked }))
                  }
                  className="size-4"
                />
                <span className="text-sm text-foreground">
                  Show this brochure on the website
                </span>
              </label>

              <div className="flex gap-3 pt-2">
                <Button onClick={handleSave} disabled={saving}>
                  {saving && <Loader2 className="size-4 animate-spin" />}
                  {editing ? "Save changes" : "Create brochure"}
                </Button>
                <Button variant="outline" onClick={() => setPanelOpen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── delete confirm ───────────────────────────────── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-background p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-foreground">
              Delete {deleteTarget.name}?
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              This removes the brochure from the site and deletes its{" "}
              {deleteTarget.pages.length} page
              {deleteTarget.pages.length === 1 ? "" : "s"}
              {deleteTarget.pdfUrl ? " and the PDF" : ""} from storage. It cannot
              be undone.
            </p>
            <div className="mt-6 flex gap-3">
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting && <Loader2 className="size-4 animate-spin" />}
                Delete brochure
              </Button>
              <Button variant="outline" onClick={() => setDeleteTarget(null)}>
                Keep it
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
