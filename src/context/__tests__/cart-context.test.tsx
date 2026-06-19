import { act, render, renderHook } from "@testing-library/react";
import { CartProvider, CartItem, useCart } from "../cart-context";

// ── Helper ────────────────────────────────────────────────────────────────────

function renderCart() {
  return renderHook(() => useCart(), { wrapper: CartProvider });
}

// ── Fixtures ──────────────────────────────────────────────────────────────────

const baseItem: Omit<CartItem, "id"> = {
  simpleCode: "SIMPLE",
  fullCode: "ABC-001",
  productName: "Test Product",
  image: null,
  variantLabel: null,
  brandingLabel: null,
  quantity: 1,
  price: 10,
};

// ── Setup ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  localStorage.clear();
});

// ── addItem ───────────────────────────────────────────────────────────────────

describe("addItem", () => {
  it("appends a new item and updates count and total", () => {
    const { result } = renderCart();

    act(() => {
      result.current.addItem({ ...baseItem, quantity: 2, price: 10 });
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.count).toBe(2);
    expect(result.current.total).toBe(20);
  });

  it("increments quantity when the same fullCode+variantLabel+brandingLabel key is added", () => {
    const { result } = renderCart();

    act(() => {
      result.current.addItem({ ...baseItem, quantity: 1 });
    });
    act(() => {
      result.current.addItem({ ...baseItem, quantity: 3 });
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].quantity).toBe(4);
  });

  it("creates separate entries for different variantLabels", () => {
    const { result } = renderCart();

    act(() => {
      result.current.addItem({ ...baseItem, variantLabel: "Red" });
    });
    act(() => {
      result.current.addItem({ ...baseItem, variantLabel: "Blue" });
    });

    expect(result.current.items).toHaveLength(2);
  });
});

// ── removeItem ────────────────────────────────────────────────────────────────

describe("removeItem", () => {
  it("removes only the item with the matching id", () => {
    const { result } = renderCart();

    act(() => {
      result.current.addItem({ ...baseItem, variantLabel: "Red" });
      result.current.addItem({ ...baseItem, variantLabel: "Blue" });
    });

    const idToRemove = result.current.items[0].id;

    act(() => {
      result.current.removeItem(idToRemove);
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].id).not.toBe(idToRemove);
  });

  it("leaves items unchanged when a non-existent id is given", () => {
    const { result } = renderCart();

    act(() => {
      result.current.addItem(baseItem);
    });

    act(() => {
      result.current.removeItem("does-not-exist");
    });

    expect(result.current.items).toHaveLength(1);
  });
});

// ── updateQuantity ────────────────────────────────────────────────────────────

describe("updateQuantity", () => {
  it("sets the correct quantity for an item", () => {
    const { result } = renderCart();

    act(() => {
      result.current.addItem(baseItem);
    });

    const id = result.current.items[0].id;

    act(() => {
      result.current.updateQuantity(id, 5);
    });

    expect(result.current.items[0].quantity).toBe(5);
  });

  it("clamps quantity to 1 when passed 0", () => {
    const { result } = renderCart();

    act(() => {
      result.current.addItem(baseItem);
    });

    const id = result.current.items[0].id;

    act(() => {
      result.current.updateQuantity(id, 0);
    });

    expect(result.current.items[0].quantity).toBe(1);
  });

  it("clamps quantity to 1 when passed a negative number", () => {
    const { result } = renderCart();

    act(() => {
      result.current.addItem(baseItem);
    });

    const id = result.current.items[0].id;

    act(() => {
      result.current.updateQuantity(id, -5);
    });

    expect(result.current.items[0].quantity).toBe(1);
  });
});

// ── clear ─────────────────────────────────────────────────────────────────────

describe("clear", () => {
  it("empties items, resets count and total to 0", () => {
    const { result } = renderCart();

    act(() => {
      result.current.addItem({ ...baseItem, quantity: 3, price: 10 });
    });

    act(() => {
      result.current.clear();
    });

    expect(result.current.items).toEqual([]);
    expect(result.current.count).toBe(0);
    expect(result.current.total).toBe(0);
  });
});

// ── localStorage ──────────────────────────────────────────────────────────────

describe("localStorage", () => {
  it("persists items to localStorage after adding an item", () => {
    const setItemSpy = jest.spyOn(Storage.prototype, "setItem");

    const { result } = renderCart();

    act(() => {
      result.current.addItem(baseItem);
    });

    const cartCalls = setItemSpy.mock.calls.filter(([key]) => key === "dplus_cart");
    const lastCall = cartCalls.at(-1)!;
    const stored = JSON.parse(lastCall[1]);

    expect(stored).toHaveLength(1);
    expect(stored[0]).toMatchObject({ fullCode: "ABC-001", quantity: 1 });

    setItemSpy.mockRestore();
  });

  it("hydrates items from localStorage on mount", () => {
    const storedItems: CartItem[] = [{ ...baseItem, id: "pre-existing-id" }];
    localStorage.setItem("dplus_cart", JSON.stringify(storedItems));

    const { result } = renderCart();

    expect(result.current.items).toEqual(storedItems);
    expect(result.current.count).toBe(1);
    expect(result.current.total).toBe(10);
  });

  it("starts with empty items when localStorage contains corrupted JSON", () => {
    localStorage.setItem("dplus_cart", "{{{not valid json");

    const { result } = renderCart();

    expect(result.current.items).toEqual([]);
  });
});

// ── useCart outside provider ───────────────────────────────────────────────────

describe("useCart", () => {
  it("throws when called outside CartProvider", () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    function BadComponent() {
      useCart();
      return null;
    }

    expect(() => render(<BadComponent />)).toThrow(
      "useCart must be used within CartProvider"
    );

    consoleSpy.mockRestore();
  });
});
