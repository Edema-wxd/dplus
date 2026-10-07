/**
 * Scores an enquiry so whoever opens the inbox knows what to pick up first.
 *
 * The weights reflect how this business actually wins work: a firm date and a
 * real headcount matter more than a big budget band someone guessed at, and a
 * person who can sign beats a person gathering options.
 */

export type LeadInput = {
  headcount?: number | null;
  budget?: string | null;
  neededBy?: string | null;
  role?: string | null;
  company?: string | null;
  phone?: string | null;
};

export type LeadTier = "hot" | "warm" | "cold";

export type LeadScore = {
  score: number;
  tier: LeadTier;
  /** Plain-language reasons, shown in the notification email. */
  signals: string[];
};

const BUDGET_POINTS: Record<string, number> = {
  "under-1m": 6,
  "1-5m": 14,
  "5-15m": 20,
  "15-50m": 25,
  "50m-plus": 30,
  unsure: 8,
};

const ROLE_POINTS: Record<string, number> = {
  decide: 20,
  recommend: 12,
  researching: 4,
};

/** Working days between now and the date someone needs delivery. */
function daysUntil(date: string): number | null {
  const target = new Date(`${date}T00:00:00`);
  if (Number.isNaN(target.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

export function scoreLead(input: LeadInput): LeadScore {
  let score = 0;
  const signals: string[] = [];

  const headcount = input.headcount ?? null;
  if (headcount && headcount > 0) {
    if (headcount >= 500) {
      score += 30;
      signals.push(`${headcount} recipients — large run`);
    } else if (headcount >= 100) {
      score += 24;
      signals.push(`${headcount} recipients`);
    } else if (headcount >= 25) {
      score += 16;
      signals.push(`${headcount} recipients`);
    } else {
      score += 8;
      signals.push(`${headcount} recipients — small run`);
    }
  }

  if (input.budget) {
    score += BUDGET_POINTS[input.budget] ?? 0;
    if (input.budget === "unsure") signals.push("Budget not set yet");
  }

  if (input.neededBy) {
    const days = daysUntil(input.neededBy);
    if (days !== null) {
      if (days < 0) {
        signals.push("Date already passed — check it");
      } else if (days <= 21) {
        score += 20;
        signals.push(`Needed in ${days} days — tight turnaround`);
      } else if (days <= 60) {
        score += 15;
        signals.push(`Needed in ${days} days`);
      } else {
        score += 8;
        signals.push(`Needed in ${days} days — planning ahead`);
      }
    }
  }

  if (input.role) {
    score += ROLE_POINTS[input.role] ?? 0;
    if (input.role === "decide") signals.push("Holds the decision");
    if (input.role === "researching") signals.push("Gathering options");
  }

  if (input.company?.trim()) score += 5;
  if (input.phone?.trim()) {
    score += 5;
    signals.push("Left a phone number");
  }

  const capped = Math.min(100, score);
  const tier: LeadTier = capped >= 65 ? "hot" : capped >= 35 ? "warm" : "cold";

  return { score: capped, tier, signals };
}
