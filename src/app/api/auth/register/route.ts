import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { hashPassword, signUserToken, TOKEN_COOKIE_NAME } from "@/lib/auth";
import { User } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const { username, email, password, full_name } = await req.json();

    if (!username || !email || !password || !full_name) {
      return NextResponse.json(
        { error: "Barcha maydonlarni to'ldirish shart (All fields required)" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Parol kamida 6 belgidan iborat bo'lishi kerak" },
        { status: 400 }
      );
    }

    const db = getDb();

    // Check if username or email exists
    const existing = db
      .prepare("SELECT id FROM users WHERE username = ? OR email = ?")
      .get(username.trim().toLowerCase(), email.trim().toLowerCase());

    if (existing) {
      return NextResponse.json(
        { error: "Bunday foydalanuvchi nomi yoki email allaqachon mavjud" },
        { status: 409 }
      );
    }

    const password_hash = await hashPassword(password);
    const result = db
      .prepare(
        "INSERT INTO users (username, email, password_hash, full_name, role) VALUES (?, ?, ?, ?, 'member')"
      )
      .run(username.trim().toLowerCase(), email.trim().toLowerCase(), password_hash, full_name.trim());

    const newUser: User = {
      id: Number(result.lastInsertRowid),
      username: username.trim().toLowerCase(),
      email: email.trim().toLowerCase(),
      full_name: full_name.trim(),
      role: "member",
      created_at: new Date().toISOString(),
    };

    const token = await signUserToken(newUser);

    const response = NextResponse.json({ user: newUser, message: "Muvaffaqiyatli ro'yxatdan o'tdingiz" });
    response.cookies.set(TOKEN_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60,
      path: "/",
    });

    return response;
  } catch (error: unknown) {
    console.error("Register error:", error);
    return NextResponse.json({ error: "Server xatosi ro'yxatdan o'tishda" }, { status: 500 });
  }
}
