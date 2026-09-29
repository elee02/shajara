import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { Person } from "@/lib/types";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const personId = Number(id);
    if (!personId) {
      return NextResponse.json({ error: "Noto'g'ri ID" }, { status: 400 });
    }

    const db = getDb();
    const currentUser = await getSessionUser(req);

    const person = db.prepare(`
      SELECT p.*, u.full_name as created_by_name
      FROM people p
      LEFT JOIN users u ON p.created_by = u.id
      WHERE p.id = ?
    `).get(personId) as (Person & { created_by_name: string; photos?: string }) | undefined;

    if (!person) {
      return NextResponse.json({ error: "Shaxs topilmadi" }, { status: 404 });
    }

    let parsedPhotos: string[] = [];
    if (person.photos) {
      try { parsedPhotos = JSON.parse(person.photos); } catch { parsedPhotos = []; }
    } else if (person.photo_url) {
      parsedPhotos = [person.photo_url];
    }

    return NextResponse.json({
      person: {
        ...person,
        photos: parsedPhotos,
        is_alive: Boolean(person.is_alive),
        can_edit: currentUser
          ? currentUser.role === "admin" || currentUser.id === person.created_by
          : false,
      },
    });
  } catch (error: unknown) {
    console.error("GET /api/people/[id] error:", error);
    return NextResponse.json({ error: "Server xatosi" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getSessionUser(req);
    if (!currentUser) {
      return NextResponse.json(
        { error: "Tahrirlash uchun tizimga kirish talab etiladi" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const personId = Number(id);
    const db = getDb();

    // Check existing person & creator ownership
    const existing = db.prepare("SELECT * FROM people WHERE id = ?").get(personId) as (Person & { photos?: string }) | undefined;
    if (!existing) {
      return NextResponse.json({ error: "Shaxs topilmadi" }, { status: 404 });
    }

    // STRICT GRANULAR PERMISSION: only creator or admin
    if (existing.created_by !== currentUser.id && currentUser.role !== "admin") {
      return NextResponse.json(
        {
          error: "Siz faqat o'zingiz kiritgan ma'lumotlarni tahrirlashingiz mumkin. Bu yozuv boshqa oila a'zosi tomonidan kiritilgan.",
        },
        { status: 403 }
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

    const genLevel = generation_level !== undefined ? Number(generation_level) : existing.generation_level;
    const side = branch_side !== undefined ? branch_side : existing.branch_side;

    let photosJson: string | null = existing.photos || null;
    if (photos !== undefined) {
      photosJson = Array.isArray(photos) ? JSON.stringify(photos) : null;
    } else if (photo_url !== undefined) {
      photosJson = photo_url ? JSON.stringify([photo_url]) : null;
    }

    db.prepare(`
      UPDATE people SET
        first_name = ?,
        last_name = ?,
        patronymic = ?,
        gender = ?,
        birth_year = ?,
        death_year = ?,
        is_alive = ?,
        birth_place = ?,
        occupation = ?,
        bio = ?,
        phone = ?,
        father_id = ?,
        mother_id = ?,
        spouse_id = ?,
        generation_level = ?,
        branch_side = ?,
        relationship_title = ?,
        photo_url = ?,
        photos = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      first_name ? first_name.trim() : existing.first_name,
      last_name ? last_name.trim() : existing.last_name,
      patronymic !== undefined ? (patronymic?.trim() || null) : existing.patronymic,
      gender === "female" ? "female" : "male",
      birth_year !== undefined ? (birth_year ? Number(birth_year) : null) : existing.birth_year,
      death_year !== undefined ? (death_year ? Number(death_year) : null) : existing.death_year,
      is_alive === false || is_alive === 0 ? 0 : 1,
      birth_place !== undefined ? (birth_place?.trim() || null) : existing.birth_place,
      occupation !== undefined ? (occupation?.trim() || null) : existing.occupation,
      bio !== undefined ? (bio?.trim() || null) : existing.bio,
      phone !== undefined ? (phone?.trim() || null) : existing.phone,
      father_id !== undefined ? (father_id ? Number(father_id) : null) : existing.father_id,
      mother_id !== undefined ? (mother_id ? Number(mother_id) : null) : existing.mother_id,
      spouse_id !== undefined ? (spouse_id ? Number(spouse_id) : null) : existing.spouse_id,
      genLevel,
      side,
      relationship_title !== undefined ? (relationship_title?.trim() || null) : existing.relationship_title,
      photo_url !== undefined ? (photo_url?.trim() || null) : existing.photo_url,
      photosJson,
      personId
    );

    const updated = db.prepare(`
      SELECT p.*, u.full_name as created_by_name
      FROM people p
      LEFT JOIN users u ON p.created_by = u.id
      WHERE p.id = ?
    `).get(personId) as Person & { created_by_name: string; photos?: string };

    let parsedPhotos: string[] = [];
    if (updated.photos) {
      try { parsedPhotos = JSON.parse(updated.photos); } catch { parsedPhotos = []; }
    }

    return NextResponse.json({
      person: {
        ...updated,
        photos: parsedPhotos,
        is_alive: Boolean(updated.is_alive),
        can_edit: true,
      },
      message: "Ma'lumotlar muvaffaqiyatli yangilandi",
    });
  } catch (error: unknown) {
    console.error("PUT /api/people/[id] error:", error);
    return NextResponse.json({ error: "O'zgartirishlarni saqlashda xatolik yuz berdi" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getSessionUser(req);
    if (!currentUser) {
      return NextResponse.json(
        { error: "O'chirish uchun tizimga kirish talab etiladi" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const personId = Number(id);
    const db = getDb();

    const existing = db.prepare("SELECT * FROM people WHERE id = ?").get(personId) as Person | undefined;
    if (!existing) {
      return NextResponse.json({ error: "Shaxs topilmadi" }, { status: 404 });
    }

    if (existing.created_by !== currentUser.id && currentUser.role !== "admin") {
      return NextResponse.json(
        {
          error: "Siz faqat o'zingiz kiritgan yozuvlarni o'chira olasiz.",
        },
        { status: 403 }
      );
    }

    db.prepare("DELETE FROM people WHERE id = ?").run(personId);

    return NextResponse.json({ message: "Yozuv muvaffaqiyatli o'chirildi" });
  } catch (error: unknown) {
    console.error("DELETE /api/people/[id] error:", error);
    return NextResponse.json({ error: "O'chirishda xatolik yuz berdi" }, { status: 500 });
  }
}
