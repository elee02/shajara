import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import { uploadsDirectory } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: "Fayl yuklash uchun tizimga kiring" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Rasm tanlanmadi" }, { status: 400 });
    }

    // Validate type
    const validMimes = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];
    if (!validMimes.includes(file.type)) {
      return NextResponse.json(
        { error: "Faqat rasm fayllari (JPEG, PNG, WEBP, GIF) qabul qilinadi" },
        { status: 400 }
      );
    }

    // Size limit: 10MB
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "Rasm hajmi 10MB dan oshmasligi kerak" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const ext = path.extname(file.name) || ".jpg";
    const cleanExt = [".jpg", ".jpeg", ".png", ".webp", ".gif"].includes(ext.toLowerCase()) ? ext.toLowerCase() : ".jpg";
    const randomSuffix = Math.random().toString(36).substring(2, 10);
    const filename = `photo_${Date.now()}_${randomSuffix}${cleanExt}`;

    const filePath = path.join(uploadsDirectory, filename);
    fs.writeFileSync(filePath, buffer);

    const fileUrl = `/api/uploads/${filename}`;
    return NextResponse.json({
      url: fileUrl,
      filename,
      message: "Rasm muvaffaqiyatli yuklandi",
    });
  } catch (error: unknown) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Rasm yuklashda xatolik yuz berdi" }, { status: 500 });
  }
}
