import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { getDb } from "./db";
import { User } from "./types";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "shajara-secure-jwt-secret-key-yetti-pusht-2026"
);

export const TOKEN_COOKIE_NAME = "shajara_token";

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function signUserToken(user: User): Promise<string> {
  return new SignJWT({
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    full_name: user.full_name,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(JWT_SECRET);
}

export async function verifyUserToken(token: string): Promise<User | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return {
      id: Number(payload.id),
      username: String(payload.username),
      email: String(payload.email),
      full_name: String(payload.full_name),
      role: (payload.role as "admin" | "member") || "member",
      created_at: "",
    };
  } catch {
    return null;
  }
}

export async function getSessionUser(req?: NextRequest): Promise<User | null> {
  let token: string | undefined;

  if (req) {
    token = req.cookies.get(TOKEN_COOKIE_NAME)?.value;
    if (!token) {
      const authHeader = req.headers.get("authorization");
      if (authHeader?.startsWith("Bearer ")) {
        token = authHeader.substring(7);
      }
    }
  } else {
    const cookieStore = await cookies();
    token = cookieStore.get(TOKEN_COOKIE_NAME)?.value;
  }

  if (!token) return null;

  const verified = await verifyUserToken(token);
  if (!verified) return null;

  // Confirm user still exists in DB
  const db = getDb();
  const dbUser = db.prepare("SELECT id, username, email, full_name, role, created_at FROM users WHERE id = ?").get(verified.id) as User | undefined;
  
  return dbUser || null;
}
