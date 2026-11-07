import type { Metadata } from "next";
import Link from "next/link";
import { ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { listEnquiries, listPeople, type Enquiry, type Person } from "@/lib/contacts";
import { BUDGETS, NEEDS, ROLES, optionLabel } from "@/lib/brief-options";

export const metadata: Metadata = { title: "Contacts" };

const PAGE_SIZE = 25;

type Tab = "enquiries" | "people";

const TABS: { value: Tab; label: string }[] = [
  { value: "enquiries", label: "Enquiries" },
  { value: "people", label: "All contacts" },
];

// The brief's fields as stored in contact_submissions.details, in the order
// they read best. Older submissions used timeline/location/position/inspiration.
const DETAIL_LABELS: Record<string, string> = {
  service: "Needs",
  headcount: "Headcount",
  neededBy: "Needed by",
  timeline: "Timeline",
  budget: "Budget",
  role: "Signs off",
  position: "Position",
  branding: "Branding",
  hamper: "From hamper",
  location: "Location",
  inspiration: "Inspiration",
};

// Coded answers from the current form, shown as the visitor read them.
const DETAIL_OPTIONS: Record<string, { value: string; label: string }[]> = {
  service: NEEDS,
  budget: BUDGETS,
  role: ROLES,
};

const TIER_CLASSES: Record<string, string> = {
  hot: "bg-dsp-red/10 text-dsp-red",
  warm: "bg-dsp-yellow/15 text-dsp-yellow",
  cold: "bg-muted text-muted-foreground",
};

// The server's clock is US Eastern; show the time in Lagos.
function formatDate(value: Date, withTime = false): string {
  return value.toLocaleString("en-ZA", {
    timeZone: "Africa/Lagos",
    day: "numeric",
    month: "short",
    year: "numeric",
    ...(withTime && { hour: "2-digit", minute: "2-digit" }),
  });
}

/** wa.me wants the international number: 0803… becomes 234803…. */
function whatsappNumber(phone: string): string | null {
  const digits = phone.replace(/\D/g, "");
  if (/^0\d{10}$/.test(digits)) return `234${digits.slice(1)}`;
  return digits.length >= 10 ? digits : null;
}

function contactsHref(tab: Tab, search: string, page = 0): string {
  const params = new URLSearchParams();
  if (tab !== "enquiries") params.set("tab", tab);
  if (search) params.set("q", search);
  if (page > 0) params.set("page", String(page + 1));
  const query = params.toString();
  return query ? `/admin/contacts?${query}` : "/admin/contacts";
}

// ── page ──────────────────────────────────────────────────

export default async function AdminContactsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; q?: string; page?: string }>;
}) {
  const params = await searchParams;
  const tab: Tab = params.tab === "people" ? "people" : "enquiries";
  const search = (params.q ?? "").trim().slice(0, 200);
  const page = Math.max(0, (Number.parseInt(params.page ?? "1", 10) || 1) - 1);
  const list = { search, limit: PAGE_SIZE, offset: page * PAGE_SIZE };

  const result =
    tab === "people"
      ? { tab, ...(await listPeople(list)) }
      : { tab, ...(await listEnquiries(list)) };

  const totalPages = Math.max(1, Math.ceil(result.total / PAGE_SIZE));
  const start = page * PAGE_SIZE + 1;
  const end = Math.min((page + 1) * PAGE_SIZE, result.total);
  const noun = tab === "people" ? "contact" : "enquiry";
  const plural = tab === "people" ? "contacts" : "enquiries";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Contacts</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Enquiries from the contact form, and everyone who has reached us
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {TABS.map(({ value, label }) => (
          <Link
            key={value}
            href={contactsHref(value, search)}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors border",
              tab === value
                ? "bg-foreground text-background border-foreground"
                : "bg-background text-muted-foreground border-border hover:border-foreground/30 hover:text-foreground"
            )}
          >
            {label}
          </Link>
        ))}
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <form action="/admin/contacts" className="relative w-full max-w-sm">
          {tab !== "enquiries" && <input type="hidden" name="tab" value={tab} />}
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <input
            type="search"
            name="q"
            defaultValue={search}
            placeholder={
              tab === "people"
                ? "Search name, email, phone or company…"
                : "Search name, email, company or message…"
            }
            aria-label={`Search ${plural}`}
            className="w-full rounded-lg border border-border bg-background pl-9 pr-4 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-border"
          />
        </form>

        {result.total > 0 && (
          <p className="text-sm text-muted-foreground shrink-0">
            Showing {start}–{end} of {result.total} {result.total === 1 ? noun : plural}
          </p>
        )}
      </div>

      {/* List */}
      {result.rows.length === 0 ? (
        <div className="rounded-xl border border-border bg-background py-16 text-center">
          <p className="text-sm text-muted-foreground">
            {search ? `No ${plural} match “${search}”.` : `No ${plural} yet.`}
          </p>
          {(search || page > 0) && (
            <Link
              href={contactsHref(tab, "")}
              className="mt-3 inline-block text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
            >
              Show all {plural}
            </Link>
          )}
        </div>
      ) : result.tab === "people" ? (
        <PeopleTable people={result.rows} />
      ) : (
        <div className="space-y-2">
          {result.rows.map((enquiry) => (
            <EnquiryCard key={enquiry.id} enquiry={enquiry} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-border pt-4">
          <PageLink href={contactsHref(tab, search, page - 1)} disabled={page === 0}>
            ← Prev
          </PageLink>
          <span className="text-sm text-muted-foreground">
            Page {page + 1} of {totalPages}
          </span>
          <PageLink href={contactsHref(tab, search, page + 1)} disabled={page + 1 >= totalPages}>
            Next →
          </PageLink>
        </div>
      )}
    </div>
  );
}

// ── EnquiryCard ───────────────────────────────────────────

function EnquiryCard({ enquiry }: { enquiry: Enquiry }) {
  const details = enquiry.details ?? {};
  const tier = typeof details.leadTier === "string" ? details.leadTier : null;
  const score = typeof details.leadScore === "number" ? details.leadScore : null;
  const signals = Array.isArray(details.leadSignals)
    ? details.leadSignals.filter((s): s is string => typeof s === "string")
    : [];
  const fields = Object.entries(DETAIL_LABELS).flatMap(([key, label]) => {
    const value = details[key];
    return value === null || value === undefined || value === ""
      ? []
      : [{ label, value: DETAIL_OPTIONS[key] ? optionLabel(DETAIL_OPTIONS[key], String(value)) : String(value) }];
  });
  const whatsapp = enquiry.phone ? whatsappNumber(enquiry.phone) : null;

  return (
    <details className="group rounded-xl border border-border bg-background overflow-hidden">
      {/* Summary row */}
      <summary className="list-none [&::-webkit-details-marker]:hidden cursor-pointer px-5 py-4 flex items-start gap-4 hover:bg-muted/40 transition-colors">
        <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-1 sm:gap-x-6">
          <div className="min-w-0">
            <p className="font-medium text-foreground truncate">
              {enquiry.name}
              {enquiry.company && (
                <span className="font-normal text-muted-foreground"> · {enquiry.company}</span>
              )}
            </p>
            <p className="text-sm text-muted-foreground truncate">{enquiry.email}</p>
            <p className="mt-1 text-sm text-muted-foreground line-clamp-1">{enquiry.message}</p>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm sm:justify-end">
            {tier && (
              <span
                className={cn(
                  "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
                  TIER_CLASSES[tier] ?? TIER_CLASSES.cold
                )}
              >
                {tier}
                {score !== null && <span className="ml-1 tabular-nums opacity-70">{score}</span>}
              </span>
            )}
            <span className="text-muted-foreground whitespace-nowrap">
              {formatDate(enquiry.createdAt)}
            </span>
          </div>
        </div>
        <ChevronDown className="size-4 shrink-0 mt-0.5 text-muted-foreground transition-transform group-open:rotate-180" />
      </summary>

      {/* Expanded detail */}
      <div className="border-t border-border px-5 py-4 space-y-4">
        <div className="flex flex-wrap gap-2">
          <ActionLink href={`mailto:${enquiry.email}`}>Email {enquiry.email}</ActionLink>
          {enquiry.phone && <ActionLink href={`tel:${enquiry.phone}`}>Call {enquiry.phone}</ActionLink>}
          {whatsapp && (
            <ActionLink href={`https://wa.me/${whatsapp}`} external>
              WhatsApp
            </ActionLink>
          )}
        </div>

        {fields.length > 0 && (
          <dl className="grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
            {fields.map(({ label, value }) => (
              <div key={label}>
                <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {label}
                </dt>
                <dd className="mt-0.5 text-foreground break-words">{value}</dd>
              </div>
            ))}
          </dl>
        )}

        <div className="rounded-lg bg-muted/50 px-4 py-3 text-sm text-foreground whitespace-pre-wrap break-words">
          {enquiry.message}
        </div>

        {signals.length > 0 && (
          <p className="text-xs text-muted-foreground">{signals.join(" · ")}</p>
        )}

        <p className="text-xs text-muted-foreground">
          Enquiry #{enquiry.id} · sent {formatDate(enquiry.createdAt, true)}
        </p>
      </div>
    </details>
  );
}

// ── PeopleTable ───────────────────────────────────────────

function PeopleTable({ people }: { people: Person[] }) {
  return (
    <div className="rounded-xl border border-border bg-background overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
            <th className="px-5 py-3">Name</th>
            <th className="px-5 py-3 hidden md:table-cell">Phone</th>
            <th className="px-5 py-3 hidden lg:table-cell">Company</th>
            <th className="px-5 py-3">Reached us by</th>
            <th className="px-5 py-3 hidden sm:table-cell">Last contact</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {people.map((p) => (
            <tr key={p.email} className="hover:bg-muted/30 transition-colors align-top">
              <td className="px-5 py-3 min-w-0">
                <p className="font-medium text-foreground">
                  {p.name ?? <span className="text-muted-foreground/60">No name</span>}
                </p>
                <a
                  href={`mailto:${p.email}`}
                  className="text-muted-foreground hover:text-foreground transition-colors break-words"
                >
                  {p.email}
                </a>
              </td>
              <td className="px-5 py-3 hidden md:table-cell text-muted-foreground whitespace-nowrap">
                {p.phone ? (
                  <a href={`tel:${p.phone}`} className="hover:text-foreground transition-colors">
                    {p.phone}
                  </a>
                ) : (
                  <span className="text-muted-foreground/40">—</span>
                )}
              </td>
              <td className="px-5 py-3 hidden lg:table-cell text-muted-foreground">
                {p.company ?? <span className="text-muted-foreground/40">—</span>}
              </td>
              <td className="px-5 py-3">
                <div className="flex flex-wrap gap-1.5">
                  {p.enquiries > 0 && (
                    <Link
                      href={contactsHref("enquiries", p.email)}
                      className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-foreground hover:bg-accent transition-colors"
                    >
                      {p.enquiries} {p.enquiries === 1 ? "enquiry" : "enquiries"}
                    </Link>
                  )}
                  {p.orders > 0 && (
                    <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-foreground">
                      {p.orders} {p.orders === 1 ? "order" : "orders"}
                    </span>
                  )}
                  {p.subscribed && (
                    <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-foreground">
                      Newsletter
                    </span>
                  )}
                </div>
              </td>
              <td className="px-5 py-3 hidden sm:table-cell text-muted-foreground whitespace-nowrap">
                {formatDate(p.lastSeen)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── small parts ───────────────────────────────────────────

function ActionLink({
  href,
  external,
  children,
}: {
  href: string;
  external?: boolean;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      {...(external && { target: "_blank", rel: "noopener noreferrer" })}
      className="rounded-full border border-border px-3 py-1 text-xs font-medium text-muted-foreground hover:border-foreground/30 hover:text-foreground transition-colors break-all"
    >
      {children}
    </a>
  );
}

function PageLink({
  href,
  disabled,
  children,
}: {
  href: string;
  disabled: boolean;
  children: React.ReactNode;
}) {
  const className =
    "rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors";
  if (disabled) {
    return (
      <span aria-disabled className={cn(className, "opacity-40 pointer-events-none")}>
        {children}
      </span>
    );
  }
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}
