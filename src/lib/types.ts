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
export type BranchSide = "father" | "mother" | "direct" | "in_laws";

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
  phone?: string | null;
  father_id?: number | null;
  mother_id?: number | null;
  spouse_id?: number | null;
  generation_level: number; // e.g. 0: Self/siblings, 1: Parents/Uncles, 2: Grandparents, -1: Children, etc.
  branch_side: BranchSide; // 'father' (Ota tomon), 'mother' (Ona tomon), 'direct' (O'z avlodi), 'in_laws' (Qudachilik)
  relationship_title?: string | null; // e.g. "Tog'a", "Xola", "Amaki", "Amma", "Ona buvi", "Jiyan", "Nabira"
  photo_url?: string | null;
  photos?: string[]; // Array of image URLs for photo gallery
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

export const UZBEK_GENERATION_LABELS: Record<number, { title_uz: string; desc: string }> = {
  7: { title_uz: "7-Ajdod (Tovur bobo)", desc: "Yetti pusht boshi" },
  6: { title_uz: "6-Ajdod (Chilla bobo)", desc: "6-bo'g'in bobokalon" },
  5: { title_uz: "5-Ajdod (Bo'g'in bobo)", desc: "5-bo'g'in bobokalon" },
  4: { title_uz: "Katta bobo / Katta buvi", desc: "4-bo'g'in ajdodlar" },
  3: { title_uz: "Bobo va Buvi", desc: "Ota va ona tomon bobo-buvilar" },
  2: { title_uz: "Ota-Ona, Tog'a, Amaki, Xola, Amma", desc: "Ota va ona avlodlari" },
  1: { title_uz: "O'zi, Aka-uka, Opa-singil, Tengdoshlar", desc: "Boshlang'ich bo'g'in va jigarlar" },
  0: { title_uz: "Farzandlar va Jiyanlar", desc: "Keyingi avlod" },
  "-1": { title_uz: "Nabiralar", desc: "Nabiralar bo'g'ini" },
  "-2": { title_uz: "Evaralar", desc: "Evaralar bo'g'ini" },
  "-3": { title_uz: "Chevaralar", desc: "Chevaralar bo'g'ini" },
};

export const COMMON_RELATIONSHIPS = [
  // Father's side (Ota tomon)
  { id: "ota", label: "Ota", side: "father" },
  { id: "ota_bobo", label: "Ota bobo (Otaning otasi)", side: "father" },
  { id: "ota_buvi", label: "Ota buvi (Otaning onasi)", side: "father" },
  { id: "amaki", label: "Amaki (Otaning ukasi/akasi)", side: "father" },
  { id: "amma", label: "Amma (Otaning opasi/singlisi)", side: "father" },
  { id: "amakivachcha", label: "Amakivachcha", side: "father" },
  { id: "ammavachcha", label: "Ammavachcha", side: "father" },

  // Mother's side (Ona tomon)
  { id: "ona", label: "Ona", side: "mother" },
  { id: "ona_bobo", label: "Ona bobo / Katta ota (Onaning otasi)", side: "mother" },
  { id: "ona_buvi", label: "Ona buvi / Katta ona (Onaning onasi)", side: "mother" },
  { id: "toga", label: "Tog'a (Onaning akasi/ukasi)", side: "mother" },
  { id: "xola", label: "Xola (Onaning opasi/singlisi)", side: "mother" },
  { id: "togavachcha", label: "Tog'avachcha", side: "mother" },
  { id: "xolavachcha", label: "Xolavachcha", side: "mother" },

  // Siblings & Peers (O'z tengdoshlari)
  { id: "ozi", label: "O'zi", side: "direct" },
  { id: "aka", label: "Aka (Katta aka)", side: "direct" },
  { id: "uka", label: "Uka (Kichik uka)", side: "direct" },
  { id: "opa", label: "Opa (Katta opa)", side: "direct" },
  { id: "singil", label: "Singil (Kichik singil)", side: "direct" },

  // Spouses & In-laws (Qudalik / Turmush o'rtoq)
  { id: "turmush_ortoq", label: "Turmush o'rtog'i (Er / Xotin)", side: "in_laws" },
  { id: "qaynota", label: "Qaynota", side: "in_laws" },
  { id: "qaynona", label: "Qaynona", side: "in_laws" },
  { id: "boja", label: "Boja", side: "in_laws" },
  { id: "qaynogha", label: "Qaynog'a / Qayin uka", side: "in_laws" },
  { id: "balduz", label: "Baldiz / Qayin singil", side: "in_laws" },

  // Descendants (Avlodlar)
  { id: "ogil", label: "O'g'il", side: "direct" },
  { id: "qiz", label: "Qiz", side: "direct" },
  { id: "jiyan", label: "Jiyan", side: "direct" },
  { id: "nabira", label: "Nabira", side: "direct" },
  { id: "evara", label: "Evara", side: "direct" },
  { id: "chevara", label: "Chevara", side: "direct" },
];
