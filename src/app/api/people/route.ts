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

    const rows = db.prepare(query).all() as (Person & { created_by_name: string; photos?: string })[];

    const people = rows.map((p) => {
      let parsedPhotos: string[] = [];
      if (p.photos) {
        try {
          parsedPhotos = JSON.parse(p.photos);
        } catch {
          parsedPhotos = [];
        }
      } else if (p.photo_url) {
        parsedPhotos = [p.photo_url];
      }

      return {
        ...p,
        photos: parsedPhotos,
        is_alive: Boolean(p.is_alive),
        branch_side: p.branch_side || "direct",
        can_edit: currentUser
          ? currentUser.role === "admin" || currentUser.id === p.created_by
          : false,
      };
    });

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
      phone,
      father_id,
      mother_id,
      spouse_id,
      generation_level,
      branch_side,
      relationship_title,
      photo_url,
      photos,
    } = body;

    if (!first_name || !last_name) {
      return NextResponse.json(
        { error: "Ism va familiyani kiritish majburiy" },
        { status: 400 }
      );
    }

    const genLevel = generation_level !== undefined ? Number(generation_level) : 1;
    const side = ["father", "mother", "direct", "in_laws"].includes(branch_side) ? branch_side : "direct";

    const photosJson = photos && Array.isArray(photos) ? JSON.stringify(photos) : (photo_url ? JSON.stringify([photo_url]) : null);

    const db = getDb();
    const insert = db.prepare(`
      INSERT INTO people (
        first_name, last_name, patronymic, gender, birth_year, death_year, is_alive,
        birth_place, occupation, bio, phone, father_id, mother_id, spouse_id, generation_level,
        branch_side, relationship_title, photo_url, photos, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      phone?.trim() || null,
      father_id ? Number(father_id) : null,
      mother_id ? Number(mother_id) : null,
      spouse_id ? Number(spouse_id) : null,
      genLevel,
      side,
      relationship_title?.trim() || null,
      photo_url?.trim() || null,
      photosJson,
      currentUser.id
    );

    const createdId = Number(result.lastInsertRowid);
    const createdPerson = db.prepare(`
      SELECT p.*, u.full_name as created_by_name
      FROM people p
      LEFT JOIN users u ON p.created_by = u.id
      WHERE p.id = ?
    `).get(createdId) as Person & { created_by_name: string; photos?: string };

    let parsedPhotos: string[] = [];
    if (createdPerson.photos) {
      try { parsedPhotos = JSON.parse(createdPerson.photos); } catch { parsedPhotos = []; }
    }

    return NextResponse.json({
      person: {
        ...createdPerson,
        photos: parsedPhotos,
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
