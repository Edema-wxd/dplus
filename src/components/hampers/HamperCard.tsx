import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import type { Hamper } from "@/lib/hampers";

export default function HamperCard({
  hamper,
  priority = false,
}: {
  hamper: Hamper;
  priority?: boolean;
}) {
  const cover = hamper.pages[0];

  return (
    <article className="group">
      <Link href={`/hampers/${hamper.slug}`} className="block">
        <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-coal-grey/60">
          {cover ? (
            <Image
              src={cover.url}
              alt={cover.alt || `${hamper.name} corporate gift hamper`}
              fill
              sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 33vw"
              loading={priority ? "eager" : "lazy"}
              fetchPriority={priority ? "high" : "auto"}
              className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
          ) : null}
        </div>

        <h3 className="font-sarlotte font-bold text-foreground text-xl mt-4 group-hover:text-dsp-yellow transition-colors">
          {hamper.name}
        </h3>
      </Link>

      {hamper.tagline && (
        <p className="font-raleway text-sm text-muted-foreground leading-relaxed mt-1 max-w-[42ch]">
          {hamper.tagline}
        </p>
      )}

      <p className="font-raleway text-sm text-dsp-yellow mt-3 inline-flex items-center gap-1.5">
        <Link href={`/hampers/${hamper.slug}`} className="hover:underline">
          See what is inside
        </Link>
        <ArrowRight className="size-3.5" aria-hidden />
      </p>
    </article>
  );
}
