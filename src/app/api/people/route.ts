import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { Person } from "@/lib/types";

export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    const currentUser = await getSessionUser(req);

    const query = `
      SELECT 
        p.*,
        u.full_name as created_by_name
      FROM people p
      LEFT JOIN users u ON p.created_by = u.id
      ORDER BY p.generation_level DESC, p.birth_year ASC, p.id ASC
    `;

    const rows = db.prepare(query).all() as (Person & { created_by_name: string })[];

    const people = rows.map((p) => ({
      ...p,
      is_alive: Boolean(p.is_alive),
      can_edit: currentUser
        ? currentUser.role === "admin" || currentUser.id === p.created_by
        : false,
    }));

    return NextResponse.json({ people, currentUser });
  } catch (error: unknown) {
    console.error("GET /api/people error:", error);
    return NextResponse.json({ error: "Ma'lumotlarni yuklashda xatolik yuz berdi" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const currentUser = await getSessionUser(req);
    if (!currentUser) {
      return NextResponse.json(
        { error: "Shajaraga ma'lumot kiritish uchun tizimga kiring" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const {
      first_name,
      last_name,
      patronymic,
      gender,
      birth_year,
      death_year,
      is_alive,
      birth_place,
      occupation,
      bio,
      father_id,
      mother_id,
      spouse_id,
      generation_level,
      photo_url,
    } = body;

    if (!first_name || !last_name) {
      return NextResponse.json(
        { error: "Ism va familiyani kiritish majburiy" },
        { status: 400 }
      );
    }

    const genLevel = Number(generation_level) || 1;
    if (genLevel < 1 || genLevel > 7) {
      return NextResponse.json(
        { error: "Ajdodlar bo'g'ini 1 dan 7 gacha bo'lishi kerak (Yetti Pusht)" },
        { status: 400 }
      );
    }

    const db = getDb();
    const insert = db.prepare(`
      INSERT INTO people (
        first_name, last_name, patronymic, gender, birth_year, death_year, is_alive,
        birth_place, occupation, bio, father_id, mother_id, spouse_id, generation_level,
        photo_url, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = insert.run(
      first_name.trim(),
      last_name.trim(),
      patronymic?.trim() || null,
      gender === "female" ? "female" : "male",
      birth_year ? Number(birth_year) : null,
      death_year ? Number(death_year) : null,
      is_alive === false || is_alive === 0 ? 0 : 1,
      birth_place?.trim() || null,
      occupation?.trim() || null,
      bio?.trim() || null,
      father_id ? Number(father_id) : null,
      mother_id ? Number(mother_id) : null,
      spouse_id ? Number(spouse_id) : null,
      genLevel,
      photo_url?.trim() || null,
      currentUser.id
    );

    const createdId = Number(result.lastInsertRowid);
    const createdPerson = db.prepare(`
      SELECT p.*, u.full_name as created_by_name
      FROM people p
      LEFT JOIN users u ON p.created_by = u.id
      WHERE p.id = ?
    `).get(createdId) as Person & { created_by_name: string };

    return NextResponse.json({
      person: {
        ...createdPerson,
        is_alive: Boolean(createdPerson.is_alive),
        can_edit: true,
      },
      message: "Shaxs shajaraga muvaffaqiyatli qo'shildi",
    }, { status: 201 });
  } catch (error: unknown) {
    console.error("POST /api/people error:", error);
    return NextResponse.json({ error: "Shaxsni saqlashda xatolik yuz berdi" }, { status: 500 });
  }
}
