import { fireEvent, render, screen } from "@testing-library/react";
import ProductDetailClient from "../ProductDetailClient";
import { CartProvider, useCart } from "@/context/cart-context";
import type { ProductDetail } from "@/lib/products";

jest.mock("next/image", () => ({
  __esModule: true,
  // eslint-disable-next-line @next/next/no-img-element
  default: (props: { src: string; alt: string }) => <img src={props.src} alt={props.alt} />,
}));
jest.mock("sonner", () => ({ toast: { success: jest.fn() } }));

const product: ProductDetail = {
  simpleCode: "TS",
  productName: "Classic Tee",
  description: "",
  brandCode: null,
  brandName: null,
  images: [],
  variants: [
    { fullCode: "TS-RED-L", codeColour: "RED", codeColourName: "Red", codeSize: "L", codeSizeName: "Large" },
    { fullCode: "TS-BLU-L", codeColour: "BLU", codeColourName: "Blue", codeSize: "L", codeSizeName: "Large" },
  ],
  brandings: [
    {
      positionCode: "FRONT",
      positionName: "Front",
      method: [{ brandingCode: "SP", brandingName: "Screen Print" }],
    },
  ],
  prices: { "TS-RED-L": 1000, "TS-BLU-L": 1200 },
  stock: { "TS-RED-L": 40, "TS-BLU-L": 0 },
  swatches: { RED: "#ff0000" },
  brandingPrices: {
    SP: [
      { minQuantity: 1, maxQuantity: 99, numberOfColours: 1, setup: 5000, price: 100 },
      { minQuantity: 1, maxQuantity: 99, numberOfColours: 2, setup: 8000, price: 150 },
    ],
  },
  inStock: true,
  categories: [],
};

function CartProbe() {
  const { items, total } = useCart();
  return <output data-testid="cart">{JSON.stringify({ items, total })}</output>;
}

function setup() {
  return render(
    <CartProvider>
      <ProductDetailClient product={product} />
      <CartProbe />
    </CartProvider>
  );
}

const ngn = (n: number) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(n);

beforeEach(() => localStorage.clear());

it("shows every colour with its price and stock", () => {
  setup();
  const red = screen.getByRole("button", { name: /Red/ });
  const blue = screen.getByRole("button", { name: /Blue/ });
  expect(red).toHaveTextContent(ngn(1000));
  expect(red).toHaveTextContent("40 in stock");
  expect(blue).toHaveTextContent(ngn(1200));
  expect(blue).toHaveTextContent("Out of stock");
});

it("lists print methods with costs and adds the branded item to the basket", () => {
  setup();
  expect(screen.getByText(`${ngn(100)}/unit + ${ngn(5000)} setup`)).toBeInTheDocument();

  fireEvent.click(screen.getByRole("radio", { name: /Screen Print/ }));
  fireEvent.change(screen.getByRole("combobox"), { target: { value: "2" } });
  fireEvent.change(screen.getByLabelText("Quantity"), { target: { value: "10" } });
  fireEvent.click(screen.getByRole("button", { name: "Add to Basket" }));

  const cart = JSON.parse(screen.getByTestId("cart").textContent!);
  expect(cart.items).toHaveLength(1);
  expect(cart.items[0]).toMatchObject({
    fullCode: "TS-RED-L",
    quantity: 10,
    price: 1000,
    brandings: [{ positionCode: "FRONT", brandingCode: "SP", colours: 2 }],
  });
  // (1000 + 150) × 10 + 8000 setup
  expect(cart.total).toBe(19500);
});
