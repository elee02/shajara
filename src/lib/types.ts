export type UserRole = "admin" | "member";

export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: UserRole;
  created_at: string;
}

export type Gender = "male" | "female";

export interface Person {
  id: number;
  first_name: string;
  last_name: string;
  patronymic?: string | null;
  gender: Gender;
  birth_year?: number | null;
  death_year?: number | null;
  is_alive: boolean;
  birth_place?: string | null;
  occupation?: string | null;
  bio?: string | null;
  father_id?: number | null;
  mother_id?: number | null;
  spouse_id?: number | null;
  generation_level: number; // 1: Self, 2: Father, 3: Grandfather, ..., 7: Ancestor
  photo_url?: string | null;
  created_by: number;
  created_by_name?: string;
  created_at: string;
  updated_at: string;
}

export interface TreeNode extends Person {
  children: TreeNode[];
  father?: Person | null;
  mother?: Person | null;
  spouse?: Person | null;
}

// 7 Generations Uzbek Tradition
export const UZBEK_GENERATIONS: Record<number, { title_uz: string; title_ru: string; desc: string }> = {
  1: { title_uz: "O'zi (Farzand)", title_ru: "Сам / Потомок", desc: "1-bo'g'in / Boshlang'ich shaxs" },
  2: { title_uz: "Ota", title_ru: "Отец", desc: "2-bo'g'in / Valida va Ota" },
  3: { title_uz: "Bobo", title_ru: "Дедушка", desc: "3-bo'g'in / Otaning otasi" },
  4: { title_uz: "Katta bobo", title_ru: "Прадедушка", desc: "4-bo'g'in / Boboning otasi" },
  5: { title_uz: "Bo'g'in bobo", title_ru: "Прапрадедушка", desc: "5-bo'g'in / Katta boboning otasi" },
  6: { title_uz: "Chilla bobo", title_ru: "Предок (6-е колено)", desc: "6-bo'g'in / 6-ajdod" },
  7: { title_uz: "Tovur bobo", title_ru: "Первопредок (7-е колено)", desc: "7-bo'g'in / Yetti pusht boshi" },
};
