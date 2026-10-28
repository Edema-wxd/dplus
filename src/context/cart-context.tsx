"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
  ReactNode,
} from "react";
import { lineTotals, type SelectedBranding } from "@/lib/branding-pricing";

/** A logo or graphic the customer uploaded for the printers. */
export type ArtworkFile = { url: string; key: string; name: string };

export type CartItem = {
  id: string;
  simpleCode: string;
  fullCode: string;
  productName: string;
  image: string | null;
  variantLabel: string | null;
  brandingLabel: string | null;
  quantity: number;
  /** Product price per unit, excluding branding. */
  price: number;
  brandings?: SelectedBranding[];
  artwork?: ArtworkFile[];
  /** Instructions for the printers about this item. */
  note?: string;
};

export type CartItemPatch = Partial<Pick<CartItem, "artwork" | "note">>;

type CartContextValue = {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "id">) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  updateItem: (id: string, patch: CartItemPatch | ((item: CartItem) => CartItemPatch)) => void;
  clear: () => void;
  count: number;
  total: number;
};

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = "dplus_cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {
      // ignore corrupted storage
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, loaded]);

  const addItem = (item: Omit<CartItem, "id">) => {
    setItems((prev) => {
      const key = lineKey(item);
      const existing = prev.find((i) => lineKey(i) === key);
      if (existing) {
        return prev.map((i) =>
          i.id === existing.id
            ? { ...i, quantity: i.quantity + item.quantity }
            : i
        );
      }
      return [...prev, { ...item, id: `${key}|${Date.now()}` }];
    });
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const updateQuantity = (id: string, quantity: number) => {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, quantity: Math.max(1, quantity) } : i))
    );
  };

  const updateItem = (
    id: string,
    patch: CartItemPatch | ((item: CartItem) => CartItemPatch)
  ) => {
    setItems((prev) =>
      prev.map((i) =>
        i.id === id ? { ...i, ...(typeof patch === "function" ? patch(i) : patch) } : i
      )
    );
  };

  const clear = () => setItems([]);

  const count = useMemo(
    () => items.reduce((sum, i) => sum + i.quantity, 0),
    [items]
  );

  const total = useMemo(
    () => items.reduce((sum, i) => sum + lineTotals(i).total, 0),
    [items]
  );

  return (
    <CartContext.Provider
      value={{ items, addItem, removeItem, updateQuantity, updateItem, clear, count, total }}
    >
      {children}
    </CartContext.Provider>
  );
}

/** Same product, variant and print setup = same basket line. */
function lineKey(item: Omit<CartItem, "id">) {
  const brandings = (item.brandings ?? [])
    .map((b) => `${b.positionCode}:${b.brandingCode}:${b.colours ?? ""}`)
    .sort()
    .join(",");
  return `${item.fullCode}|${item.variantLabel}|${item.brandingLabel}|${brandings}`;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
