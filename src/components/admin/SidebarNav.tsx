"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingBag,
  Images,
  RefreshCw,
  SlidersHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { href: "/admin/content", label: "Content", icon: Images },
  { href: "/admin/amrod", label: "Amrod Sync", icon: RefreshCw },
  { href: "/admin/pricing", label: "Pricing", icon: SlidersHorizontal },
];

interface SidebarNavProps {
  userEmail: string | null | undefined;
  newOrderCount: number;
  signOutAction: () => Promise<void>;
}

function NavItem({
  href,
  label,
  icon: Icon,
  exact,
  badge,
}: {
  href: string;
  label: string;
  icon: React.ElementType;
  exact?: boolean;
  badge?: number;
}) {
  const pathname = usePathname();
  const active = exact ? pathname === href : pathname.startsWith(href);

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
        "hover:bg-accent hover:text-foreground",
        active
          ? "bg-accent text-foreground"
          : "text-muted-foreground"
      )}
    >
      <Icon className="size-4 shrink-0" />
      <span className="truncate">{label}</span>
      {badge != null && badge > 0 && (
        <span className="ml-auto flex size-5 items-center justify-center rounded-full bg-dsp-red text-[10px] font-semibold text-white leading-none">
          {badge > 99 ? "99+" : badge}
        </span>
      )}
    </Link>
  );
}

export function SidebarNav({
  userEmail,
  newOrderCount,
  signOutAction,
}: SidebarNavProps) {
  return (
    <>
      {/* ── Desktop sidebar ─────────────────────────────── */}
      <aside className="hidden lg:flex lg:flex-col lg:w-60 lg:shrink-0 lg:border-r lg:border-border lg:bg-background lg:min-h-screen lg:sticky lg:top-0 lg:self-start">
        {/* Wordmark */}
        <div className="flex h-16 items-center border-b border-border px-5">
          <span className="text-base font-semibold tracking-tight text-foreground">
            De-Sign Plus
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-0.5 p-3">
          {NAV_ITEMS.map((item) => (
            <NavItem
              key={item.href}
              href={item.href}
              label={item.label}
              icon={item.icon}
              exact={item.exact}
              badge={item.label === "Orders" ? newOrderCount : undefined}
            />
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-border p-4 space-y-2">
          <p className="truncate text-xs text-muted-foreground">{userEmail}</p>
          <form action={signOutAction}>
            <button
              type="submit"
              className="w-full rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            >
              Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* ── Mobile bottom tab bar ────────────────────────── */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-50 flex items-stretch border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        {NAV_ITEMS.map((item) => (
          <MobileTabItem
            key={item.href}
            href={item.href}
            label={item.label}
            icon={item.icon}
            exact={item.exact}
            badge={item.label === "Orders" ? newOrderCount : undefined}
          />
        ))}
      </nav>
    </>
  );
}

function MobileTabItem({
  href,
  label,
  icon: Icon,
  exact,
  badge,
}: {
  href: string;
  label: string;
  icon: React.ElementType;
  exact?: boolean;
  badge?: number;
}) {
  const pathname = usePathname();
  const active = exact ? pathname === href : pathname.startsWith(href);

  return (
    <Link
      href={href}
      className={cn(
        "relative flex flex-1 flex-col items-center justify-center gap-1 py-2 text-[10px] font-medium transition-colors",
        active ? "text-foreground" : "text-muted-foreground"
      )}
    >
      <span className="relative">
        <Icon className={cn("size-5", active && "stroke-[2.25px]")} />
        {badge != null && badge > 0 && (
          <span className="absolute -top-1 -right-2 flex min-w-[16px] items-center justify-center rounded-full bg-dsp-red px-0.5 text-[9px] font-bold text-white leading-[16px]">
            {badge > 99 ? "99+" : badge}
          </span>
        )}
      </span>
      <span>{label}</span>
    </Link>
  );
}
