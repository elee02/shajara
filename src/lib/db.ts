import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import bcrypt from "bcryptjs";

const dbDirectory = path.join(process.cwd(), "data");
if (!fs.existsSync(dbDirectory)) {
  fs.mkdirSync(dbDirectory, { recursive: true });
}

export const uploadsDirectory = path.join(dbDirectory, "uploads");
if (!fs.existsSync(uploadsDirectory)) {
  fs.mkdirSync(uploadsDirectory, { recursive: true });
}

const dbPath = path.join(dbDirectory, "shajara.db");

declare global {
  // eslint-disable-next-line no-var
  var _sqliteDb: Database.Database | undefined;
}

export function getDb(): Database.Database {
  if (!global._sqliteDb) {
    const db = new Database(dbPath);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
    initSchema(db);
    runMigrations(db);
    global._sqliteDb = db;
  }
  return global._sqliteDb;
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL,
      role TEXT CHECK(role IN ('admin', 'member')) NOT NULL DEFAULT 'member',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS people (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      patronymic TEXT,
      gender TEXT CHECK(gender IN ('male', 'female')) NOT NULL DEFAULT 'male',
      birth_year INTEGER,
      death_year INTEGER,
      is_alive INTEGER DEFAULT 1,
      birth_place TEXT,
      occupation TEXT,
      bio TEXT,
      phone TEXT,
      father_id INTEGER REFERENCES people(id) ON DELETE SET NULL,
      mother_id INTEGER REFERENCES people(id) ON DELETE SET NULL,
      spouse_id INTEGER REFERENCES people(id) ON DELETE SET NULL,
      generation_level INTEGER NOT NULL DEFAULT 1,
      branch_side TEXT CHECK(branch_side IN ('father', 'mother', 'direct', 'in_laws')) NOT NULL DEFAULT 'direct',
      relationship_title TEXT,
      photo_url TEXT,
      photos TEXT,
      created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_people_father ON people(father_id);
    CREATE INDEX IF NOT EXISTS idx_people_mother ON people(mother_id);
    CREATE INDEX IF NOT EXISTS idx_people_created_by ON people(created_by);
  `);

  seedInitialData(db);
}

function runMigrations(db: Database.Database) {
  const tableInfo = db.prepare("PRAGMA table_info(people)").all() as { name: string }[];
  const columnNames = new Set(tableInfo.map((c) => c.name));

  if (!columnNames.has("phone")) db.exec("ALTER TABLE people ADD COLUMN phone TEXT;");
  if (!columnNames.has("branch_side")) db.exec("ALTER TABLE people ADD COLUMN branch_side TEXT DEFAULT 'direct';");
  if (!columnNames.has("relationship_title")) db.exec("ALTER TABLE people ADD COLUMN relationship_title TEXT;");
  if (!columnNames.has("photos")) db.exec("ALTER TABLE people ADD COLUMN photos TEXT;");

  // Ensure reciprocal relations and mother links in seed data
  try {
    db.prepare("UPDATE people SET mother_id = 10 WHERE id IN (6, 11, 12) AND mother_id IS NULL").run();
    db.prepare("UPDATE people SET spouse_id = 15 WHERE id = 6 AND spouse_id IS NULL").run();
    db.prepare("UPDATE people SET spouse_id = 6 WHERE id = 15 AND spouse_id IS NULL").run();
    db.prepare("UPDATE people SET spouse_id = 10 WHERE id = 5 AND spouse_id IS NULL").run();
    db.prepare("UPDATE people SET spouse_id = 5 WHERE id = 10 AND spouse_id IS NULL").run();
    db.prepare("UPDATE people SET spouse_id = 14 WHERE id = 13 AND spouse_id IS NULL").run();
    db.prepare("UPDATE people SET spouse_id = 13 WHERE id = 14 AND spouse_id IS NULL").run();
  } catch {
    // Ignore if rows don't exist yet
  }
}

function seedInitialData(db: Database.Database) {
  const userCount = db.prepare("SELECT COUNT(*) as count FROM users").get() as { count: number };
  if (userCount.count === 0) {
    const salt = bcrypt.genSaltSync(10);
    const adminPasswordHash = bcrypt.hashSync("admin123", salt);
    const memberPasswordHash = bcrypt.hashSync("user123", salt);

    const insertUser = db.prepare(`
      INSERT INTO users (username, email, password_hash, full_name, role)
      VALUES (?, ?, ?, ?, ?)
    `);

    insertUser.run("admin", "admin@shajara.uz", adminPasswordHash, "Boshqaruvchi (Admin)", "admin");
    insertUser.run("elyor", "elyor@shajara.uz", memberPasswordHash, "Elyor Rasulov", "member");
    insertUser.run("rustam", "rustam@shajara.uz", memberPasswordHash, "Rustam Alimov", "member");

    const insertPerson = db.prepare(`
      INSERT INTO people (
        id, first_name, last_name, patronymic, gender, birth_year, death_year, is_alive,
        birth_place, occupation, bio, phone, father_id, mother_id, spouse_id, generation_level,
        branch_side, relationship_title, photo_url, photos, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // --- PATERNAL LINE (Ota tomon) ---
    // 7. Tovur bobo
    insertPerson.run(1, "Nazarboy", "Boybobo o'g'li", null, "male", 1810, 1885, 0, "Buxoro", "Chorvador va savdogar", "Yetti pusht boshidagi katta bobokalonimiz", null, null, null, null, 7, "father", "7-Ajdod (Tovur bobo)", null, null, 1);
    // 6. Chilla bobo
    insertPerson.run(2, "Ernazar", "Nazarboyev", "Nazarboy o'g'li", "male", 1842, 1918, 0, "Buxoro", "Bog'bon va dehqon", "6-ajdodimiz", null, 1, null, null, 6, "father", "6-Ajdod (Chilla bobo)", null, null, 1);
    // 5. Bo'g'in bobo
    insertPerson.run(3, "Qodirqul", "Ernazarov", "Ernazar o'g'li", "male", 1875, 1943, 0, "Samarqand", "Mirza va mudarris", "5-ajdodimiz", null, 2, null, null, 5, "father", "5-Ajdod (Bo'g'in bobo)", null, null, 1);
    // 4. Katta bobo
    insertPerson.run(4, "Shermat", "Qodirov", "Qodirqul o'g'li", "male", 1908, 1982, 0, "Toshkent", "Usta duradgor", "4-ajdodimiz", null, 3, null, null, 4, "father", "Katta bobo", null, null, 1);
    // 3. Ota bobo & Ota buvi
    insertPerson.run(5, "Rahimjon", "Shermatov", "Shermat o'g'li", "male", 1938, 2012, 0, "Toshkent", "O'qituvchi", "Ota tomon sevimli bobomiz", null, 4, null, 10, 3, "father", "Ota bobo", null, null, 2);
    insertPerson.run(10, "Saida", "Shermatova", "Karim qizi", "female", 1942, 2018, 0, "Toshkent", "Shifokor", "Ota tomon buvimiz, mehridaryo ayol", null, null, null, 5, 3, "father", "Ota buvi", null, null, 2);
    // 2. Ota va Amaki, Amma
    insertPerson.run(6, "Ulug'bek", "Shermatov", "Rahimjon o'g'li", "male", 1968, null, 1, "Toshkent", "Muhandis-energetik", "Otamiz, oila ustuni", "+998 90 123 45 67", 5, 10, 15, 2, "father", "Ota", null, null, 2);
    insertPerson.run(11, "Anvar", "Shermatov", "Rahimjon o'g'li", "male", 1972, null, 1, "Toshkent", "Tadbirkor", "Katta amakim", "+998 97 765 43 21", 5, 10, null, 2, "father", "Amaki", null, null, 2);
    insertPerson.run(12, "Zulayho", "Rahimova", "Rahimjon qizi", "female", 1975, null, 1, "Toshkent", "Iqtisodchi", "Katta ammam", "+998 93 321 00 11", 5, 10, null, 2, "father", "Amma", null, null, 2);

    // --- MATERNAL LINE (Ona tomon) ---
    // 3. Ona bobo & Ona buvi
    insertPerson.run(13, "Akrom", "Mansurov", "Mansur o'g'li", "male", 1939, 2015, 0, "Farg'ona", "Agronom olim", "Ona tomon bobomiz (Katta ota)", null, null, null, 14, 3, "mother", "Ona bobo (Katta ota)", null, null, 2);
    insertPerson.run(14, "Muxabbat", "Mansurova", "Salim qizi", "female", 1944, null, 1, "Farg'ona", "Pedagog", "Ona tomon buvimiz (Katta ona)", "+998 90 999 88 77", null, null, 13, 3, "mother", "Ona buvi (Katta ona)", null, null, 2);
    // 2. Ona, Tog'a, Xola
    insertPerson.run(15, "Dildora", "Shermatova (Mansurova)", "Akrom qizi", "female", 1971, null, 1, "Toshkent", "Musiqa fani o'qituvchisi", "Onamiz, mehribon va oqila", "+998 90 234 56 78", 13, 14, 6, 2, "mother", "Ona", null, null, 2);
    insertPerson.run(16, "Nodir", "Mansurov", "Akrom o'g'li", "male", 1974, null, 1, "Farg'ona", "Jurnalist", "Katta tog'amiz", "+998 91 111 22 33", 13, 14, null, 2, "mother", "Tog'a", null, null, 2);
    insertPerson.run(17, "Gulnoza", "Qosimova", "Akrom qizi", "female", 1978, null, 1, "Toshkent", "Dizayner", "Kichik xolamiz", "+998 94 444 55 66", 13, 14, null, 2, "mother", "Xola", null, null, 2);

    // --- SELF & SIBLINGS & PEERS (1-bo'g'in) ---
    insertPerson.run(7, "Javohir", "Shermatov", "Ulug'bek o'g'li", "male", 1998, null, 1, "Toshkent", "Dasturchi / IT", "O'zim - shajarani yurituvchi", "+998 90 555 44 33", 6, 15, null, 1, "direct", "O'zi", null, null, 2);
    insertPerson.run(8, "Shahnoza", "Shermatova", "Ulug'bek qizi", "female", 2002, null, 1, "Toshkent", "Shifokor-pediatr", "Singlim", "+998 90 666 55 44", 6, 15, null, 1, "direct", "Singil", null, null, 2);
    insertPerson.run(9, "Temur", "Shermatov", "Ulug'bek o'g'li", "male", 2006, null, 1, "Toshkent", "Talaba", "Ukam", "+998 90 777 66 55", 6, 15, null, 1, "direct", "Uka", null, null, 2);

    // Cousins
    insertPerson.run(18, "Sardor", "Shermatov", "Anvar o'g'li", "male", 2000, null, 1, "Toshkent", "Muhandis", "Amakim Anvarning o'g'li (Amakivachcha)", "+998 90 888 77 66", 11, null, null, 1, "father", "Amakivachcha", null, null, 2);
    insertPerson.run(19, "Madina", "Mansurova", "Nodir qizi", "female", 2003, null, 1, "Farg'ona", "Tarjimon", "Tog'am Nodirning qizi (Tog'avachcha)", "+998 91 222 33 44", 16, null, null, 1, "mother", "Tog'avachcha", null, null, 2);

    // Descendants
    insertPerson.run(20, "Azizbek", "Shermatov", "Javohir o'g'li", "male", 2024, null, 1, "Toshkent", null, "Katta o'g'lim", null, 7, null, null, 0, "direct", "O'g'il (Farzand)", null, null, 2);
  }
}
