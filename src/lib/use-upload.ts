"use client";

import { useCallback, useRef, useState } from "react";
import { UPLOAD_SLOTS, type UploadedFile, type UploadSlotName } from "@/lib/upload-slots";

/** Files per request: keeps each body small and lets progress show per batch. */
const BATCH_SIZE = 4;

type Options = {
  onClientUploadComplete?: (files: UploadedFile[]) => void;
  onUploadError?: (error: Error) => void;
};

async function send(slot: UploadSlotName, files: File[]): Promise<UploadedFile[]> {
  const body = new FormData();
  for (const file of files) body.append("files", file);
  const res = await fetch(`/api/uploads/${slot}`, { method: "POST", body });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(json?.error ?? `Upload failed (${res.status})`);
  return json as UploadedFile[];
}

/** Uploads files to /api/uploads/[slot]. Shaped like UploadThing's hook it replaced. */
export function useUpload(slot: UploadSlotName, { onClientUploadComplete, onUploadError }: Options = {}) {
  const [isUploading, setIsUploading] = useState(false);
  // Latest callbacks, so a re-render mid-upload doesn't call stale ones.
  const callbacks = useRef({ onClientUploadComplete, onUploadError });
  callbacks.current = { onClientUploadComplete, onUploadError };

  const startUpload = useCallback(
    async (files: File[]) => {
      const rules = UPLOAD_SLOTS[slot];
      const types: Record<string, string> = rules.types;
      const uploaded: UploadedFile[] = [];
      try {
        if (files.length > rules.maxFiles) throw new Error(`At most ${rules.maxFiles} files`);
        for (const file of files) {
          if (!Object.hasOwn(types, file.type)) throw new Error(`${file.name}: file type not allowed`);
          if (file.size > rules.maxBytes) {
            throw new Error(`${file.name} is larger than ${Math.round(rules.maxBytes / 1024 / 1024)} MB`);
          }
        }

        setIsUploading(true);
        for (let i = 0; i < files.length; i += BATCH_SIZE) {
          uploaded.push(...(await send(slot, files.slice(i, i + BATCH_SIZE))));
        }
        callbacks.current.onClientUploadComplete?.(uploaded);
        return uploaded;
      } catch (err) {
        // Batches that made it are still reported, so the caller can keep or
        // clean them up instead of leaving files nothing points at.
        if (uploaded.length) callbacks.current.onClientUploadComplete?.(uploaded);
        callbacks.current.onUploadError?.(err instanceof Error ? err : new Error(String(err)));
        return undefined;
      } finally {
        setIsUploading(false);
      }
    },
    [slot]
  );

  return { startUpload, isUploading };
}
