"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

// ── What the brief collects ───────────────────────────────

const NEEDS = [
  { value: "hampers", label: "gift hampers" },
  { value: "branded-merchandise", label: "branded merchandise" },
  { value: "executive-gifts", label: "executive gifts" },
  { value: "workwear", label: "workwear & PPE" },
  { value: "packaging", label: "custom packaging" },
  { value: "not-sure", label: "something else" },
];

const BUDGETS = [
  { value: "under-1m", label: "Under ₦1M" },
  { value: "1-5m", label: "₦1M – ₦5M" },
  { value: "5-15m", label: "₦5M – ₦15M" },
  { value: "15-50m", label: "₦15M – ₦50M" },
  { value: "50m-plus", label: "Over ₦50M" },
  { value: "unsure", label: "Not sure yet" },
];

const ROLES = [
  { value: "decide", label: "I decide" },
  { value: "recommend", label: "I recommend, someone else signs" },
  { value: "researching", label: "I'm gathering options" },
];

type Form = {
  need: string;
  headcount: string;
  neededBy: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  role: string;
  budget: string;
  branding: string;
  notes: string;
  /** Bots fill this; people never see it. */
  website: string;
};

const EMPTY: Form = {
  need: "hampers",
  headcount: "",
  neededBy: "",
  name: "",
  email: "",
  phone: "",
  company: "",
  role: "",
  budget: "",
  branding: "",
  notes: "",
  website: "",
};

const DRAFT_KEY = "dplus_brief_draft";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// The sentence inputs share this treatment: the one place the page is loud.
const FILL =
  "bg-transparent border-0 border-b-2 border-dsp-yellow/70 px-1 pb-0.5 text-foreground focus:outline-none focus:border-dsp-yellow hover:border-dsp-yellow transition-colors";

export default function BriefForm() {
  const searchParams = useSearchParams();
  const [form, setForm] = useState<Form>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState<{ name: string } | null>(null);
  const [about, setAbout] = useState<string | null>(null);
  const startedAt = useRef(Date.now());
  const detailRef = useRef<HTMLDivElement>(null);

  const set = <K extends keyof Form>(key: K, value: Form[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => (prev[key] ? { ...prev, [key]: "" } : prev));
  };

  // Restore an unfinished brief, then keep it saved. Phones interrupt people.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) setForm((prev) => ({ ...prev, ...JSON.parse(raw), website: "" }));
    } catch {
      // a blocked or corrupted store is not worth failing the page over
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ ...form, website: "" }));
    } catch {
      // ignore
    }
  }, [form]);

  // Arriving from a hamper or service page, the brief already knows the subject.
  useEffect(() => {
    const service = searchParams.get("service");
    const hamper = searchParams.get("hamper");
    if (service && NEEDS.some((n) => n.value === service)) {
      setForm((prev) => ({ ...prev, need: service }));
    }
    if (hamper) {
      setAbout(hamper);
      setForm((prev) => ({
        ...prev,
        need: "hampers",
        notes: prev.notes || `Interested in ${hamper}.`,
      }));
    }
  }, [searchParams]);

  function validate() {
    // Keyed in page order, so the first key is the field to send someone to.
    const next: Record<string, string> = {};
    if (!form.headcount.trim())
      next.headcount = "Roughly how many people are you gifting?";
    if (!form.name.trim()) next.name = "We need a name to address the quote to";
    if (!EMAIL_RE.test(form.email.trim()))
      next.email = "Check this email address — the quote goes here";
    setErrors(next);
    return next;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const found = validate();
    if (Object.keys(found).length) {
      const first = document.querySelector<HTMLElement>(`[data-field="${Object.keys(found)[0]}"]`);
      first?.focus();
      first?.scrollIntoView({ block: "center", behavior: "smooth" });
      return;
    }

    setSending(true);
    const need = NEEDS.find((n) => n.value === form.need)?.label ?? form.need;

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim() || undefined,
          company: form.company.trim() || undefined,
          // The brief, written out, so the email and dashboard read as a brief.
          message: [
            `Needs ${need} for ${form.headcount} people${
              form.neededBy ? `, by ${form.neededBy}` : ""
            }.`,
            form.notes.trim(),
          ]
            .filter(Boolean)
            .join("\n\n"),
          service: form.need,
          headcount: Number(form.headcount.replace(/\D/g, "")) || undefined,
          neededBy: form.neededBy || undefined,
          role: form.role || undefined,
          budget: form.budget || undefined,
          branding: form.branding || undefined,
          hamper: about || undefined,
          website: form.website,
          elapsedMs: Date.now() - startedAt.current,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (data.errors) setErrors(data.errors);
        throw new Error(data.error ?? "Could not send the brief");
      }

      try {
        localStorage.removeItem(DRAFT_KEY);
      } catch {
        // ignore
      }
      setSent({ name: form.name.trim().split(" ")[0] });
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Could not send the brief",
        { description: "Try again, or message us on WhatsApp." }
      );
    } finally {
      setSending(false);
    }
  }

  // ── Sent ────────────────────────────────────────────────
  if (sent) {
    return (
      <section id="contact-form" className="py-20 lg:py-28">
        <div className="max-w-2xl mx-auto px-5 sm:px-6">
          <h1
            className="font-sarlotte font-bold text-foreground leading-[1.05]"
            style={{ fontSize: "clamp(2rem, 5vw, 3rem)" }}
          >
            Got it, {sent.name}.
          </h1>
          <p className="font-raleway text-muted-foreground leading-relaxed mt-5 max-w-[52ch]">
            Your brief is with our team. You will have costings, options and a
            delivery schedule by email within one working day.
          </p>

          <div className="mt-8 border-t border-border pt-7">
            <p className="font-raleway text-sm text-foreground mb-4">
              Need it faster, or want to talk it through?
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href="https://wa.me/2349125120020"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center bg-dsp-yellow text-background font-sarlotte font-semibold px-7 py-3.5 rounded-xl hover:brightness-110 transition-[filter]"
              >
                Message us on WhatsApp
              </a>
              <a
                href="tel:+2349125120020"
                className="inline-flex items-center justify-center border border-foreground/15 text-foreground font-sarlotte px-7 py-3.5 rounded-xl hover:bg-foreground hover:text-background transition-colors"
              >
                Call +234 912 512 0020
              </a>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // ── The brief ───────────────────────────────────────────
  return (
    <form id="contact-form" onSubmit={handleSubmit} noValidate>
      {/* The sentence is the hero: three answers, one line of thought */}
      <section className="pt-14 pb-12 lg:pt-20 lg:pb-16">
        <div className="max-w-5xl mx-auto px-5 sm:px-6 lg:px-8">
          {about && (
            <p className="font-raleway text-sm text-muted-foreground mb-6">
              Asking about <span className="text-foreground">{about}</span>.{" "}
              <button
                type="button"
                onClick={() => {
                  setAbout(null);
                  set("notes", "");
                }}
                className="underline underline-offset-4 hover:text-foreground"
              >
                Something else
              </button>
            </p>
          )}

          <h1
            className="font-sarlotte font-bold text-foreground leading-[1.25] tracking-[-0.01em]"
            style={{ fontSize: "clamp(1.75rem, 4.6vw, 3.1rem)" }}
          >
            <span className="inline-flex flex-wrap items-baseline gap-x-3 gap-y-2">
              <span>We need</span>

              <label htmlFor="need" className="sr-only">
                What you need
              </label>
              <span className="relative inline-flex items-baseline">
              <select
                id="need"
                data-field="need"
                value={form.need}
                onChange={(e) => set("need", e.target.value)}
                className={`${FILL} font-sarlotte cursor-pointer appearance-none pr-1`}
                style={{ fontSize: "inherit" }}
              >
                {NEEDS.map((option) => (
                  <option key={option.value} value={option.value} className="text-black">
                    {option.label}
                  </option>
                ))}
              </select>
                {/* The underline says "editable"; this says "there are options" */}
                <span
                  aria-hidden
                  className="pointer-events-none ml-1 self-center text-dsp-yellow text-[0.4em] leading-none"
                >
                  ▾
                </span>
              </span>

              <span>for</span>

              <label htmlFor="headcount" className="sr-only">
                How many people
              </label>
              <input
                id="headcount"
                data-field="headcount"
                value={form.headcount}
                onChange={(e) => set("headcount", e.target.value.replace(/[^\d]/g, ""))}
                inputMode="numeric"
                placeholder="120"
                aria-invalid={Boolean(errors.headcount)}
                className={`${FILL} w-[4.5ch] text-center placeholder:text-muted-foreground/40`}
                style={{ fontSize: "inherit" }}
              />

              <span>people,</span>

              <span className="inline-flex items-baseline gap-x-3">
                <span>by</span>
                <label htmlFor="neededBy" className="sr-only">
                  Date you need them
                </label>
                <input
                  id="neededBy"
                  data-field="neededBy"
                  type="date"
                  value={form.neededBy}
                  onChange={(e) => set("neededBy", e.target.value)}
                  // color-scheme keeps the native picker icon visible in both themes
                  className={`${FILL} cursor-pointer [color-scheme:light] dark:[color-scheme:dark]`}
                  style={{ fontSize: "inherit" }}
                />
              </span>
            </span>
          </h1>

          {errors.headcount && (
            <p role="alert" className="font-raleway text-sm text-dsp-red mt-4">
              {errors.headcount}
            </p>
          )}

          <p className="font-raleway text-base text-muted-foreground mt-7 max-w-[54ch] leading-relaxed">
            Three answers and we can quote. An approximate number is fine — we
            will confirm everything before anything is produced.
          </p>

          <button
            type="button"
            onClick={() =>
              detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
            }
            className="font-raleway text-sm text-foreground underline decoration-dsp-yellow decoration-2 underline-offset-4 mt-6 hover:text-dsp-yellow transition-colors"
          >
            Where do we send it?
          </button>
        </div>
      </section>

      {/* Everything else is quiet */}
      <section ref={detailRef} className="py-12 lg:py-16 border-t border-border bg-coal-grey/30">
        <div className="max-w-5xl mx-auto px-5 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_18rem] gap-12 lg:gap-16 items-start">
            <div>
              <h2 className="font-sarlotte font-bold text-foreground text-2xl mb-7">
                Where do we send the quote?
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
                <Field
                  id="name"
                  label="Your name"
                  value={form.name}
                  onChange={(v) => set("name", v)}
                  error={errors.name}
                  autoComplete="name"
                  required
                />
                <Field
                  id="email"
                  label="Work email"
                  type="email"
                  value={form.email}
                  onChange={(v) => set("email", v)}
                  error={errors.email}
                  autoComplete="email"
                  required
                />
                <Field
                  id="company"
                  label="Company"
                  value={form.company}
                  onChange={(v) => set("company", v)}
                  autoComplete="organization"
                />
                <Field
                  id="phone"
                  label="Phone or WhatsApp"
                  type="tel"
                  value={form.phone}
                  onChange={(v) => set("phone", v)}
                  autoComplete="tel"
                  hint="Fastest way to reach you"
                />
              </div>

              <h2 className="font-sarlotte font-bold text-foreground text-2xl mt-12 mb-2">
                Anything that sharpens the quote
              </h2>
              <p className="font-raleway text-sm text-muted-foreground mb-7">
                All optional. Skip straight to sending if you would rather talk
                it through.
              </p>

              <Choice
                label="Indicative budget"
                name="budget"
                options={BUDGETS}
                value={form.budget}
                onChange={(v) => set("budget", v)}
              />

              <div className="mt-7">
                <Choice
                  label="Your logo on the items?"
                  name="branding"
                  options={[
                    { value: "yes", label: "Yes" },
                    { value: "no", label: "No" },
                    { value: "unsure", label: "Not sure" },
                  ]}
                  value={form.branding}
                  onChange={(v) => set("branding", v)}
                />
              </div>

              <div className="mt-7">
                <label
                  htmlFor="role"
                  className="block font-raleway text-sm text-foreground mb-2.5"
                >
                  Who signs this off?
                </label>
                <select
                  id="role"
                  value={form.role}
                  onChange={(e) => set("role", e.target.value)}
                  className="w-full sm:max-w-sm font-raleway text-sm bg-background border border-border rounded-lg px-3.5 py-3 text-foreground focus:outline-none focus:border-dsp-yellow transition-colors"
                >
                  <option value="">Prefer not to say</option>
                  {ROLES.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mt-7">
                <label
                  htmlFor="notes"
                  className="block font-raleway text-sm text-foreground mb-2.5"
                >
                  Anything else we should know
                </label>
                <textarea
                  id="notes"
                  value={form.notes}
                  onChange={(e) => set("notes", e.target.value)}
                  rows={4}
                  placeholder="The occasion, items you have in mind, where it all needs to go."
                  className="w-full font-raleway text-sm bg-background border border-border rounded-lg px-3.5 py-3 text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-dsp-yellow transition-colors leading-relaxed"
                />
              </div>

              {/* Bait for bots; people never see or tab to it. */}
              <div aria-hidden className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
                <label htmlFor="website">Website</label>
                <input
                  id="website"
                  name="website"
                  tabIndex={-1}
                  autoComplete="off"
                  value={form.website}
                  onChange={(e) => set("website", e.target.value)}
                />
              </div>

              <div className="mt-10 flex flex-col sm:flex-row sm:items-center gap-4">
                <button
                  type="submit"
                  disabled={sending}
                  className="inline-flex items-center justify-center gap-2 bg-dsp-yellow text-background font-sarlotte font-semibold text-base px-8 py-4 rounded-xl hover:brightness-110 transition-[filter] disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-dsp-yellow"
                >
                  {sending && <Loader2 className="size-4 animate-spin" />}
                  {sending ? "Sending the brief" : "Send the brief"}
                </button>
                <p className="font-raleway text-xs text-muted-foreground max-w-[34ch]">
                  You will hear back within one working day. We never share your
                  details.
                </p>
              </div>
            </div>

            {/* Reach us another way */}
            <aside className="lg:pt-2">
              <h2 className="font-sarlotte font-bold text-foreground text-xl mb-5">
                Rather talk?
              </h2>
              <ul className="font-raleway text-sm space-y-4">
                <li className="pb-4 border-b border-border">
                  <a
                    href="https://wa.me/2349125120020"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-foreground underline decoration-dsp-yellow decoration-2 underline-offset-4 hover:text-dsp-yellow transition-colors"
                  >
                    WhatsApp us
                  </a>
                  <span className="block text-muted-foreground mt-1">
                    Usually answered within the hour
                  </span>
                </li>
                <li className="pb-4 border-b border-border">
                  <a href="tel:+2349125120020" className="text-foreground hover:text-dsp-yellow transition-colors">
                    +234 912 512 0020
                  </a>
                  <span className="block text-muted-foreground mt-1">
                    Monday to Friday, 9am to 5pm
                  </span>
                </li>
                <li className="pb-4 border-b border-border">
                  <a
                    href="mailto:support@de-signplus.com"
                    className="text-foreground hover:text-dsp-yellow transition-colors break-all"
                  >
                    support@de-signplus.com
                  </a>
                </li>
                <li>
                  <span className="text-foreground">Victoria Island, Lagos</span>
                  <span className="block text-muted-foreground mt-1">
                    Visits by appointment
                  </span>
                </li>
              </ul>
            </aside>
          </div>
        </div>
      </section>
    </form>
  );
}

// ── Small parts ───────────────────────────────────────────

function Field({
  id,
  label,
  value,
  onChange,
  error,
  hint,
  type = "text",
  autoComplete,
  required,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  hint?: string;
  type?: string;
  autoComplete?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label htmlFor={id} className="block font-raleway text-sm text-foreground mb-2.5">
        {label}
        {!required && <span className="text-muted-foreground"> (optional)</span>}
      </label>
      <input
        id={id}
        data-field={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        className={`w-full font-raleway text-sm bg-background border rounded-lg px-3.5 py-3 text-foreground focus:outline-none transition-colors ${
          error ? "border-dsp-red" : "border-border focus:border-dsp-yellow"
        }`}
      />
      {error ? (
        <p id={`${id}-error`} role="alert" className="font-raleway text-xs text-dsp-red mt-2">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="font-raleway text-xs text-muted-foreground mt-2">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

function Choice({
  label,
  name,
  options,
  value,
  onChange,
}: {
  label: string;
  name: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <fieldset>
      <legend className="font-raleway text-sm text-foreground mb-2.5">
        {label}
      </legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const active = value === option.value;
          return (
            <label
              key={option.value}
              className={`cursor-pointer font-raleway text-sm px-4 py-2.5 rounded-lg border transition-colors ${
                active
                  ? "border-dsp-yellow bg-dsp-yellow/10 text-foreground"
                  : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
              }`}
            >
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={active}
                onChange={() => onChange(option.value)}
                className="sr-only"
              />
              {option.label}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
