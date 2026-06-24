export const VALID_STATUSES = ["new", "reviewing", "confirmed", "cancelled"] as const;
export type OrderStatus = (typeof VALID_STATUSES)[number];
