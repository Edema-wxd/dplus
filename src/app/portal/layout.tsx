import type { Metadata } from "next";

// Sign-in surface: never indexed, and no links worth following out of it.
export const metadata: Metadata = {
  title: "Portal",
  robots: { index: false, follow: false },
};

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
