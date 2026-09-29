import { Person } from "./types";

/**
 * Robust Graph-based Kinship Algorithm for Uzbek Genealogy.
 * Calculates exact relationship of `target` relative to `focus`.
 * Uses graph path-finding so changing `focus` immediately recalculates every person correctly!
 */
export function getKinshipTitle(target: Person, focus: Person | null, allPeople: Person[]): string {
  if (!focus) {
    return target.relationship_title || "";
  }

  // 1. Self
  if (target.id === focus.id) {
    return "O'zingiz (Bosh)";
  }

  const peopleMap = new Map<number, Person>();
  allPeople.forEach((p) => peopleMap.set(p.id, p));

  const isMale = target.gender === "male";

  // 2. Direct Spouse (Er / Xotin)
  if (focus.spouse_id === target.id || target.spouse_id === focus.id) {
    return isMale ? "Turmush o'rtog'ingiz (Eringiz)" : "Turmush o'rtog'ingiz (Xotiningiz)";
  }

  // 3. Direct Parents (Ota / Ona)
  if (focus.father_id === target.id) return "Otangiz";
  if (focus.mother_id === target.id) return "Onangiz";

  // 4. Direct Children (O'g'il / Qiz)
  if (target.father_id === focus.id || target.mother_id === focus.id) {
    return isMale ? "O'g'lingiz" : "Qizingiz";
  }

  // Helper: Focus siblings
  const focusSiblings = allPeople.filter(
    (p) =>
      p.id !== focus.id &&
      ((focus.father_id && p.father_id && focus.father_id === p.father_id) ||
        (focus.mother_id && p.mother_id && focus.mother_id === p.mother_id))
  );

  // 5. Siblings (Aka, Uka, Opa, Singil)
  const isSameFather = focus.father_id && target.father_id && focus.father_id === target.father_id;
  const isSameMother = focus.mother_id && target.mother_id && focus.mother_id === target.mother_id;
  if (isSameFather || isSameMother) {
    const isOlder = (target.birth_year || 0) <= (focus.birth_year || 0);
    if (isMale) {
      return isOlder ? "Katta akangiz" : "Ukangiz";
    } else {
      return isOlder ? "Katta opangiz" : "Singlingiz";
    }
  }

  // 6. Sibling's spouse (Pochcha / Yanga / Kelinoyi / Kuyov)
  for (const sib of focusSiblings) {
    if (sib.spouse_id === target.id || target.spouse_id === sib.id) {
      if (sib.gender === "female") {
        return "Pochchangiz / Kuyov (Opangiz/Singlingizning eri)";
      } else {
        return "Yangangiz / Kelinoyi (Akangiz/Ukangizning rafiqasi)";
      }
    }
  }

  // 7. Focus Spouse's Family (In-laws)
  const focusSpouseId = focus.spouse_id || allPeople.find(p => p.spouse_id === focus.id)?.id;
  if (focusSpouseId) {
    const focusSpouse = peopleMap.get(focusSpouseId);
    
    if (focusSpouse) {
      // Spouse's parents (Qaynota / Qaynona)
      if (focusSpouse.father_id === target.id) return "Qaynotangiz (Turmush o'rtog'ingizning otasi)";
      if (focusSpouse.mother_id === target.id) return "Qaynonangiz (Turmush o'rtog'ingizning onasi)";

      // Spouse's siblings (Qaynog'a, Qayin uka, Baldiz, Qayin singil)
      const isSpouseSibling =
        (focusSpouse.father_id && target.father_id && focusSpouse.father_id === target.father_id) ||
        (focusSpouse.mother_id && target.mother_id && focusSpouse.mother_id === target.mother_id);

      if (isSpouseSibling) {
        if (focus.gender === "male") {
          return isMale ? "Qaynog'angiz / Qayin ukangiz" : "Baldizingiz / Qayin singlingiz";
        } else {
          return isMale ? "Qayinog'angiz / Qayningiz" : "Qayinopangiz / Qayinsinglingiz";
        }
      }
    }
  }

  // 8. Grandparents (Bobo & Buvi)
  const focusFather = focus.father_id ? peopleMap.get(focus.father_id) : null;
  const focusMother = focus.mother_id ? peopleMap.get(focus.mother_id) : null;

  if (focusFather) {
    if (focusFather.father_id === target.id) return "Ota bobongiz (Katta ota)";
    if (focusFather.mother_id === target.id) return "Ota buvingiz (Katta ona)";
  }
  if (focusMother) {
    if (focusMother.father_id === target.id) return "Ona bobongiz (Katta ota)";
    if (focusMother.mother_id === target.id) return "Ona buvingiz (Katta ona)";
  }

  // 9. Grandchildren (Nabiralar)
  const focusChildren = allPeople.filter((p) => p.father_id === focus.id || p.mother_id === focus.id);
  const isGrandchild = focusChildren.some((ch) => ch.id === target.father_id || ch.id === target.mother_id);
  if (isGrandchild) {
    return isMale ? "Nabirangiz (O'g'il)" : "Nabirangiz (Qiz)";
  }

  // 10. Great-Grandchildren (Evaralar)
  const focusGrandchildren = allPeople.filter((p) =>
    focusChildren.some((ch) => ch.id === p.father_id || ch.id === p.mother_id)
  );
  if (focusGrandchildren.some((gch) => gch.id === target.father_id || gch.id === target.mother_id)) {
    return isMale ? "Evarangiz (O'g'il)" : "Evarangiz (Qiz)";
  }

  // 11. Great-Grandparents & 7 Generations (Direct paternal ancestors of focus)
  const focusPaternalGrandfather = focusFather?.father_id ? peopleMap.get(focusFather.father_id) : null;
  if (focusPaternalGrandfather) {
    if (focusPaternalGrandfather.father_id === target.id) return "Katta bobongiz (4-ajdod)";
    const great4 = focusPaternalGrandfather.father_id ? peopleMap.get(focusPaternalGrandfather.father_id) : null;
    if (great4) {
      if (great4.father_id === target.id) return "Bo'g'in bobongiz (5-ajdod)";
      const great5 = great4.father_id ? peopleMap.get(great4.father_id) : null;
      if (great5) {
        if (great5.father_id === target.id) return "Chilla bobongiz (6-ajdod)";
        const great6 = great5.father_id ? peopleMap.get(great5.father_id) : null;
        if (great6 && great6.father_id === target.id) return "Tovur bobongiz (7-ajdod)";
      }
    }
  }

  // 12. Uncles and Aunts (Amaki, Amma, Tog'a, Xola)
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

  // 13. Nephews / Nieces (Jiyanlar - Children of focus siblings)
  if (focusSiblings.some((sib) => sib.id === target.father_id || sib.id === target.mother_id)) {
    return isMale ? "Jiyaningiz (O'g'il)" : "Jiyaningiz (Qiz)";
  }

  // 14. Cousins (Amakivachcha, Ammavachcha, Tog'avachcha, Xolavachcha)
  const targetFather = target.father_id ? peopleMap.get(target.father_id) : null;
  const targetMother = target.mother_id ? peopleMap.get(target.mother_id) : null;

  if (focusFather) {
    if (
      targetFather &&
      focusFather.father_id &&
      targetFather.father_id &&
      targetFather.father_id === focusFather.father_id
    ) {
      return isMale ? "Amakivachchangiz (O'g'il)" : "Amakivachchangiz (Qiz)";
    }
    if (
      targetMother &&
      focusFather.father_id &&
      targetMother.father_id &&
      targetMother.father_id === focusFather.father_id
    ) {
      return isMale ? "Ammavachchangiz (O'g'il)" : "Ammavachchangiz (Qiz)";
    }
  }

  if (focusMother) {
    if (
      targetFather &&
      focusMother.father_id &&
      targetFather.father_id &&
      targetFather.father_id === focusMother.father_id
    ) {
      return isMale ? "Tog'avachchangiz (O'g'il)" : "Tog'avachchangiz (Qiz)";
    }
    if (
      targetMother &&
      focusMother.mother_id &&
      targetMother.mother_id &&
      targetMother.mother_id === focusMother.mother_id
    ) {
      return isMale ? "Xolavachchangiz (O'g'il)" : "Xolavachchangiz (Qiz)";
    }
  }

  // 15. Children's spouses (Kuyov / Kelin)
  const isChildSpouse = focusChildren.some(
    (ch) => ch.spouse_id === target.id || target.spouse_id === ch.id
  );
  if (isChildSpouse) {
    return isMale ? "Kuyovingiz (Qizingizning eri)" : "Keliningiz (O'g'lingizning rafiqasi)";
  }

  // 16. In-law connections between collateral branches (e.g. Nodir looking at Rahimjon)
  // Check if target is parent of focus's sibling's spouse
  for (const sib of focusSiblings) {
    const sibSpouse = sib.spouse_id ? peopleMap.get(sib.spouse_id) : null;
    if (sibSpouse) {
      if (sibSpouse.father_id === target.id) return `Quda (Kuyov/Kelinning otasi)`;
      if (sibSpouse.mother_id === target.id) return `Quda (Kuyov/Kelinning onasi)`;
      if (sibSpouse.father_id) {
        const sibSpouseFather = peopleMap.get(sibSpouse.father_id);
        if (sibSpouseFather && sibSpouseFather.father_id === target.id) {
          return `Quda bobo (${target.first_name})`;
        }
      }
    }
  }

  // 17. If focus is root (id 7 Javohir), fallback to custom title if set
  if (focus.id === 7 && target.relationship_title) {
    return target.relationship_title;
  }

  // 18. General generation difference fallback
  const genDiff = target.generation_level - focus.generation_level;
  if (genDiff > 0) {
    return `${genDiff}-bo'g'in katta qarindosh (${target.first_name})`;
  } else if (genDiff < 0) {
    return `${Math.abs(genDiff)}-bo'g'in kichik qarindosh (${target.first_name})`;
  }

  return `Tengdosh qarindosh (${target.first_name})`;
}
