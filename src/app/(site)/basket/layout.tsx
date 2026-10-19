import type { Metadata } from "next";

// The basket is per-visitor and has nothing to rank for. The page itself is a
// client component, so its metadata lives here.
export const metadata: Metadata = {
  title: "Your Basket",
  description: "Review the items in your De-Sign Plus enquiry basket.",
  alternates: { canonical: "/basket" },
  robots: { index: false, follow: true, googleBot: { index: false, follow: true } },
};

export default function BasketLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
