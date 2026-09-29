import { Person, BranchSide } from "./types";

/**
 * Computes dynamic branch side ('father', 'mother', 'direct', 'in_laws')
 * of `target` strictly relative to the current `focus` person.
 */
export function getDynamicBranchSide(target: Person, focus: Person | null, allPeople: Person[]): BranchSide {
  if (!focus) {
    return target.branch_side || "direct";
  }

  if (target.id === focus.id) {
    return "direct";
  }

  const focusId = focus.id;
  const focusFatherId = focus.father_id;
  const focusMotherId = focus.mother_id;
  const peopleMap = new Map<number, Person>();
  allPeople.forEach((p) => peopleMap.set(p.id, p));

  // 1. Direct core family:
  // - Focus person's spouse
  if (focus.spouse_id === target.id || target.spouse_id === focus.id) return "direct";

  // - Focus person's children and direct descendants
  const focusDescendantIds = new Set<number>();
  function collectDescendants(personId: number) {
    allPeople.forEach((p) => {
      if ((p.father_id === personId || p.mother_id === personId) && !focusDescendantIds.has(p.id)) {
        focusDescendantIds.add(p.id);
        collectDescendants(p.id);
      }
    });
  }
  collectDescendants(focus.id);
  if (focusDescendantIds.has(target.id)) return "direct";

  // - Focus person's full/half siblings
  const isSibling =
    (focus.father_id && target.father_id && focus.father_id === target.father_id) ||
    (focus.mother_id && target.mother_id && focus.mother_id === target.mother_id);
  if (isSibling) return "direct";

  // - Focus person's sibling children (Jiyanlar)
  const focusSiblings = allPeople.filter(
    (p) =>
      p.id !== focus.id &&
      ((focus.father_id && p.father_id && focus.father_id === p.father_id) ||
        (focus.mother_id && p.mother_id && focus.mother_id === p.mother_id))
  );
  if (focusSiblings.some((s) => s.id === target.father_id || s.id === target.mother_id)) {
    return "direct";
  }

  // 2. Helper to collect ancestor bloodline:
  // Starting from a root ancestor (father or mother), collect all ancestors upwards,
  // then collect all descendants of those ancestors (uncles, aunts, cousins, etc.)
  function collectBloodline(rootPersonId: number) {
    if (!rootPersonId) return new Set<number>();
    const ancestors = new Set<number>();
    function addUpwardAncestors(id: number | null | undefined) {
      if (!id || ancestors.has(id)) return;
      ancestors.add(id);
      const person = peopleMap.get(id);
      if (person) {
        if (person.father_id) addUpwardAncestors(person.father_id);
        if (person.mother_id) addUpwardAncestors(person.mother_id);
      }
    }
    addUpwardAncestors(rootPersonId);

    // Collect all descendants of these ancestors (uncles, aunts, cousins)
    const bloodline = new Set<number>(ancestors);
    let changed = true;
    while (changed) {
      changed = false;
      allPeople.forEach((p) => {
        if (p.id === focusId || focusDescendantIds.has(p.id) || isSiblingPerson(p)) return;
        if (!bloodline.has(p.id)) {
          if ((p.father_id && bloodline.has(p.father_id)) || (p.mother_id && bloodline.has(p.mother_id))) {
            bloodline.add(p.id);
            changed = true;
          }
        }
      });
    }

    // Include spouses of those ancestors/uncles/aunts (e.g. Saida is Rahimjon's spouse)
    // but not cross-parents
    const spouses = new Set<number>();
    bloodline.forEach((id) => {
      const p = peopleMap.get(id);
      if (p && p.spouse_id && p.id !== focusFatherId && p.id !== focusMotherId) {
        spouses.add(p.spouse_id);
      }
    });
    spouses.forEach((id) => bloodline.add(id));

    return bloodline;
  }

  function isSiblingPerson(p: Person) {
    return (
      (focusFatherId && p.father_id && focusFatherId === p.father_id) ||
      (focusMotherId && p.mother_id && focusMotherId === p.mother_id)
    );
  }

  // Check Father Side (Ota tomoni)
  if (focus.father_id) {
    const fatherLine = collectBloodline(focus.father_id);
    if (fatherLine.has(target.id)) return "father";
  }

  // Check Mother Side (Ona tomoni)
  if (focus.mother_id) {
    const motherLine = collectBloodline(focus.mother_id);
    if (motherLine.has(target.id)) return "mother";
  }

  // In-laws (Qudachilik / Turmush o'rtoq tomoni)
  return "in_laws";
}

/**
 * Dynamic Graph-based Kinship Algorithm for Uzbek Genealogy.
 * Calculates exact relationship title of `target` strictly relative to `focus`.
 */
export function getKinshipTitle(target: Person, focus: Person | null, allPeople: Person[]): string {
  if (!focus) {
    return target.relationship_title || `${target.generation_level}-bo'g'in`;
  }

  // 1. Self
  if (target.id === focus.id) {
    return "Siz (Tanlangan shaxs)";
  }

  const peopleMap = new Map<number, Person>();
  allPeople.forEach((p) => peopleMap.set(p.id, p));

  // 2. Spouse (Turmush o'rtog'i)
  if (focus.spouse_id === target.id || target.spouse_id === focus.id) {
    return target.gender === "female" ? "Turmush o'rtog'ingiz (Rafiqa)" : "Turmush o'rtog'ingiz (Eringiz)";
  }

  // 3. Parents (Ota-Ona)
  if (focus.father_id === target.id) return "Otangiz";
  if (focus.mother_id === target.id) return "Onangiz";

  // 4. Children (Farzandlar)
  if (target.father_id === focus.id || target.mother_id === focus.id) {
    return target.gender === "male" ? "O'g'lingiz (Farzandingiz)" : "Qizingiz (Farzandingiz)";
  }

  // 5. Full Siblings (Aka, Uka, Opa, Singil)
  const focusSiblings = allPeople.filter(
    (p) =>
      p.id !== focus.id &&
      ((focus.father_id && p.father_id && focus.father_id === p.father_id) ||
        (focus.mother_id && p.mother_id && focus.mother_id === p.mother_id))
  );

  const isSameFather = focus.father_id && target.father_id && focus.father_id === target.father_id;
  const isSameMother = focus.mother_id && target.mother_id && focus.mother_id === target.mother_id;
  if (isSameFather || isSameMother) {
    const isOlder = (target.birth_year || 0) <= (focus.birth_year || 0);
    if (target.gender === "male") {
      return isOlder ? "Akangiz" : "Ukangiz";
    } else {
      return isOlder ? "Opangiz" : "Singlingiz";
    }
  }

  // 6. Sibling's Spouse (Pochcha, Kelin)
  for (const sib of focusSiblings) {
    if (sib.spouse_id === target.id) {
      if (sib.gender === "female") {
        return "Pochchangiz (Opangiz/Singlingizning turmush o'rtog'i)";
      } else {
        return "Kelingiz (Akangiz/Ukangizning turmush o'rtog'i)";
      }
    }
  }

  // 7. Focus Spouse's Family (In-laws / Qudalar)
  const focusSpouseId = focus.spouse_id || allPeople.find((p) => p.spouse_id === focus.id)?.id;
  if (focusSpouseId) {
    const focusSpouse = peopleMap.get(focusSpouseId);
    if (focusSpouse) {
      if (focusSpouse.father_id === target.id) return "Qaynotangiz (Turmush o'rtog'ingizning otasi)";
      if (focusSpouse.mother_id === target.id) return "Qaynonangiz (Turmush o'rtog'ingizning onasi)";

      const isSpouseSibling =
        (focusSpouse.father_id && target.father_id && focusSpouse.father_id === target.father_id) ||
        (focusSpouse.mother_id && target.mother_id && focusSpouse.mother_id === target.mother_id);

      if (isSpouseSibling) {
        const isOlder = (target.birth_year || 0) <= (focusSpouse.birth_year || 0);
        if (focus.gender === "male") {
          return target.gender === "male"
            ? (isOlder ? "Qaynog'angiz (Rafiqa akasi)" : "Qayin ukangiz (Rafiqa ukasi)")
            : (isOlder ? "Qayin opangiz (Rafiqa opasi)" : "Baldizingiz (Rafiqa singlisi)");
        } else {
          return target.gender === "male"
            ? (isOlder ? "Qaynag'angiz (Er akasi)" : "Qayningiz (Er ukasi)")
            : (isOlder ? "Qaynopangiz (Er opasi)" : "Qayin singlingiz (Er singlisi)");
        }
      }

      // Spouse sibling's children
      const spouseSiblings = allPeople.filter(
        (p) =>
          p.id !== focusSpouse.id &&
          ((focusSpouse.father_id && p.father_id && focusSpouse.father_id === p.father_id) ||
            (focusSpouse.mother_id && p.mother_id && focusSpouse.mother_id === p.mother_id))
      );
      if (spouseSiblings.some((sib) => sib.id === target.father_id || sib.id === target.mother_id)) {
        return "Qayin jiyaningiz (Turmush o'rtog'ingizning jiyani)";
      }
    }
  }

  // 8. Grandparents (Bobo va Buvi)
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
    return target.gender === "male" ? "Nabirangiz (O'g'il nabira)" : "Nabirangiz (Qiz nabira)";
  }

  // 10. Great-Grandchildren (Evaralar)
  const focusGrandchildren = allPeople.filter((p) =>
    focusChildren.some((ch) => ch.id === p.father_id || ch.id === p.mother_id)
  );
  if (focusGrandchildren.some((gch) => gch.id === target.father_id || gch.id === target.mother_id)) {
    return "Evarangiz";
  }

  // 11. Great-Grandparents & 7 Generations (Direct paternal ancestors of focus)
  const focusPaternalGrandfather = focusFather?.father_id ? peopleMap.get(focusFather.father_id) : null;
  if (focusPaternalGrandfather) {
    if (focusPaternalGrandfather.father_id === target.id) return "Katta bobongiz (4-ajdod)";
    const great4 = focusPaternalGrandfather.father_id ? peopleMap.get(focusPaternalGrandfather.father_id) : null;
    if (great4 && great4.father_id === target.id) return "Katta bobongiz (5-ajdod)";
    const great5 = great4?.father_id ? peopleMap.get(great4.father_id) : null;
    if (great5 && great5.father_id === target.id) return "Katta bobongiz (6-ajdod)";
    const great6 = great5?.father_id ? peopleMap.get(great5.father_id) : null;
    if (great6 && great6.father_id === target.id) return "Katta bobongiz (7-ajdod)";
  }

  // 12. Uncles and Aunts (Amaki, Amma, Tog'a, Xola)
  if (focusFather) {
    const isFatherSibling =
      (focusFather.father_id && target.father_id && focusFather.father_id === target.father_id) ||
      (focusFather.mother_id && target.mother_id && focusFather.mother_id === target.mother_id);
    if (isFatherSibling) {
      return target.gender === "male" ? "Amakingiz (Otangizning ukasi/akasi)" : "Ammangiz (Otangizning singlisi/opasi)";
    }
  }

  if (focusMother) {
    const isMotherSibling =
      (focusMother.father_id && target.father_id && focusMother.father_id === target.father_id) ||
      (focusMother.mother_id && target.mother_id && focusMother.mother_id === target.mother_id);
    if (isMotherSibling) {
      return target.gender === "male" ? "Tog'angiz (Onangizning ukasi/akasi)" : "Xolangiz (Onangizning singlisi/opasi)";
    }
  }

  // 13. Nephews / Nieces (Jiyanlar - Children of focus siblings)
  if (focusSiblings.some((sib) => sib.id === target.father_id || sib.id === target.mother_id)) {
    const parentSib = focusSiblings.find((sib) => sib.id === target.father_id || sib.id === target.mother_id);
    const parentTitle = parentSib?.gender === "male" ? "Aka/Uka" : "Opa/Singil";
    return target.gender === "male" ? `Jiyaningiz (${parentTitle}ning o'g'li)` : `Jiyaningiz (${parentTitle}ning qizi)`;
  }

  // Children of nephews / nieces (Nabira jiyan)
  const focusNephewIds = allPeople
    .filter((p) => focusSiblings.some((sib) => sib.id === p.father_id || sib.id === p.mother_id))
    .map((p) => p.id);
  if (focusNephewIds.some((nid) => nid === target.father_id || nid === target.mother_id)) {
    return "Nabira jiyaningiz (Jiyaningizning farzandi)";
  }

  // 14. First Cousins (Amakivachcha, Ammavachcha, Tog'avachcha, Xolavachcha)
  const targetFather = target.father_id ? peopleMap.get(target.father_id) : null;
  const targetMother = target.mother_id ? peopleMap.get(target.mother_id) : null;

  if (focusFather && targetFather) {
    if (focusFather.father_id && targetFather.father_id && targetFather.father_id === focusFather.father_id) {
      return target.gender === "male" ? "Amakivachchangiz (Amakining o'g'li)" : "Amakivachchangiz (Amakining qizi)";
    }
  }
  if (focusFather && targetMother) {
    if (focusFather.father_id && targetMother.father_id && targetMother.father_id === focusFather.father_id) {
      return target.gender === "male" ? "Ammavachchangiz (Ammaning o'g'li)" : "Ammavachchangiz (Ammaning qizi)";
    }
  }
  if (focusMother && targetFather) {
    if (focusMother.father_id && targetFather.father_id && targetFather.father_id === focusMother.father_id) {
      return target.gender === "male" ? "Tog'avachchangiz (Tog'aning o'g'li)" : "Tog'avachchangiz (Tog'aning qizi)";
    }
  }
  if (focusMother && targetMother) {
    if (focusMother.mother_id && targetMother.mother_id && targetMother.mother_id === focusMother.mother_id) {
      return target.gender === "male" ? "Xolavachchangiz (Xolaning o'g'li)" : "Xolavachchangiz (Xolaning qizi)";
    }
  }

  // 15. Child's Spouse (Kelin / Kuyov)
  const isChildSpouse = focusChildren.some(
    (ch) => ch.spouse_id === target.id || target.spouse_id === ch.id
  );
  if (isChildSpouse) {
    return target.gender === "male" ? "Kuyovingiz (Qizingizning turmush o'rtog'i)" : "Keliningiz (O'g'lingizning turmush o'rtog'i)";
  }

  // 16. In-law connections between collateral branches (e.g. Nodir looking at Rahimjon/Saida)
  for (const sib of focusSiblings) {
    const sibSpouse = sib.spouse_id ? peopleMap.get(sib.spouse_id) : null;
    if (sibSpouse) {
      if (sibSpouse.father_id === target.id) return "Qudangiz (Pochchangiz/Keliningizning otasi)";
      if (sibSpouse.mother_id === target.id) return "Qudangiz (Pochchangiz/Keliningizning onasi)";
      if (
        (sibSpouse.father_id && target.father_id && sibSpouse.father_id === target.father_id) ||
        (sibSpouse.mother_id && target.mother_id && sibSpouse.mother_id === target.mother_id)
      ) {
        return "Qudangiz (Pochchangiz/Keliningizning jigari)";
      }
    }
  }

  // 17. Dynamic branch fallback
  const dynamicSide = getDynamicBranchSide(target, focus, allPeople);
  if (dynamicSide === "father") return `Ota tomon qarindoshingiz (${target.first_name})`;
  if (dynamicSide === "mother") return `Ona tomon qarindoshingiz (${target.first_name})`;
  if (dynamicSide === "in_laws") return `Quda / Qaynonalik tomoni (${target.first_name})`;

  // 18. General generation difference fallback
  const genDiff = target.generation_level - focus.generation_level;
  if (genDiff > 1) return `${genDiff}-katta ajdod`;
  if (genDiff === 1) return "Katta avlod qarindoshi";
  if (genDiff === -1) return "Kichik avlod qarindoshi";
  if (genDiff < -1) return `${Math.abs(genDiff)}-kichik avlod`;

  return "Qarindoshingiz";
}

export interface LineageInfo {
  id: string;
  name: string;
  color: string;
  bg: string;
}

/**
 * Derives objective genealogical lineage / clan of a person
 * without any relative bias to a specific focus individual.
 */
export function getPersonLineage(person: Person, allPeople: Person[]): LineageInfo {
  const peopleMap = new Map<number, Person>();
  allPeople.forEach((p) => peopleMap.set(p.id, p));

  let curr = person;
  while (curr.father_id && peopleMap.has(curr.father_id)) {
    curr = peopleMap.get(curr.father_id)!;
  }

  const ln = ((curr.last_name || "") + " " + (person.last_name || "")).toLowerCase();
  if (
    ln.includes("shermat") ||
    ln.includes("qodir") ||
    ln.includes("ernazar") ||
    ln.includes("nazarboy") ||
    ln.includes("boybobo") ||
    ln.includes("rahim")
  ) {
    return {
      id: "shermatov",
      name: "Shermatovlar",
      color: "#38bdf8",
      bg: "rgba(56, 189, 248, 0.12)",
    };
  }

  if (ln.includes("mansur") || ln.includes("qosim")) {
    return {
      id: "mansurov",
      name: "Mansurovlar",
      color: "#f472b6",
      bg: "rgba(244, 114, 182, 0.12)",
    };
  }

  const baseSurname = person.last_name ? person.last_name.replace(/(ov|ova|ev|eva)$/i, "") + "lar" : "Sulola";
  return {
    id: "other",
    name: baseSurname,
    color: "#34d399",
    bg: "rgba(52, 211, 153, 0.12)",
  };
}
