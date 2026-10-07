import Link from "next/link";
import { ArrowRight, Clock, Download, Package, Truck } from "lucide-react";
import { formatBytes, type Hamper } from "@/lib/hampers";

/** Deep link that lands on the contact form already knowing the hamper. */
export function enquiryHref(hamper: Pick<Hamper, "name" | "slug">) {
  const params = new URLSearchParams({
    service: "hampers",
    hamper: hamper.name,
  });
  return `/contact-us?${params.toString()}#contact-form`;
}

export default function HamperEnquiry({ hamper }: { hamper: Hamper }) {
  return (
    <section
      aria-labelledby="enquire-heading"
      className="rounded-2xl border border-dsp-yellow/30 bg-dsp-yellow/[0.07] p-6 sm:p-8"
    >
      <h2
        id="enquire-heading"
        className="font-sarlotte font-bold text-foreground text-2xl sm:text-3xl leading-tight"
      >
        Want this one for your team?
      </h2>
      <p className="font-raleway text-[0.95rem] text-muted-foreground leading-relaxed mt-3 max-w-[46ch]">
        Tell us the headcount and the date you need them by. You will have
        costings and a delivery schedule back within one working day.
      </p>

      <div className="mt-6 flex flex-col sm:flex-row gap-3">
        <Link
          href={enquiryHref(hamper)}
          className="inline-flex items-center justify-center gap-2 bg-dsp-yellow text-background font-sarlotte font-semibold text-base px-7 py-4 rounded-xl hover:brightness-110 transition-[filter] duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-dsp-yellow"
        >
          Request this hamper
          <ArrowRight className="size-4" />
        </Link>
        {hamper.pdfUrl && (
          <a
            href={hamper.pdfUrl}
            download
            className="inline-flex items-center justify-center gap-2 border border-foreground/15 text-foreground font-sarlotte px-7 py-4 rounded-xl hover:bg-foreground hover:text-background transition-colors duration-300 text-base"
          >
            <Download className="size-4" />
            Download the PDF
          </a>
        )}
        <a
          href="tel:+2349125120020"
          className="inline-flex items-center justify-center border border-foreground/15 text-foreground font-sarlotte px-7 py-4 rounded-xl hover:bg-foreground hover:text-background transition-colors duration-300 text-base"
        >
          Call +234 912 512 0020
        </a>
      </div>

      {hamper.pdfUrl && (
        <p className="font-raleway text-xs text-muted-foreground mt-3">
          {hamper.pdfPageCount ? `${hamper.pdfPageCount} pages, ` : ""}
          {hamper.pdfSizeBytes ? `${formatBytes(hamper.pdfSizeBytes)}. ` : ""}
          Share it with whoever signs off.
        </p>
      )}

      <dl className="mt-7 pt-6 border-t border-dsp-yellow/20 grid grid-cols-1 sm:grid-cols-3 gap-5 font-raleway text-sm">
        <div className="flex items-start gap-2.5">
          <Package className="size-4 mt-0.5 shrink-0 text-dsp-yellow" />
          <div>
            <dt className="text-foreground">Branded to you</dt>
            <dd className="text-muted-foreground">Items and packaging</dd>
          </div>
        </div>
        {hamper.leadTimeDays !== null && (
          <div className="flex items-start gap-2.5">
            <Clock className="size-4 mt-0.5 shrink-0 text-dsp-yellow" />
            <div>
              <dt className="text-foreground">{hamper.leadTimeDays} working days</dt>
              <dd className="text-muted-foreground">From artwork approval</dd>
            </div>
          </div>
        )}
        <div className="flex items-start gap-2.5">
          <Truck className="size-4 mt-0.5 shrink-0 text-dsp-yellow" />
          <div>
            <dt className="text-foreground">Delivered</dt>
            <dd className="text-muted-foreground">One address or many</dd>
          </div>
        </div>
      </dl>
    </section>
  );
}
