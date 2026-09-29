import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { comparePassword, signUserToken, TOKEN_COOKIE_NAME } from "@/lib/auth";
import { User } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const { login, password } = await req.json();

    if (!login || !password) {
      return NextResponse.json(
        { error: "Login va parolni kiriting" },
        { status: 400 }
      );
    }

    const db = getDb();
    const cleanLogin = login.trim().toLowerCase();
    const userRow = db
      .prepare("SELECT * FROM users WHERE username = ? OR email = ?")
      .get(cleanLogin, cleanLogin) as (User & { password_hash: string }) | undefined;

    if (!userRow) {
      return NextResponse.json(
        { error: "Login yoki parol noto'g'ri" },
        { status: 401 }
      );
    }

    const isMatch = await comparePassword(password, userRow.password_hash);
    if (!isMatch) {
      return NextResponse.json(
        { error: "Login yoki parol noto'g'ri" },
        { status: 401 }
      );
    }

    const user: User = {
      id: userRow.id,
      username: userRow.username,
      email: userRow.email,
      full_name: userRow.full_name,
      role: userRow.role,
      created_at: userRow.created_at,
    };

    const token = await signUserToken(user);

    const response = NextResponse.json({ user, message: "Xush kelibsiz!" });
    response.cookies.set(TOKEN_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60,
      path: "/",
    });

    return response;
  } catch (error: unknown) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Server xatosi kirishda" }, { status: 500 });
  }
}
