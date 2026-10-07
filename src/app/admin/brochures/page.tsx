"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  FileText,
  GripVertical,
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
  slug: string;
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
  slug: "",
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

/** The fields that can be edited straight from a table row. */
type InlineField = "name" | "edition" | "sortOrder";

// ── helpers ───────────────────────────────────────────────

function formatBytes(bytes: number) {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
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
    slug: b.slug,
    edition: b.edition ?? "",
    description: b.description ?? "",
    pageRatio: String(b.pageRatio),
    sortOrder: String(b.sortOrder),
    pages: b.pages.map((p) => ({ ...p })),
    pdfUrl: b.pdfUrl,
    pdfKey: b.pdfKey,
    pdfSizeBytes: b.pdfSizeBytes,
    pdfPageCount: b.pdfPageCount,
    isPublished: b.isPublished,
  };
}

/** Moves one item of a list to another index, leaving the rest in order. */
function moveItem<T>(list: T[], from: number, to: number): T[] {
  if (from === to || from < 0 || from >= list.length) return list;
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(Math.max(0, Math.min(to, next.length)), 0, item);
  return next;
}

/** Drops files nobody owns, so an abandoned edit doesn't leave them behind. */
function discardUploads(keys: string[]) {
  if (!keys.length) return;
  void fetch("/api/admin/uploads", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ keys }),
  }).catch(() => {});
}

// ── inline cell ───────────────────────────────────────────

/**
 * A table cell that turns into an input when clicked. Enter or blur commits,
 * Escape puts the old value back.
 */
function InlineCell({
  value,
  label,
  placeholder,
  numeric = false,
  className = "",
  onCommit,
}: {
  value: string;
  label: string;
  placeholder?: string;
  numeric?: boolean;
  className?: string;
  onCommit: (next: string) => Promise<void> | void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);
  const cancelled = useRef(false);

  useLayoutEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  function start() {
    setDraft(value);
    cancelled.current = false;
    setEditing(true);
  }

  function commit() {
    setEditing(false);
    if (cancelled.current || draft === value) return;
    void onCommit(draft);
  }

  if (!editing) {
    return (
      <button
        type="button"
        onClick={start}
        title={`Edit ${label}`}
        className={`w-full truncate rounded px-1.5 py-1 text-left transition-colors hover:bg-muted ${className}`}
      >
        {value || (
          <span className="text-muted-foreground">{placeholder ?? "—"}</span>
        )}
      </button>
    );
  }

  return (
    <input
      ref={inputRef}
      aria-label={label}
      value={draft}
      inputMode={numeric ? "numeric" : undefined}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          commit();
        } else if (e.key === "Escape") {
          e.preventDefault();
          cancelled.current = true;
          setEditing(false);
        }
      }}
      className={`w-full rounded border border-input bg-background px-1.5 py-1 text-sm outline-none ring-1 ring-ring ${className}`}
    />
  );
}

// ── page ──────────────────────────────────────────────────

export default function AdminBrochuresPage() {
  const [items, setItems] = useState<Brochure[]>([]);
  const [loading, setLoading] = useState(true);
  const [panelOpen, setPanelOpen] = useState(false);
  const [editing, setEditing] = useState<Brochure | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [slugTouched, setSlugTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Brochure | null>(null);
  const [deleting, setDeleting] = useState(false);
  const pageInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  // Keys uploaded since the panel opened. Dropped if the edit is abandoned.
  const sessionKeys = useRef<Set<string>>(new Set());

  // Row dragging. `armed` keeps rows undraggable until a grip is pressed, so
  // text in the inline inputs stays selectable.
  const [rowDragArmed, setRowDragArmed] = useState(false);
  const [rowDragFrom, setRowDragFrom] = useState<number | null>(null);
  const [rowDragOver, setRowDragOver] = useState<number | null>(null);

  // Page dragging inside the editor panel, armed the same way.
  const [pageDragArmed, setPageDragArmed] = useState(false);
  const [pageDragFrom, setPageDragFrom] = useState<number | null>(null);
  const [pageDragOver, setPageDragOver] = useState<number | null>(null);

  // A grip pressed but never dragged would otherwise leave rows draggable,
  // which swallows clicks and text selection.
  useEffect(() => {
    if (!rowDragArmed && !pageDragArmed) return;
    const disarm = () => {
      setRowDragArmed(false);
      setPageDragArmed(false);
    };
    window.addEventListener("mouseup", disarm);
    window.addEventListener("touchend", disarm);
    return () => {
      window.removeEventListener("mouseup", disarm);
      window.removeEventListener("touchend", disarm);
    };
  }, [rowDragArmed, pageDragArmed]);

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
        res.forEach((f) => sessionKeys.current.add(f.key));
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
        sessionKeys.current.add(file.key);
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
      const target = index + delta;
      if (target < 0 || target >= prev.pages.length) return prev;
      return { ...prev, pages: moveItem(prev.pages, index, target) };
    });
  }

  function removePage(index: number) {
    setForm((prev) => ({
      ...prev,
      pages: prev.pages.filter((_, i) => i !== index),
    }));
  }

  function setPageAlt(index: number, alt: string) {
    setForm((prev) => ({
      ...prev,
      pages: prev.pages.map((p, i) => (i === index ? { ...p, alt } : p)),
    }));
  }

  function dropPage(to: number) {
    if (pageDragFrom === null) return;
    setForm((prev) => ({
      ...prev,
      pages: moveItem(prev.pages, pageDragFrom, to),
    }));
    setPageDragFrom(null);
    setPageDragOver(null);
    setPageDragArmed(false);
  }

  // ── open / save / close ───────────────────────────────

  function openNew() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setSlugTouched(false);
    sessionKeys.current = new Set();
    setPanelOpen(true);
  }

  function openEdit(brochure: Brochure) {
    setEditing(brochure);
    setForm(brochureToForm(brochure));
    setSlugTouched(true);
    sessionKeys.current = new Set();
    setPanelOpen(true);
  }

  /** Closes without saving, dropping anything uploaded during the session. */
  function cancelEdit() {
    discardUploads([...sessionKeys.current]);
    sessionKeys.current = new Set();
    setPanelOpen(false);
  }

  async function handleSave() {
    const name = form.name.trim();
    if (!name) {
      toast.error("Give the brochure a name");
      return;
    }
    const slug = slugify(form.slug || name);
    if (!slug) {
      toast.error("The address must contain letters or numbers");
      return;
    }
    setSaving(true);

    const payload = {
      name,
      slug,
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

      // The row now owns these files, so they are no longer the session's to drop.
      sessionKeys.current = new Set();
      toast.success(editing ? "Brochure saved" : "Brochure created");
      setPanelOpen(false);
      fetchItems();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  // ── row-level edits ───────────────────────────────────

  /** Patches one brochure, showing the change at once and rolling back if it fails. */
  const patchRow = useCallback(
    async (brochure: Brochure, patch: Partial<Brochure>, failure: string) => {
      setItems((prev) =>
        prev.map((b) => (b.id === brochure.id ? { ...b, ...patch } : b))
      );
      try {
        const res = await fetch(`/api/admin/brochures/${brochure.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patch),
        });
        const data = await res.json().catch(() => null);
        if (!res.ok) throw new Error(data?.error ?? failure);
        if (data?.id) {
          setItems((prev) => prev.map((b) => (b.id === data.id ? data : b)));
        }
        return true;
      } catch (err) {
        setItems((prev) =>
          prev.map((b) => (b.id === brochure.id ? brochure : b))
        );
        toast.error(err instanceof Error ? err.message : failure);
        return false;
      }
    },
    []
  );

  async function commitInline(
    brochure: Brochure,
    field: InlineField,
    raw: string
  ) {
    if (field === "name") {
      const name = raw.trim();
      if (!name) {
        toast.error("Name is required");
        return;
      }
      await patchRow(brochure, { name }, "Could not rename this brochure");
      return;
    }

    if (field === "edition") {
      const edition = raw.trim();
      await patchRow(
        brochure,
        { edition: edition || null },
        "Could not change the edition"
      );
      return;
    }

    const sortOrder = Number(raw);
    if (!Number.isFinite(sortOrder)) {
      toast.error("Order must be a number");
      return;
    }
    const ok = await patchRow(
      brochure,
      { sortOrder: Math.trunc(sortOrder) },
      "Could not change the order"
    );
    // The list is kept in sort order, so a new number may move the row.
    if (ok) {
      setItems((prev) =>
        [...prev].sort((a, b) => a.sortOrder - b.sortOrder || b.id - a.id)
      );
    }
  }

  async function togglePublished(brochure: Brochure) {
    const next = !brochure.isPublished;
    const ok = await patchRow(
      brochure,
      { isPublished: next },
      "Could not change this"
    );
    if (ok) toast.success(next ? "Published" : "Unpublished");
  }

  /** Writes the dragged order back, numbering the rows from the top. */
  async function dropRow(to: number) {
    const from = rowDragFrom;
    setRowDragFrom(null);
    setRowDragOver(null);
    setRowDragArmed(false);
    if (from === null || from === to) return;

    const previous = items;
    const next = moveItem(items, from, to).map((b, i) => ({
      ...b,
      sortOrder: i,
    }));
    setItems(next);

    try {
      const res = await fetch("/api/admin/brochures", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: next.map((b) => b.id) }),
      });
      if (!res.ok) throw new Error();
      setItems(await res.json());
      toast.success("Order saved");
    } catch {
      setItems(previous);
      toast.error("Could not save the new order");
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
            Pages and PDFs shown on the brochures page. Click a name, edition or
            order to change it here; drag the handle to reorder.
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
                  <th className="px-2 py-3 w-8">
                    <span className="sr-only">Reorder</span>
                  </th>
                  <th className="px-4 py-3 w-20">Cover</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3 hidden sm:table-cell">Edition</th>
                  <th className="px-4 py-3 text-center">Pages</th>
                  <th className="px-4 py-3 text-center hidden md:table-cell">
                    PDF
                  </th>
                  <th className="px-4 py-3 text-center w-20">Order</th>
                  <th className="px-4 py-3 text-center">Published</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {items.map((b, index) => (
                  <tr
                    key={b.id}
                    draggable={rowDragArmed}
                    onDragStart={() => setRowDragFrom(index)}
                    onDragEnd={() => {
                      setRowDragFrom(null);
                      setRowDragOver(null);
                      setRowDragArmed(false);
                    }}
                    onDragOver={(e) => {
                      if (rowDragFrom === null) return;
                      e.preventDefault();
                      setRowDragOver(index);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      dropRow(index);
                    }}
                    className={`transition-colors ${
                      rowDragFrom === index
                        ? "opacity-40"
                        : rowDragOver === index
                          ? "bg-muted"
                          : "hover:bg-muted/40"
                    }`}
                  >
                    <td className="px-2 py-3">
                      <button
                        type="button"
                        aria-label={`Drag to reorder ${b.name}`}
                        title="Drag to reorder"
                        onMouseDown={() => setRowDragArmed(true)}
                        onTouchStart={() => setRowDragArmed(true)}
                        className="cursor-grab text-muted-foreground hover:text-foreground active:cursor-grabbing"
                      >
                        <GripVertical className="size-4" />
                      </button>
                    </td>
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
                    <td className="px-4 py-3 max-w-[220px]">
                      <InlineCell
                        value={b.name}
                        label={`Name of ${b.name}`}
                        className="font-medium text-foreground"
                        onCommit={(next) => commitInline(b, "name", next)}
                      />
                      <span className="block px-1.5 text-xs text-muted-foreground truncate">
                        /brochures#{b.slug}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell max-w-[180px]">
                      <InlineCell
                        value={b.edition ?? ""}
                        label={`Edition of ${b.name}`}
                        className="text-muted-foreground"
                        onCommit={(next) => commitInline(b, "edition", next)}
                      />
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
                    <td className="px-4 py-3">
                      <InlineCell
                        value={String(b.sortOrder)}
                        label={`Order of ${b.name}`}
                        numeric
                        className="text-center text-muted-foreground tabular-nums"
                        onCommit={(next) => commitInline(b, "sortOrder", next)}
                      />
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
                onClick={cancelEdit}
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
                  onChange={(e) => {
                    const name = e.target.value;
                    setForm((p) => ({
                      ...p,
                      name,
                      // A new brochure follows the name until the address is edited.
                      slug: slugTouched ? p.slug : slugify(name),
                    }));
                  }}
                  placeholder="Corporate Christmas"
                  className="mt-1.5"
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-foreground">
                  Address
                </span>
                <Input
                  value={form.slug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    setForm((p) => ({ ...p, slug: e.target.value }));
                  }}
                  onBlur={() =>
                    setForm((p) => ({ ...p, slug: slugify(p.slug) }))
                  }
                  placeholder="corporate-christmas"
                  className="mt-1.5"
                />
                <span className="mt-1 block text-xs text-muted-foreground">
                  Links to this brochure use /brochures#
                  {slugify(form.slug) || "address"}. Changing it breaks links
                  already shared.
                </span>
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
                  Uploaded in the order you select them. Drag a page to move it,
                  or use the arrows.
                </p>

                {form.pages.length > 0 && (
                  <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {form.pages.map((page, i) => (
                      <li
                        key={page.key || page.url}
                        draggable={pageDragArmed}
                        onDragStart={() => setPageDragFrom(i)}
                        onDragEnd={() => {
                          setPageDragFrom(null);
                          setPageDragOver(null);
                          setPageDragArmed(false);
                        }}
                        onDragOver={(e) => {
                          if (pageDragFrom === null) return;
                          e.preventDefault();
                          setPageDragOver(i);
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          dropPage(i);
                        }}
                        className={`rounded-lg border p-2 transition-colors ${
                          pageDragFrom === i
                            ? "border-border opacity-40"
                            : pageDragOver === i
                              ? "border-foreground bg-muted"
                              : "border-border"
                        }`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={page.url}
                          alt=""
                          draggable={false}
                          title="Drag to move this page"
                          onMouseDown={() => setPageDragArmed(true)}
                          onTouchStart={() => setPageDragArmed(true)}
                          className="w-full cursor-grab rounded bg-muted object-cover active:cursor-grabbing"
                          style={{ aspectRatio: Number(form.pageRatio) || 1.414 }}
                        />
                        <input
                          value={page.alt}
                          onChange={(e) => setPageAlt(i, e.target.value)}
                          aria-label={`Description of page ${i + 1}`}
                          placeholder="Describe this page"
                          className="mt-2 w-full rounded border border-input bg-background px-2 py-1 text-xs"
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
                <Button variant="outline" onClick={cancelEdit}>
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
