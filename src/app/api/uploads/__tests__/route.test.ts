/**
 * @jest-environment node
 */
import { mkdtempSync, readFileSync, rmSync } from "fs";
import os from "os";
import path from "path";

// Mock next/server so we don't need a real Next.js runtime in tests.
jest.mock("next/server", () => ({
  NextResponse: {
    json: jest.fn((body: unknown, init?: { status?: number }) => ({
      status: init?.status ?? 200,
      json: () => Promise.resolve(body),
    })),
  },
}));

jest.mock("@/lib/auth", () => ({ auth: jest.fn() }));
jest.mock("@/lib/redis", () => ({ redis: null }));

const uploadsDir = mkdtempSync(path.join(os.tmpdir(), "dplus-uploads-"));
process.env.UPLOADS_DIR = uploadsDir;

import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { POST } from "@/app/api/uploads/[slot]/route";
import { isUploadedFileUrl, type UploadedFile } from "@/lib/upload-slots";

const mockAuth = auth as jest.Mock;

function upload(slot: string, files: File[]) {
  const form = new FormData();
  for (const file of files) form.append("files", file);
  const req = { formData: () => Promise.resolve(form), headers: new Headers() };
  return POST(req as unknown as NextRequest, { params: Promise.resolve({ slot }) });
}

const png = (name = "logo.png", bytes = 10) => new File([new Uint8Array(bytes)], name, { type: "image/png" });

afterAll(() => rmSync(uploadsDir, { recursive: true, force: true }));
beforeEach(() => mockAuth.mockReset());

describe("POST /api/uploads/[slot]", () => {
  it("saves shopper artwork without a session and returns its URL", async () => {
    const res = await upload("customerArtwork", [png()]);
    expect(res.status).toBe(200);

    const [file] = (await res.json()) as UploadedFile[];
    expect(file).toMatchObject({ name: "logo.png", size: 10 });
    expect(file.key).toMatch(/^customerArtwork\/\d{4}\/\d{2}\/[0-9a-f-]{36}\.png$/);
    expect(isUploadedFileUrl(file.url)).toBe(true);
    expect(readFileSync(path.join(uploadsDir, file.key))).toHaveLength(10);
  });

  it("names files by type, not by what the browser sent", async () => {
    const res = await upload("customerArtwork", [png("shell.php")]);
    const [file] = (await res.json()) as UploadedFile[];
    expect(file.key).toMatch(/\.png$/);
  });

  it("rejects admin slots without a session", async () => {
    mockAuth.mockResolvedValue(null);
    const res = await upload("brochurePage", [png()]);
    expect(res.status).toBe(401);
  });

  it("accepts admin slots with a session", async () => {
    mockAuth.mockResolvedValue({ user: { email: "admin@example.com" } });
    const res = await upload("brochurePage", [png()]);
    expect(res.status).toBe(200);
  });

  it.each([
    ["an unknown slot", "nope", [png()], 404],
    ["no files", "customerArtwork", [], 400],
    ["a disallowed type", "customerArtwork", [new File(["<p>"], "x.html", { type: "text/html" })], 400],
    ["too many files", "customerArtwork", Array.from({ length: 6 }, () => png()), 400],
    ["a file over the size limit", "customerArtwork", [png("big.png", 16 * 1024 * 1024 + 1)], 400],
  ])("rejects %s", async (_label, slot, files, status) => {
    const res = await upload(slot, files);
    expect(res.status).toBe(status);
  });
});
