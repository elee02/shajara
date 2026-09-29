import { Person } from "./types";

/**
 * Calculates dynamic kinship title between target person and focus person
 * (e.g. "Tog'angiz", "Amakingiz", "Akangiz", "Nabirangiz", "Ota bobongiz", etc.)
 */
export function getKinshipTitle(target: Person, focus: Person | null, allPeople: Person[]): string {
  if (!focus) {
    return target.relationship_title || "";
  }

  if (target.id === focus.id) {
    return "O'zingiz (Bosh)";
  }

  const peopleMap = new Map<number, Person>();
  allPeople.forEach((p) => peopleMap.set(p.id, p));

  const isMale = target.gender === "male";

  // 1. Direct Spouse
  if (focus.spouse_id === target.id || target.spouse_id === focus.id) {
    return isMale ? "Turmush o'rtog'ingiz (Eringiz)" : "Turmush o'rtog'ingiz (Xotiningiz)";
  }

  // 2. Direct Parents
  if (focus.father_id === target.id) {
    return "Otangiz";
  }
  if (focus.mother_id === target.id) {
    return "Onangiz";
  }

  // 3. Direct Children
  if (target.father_id === focus.id || target.mother_id === focus.id) {
    return isMale ? "O'g'lingiz" : "Qizingiz";
  }

  // 4. Grandparents (Bobo & Buvi)
  const focusFather = focus.father_id ? peopleMap.get(focus.father_id) : null;
  const focusMother = focus.mother_id ? peopleMap.get(focus.mother_id) : null;

  // Paternal Grandparents (Ota tomon)
  if (focusFather) {
    if (focusFather.father_id === target.id) return "Ota bobongiz";
    if (focusFather.mother_id === target.id) return "Ota buvingiz";
  }

  // Maternal Grandparents (Ona tomon)
  if (focusMother) {
    if (focusMother.father_id === target.id) return "Ona bobongiz (Katta ota)";
    if (focusMother.mother_id === target.id) return "Ona buvingiz (Katta ona)";
  }

  // 5. Great-Grandparents & 7 Ancestors
  if (target.generation_level === 4 && target.branch_side === "father") {
    return isMale ? "Katta bobongiz" : "Katta buvingiz";
  }
  if (target.generation_level === 5 && target.branch_side === "father") return "Bo'g'in bobongiz (5-ajdod)";
  if (target.generation_level === 6 && target.branch_side === "father") return "Chilla bobongiz (6-ajdod)";
  if (target.generation_level === 7 && target.branch_side === "father") return "Tovur bobongiz (7-ajdod)";

  // 6. Siblings (Aka, Uka, Opa, Singil)
  const isSameFather = focus.father_id && target.father_id && focus.father_id === target.father_id;
  const isSameMother = focus.mother_id && target.mother_id && focus.mother_id === target.mother_id;

  if (isSameFather || isSameMother) {
    const isOlder = (target.birth_year || 0) < (focus.birth_year || 0);
    if (isMale) {
      return isOlder ? "Katta akangiz" : "Ukangiz";
    } else {
      return isOlder ? "Katta opangiz" : "Singlingiz";
    }
  }

  // 7. Uncles and Aunts (Amaki, Amma, Tog'a, Xola)
  if (focusFather) {
    const isFatherSibling =
      (focusFather.father_id && target.father_id && focusFather.father_id === target.father_id) ||
      (focusFather.mother_id && target.mother_id && focusFather.mother_id === target.mother_id);

    if (isFatherSibling) {
      return isMale ? "Amakingiz (Otaning ukasi/akasi)" : "Ammangiz (Otaning opasi/singlisi)";
    }
  }

  if (focusMother) {
    const isMotherSibling =
      (focusMother.father_id && target.father_id && focusMother.father_id === target.father_id) ||
      (focusMother.mother_id && target.mother_id && focusMother.mother_id === target.mother_id);

    if (isMotherSibling) {
      return isMale ? "Tog'angiz (Onaning akasi/ukasi)" : "Xolangiz (Onaning opasi/singlisi)";
    }
  }

  // 8. Cousins (Amakivachcha, Ammavachcha, Tog'avachcha, Xolavachcha)
  const targetFather = target.father_id ? peopleMap.get(target.father_id) : null;
  const targetMother = target.mother_id ? peopleMap.get(target.mother_id) : null;

  if (focusFather && targetFather) {
    if (focusFather.father_id && targetFather.father_id && focusFather.father_id === targetFather.father_id) {
      return "Amakivachchangiz";
    }
  }
  if (focusMother && targetFather) {
    if (focusMother.father_id && targetFather.father_id && focusMother.father_id === targetFather.father_id) {
      return "Tog'avachchangiz";
    }
  }
  if (focusMother && targetMother) {
    if (focusMother.mother_id && targetMother.mother_id && focusMother.mother_id === targetMother.mother_id) {
      return "Xolavachchangiz";
    }
  }

  // 9. Grandchildren & Descendants (Nabiralar, Evaralar)
  const focusChildren = allPeople.filter((p) => p.father_id === focus.id || p.mother_id === focus.id);
  const isGrandchild = focusChildren.some((ch) => ch.id === target.father_id || ch.id === target.mother_id);
  if (isGrandchild) {
    return isMale ? "Nabirangiz (O'g'il)" : "Nabirangiz (Qiz)";
  }

  // 10. Nephews / Nieces (Jiyanlar)
  const focusSiblings = allPeople.filter(
    (p) =>
      p.id !== focus.id &&
      ((focus.father_id && p.father_id && focus.father_id === p.father_id) ||
        (focus.mother_id && p.mother_id && focus.mother_id === p.mother_id))
  );
  const isNephew = focusSiblings.some((sib) => sib.id === target.father_id || sib.id === target.mother_id);
  if (isNephew) {
    return isMale ? "Jiyaningiz (O'g'il)" : "Jiyaningiz (Qiz)";
  }

  // 11. In-Laws (Qaynota, Qaynona, Boja)
  if (focus.spouse_id) {
    const spouseObj = peopleMap.get(focus.spouse_id);
    if (spouseObj) {
      if (spouseObj.father_id === target.id) return "Qaynotangiz";
      if (spouseObj.mother_id === target.id) return "Qaynonangiz";
    }
  }

  // Fallback to manual relationship_title if set
  if (target.relationship_title) {
    return target.relationship_title;
  }

  // Branch side fallback
  if (target.branch_side === "father") return "Ota tomon qarindoshingiz";
  if (target.branch_side === "mother") return "Ona tomon qarindoshingiz";
  if (target.branch_side === "in_laws") return "Quda tomon qarindoshingiz";

  return `${target.generation_level}-bo'g'in qarindosh`;
}
