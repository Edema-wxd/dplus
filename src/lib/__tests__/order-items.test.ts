import { parseOrderItem } from "@/lib/order-items";
import { isUploadedFileUrl } from "@/lib/upload-slots";

const UPLOAD = "https://www.de-signplus.com/uploads/customerArtwork/2026/11/0f8e3a52-5d0b-4a8e-9a0c-2b8f5c1d7e44.png";

const base = {
  simpleCode: "ABC",
  fullCode: "ABC-RED",
  productName: "T-Shirt",
  image: null,
  variantLabel: "Red",
  brandingLabel: null,
  quantity: 2,
  price: 5000,
};

const branding = {
  positionCode: "FRONT",
  positionName: "Front",
  brandingCode: "SP",
  brandingName: "Screen Print",
  colours: 1,
  breaks: [{ minQuantity: 1, maxQuantity: -1, numberOfColours: 1, setup: 100, price: 10 }],
};

describe("isUploadedFileUrl", () => {
  it.each([
    [UPLOAD, true],
    [UPLOAD.replace("https:", "http:"), false],
    ["https://evil.com/uploads/customerArtwork/2026/11/0f8e3a52-5d0b-4a8e-9a0c-2b8f5c1d7e44.png", false],
    ["https://www.de-signplus.com.evil.com/uploads/x.png", false],
    ["https://www.de-signplus.com/uploads/../admin", false],
    ["https://abc123.ufs.sh/f/key", false],
    ["not a url", false],
  ])("%s -> %s", (url, ok) => {
    expect(isUploadedFileUrl(url)).toBe(ok);
  });
});

describe("parseOrderItem", () => {
  it("accepts a plain item", () => {
    expect(parseOrderItem(base)).toEqual(base);
  });

  it("keeps branding, artwork and a trimmed note", () => {
    const item = parseOrderItem({
      ...base,
      brandings: [branding],
      artwork: [{ url: UPLOAD, key: "k1", name: "logo.png" }],
      note: "  Centre it, 8cm wide  ",
    });
    expect(item).toMatchObject({
      brandings: [branding],
      artwork: [{ url: UPLOAD, key: "k1", name: "logo.png" }],
      note: "Centre it, 8cm wide",
    });
  });

  it("drops unknown fields", () => {
    const item = parseOrderItem({ ...base, injected: "<script>" });
    expect(item).not.toHaveProperty("injected");
  });

  it.each([
    [{ ...base, quantity: 0 }, /quantity/],
    [{ ...base, quantity: 1.5 }, /quantity/],
    [{ ...base, price: 0 }, /price/],
    [{ ...base, fullCode: "" }, /code/],
    [{ ...base, artwork: [{ url: "https://evil.com/x.png", key: "k", name: "x" }] }, /artwork/],
    [{ ...base, artwork: Array(6).fill({ url: UPLOAD, key: "k", name: "x" }) }, /at most/],
    [{ ...base, note: "x".repeat(1001) }, /note/],
    [{ ...base, note: 5 }, /note/],
    [{ ...base, brandings: [{ ...branding, breaks: [{ price: "free" }] }] }, /branding/],
    ["nope", /object/],
  ])("rejects %#", (raw, message) => {
    const result = parseOrderItem(raw);
    expect(typeof result).toBe("string");
    expect(result).toMatch(message);
  });
});
