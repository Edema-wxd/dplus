import { config } from "dotenv";
config({ path: ".env.local" });

async function main() {
  const { amrodFetch } = await import("../src/lib/amrod/auth");

  const path = process.argv[2] ?? "/api/v1/Products/";
  const maxBytes = Number(process.argv[3] ?? 100_000);

  const res = await amrodFetch(path);
  console.log("status:", res.status, "content-length:", res.headers.get("content-length"));

  if (!res.body) return;

  const reader = res.body.getReader();
  let received = 0;
  const chunks: Uint8Array[] = [];
  while (received < maxBytes) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    received += value.length;
  }
  await reader.cancel();

  const text = Buffer.concat(chunks.map((c) => Buffer.from(c))).toString("utf-8");

  // find the end of the first complete top-level object in the array
  let depth = 0;
  let end = -1;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) {
        end = i;
        break;
      }
    }
  }

  const firstObj = end > 0 ? text.slice(text.indexOf("{"), end + 1) : text;
  console.log("first object:");
  console.log(JSON.stringify(JSON.parse(firstObj), null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
