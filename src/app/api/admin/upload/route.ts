import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { auth } from "@/lib/auth";
import { randomUUID } from "crypto";

function getS3Client() {
  const endpoint = process.env.STORAGE_ENDPOINT;
  const accessKeyId = process.env.STORAGE_ACCESS_KEY;
  const secretAccessKey = process.env.STORAGE_SECRET_KEY;
  const region = process.env.STORAGE_REGION ?? "auto";

  if (!endpoint || !accessKeyId || !secretAccessKey) {
    throw new Error("Storage credentials not configured");
  }

  return new S3Client({
    endpoint,
    region,
    credentials: { accessKeyId, secretAccessKey },
    forcePathStyle: true,
  });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const bucket = process.env.STORAGE_BUCKET;
  if (!bucket) {
    return NextResponse.json({ error: "STORAGE_BUCKET not configured" }, { status: 500 });
  }

  let s3: S3Client;
  try {
    s3 = getS3Client();
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Storage not configured" },
      { status: 500 }
    );
  }

  const formData = await req.formData();
  const file = formData.get("file");

  if (!file || typeof file === "string") {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: "File type not allowed" }, { status: 400 });
  }

  const maxBytes = 10 * 1024 * 1024; // 10 MB
  if (file.size > maxBytes) {
    return NextResponse.json({ error: "File exceeds 10 MB limit" }, { status: 400 });
  }

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const key = `portfolio/${randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: file.type,
      ContentLength: buffer.byteLength,
    })
  );

  const endpoint = process.env.STORAGE_ENDPOINT!.replace(/\/$/, "");
  const url = `${endpoint}/${bucket}/${key}`;

  return NextResponse.json({ url });
}
