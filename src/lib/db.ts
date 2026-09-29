import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import bcrypt from "bcryptjs";

const dbDirectory = path.join(process.cwd(), "data");
if (!fs.existsSync(dbDirectory)) {
  fs.mkdirSync(dbDirectory, { recursive: true });
}

const dbPath = path.join(dbDirectory, "shajara.db");

// Singleton connection for Next.js hot reload
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
      father_id INTEGER REFERENCES people(id) ON DELETE SET NULL,
      mother_id INTEGER REFERENCES people(id) ON DELETE SET NULL,
      spouse_id INTEGER REFERENCES people(id) ON DELETE SET NULL,
      generation_level INTEGER NOT NULL DEFAULT 1,
      photo_url TEXT,
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

    // Seed a traditional 7-generation sample Uzbek lineage (Yetti Pusht)
    const insertPerson = db.prepare(`
      INSERT INTO people (
        id, first_name, last_name, patronymic, gender, birth_year, death_year, is_alive,
        birth_place, occupation, bio, father_id, mother_id, spouse_id, generation_level, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // Generation 7: Tovur bobo
    insertPerson.run(1, "Nazarboy", "Boybobo o'g'li", null, "male", 1810, 1885, 0, "Buxoro", "Chorvador va savdogar", "Yetti pusht boshidagi katta bobokalonimiz", null, null, null, 7, 1);
    
    // Generation 6: Chilla bobo
    insertPerson.run(2, "Ernazar", "Nazarboyev", "Nazarboy o'g'li", "male", 1842, 1918, 0, "Buxoro / Zarafshon", "Bog'bon va dehqon", "6-ajdodimiz, saxovatpesha inson bo'lgan", 1, null, null, 6, 1);

    // Generation 5: Bo'g'in bobo
    insertPerson.run(3, "Qodirqul", "Ernazarov", "Ernazar o'g'li", "male", 1875, 1943, 0, "Samarqand", "Mirza, xattot va mudarris", "5-ajdodimiz, arab va forsiy xatlarni bilgan", 2, null, null, 5, 1);

    // Generation 4: Katta bobo
    insertPerson.run(4, "Shermat", "Qodirov", "Qodirqul o'g'li", "male", 1908, 1982, 0, "Toshkent viloyati", "Usta duradgor va mahalla oqsoqoli", "4-ajdodimiz, 2-jahon urushi qatnashchisi", 3, null, null, 4, 1);

    // Generation 3: Bobo
    insertPerson.run(5, "Rahimjon", "Shermatov", "Shermat o'g'li", "male", 1938, 2012, 0, "Toshkent shahri", "O'qituvchi va ma'rifatparvar", "Sevimli bobomiz, fizika-matematika o'qituvchisi", 4, null, null, 3, 2);

    // Generation 2: Ota
    insertPerson.run(6, "Ulug'bek", "Shermatov", "Rahimjon o'g'li", "male", 1968, null, 1, "Toshkent shahri", "Muhandis-energetik", "Otamiz, oila tayanchi", 5, null, null, 2, 2);

    // Generation 1: O'zi (Self)
    insertPerson.run(7, "Javohir", "Shermatov", "Ulug'bek o'g'li", "male", 1998, null, 1, "Toshkent shahri", "Dasturchi / IT mutaxassisi", "Shajarani raqamlashtirish tashabbuskori", 6, null, null, 1, 2);

    // Brother & Sister (Generation 1 branches)
    insertPerson.run(8, "Shahnoza", "Shermatova", "Ulug'bek qizi", "female", 2002, null, 1, "Toshkent shahri", "Shifokor-pediatr", "Singlisi", 6, null, null, 1, 2);
    insertPerson.run(9, "Temur", "Shermatov", "Ulug'bek o'g'li", "male", 2006, null, 1, "Toshkent shahri", "Talaba", "Ukasi", 6, null, null, 1, 2);
  }
}
