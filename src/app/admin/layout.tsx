import type { Metadata } from "next";
import { auth, signOut } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Toaster } from "@/components/ui/sonner";
import { SidebarNav } from "@/components/admin/SidebarNav";
import { getNewOrderCount } from "@/lib/orders";

export const dynamic = "force-dynamic";

// robots.txt already disallows /admin, but a meta tag also covers anything that
// reaches these pages through a link rather than a crawl of the root.
export const metadata: Metadata = {
  title: { default: "Admin", template: "%s | Admin" },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect("/portal");
  }

  const newOrderCount = await getNewOrderCount();

  const signOutAction = async () => {
    "use server";
    await signOut({ redirectTo: "/portal" });
  };

  return (
    <div className="flex min-h-screen bg-background">
      <SidebarNav
        userEmail={session.user?.email}
        newOrderCount={newOrderCount}
        signOutAction={signOutAction}
      />

      {/* Main content — adds bottom padding on mobile so the tab bar doesn't overlap */}
      <main className="flex-1 overflow-y-auto p-6 pb-24 lg:pb-6">
        {children}
      </main>

      <Toaster richColors />
    </div>
  );
}
