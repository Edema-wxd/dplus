"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  ArrowDown,
  ArrowUp,
  FileText,
  Loader2,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUploadThing } from "@/lib/uploadthing-client";

type HamperPage = { url: string; key: string; alt: string };
type HamperContent = { item: string; note?: string };
type HamperFaq = { question: string; answer: string };

type Hamper = {
  id: number;
  slug: string;
  name: string;
  tagline: string | null;
  description: string | null;
  leadTimeDays: number | null;
  pageRatio: number;
  contents: HamperContent[];
  pages: HamperPage[];
  pdfUrl: string | null;
  pdfKey: string | null;
  pdfSizeBytes: number | null;
  pdfPageCount: number | null;
  faqs: HamperFaq[];
  occasions: string[];
  metaTitle: string | null;
  metaDescription: string | null;
  isPublished: boolean;
  sortOrder: number;
};

type FormState = {
  name: string;
  slug: string;
  tagline: string;
  description: string;
  leadTimeDays: string;
  sortOrder: string;
  contentsText: string;
  faqsText: string;
  occasionsText: string;
  metaTitle: string;
  metaDescription: string;
  pageRatio: string;
  pages: HamperPage[];
  pdfUrl: string | null;
  pdfKey: string | null;
  pdfSizeBytes: number | null;
  pdfPageCount: number | null;
  isPublished: boolean;
};

const EMPTY_FORM: FormState = {
  name: "",
  slug: "",
  tagline: "",
  description: "",
  leadTimeDays: "",
  sortOrder: "0",
  contentsText: "",
  faqsText: "",
  occasionsText: "",
  metaTitle: "",
  metaDescription: "",
  pageRatio: "1.414",
  pages: [],
  pdfUrl: null,
  pdfKey: null,
  pdfSizeBytes: null,
  pdfPageCount: null,
  isPublished: false,
};

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

/** One line per item: "Item name | optional note" */
function parseContents(text: string): HamperContent[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [item, ...rest] = line.split("|");
      const note = rest.join("|").trim();
      return note ? { item: item.trim(), note } : { item: item.trim() };
    });
}

const contentsToText = (contents: HamperContent[]) =>
  contents.map((c) => (c.note ? `${c.item} | ${c.note}` : c.item)).join("\n");

/** One Q&A per line: "Question? | Answer" */
function parseFaqs(text: string): HamperFaq[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [question, ...rest] = line.split("|");
      return { question: question.trim(), answer: rest.join("|").trim() };
    })
    .filter((faq) => faq.question && faq.answer);
}

const faqsToText = (faqs: HamperFaq[]) =>
  faqs.map((f) => `${f.question} | ${f.answer}`).join("\n");

function hamperToForm(h: Hamper): FormState {
  return {
    name: h.name,
    slug: h.slug,
    tagline: h.tagline ?? "",
    description: h.description ?? "",
    leadTimeDays: h.leadTimeDays === null ? "" : String(h.leadTimeDays),
    sortOrder: String(h.sortOrder),
    contentsText: contentsToText(h.contents),
    faqsText: faqsToText(h.faqs),
    occasionsText: h.occasions.join(", "),
    metaTitle: h.metaTitle ?? "",
    metaDescription: h.metaDescription ?? "",
    pageRatio: String(h.pageRatio),
    pages: h.pages,
    pdfUrl: h.pdfUrl,
    pdfKey: h.pdfKey,
    pdfSizeBytes: h.pdfSizeBytes,
    pdfPageCount: h.pdfPageCount,
    isPublished: h.isPublished,
  };
}

export default function AdminHampersPage() {
  const [items, setItems] = useState<Hamper[]>([]);
  const [loading, setLoading] = useState(true);
  const [panelOpen, setPanelOpen] = useState(false);
  const [editing, setEditing] = useState<Hamper | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Hamper | null>(null);
  const [deleting, setDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/hampers");
      if (!res.ok) throw new Error();
      setItems(await res.json());
    } catch {
      toast.error("Could not load hampers");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const { startUpload, isUploading } = useUploadThing("hamperPage", {
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
    "hamperPdf",
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
    const pdfPageCount = await countPdfPages(file);
    setForm((prev) => ({ ...prev, pdfPageCount }));
    await uploadPdf([file]);
  }

  function movePage(index: number, delta: number) {
    setForm((prev) => {
      const next = [...prev.pages];
      const target = index + delta;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return { ...prev, pages: next };
    });
  }

  function openNew() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setPanelOpen(true);
  }

  function openEdit(hamper: Hamper) {
    setEditing(hamper);
    setForm(hamperToForm(hamper));
    setPanelOpen(true);
  }

  async function handleSave() {
    if (!form.name.trim()) {
      toast.error("Give the hamper a name");
      return;
    }
    setSaving(true);

    const payload = {
      name: form.name.trim(),
      ...(editing ? { slug: form.slug.trim() } : {}),
      tagline: form.tagline.trim(),
      description: form.description.trim(),
      leadTimeDays: form.leadTimeDays === "" ? null : Number(form.leadTimeDays),
      sortOrder: Number(form.sortOrder) || 0,
      contents: parseContents(form.contentsText),
      faqs: parseFaqs(form.faqsText),
      occasions: form.occasionsText
        .split(",")
        .map((o) => o.trim().toLowerCase())
        .filter(Boolean),
      metaTitle: form.metaTitle.trim(),
      metaDescription: form.metaDescription.trim(),
      pageRatio: Number(form.pageRatio) || 1.414,
      pages: form.pages,
      pdfUrl: form.pdfUrl,
      pdfKey: form.pdfKey,
      pdfSizeBytes: form.pdfSizeBytes,
      pdfPageCount: form.pdfPageCount,
      isPublished: form.isPublished,
    };

    try {
      const res = await fetch(
        editing ? `/api/admin/hampers/${editing.id}` : "/api/admin/hampers",
        {
          method: editing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Save failed");
      toast.success(editing ? "Hamper saved" : "Hamper created");
      setPanelOpen(false);
      fetchItems();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function togglePublished(hamper: Hamper) {
    const next = !hamper.isPublished;
    setItems((prev) =>
      prev.map((h) => (h.id === hamper.id ? { ...h, isPublished: next } : h))
    );
    try {
      const res = await fetch(`/api/admin/hampers/${hamper.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublished: next }),
      });
      if (!res.ok) throw new Error();
      toast.success(next ? "Published" : "Unpublished");
    } catch {
      setItems((prev) =>
        prev.map((h) => (h.id === hamper.id ? { ...h, isPublished: !next } : h))
      );
      toast.error("Could not change this");
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/hampers/${deleteTarget.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      setItems((prev) => prev.filter((h) => h.id !== deleteTarget.id));
      toast.success("Hamper deleted");
      setDeleteTarget(null);
    } catch {
      toast.error("Could not delete this hamper");
    } finally {
      setDeleting(false);
    }
  }

  const metaTitlePreview =
    form.metaTitle.trim() || `${form.name || "Hamper"} — Corporate Gift Hamper`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Hampers</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Each hamper is its own page at /hampers/…
          </p>
        </div>
        <Button onClick={openNew}>+ New Hamper</Button>
      </div>

      <div className="rounded-xl border border-border bg-background overflow-hidden">
        {loading ? (
          <div className="px-5 py-12 text-center text-sm text-muted-foreground">
            Loading…
          </div>
        ) : items.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-muted-foreground">
            No hampers yet.{" "}
            <button onClick={openNew} className="underline hover:text-foreground">
              Add the first one
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3 w-20">Image</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3 text-center hidden md:table-cell">
                    Pages
                  </th>
                  <th className="px-4 py-3 text-center hidden md:table-cell">
                    PDF
                  </th>
                  <th className="px-4 py-3 text-center">Published</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {items.map((h) => (
                  <tr key={h.id} className="hover:bg-muted/40 transition-colors">
                    <td className="px-4 py-3">
                      {h.pages[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={h.pages[0].url}
                          alt=""
                          className="h-12 w-12 rounded object-cover bg-muted"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded bg-muted" />
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium text-foreground max-w-[220px] truncate">
                      {h.name}
                      <a
                        href={`/hampers/${h.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-xs font-normal text-muted-foreground truncate hover:underline"
                      >
                        /hampers/{h.slug}
                      </a>
                    </td>
                    <td className="px-4 py-3 text-center hidden md:table-cell text-muted-foreground tabular-nums">
                      {h.pages.length}
                    </td>
                    <td className="px-4 py-3 text-center hidden md:table-cell text-muted-foreground">
                      {h.pdfUrl
                        ? h.pdfSizeBytes
                          ? formatBytes(h.pdfSizeBytes)
                          : "Yes"
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => togglePublished(h)}
                        className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                          h.isPublished
                            ? "bg-dsp-green/15 text-dsp-green"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {h.isPublished ? "Live" : "Draft"}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button
                        onClick={() => openEdit(h)}
                        className="text-sm text-muted-foreground hover:text-foreground underline"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setDeleteTarget(h)}
                        className="ml-4 text-sm text-muted-foreground hover:text-dsp-red"
                        aria-label={`Delete ${h.name}`}
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

      {panelOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
          <div className="h-full w-full max-w-2xl overflow-y-auto bg-background p-6 shadow-xl">
            <div className="flex items-start justify-between mb-6">
              <h2 className="text-lg font-semibold text-foreground">
                {editing ? `Edit ${editing.name}` : "New hamper"}
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
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="The Lagos Festive Hamper"
                  className="mt-1.5"
                />
              </label>

              {editing && (
                <label className="block">
                  <span className="text-sm font-medium text-foreground">
                    Web address
                  </span>
                  <Input
                    value={form.slug}
                    onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))}
                    className="mt-1.5"
                  />
                  <span className="mt-1 block text-xs text-muted-foreground">
                    /hampers/{form.slug || "…"} — changing this breaks any link
                    already shared or ranked.
                  </span>
                </label>
              )}

              <label className="block">
                <span className="text-sm font-medium text-foreground">
                  Tagline
                </span>
                <Input
                  value={form.tagline}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, tagline: e.target.value }))
                  }
                  placeholder="Nine pieces, packed for the people who close your deals."
                  className="mt-1.5"
                />
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
                  rows={6}
                  className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="Two or three paragraphs. Leave a blank line between them."
                />
                <span className="mt-1 block text-xs text-muted-foreground">
                  This is most of what search engines read. Write it for a buyer,
                  not for a robot.
                </span>
              </label>

              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                <label className="block">
                  <span className="text-sm font-medium text-foreground">
                    Lead time (working days)
                  </span>
                  <Input
                    value={form.leadTimeDays}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, leadTimeDays: e.target.value }))
                    }
                    inputMode="numeric"
                    placeholder="10"
                    className="mt-1.5"
                  />
                </label>
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
                    Width ÷ height. A4 landscape 1.414, portrait 0.707.
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

              <label className="block">
                <span className="text-sm font-medium text-foreground">
                  What is inside
                </span>
                <textarea
                  value={form.contentsText}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, contentsText: e.target.value }))
                  }
                  rows={6}
                  className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
                  placeholder={"Ceramic mug | Laser-engraved with your logo\nShortbread tin"}
                />
                <span className="mt-1 block text-xs text-muted-foreground">
                  One item per line. Add a note after a | if it needs one.
                </span>
              </label>

              <label className="block">
                <span className="text-sm font-medium text-foreground">
                  Questions people ask
                </span>
                <textarea
                  value={form.faqsText}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, faqsText: e.target.value }))
                  }
                  rows={5}
                  className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
                  placeholder={"Can we add our logo? | Yes, on the items and the packaging."}
                />
                <span className="mt-1 block text-xs text-muted-foreground">
                  Question | Answer, one per line. These can appear directly in
                  Google results, so answer them properly.
                </span>
              </label>

              <label className="block">
                <span className="text-sm font-medium text-foreground">
                  Occasions
                </span>
                <Input
                  value={form.occasionsText}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, occasionsText: e.target.value }))
                  }
                  placeholder="christmas, client appreciation, onboarding"
                  className="mt-1.5"
                />
                <span className="mt-1 block text-xs text-muted-foreground">
                  Comma separated. Used to pick which hampers link to each other.
                </span>
              </label>

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
                    disabled={isUploading}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {isUploading ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <UploadCloud className="size-4" />
                    )}
                    Add pages
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    hidden
                    onChange={(e) => {
                      const files = Array.from(e.target.files ?? []);
                      if (files.length) startUpload(files);
                      e.target.value = "";
                    }}
                  />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Shown in this order. The first page is the cover, and the one
                  used when the page is shared.
                </p>

                {form.pages.length > 0 && (
                  <ul className="mt-3 space-y-2">
                    {form.pages.map((page, i) => (
                      <li
                        key={page.key || page.url}
                        className="flex items-center gap-3 rounded-lg border border-border p-2"
                      >
                        <span className="w-6 text-center text-xs tabular-nums text-muted-foreground shrink-0">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={page.url}
                          alt=""
                          className="h-12 w-16 rounded object-cover bg-muted shrink-0"
                        />
                        <Input
                          value={page.alt}
                          onChange={(e) =>
                            setForm((p) => ({
                              ...p,
                              pages: p.pages.map((pg, idx) =>
                                idx === i ? { ...pg, alt: e.target.value } : pg
                              ),
                            }))
                          }
                          placeholder="Describe this page (helps search and screen readers)"
                          className="flex-1"
                        />
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => movePage(i, -1)}
                            disabled={i === 0}
                            aria-label={`Move page ${i + 1} earlier`}
                            className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                          >
                            <ArrowUp className="size-4" />
                          </button>
                          <button
                            onClick={() => movePage(i, 1)}
                            disabled={i === form.pages.length - 1}
                            aria-label={`Move page ${i + 1} later`}
                            className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                          >
                            <ArrowDown className="size-4" />
                          </button>
                          <button
                            onClick={() =>
                              setForm((p) => ({
                                ...p,
                                pages: p.pages.filter((_, idx) => idx !== i),
                              }))
                            }
                            aria-label={`Remove page ${i + 1}`}
                            className="ml-1 text-muted-foreground hover:text-dsp-red"
                          >
                            <X className="size-4" />
                          </button>
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
                          {form.pdfPageCount ? `, ${form.pdfPageCount} pages` : ""}
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
                    {uploadingPdf ? <Loader2 className="size-4 animate-spin" /> : null}
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

              {/* search appearance */}
              <div className="rounded-lg border border-border p-4">
                <h3 className="text-sm font-medium text-foreground">
                  How it looks in Google
                </h3>
                <div className="mt-3 rounded bg-muted/50 p-3">
                  <p className="text-[13px] text-blue-700 dark:text-blue-400 truncate">
                    {metaTitlePreview}
                  </p>
                  <p className="text-[11px] text-dsp-green truncate">
                    de-signplus.com › hampers › {form.slug || "…"}
                  </p>
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                    {form.metaDescription.trim() ||
                      form.tagline.trim() ||
                      form.description.slice(0, 155) ||
                      "Add a description so this reads well in search results."}
                  </p>
                </div>

                <label className="mt-4 block">
                  <span className="text-xs font-medium text-foreground">
                    Search title{" "}
                    <span className="text-muted-foreground">
                      ({metaTitlePreview.length}/60)
                    </span>
                  </span>
                  <Input
                    value={form.metaTitle}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, metaTitle: e.target.value }))
                    }
                    placeholder="Leave empty to generate one"
                    className="mt-1.5"
                  />
                </label>

                <label className="mt-3 block">
                  <span className="text-xs font-medium text-foreground">
                    Search description{" "}
                    <span className="text-muted-foreground">
                      ({form.metaDescription.length}/155)
                    </span>
                  </span>
                  <textarea
                    value={form.metaDescription}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, metaDescription: e.target.value }))
                    }
                    rows={3}
                    className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder="Leave empty to use the tagline"
                  />
                </label>
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
                  Show this hamper on the website
                </span>
              </label>

              <div className="flex gap-3 pt-2">
                <Button onClick={handleSave} disabled={saving}>
                  {saving && <Loader2 className="size-4 animate-spin" />}
                  {editing ? "Save changes" : "Create hamper"}
                </Button>
                <Button variant="outline" onClick={() => setPanelOpen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-background p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-foreground">
              Delete {deleteTarget.name}?
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              The page at /hampers/{deleteTarget.slug} will start returning “not
              found”, and its {deleteTarget.pages.length} page
              {deleteTarget.pages.length === 1 ? "" : "s"}
              {deleteTarget.pdfUrl ? " and the PDF" : ""} will be removed from
              storage. This cannot be undone.
            </p>
            <div className="mt-6 flex gap-3">
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting && <Loader2 className="size-4 animate-spin" />}
                Delete hamper
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
