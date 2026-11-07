// What the contact brief (src/components/contact/BriefForm.tsx) offers. The
// values are stored in contact_submissions.details; the admin Contacts page
// shows the labels.

export const NEEDS = [
  { value: "hampers", label: "gift hampers" },
  { value: "branded-merchandise", label: "branded merchandise" },
  { value: "executive-gifts", label: "executive gifts" },
  { value: "workwear", label: "workwear & PPE" },
  { value: "packaging", label: "custom packaging" },
  { value: "not-sure", label: "something else" },
];

export const BUDGETS = [
  { value: "under-1m", label: "Under ₦1M" },
  { value: "1-5m", label: "₦1M – ₦5M" },
  { value: "5-15m", label: "₦5M – ₦15M" },
  { value: "15-50m", label: "₦15M – ₦50M" },
  { value: "50m-plus", label: "Over ₦50M" },
  { value: "unsure", label: "Not sure yet" },
];

export const ROLES = [
  { value: "decide", label: "I decide" },
  { value: "recommend", label: "I recommend, someone else signs" },
  { value: "researching", label: "I'm gathering options" },
];

/** The label for a stored value, or the value itself if it isn't one of ours. */
export function optionLabel(options: { value: string; label: string }[], value: string): string {
  return options.find((o) => o.value === value)?.label ?? value;
}
