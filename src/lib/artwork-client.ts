import type { ArtworkFile } from "@/context/cart-context";

/**
 * Asks the server to delete artwork the shopper removed. Best effort: a file
 * left behind only costs storage, so failures are logged, not shown.
 */
export function discardArtwork(files: ArtworkFile[] | undefined) {
  const deletable = (files ?? []).filter((f) => f.deleteToken);
  if (!deletable.length) return;

  fetch("/api/artwork/delete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ files: deletable.map((f) => ({ key: f.key, token: f.deleteToken })) }),
    // Lets the request finish if the shopper navigates away straight after.
    keepalive: true,
  }).catch((err) => console.error("[artwork] delete failed:", err));
}
