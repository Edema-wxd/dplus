import type { Metadata } from "next";
import { Suspense } from "react";
import BriefForm from "@/components/contact/BriefForm";
import JsonLd from "@/components/JsonLd";
import {
  absoluteUrl,
  breadcrumbSchema,
  ORGANIZATION_ID,
  pageMetadata,
} from "@/lib/seo";

const TITLE = "Get a corporate gifting quote";
const DESCRIPTION =
  "Tell us what you need, for how many people, and by when. Costings, options and a delivery schedule back within one working day, anywhere in Nigeria.";

export const metadata: Metadata = pageMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: "/contact-us",
});

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
      <section className="pt-20 lg:pt-28 pb-2">
        <div className="max-w-2xl mx-auto px-5 sm:px-6">
          <p className="font-raleway text-[10px] tracking-[0.2em] uppercase text-dsp-yellow mb-4">
            Start a brief
          </p>
          <h1
            className="font-sarlotte font-bold text-foreground leading-[1.07] mb-5"
            style={{ fontSize: "clamp(2.1rem, 5.4vw, 3.4rem)" }}
          >
            Get a corporate gifting quote
          </h1>
          <p className="font-raleway text-base sm:text-lg text-muted-foreground leading-relaxed max-w-[56ch]">
            {DESCRIPTION}
          </p>
        </div>
      </section>

      <Suspense fallback={null}>
        <BriefForm />
      </Suspense>
    </main>
  );
}
