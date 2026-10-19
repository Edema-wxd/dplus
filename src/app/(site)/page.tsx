import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
import { breadcrumbSchema, pageMetadata } from "@/lib/seo";
import Hero from "@/components/home/Hero";
import CTA from "@/components/home/CTA";
import Services from "@/components/home/Services";

export const metadata: Metadata = pageMetadata({
  title: "Corporate Gifting & Branded Merchandise in Nigeria",
  description:
    "De-Sign Plus curates corporate gifts, branded merchandise, workwear and custom branding for Nigerian business. Executive hampers and bulk branding, delivered nationwide.",
  path: "/",
});

export default function Home() {
  return (
    <div>
      <JsonLd data={breadcrumbSchema([{ name: "Home", path: "/" }])} />
      <Hero />
      <Services />
      <CTA />
    </div>
  );
}
