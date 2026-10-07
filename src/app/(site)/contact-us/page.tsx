import type { Metadata } from "next";
import { Suspense } from "react";
import BriefForm from "@/components/contact/BriefForm";
import JsonLd from "@/components/JsonLd";
import { absoluteUrl, breadcrumbSchema, ORGANIZATION_ID } from "@/lib/seo";

const TITLE = "Get a corporate gifting quote";
const DESCRIPTION =
  "Tell us what you need, for how many people, and by when. Costings, options and a delivery schedule back within one working day, anywhere in Nigeria.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/contact-us" },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: absoluteUrl("/contact-us"),
    type: "website",
  },
};

export default function ContactPage() {
  return (
    <main className="min-h-screen">
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Contact", path: "/contact-us" },
          ]),
          {
            "@context": "https://schema.org",
            "@type": "ContactPage",
            name: TITLE,
            description: DESCRIPTION,
            url: absoluteUrl("/contact-us"),
            isPartOf: { "@id": ORGANIZATION_ID },
          },
        ]}
      />
      <Suspense fallback={null}>
        <BriefForm />
      </Suspense>
    </main>
  );
}
