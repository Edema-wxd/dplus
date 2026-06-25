"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CheckCircle2, Clock, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ── Types ────────────────────────────────────────────────────────────────────

interface SyncResourceStatus {
  resource: string;
  sync_type: string;
  status: string;
  record_count: number | null;
  error: string | null;
  started_at: string;
  finished_at: string | null;
}

interface SyncLogEntry {
  id: number;
  resource: string;
  sync_type: string;
  status: string;
  record_count: number | null;
  error: string | null;
  started_at: string;
  finished_at: string | null;
}

// ── Constants ────────────────────────────────────────────────────────────────

const ALL_RESOURCES = [
  "products",
  "stock",
  "prices",
  "categories",
  "brands",
  "branding_departments",
  "inclusive_brandings",
  "branding_prices",
  "colour_swatches",
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function relativeTime(date: string | null): string {
  if (!date) return "Never";
  const diff = Date.now() - new Date(date).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function durationSeconds(entry: SyncLogEntry): string {
  if (!entry.finished_at) return "—";
  const ms = new Date(entry.finished_at).getTime() - new Date(entry.started_at).getTime();
  return `${(ms / 1000).toFixed(1)}s`;
}

function fmt(n: number | null): string {
  if (n == null) return "—";
  return n.toLocaleString();
}

function resourceLabel(r: string): string {
  return r.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// ── Status dot ───────────────────────────────────────────────────────────────

function StatusDot({ status }: { status: string | null }) {
  if (!status) return <span className="size-2.5 rounded-full bg-muted-foreground/30 inline-block" />;
  if (status === "success")
    return <span className="size-2.5 rounded-full bg-emerald-500 inline-block" />;
  if (status === "failed")
    return <span className="size-2.5 rounded-full bg-red-500 inline-block" />;
  return <span className="size-2.5 rounded-full bg-amber-400 animate-pulse inline-block" />;
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        status === "success" && "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400",
        status === "failed" && "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
        status === "running" && "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 animate-pulse",
        !["success", "failed", "running"].includes(status) && "bg-muted text-muted-foreground"
      )}
    >
      {status}
    </span>
  );
}

// ── Resource card ─────────────────────────────────────────────────────────────

function ResourceCard({ resource, data }: { resource: string; data?: SyncResourceStatus }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-xl border border-border bg-card p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-foreground leading-tight">
          {resourceLabel(resource)}
        </span>
        <StatusDot status={data?.status ?? null} />
      </div>

      <div className="text-xs text-muted-foreground">
        Last sync: <span className="text-foreground font-medium">{relativeTime(data?.finished_at ?? null)}</span>
      </div>

      <div className="text-xs text-muted-foreground">
        Records:{" "}
        <span className="text-foreground font-medium">
          {data?.record_count != null ? `${fmt(data.record_count)} records` : "—"}
        </span>
      </div>

      {data?.status === "failed" && data.error && (
        <div className="mt-1">
          <button
            className="text-xs text-red-500 underline underline-offset-2 cursor-pointer"
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? "Hide error" : "Show error"}
          </button>
          {expanded && (
            <p className="mt-1 text-xs text-red-500 break-words font-mono bg-red-50 dark:bg-red-950/30 rounded p-2">
              {data.error}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AdminAmrodPage() {
  const [statusMap, setStatusMap] = useState<Record<string, SyncResourceStatus>>({});
  const [log, setLog] = useState<SyncLogEntry[]>([]);
  const [page, setPage] = useState(0);
  const [triggering, setTriggering] = useState<"daily" | "weekly" | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchStatus = useCallback(async () => {
    const res = await fetch("/api/admin/amrod/status");
    if (!res.ok) return;
    const data: SyncResourceStatus[] = await res.json();
    const map: Record<string, SyncResourceStatus> = {};
    for (const entry of data) map[entry.resource] = entry;
    setStatusMap(map);
  }, []);

  const fetchLog = useCallback(async () => {
    const res = await fetch("/api/admin/amrod/log");
    if (!res.ok) return;
    const data: SyncLogEntry[] = await res.json();
    setLog(data);
  }, []);

  useEffect(() => {
    fetchStatus();
    fetchLog();
  }, [fetchStatus, fetchLog]);

  // Poll every 15s while a trigger is in flight
  useEffect(() => {
    if (triggering) {
      pollRef.current = setInterval(() => {
        fetchStatus();
        fetchLog();
      }, 15_000);
    } else {
      if (pollRef.current) clearInterval(pollRef.current);
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [triggering, fetchStatus, fetchLog]);

  async function handleTrigger(job: "daily" | "weekly") {
    setTriggering(job);
    try {
      const res = await fetch("/api/admin/amrod/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        const counts = data.results
          ? Object.entries(data.results as Record<string, number>)
              .map(([k, v]) => `${k}: ${v}`)
              .join(", ")
          : "Done";
        toast.success(`${job === "daily" ? "Daily" : "Weekly"} sync complete`, {
          description: counts,
        });
      } else {
        toast.error("Sync failed", { description: data.error ?? "Unknown error" });
      }
    } catch {
      toast.error("Sync failed", { description: "Network error" });
    } finally {
      setTriggering(null);
      fetchStatus();
      fetchLog();
    }
  }

  const PAGE_SIZE = 20;
  const paginated = log.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(log.length / PAGE_SIZE);

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold">Amrod Sync</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Monitor and manually trigger Amrod catalogue sync jobs.
        </p>
      </div>

      {/* Resource status grid */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-foreground">Resource Status</h2>
          <button
            onClick={() => { fetchStatus(); fetchLog(); }}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <RefreshCw className="size-3" />
            Refresh
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {ALL_RESOURCES.map((r) => (
            <ResourceCard key={r} resource={r} data={statusMap[r]} />
          ))}
        </div>
      </section>

      {/* Manual trigger */}
      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold text-foreground mb-1">Manual Trigger</h2>
        <p className="text-xs text-muted-foreground mb-4">
          This may take up to 60 seconds. Do not navigate away while a sync is running.
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            disabled={!!triggering}
            onClick={() => handleTrigger("daily")}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
              "bg-foreground text-background hover:bg-foreground/90 disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            {triggering === "daily" ? (
              <RefreshCw className="size-4 animate-spin" />
            ) : (
              <CheckCircle2 className="size-4" />
            )}
            {triggering === "daily" ? "Running Daily Sync…" : "Run Daily Sync"}
          </button>

          <button
            disabled={!!triggering}
            onClick={() => handleTrigger("weekly")}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
              "border border-border bg-background hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            {triggering === "weekly" ? (
              <RefreshCw className="size-4 animate-spin" />
            ) : (
              <Clock className="size-4" />
            )}
            {triggering === "weekly" ? "Running Weekly Sync…" : "Run Weekly Sync"}
          </button>
        </div>
      </section>

      {/* Sync history table */}
      <section>
        <h2 className="text-sm font-semibold text-foreground mb-3">Sync History</h2>
        <div className="rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Resource</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Type</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">Records</th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">Duration</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Started</th>
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-xs text-muted-foreground">
                      No sync history yet.
                    </td>
                  </tr>
                )}
                {paginated.map((entry) => (
                  <tr
                    key={entry.id}
                    className={cn(
                      "border-b border-border last:border-0 transition-colors",
                      entry.status === "running" && "bg-amber-50/50 dark:bg-amber-950/10"
                    )}
                  >
                    <td className="px-4 py-2.5 font-medium">{resourceLabel(entry.resource)}</td>
                    <td className="px-4 py-2.5 text-muted-foreground capitalize">{entry.sync_type}</td>
                    <td className="px-4 py-2.5">
                      <StatusBadge status={entry.status} />
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">
                      {fmt(entry.record_count)}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">
                      {durationSeconds(entry)}
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground text-xs whitespace-nowrap">
                      {relativeTime(entry.started_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border px-4 py-2.5 bg-muted/20">
              <span className="text-xs text-muted-foreground">
                Page {page + 1} of {totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  disabled={page === 0}
                  onClick={() => setPage((p) => p - 1)}
                  className="rounded px-2.5 py-1 text-xs font-medium border border-border hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Prev
                </button>
                <button
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage((p) => p + 1)}
                  className="rounded px-2.5 py-1 text-xs font-medium border border-border hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
