"use client";

import React, { useState, useMemo } from "react";
import { Person, User, BranchSide, UZBEK_GENERATION_LABELS } from "@/lib/types";
import { getDynamicBranchSide, getKinshipTitle, getPersonLineage } from "@/lib/kinship";
import { 
  Search, 
  Filter, 
  User as UserIcon, 
  Edit3, 
  Trash2, 
  Lock, 
  Plus, 
  MapPin, 
  Briefcase,
  Phone,
  Users,
  Compass
} from "lucide-react";

interface ListViewProps {
  people: (Person & { can_edit?: boolean; created_by_name?: string })[];
  currentUser: User | null;
  focusPerson?: Person | null;
  enableKinship?: boolean;
  onFocusPersonChange?: (personId: number) => void;
  onSelectPerson: (person: Person) => void;
  onEditPerson: (person: Person) => void;
  onDeletePerson: (personId: number) => void;
  onOpenAddModal: () => void;
}

export const ListView: React.FC<ListViewProps> = ({
  people,
  currentUser,
  focusPerson = null,
  enableKinship = true,
  onFocusPersonChange,
  onSelectPerson,
  onEditPerson,
  onDeletePerson,
  onOpenAddModal,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSide, setSelectedSide] = useState<"all" | BranchSide>("all");
  const [objLineageFilter, setObjLineageFilter] = useState<"all" | "shermatov" | "mansurov" | "male" | "female">("all");
  const [onlyMine, setOnlyMine] = useState(false);

  // Dynamic branch sides relative to focus person
  const dynamicSideMap = useMemo(() => {
    const map = new Map<number, BranchSide>();
    people.forEach((p) => {
      map.set(p.id, getDynamicBranchSide(p, focusPerson, people));
    });
    return map;
  }, [people, focusPerson]);

  const dynamicCounts = useMemo(() => {
    let father = 0;
    let mother = 0;
    let direct = 0;
    let in_laws = 0;
    people.forEach((p) => {
      const s = dynamicSideMap.get(p.id) || "direct";
      if (s === "father") father++;
      else if (s === "mother") mother++;
      else if (s === "direct") direct++;
      else if (s === "in_laws") in_laws++;
    });
    return { father, mother, direct, in_laws };
  }, [people, dynamicSideMap]);

  const filteredPeople = useMemo(() => {
    return people.filter((p) => {
      const query = searchQuery.toLowerCase().trim();
      const match =
        p.first_name.toLowerCase().includes(query) ||
        p.last_name.toLowerCase().includes(query) ||
        (p.patronymic && p.patronymic.toLowerCase().includes(query)) ||
        (p.relationship_title && p.relationship_title.toLowerCase().includes(query)) ||
        (p.birth_place && p.birth_place.toLowerCase().includes(query)) ||
        (p.occupation && p.occupation.toLowerCase().includes(query)) ||
        (p.phone && p.phone.includes(query));

      if (query && !match) return false;

      if (enableKinship) {
        if (selectedSide !== "all" && (dynamicSideMap.get(p.id) || "direct") !== selectedSide) {
          return false;
        }
      } else {
        if (objLineageFilter === "shermatov" || objLineageFilter === "mansurov") {
          if (getPersonLineage(p, people).id !== objLineageFilter) return false;
        } else if (objLineageFilter === "male" && p.gender !== "male") {
          return false;
        } else if (objLineageFilter === "female" && p.gender !== "female") {
          return false;
        }
      }

      if (onlyMine && currentUser && p.created_by !== currentUser.id) {
        return false;
      }

      return true;
    });
  }, [people, searchQuery, selectedSide, onlyMine, currentUser, dynamicSideMap, enableKinship, objLineageFilter]);

  const sideLabels: Record<BranchSide, { label: string; color: string; bg: string }> = {
    father: { label: "Ota tomoni", color: "#38bdf8", bg: "rgba(56, 189, 248, 0.12)" },
    mother: { label: "Ona tomoni", color: "#f472b6", bg: "rgba(244, 114, 182, 0.12)" },
    direct: { label: "O'z oilasi & Avlodlar", color: "#34d399", bg: "rgba(52, 211, 153, 0.12)" },
    in_laws: { label: "Qudachilik", color: "#c084fc", bg: "rgba(192, 132, 252, 0.12)" },
  };

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "28px 20px" }}>
      {/* Search and Filters Header */}
      <div
        className="glass-panel"
        style={{
          padding: "20px",
          marginBottom: "24px",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "16px",
        }}
      >
        {/* Search Input */}
        <div style={{ position: "relative", flex: "1 1 280px" }}>
          <Search
            size={18}
            style={{
              position: "absolute",
              left: "14px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--text-muted)",
            }}
          />
          <input
            id="input-search-members"
            type="text"
            className="form-input"
            style={{ paddingLeft: "42px" }}
            placeholder="Ism, familiya, qarindoshlik (Tog'a, Amaki), telefon yoki kasbi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Side and Options Filters */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Users size={16} color="var(--text-muted)" />
            {enableKinship ? (
              <select
                id="select-filter-side"
                className="form-select"
                style={{ width: "auto", minWidth: "190px" }}
                value={selectedSide}
                onChange={(e) => setSelectedSide(e.target.value as "all" | BranchSide)}
              >
                <option value="all">Barcha shoxobchalar ({people.length})</option>
                <option value="father">👨‍🦳 Ota tomoni ({dynamicCounts.father})</option>
                <option value="mother">👩‍🦳 Ona tomoni ({dynamicCounts.mother})</option>
                <option value="direct">🌱 O&apos;z oilasi ({dynamicCounts.direct})</option>
                <option value="in_laws">🤝 Qudachilik ({dynamicCounts.in_laws})</option>
              </select>
            ) : (
              <select
                id="select-filter-lineage"
                className="form-select"
                style={{ width: "auto", minWidth: "200px" }}
                value={objLineageFilter}
                onChange={(e) => setObjLineageFilter(e.target.value as any)}
              >
                <option value="all">Barcha qarindoshlar ({people.length})</option>
                <option value="shermatov">🏛️ Shermatovlar sulolasi</option>
                <option value="mansurov">🏛️ Mansurovlar sulolasi</option>
                <option value="male">👨 Erkaklar</option>
                <option value="female">👩 Ayollar</option>
              </select>
            )}
          </div>

          {currentUser && (
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "13px",
                fontWeight: 600,
                color: onlyMine ? "var(--text-gold)" : "var(--text-secondary)",
                cursor: "pointer",
                background: onlyMine ? "rgba(245, 158, 11, 0.15)" : "var(--bg-tertiary)",
                padding: "8px 14px",
                borderRadius: "var(--radius-md)",
                border: "1px solid",
                borderColor: onlyMine ? "var(--gold-500)" : "var(--border-subtle)",
              }}
            >
              <input
                id="checkbox-only-mine"
                type="checkbox"
                checked={onlyMine}
                onChange={(e) => setOnlyMine(e.target.checked)}
                style={{ accentColor: "var(--gold-500)", cursor: "pointer" }}
              />
              Faqat men kiritganlar
            </label>
          )}

          {currentUser && (
            <button
              id="btn-add-person-list"
              onClick={onOpenAddModal}
              className="btn btn-primary"
            >
              <Plus size={16} />
              <span>Yangi qarindosh</span>
            </button>
          )}
        </div>
      </div>

      {/* Results Count & Notice */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "16px",
          padding: "0 4px",
        }}
      >
        <span style={{ fontSize: "14px", color: "var(--text-muted)" }}>
          Topildi: <strong style={{ color: "var(--text-primary)" }}>{filteredPeople.length}</strong> ta qarindosh
        </span>
        <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
          📷 Yuz suratlari va kontaktlar saqlangan
        </span>
      </div>

      {/* Grid of Persons */}
      {filteredPeople.length === 0 ? (
        <div
          className="glass-panel"
          style={{
            padding: "48px 24px",
            textAlign: "center",
            color: "var(--text-muted)",
          }}
        >
          <UserIcon size={48} style={{ margin: "0 auto 16px", opacity: 0.4 }} />
          <h3 style={{ fontSize: "18px", color: "var(--text-primary)", marginBottom: "8px" }}>
            Hech qanday qarindosh topilmadi
          </h3>
          <p style={{ fontSize: "14px", maxWidth: "400px", margin: "0 auto" }}>
            Qidiruvni o&apos;zgartirib ko&apos;ring yoki yangi qarindosh suratini va ma&apos;lumotini kiriting.
          </p>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: "20px",
          }}
        >
          {filteredPeople.map((person) => {
            const isOwner = currentUser?.id === person.created_by || currentUser?.role === "admin";
            const isMale = person.gender === "male";
            const portrait = person.photo_url || (person.photos && person.photos[0]) || null;
            const dynSide = dynamicSideMap.get(person.id) || "direct";
            const sideInfo = sideLabels[dynSide] || sideLabels.direct;
            const kinshipTitle = getKinshipTitle(person, focusPerson, people);

            return (
              <div
                key={person.id}
                className="glass-panel"
                onClick={() => onSelectPerson(person)}
                style={{
                  padding: "18px",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  gap: "14px",
                  borderLeft: `5px solid ${isMale ? "var(--male-color)" : "var(--female-color)"}`,
                }}
              >
                <div>
                  {/* Top Badges */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      {enableKinship ? (
                        <span
                          style={{
                            fontSize: "11px",
                            fontWeight: 700,
                            padding: "2px 8px",
                            borderRadius: "9999px",
                            background: sideInfo.bg,
                            color: sideInfo.color,
                          }}
                        >
                          {sideInfo.label}
                        </span>
                      ) : (
                        <span
                          style={{
                            fontSize: "11px",
                            fontWeight: 700,
                            padding: "2px 8px",
                            borderRadius: "9999px",
                            background: getPersonLineage(person, people).bg,
                            color: getPersonLineage(person, people).color,
                          }}
                        >
                          🏛️ {getPersonLineage(person, people).name}
                        </span>
                      )}

                      {person.relationship_title && (
                        <span
                          style={{
                            fontSize: "11px",
                            fontWeight: 700,
                            padding: "2px 8px",
                            borderRadius: "9999px",
                            background: "rgba(212, 175, 55, 0.15)",
                            color: "var(--text-gold)",
                          }}
                        >
                          ⭐ {person.relationship_title}
                        </span>
                      )}
                    </div>

                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 600,
                        color: person.is_alive ? "var(--emerald-500)" : "var(--text-muted)",
                      }}
                    >
                      {person.is_alive ? "• Hayot" : "• Vafot etgan"}
                    </span>
                  </div>

                  {/* Portrait + Name */}
                  <div style={{ display: "flex", gap: "14px", alignItems: "center" }}>
                    <div
                      style={{
                        width: "60px",
                        height: "60px",
                        borderRadius: "50%",
                        overflow: "hidden",
                        border: `2px solid ${isMale ? "var(--male-color)" : "var(--female-color)"}`,
                        background: "var(--bg-tertiary)",
                        flexShrink: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {portrait ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={portrait}
                          alt={person.first_name}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      ) : (
                        <UserIcon
                          size={30}
                          color={isMale ? "var(--male-color)" : "var(--female-color)"}
                        />
                      )}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3 style={{ fontSize: "17px", fontWeight: 700, color: "var(--text-primary)" }}>
                        {person.first_name} {person.last_name}
                      </h3>
                      {person.patronymic && (
                        <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "2px" }}>
                          {person.patronymic}
                        </p>
                      )}
                      <p style={{ fontSize: "12px", color: "var(--text-gold)", marginTop: "4px", fontWeight: 600 }}>
                        {person.birth_year ? `${person.birth_year}-yil` : "?"} —{" "}
                        {person.is_alive ? "hozir" : person.death_year ? `${person.death_year}-yil` : "?"}
                      </p>
                    </div>
                  </div>

                  {/* Contact & Location Info */}
                  <div style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "5px", fontSize: "12px", color: "var(--text-muted)" }}>
                    {person.phone && (
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--emerald-500)", fontWeight: 600 }}>
                        <Phone size={13} />
                        <a href={`tel:${person.phone}`} onClick={(e) => e.stopPropagation()} style={{ color: "inherit", textDecoration: "none" }}>
                          {person.phone}
                        </a>
                      </div>
                    )}
                    {person.birth_place && (
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <MapPin size={13} />
                        <span>{person.birth_place}</span>
                      </div>
                    )}
                    {person.occupation && (
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <Briefcase size={13} />
                        <span>{person.occupation}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer attribution & actions */}
                <div
                  style={{
                    paddingTop: "12px",
                    borderTop: "1px solid var(--border-subtle)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <span style={{ fontSize: "11px", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "4px" }}>
                    <UserIcon size={12} />
                    Kiritdi: <strong style={{ color: "var(--text-secondary)" }}>{person.created_by_name || "Noma'lum"}</strong>
                  </span>

                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    {isOwner ? (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditPerson(person);
                          }}
                          className="btn btn-sm btn-secondary"
                          style={{ padding: "4px 8px" }}
                          title="Tahrirlash"
                        >
                          <Edit3 size={13} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`Haqiqatan ham "${person.first_name} ${person.last_name}"ni o'chirmoqchimisiz?`)) {
                              onDeletePerson(person.id);
                            }
                          }}
                          className="btn btn-sm btn-danger"
                          style={{ padding: "4px 8px" }}
                          title="O'chirish"
                        >
                          <Trash2 size={13} />
                        </button>
                      </>
                    ) : (
                      <span
                        style={{ fontSize: "11px", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "4px" }}
                        title="Faqat yozuv egasi tahrirlashi mumkin"
                      >
                        <Lock size={12} />
                        <span>Himoyalangan</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
