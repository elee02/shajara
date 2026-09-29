import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import { uploadsDirectory } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;
    // Sanitize filename to prevent directory traversal
    const safeFilename = path.basename(filename);
    const filePath = path.join(uploadsDirectory, safeFilename);

    if (!fs.existsSync(filePath)) {
      return new NextResponse("Rasm topilmadi", { status: 404 });
    }

    const buffer = fs.readFileSync(filePath);
    const ext = path.extname(safeFilename).toLowerCase();

    let mimeType = "image/jpeg";
    if (ext === ".png") mimeType = "image/png";
    else if (ext === ".webp") mimeType = "image/webp";
    else if (ext === ".gif") mimeType = "image/gif";
    else if (ext === ".svg") mimeType = "image/svg+xml";

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": mimeType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error: unknown) {
    console.error("Serve upload error:", error);
    return new NextResponse("Server xatosi", { status: 500 });
  }
}
