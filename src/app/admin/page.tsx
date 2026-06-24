import Link from "next/link";
import OrderRow from "./_components/OrderRow";
import { pool } from "@/lib/db";
import { getOrderStats, getRecentOrders } from "@/lib/orders";
import { getLastSyncTime } from "@/lib/amrod/sync/log";

// ── helpers ────────────────────────────────────────────────

async function getCatalogueSize(): Promise<number> {
  const { rows } = await pool.query<{ count: string }>(
    `select count(*) from products where is_active = true`
  );
  return Number(rows[0].count);
}

type ContactSubmission = {
  id: number;
  name: string;
  email: string;
  company: string | null;
  message: string;
  created_at: string;
};

async function getRecentContactSubmissions(limit = 5): Promise<ContactSubmission[]> {
  const { rows } = await pool.query<ContactSubmission>(
    `select id, name, email, company, message, created_at
     from contact_submissions
     order by created_at desc
     limit $1`,
    [limit]
  );
  return rows;
}

async function getContactSubmissionCount(): Promise<number> {
  const { rows } = await pool.query<{ count: string }>(
    `select count(*) from contact_submissions`
  );
  return Number(rows[0].count);
}

function relativeTime(date: Date): string {
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

const STATUS_LABELS: Record<string, string> = {
  new: "New",
  reviewing: "Reviewing",
  confirmed: "Confirmed",
  cancelled: "Cancelled",
};

const STATUS_CLASSES: Record<string, string> = {
  new: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  reviewing: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  confirmed: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  cancelled: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
};

// ── page ──────────────────────────────────────────────────

export default async function AdminDashboardPage() {
  const [stats, recentOrders, catalogueSize, lastSync, recentContacts, contactCount] =
    await Promise.all([
      getOrderStats(),
      getRecentOrders(5),
      getCatalogueSize(),
      getLastSyncTime(),
      getRecentContactSubmissions(5),
      getContactSubmissionCount(),
    ]);

  const newCount = stats.byStatus["new"] ?? 0;
  const STATUS_ORDER = ["new", "reviewing", "confirmed", "cancelled"] as const;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          De-Sign Plus operational overview
        </p>
      </div>

      {/* ── Stat cards ───────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="New Orders" value={newCount} highlight />
        <StatCard label="Total Orders" value={stats.total} />
        <StatCard label="Catalogue Size" value={catalogueSize} />
        <StatCard label="Contact Inquiries" value={contactCount} />
      </div>

      {/* ── Last sync note ───────────────────────────────── */}
      {lastSync && (
        <p className="text-xs text-muted-foreground -mt-4">
          Last Amrod sync:{" "}
          <span className="font-medium text-foreground">{relativeTime(lastSync)}</span>
          {" · "}
          {lastSync.toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })}
        </p>
      )}

      {/* ── Order status breakdown ───────────────────────── */}
      <div className="rounded-xl border border-border bg-background p-5">
        <h2 className="mb-4 text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Order Status Breakdown
        </h2>
        <div className="flex flex-wrap gap-6">
          {STATUS_ORDER.map((s) => (
            <div key={s} className="flex flex-col gap-0.5">
              <span className="text-2xl font-semibold tabular-nums text-foreground">
                {stats.byStatus[s] ?? 0}
              </span>
              <span
                className={`inline-self-start rounded-full px-2 py-0.5 text-xs font-medium ${
                  STATUS_CLASSES[s] ?? ""
                }`}
              >
                {STATUS_LABELS[s] ?? s}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Recent orders table ──────────────────────────── */}
      <div className="rounded-xl border border-border bg-background">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-sm font-semibold text-foreground">
            Recent Orders
          </h2>
          <Link
            href="/admin/orders"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            View all orders →
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-muted-foreground">
            No orders yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  <th className="px-5 py-3">Customer</th>
                  <th className="px-5 py-3 hidden sm:table-cell">Email</th>
                  <th className="px-5 py-3 text-right">Items</th>
                  <th className="px-5 py-3 text-right">Total</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 hidden md:table-cell">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {recentOrders.map((order) => (
                  <OrderRow key={order.id} order={order} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Recent contact inquiries ─────────────────────── */}
      <div className="rounded-xl border border-border bg-background">
        <div className="border-b border-border px-5 py-4">
          <h2 className="text-sm font-semibold text-foreground">
            Recent Contact Inquiries
          </h2>
        </div>

        {recentContacts.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-muted-foreground">
            No inquiries yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  <th className="px-5 py-3">Name</th>
                  <th className="px-5 py-3 hidden sm:table-cell">Email</th>
                  <th className="px-5 py-3 hidden md:table-cell">Company</th>
                  <th className="px-5 py-3">Message</th>
                  <th className="px-5 py-3 hidden md:table-cell">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {recentContacts.map((c) => (
                  <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-3 font-medium whitespace-nowrap">{c.name}</td>
                    <td className="px-5 py-3 hidden sm:table-cell text-muted-foreground">
                      <a href={`mailto:${c.email}`} className="hover:text-foreground transition-colors">
                        {c.email}
                      </a>
                    </td>
                    <td className="px-5 py-3 hidden md:table-cell text-muted-foreground">
                      {c.company ?? <span className="text-muted-foreground/40">—</span>}
                    </td>
                    <td className="px-5 py-3 text-muted-foreground max-w-xs">
                      <span className="line-clamp-1">{c.message}</span>
                    </td>
                    <td className="px-5 py-3 hidden md:table-cell text-muted-foreground whitespace-nowrap">
                      {relativeTime(new Date(c.created_at))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ── sub-components ────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  highlight,
}: {
  label: string;
  value: string | number;
  sub?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-5 ${
        highlight
          ? "border-dsp-red/30 bg-dsp-red/5"
          : "border-border bg-background"
      }`}
    >
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p
        className={`mt-2 text-3xl font-semibold tabular-nums ${
          highlight ? "text-dsp-red" : "text-foreground"
        }`}
      >
        {value}
      </p>
      {sub && (
        <p className="mt-1 text-xs text-muted-foreground">{sub}</p>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
        STATUS_CLASSES[status] ?? "bg-muted text-muted-foreground"
      }`}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

function formatNGN(amount: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
