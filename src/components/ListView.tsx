"use client";

import React, { useState, useMemo } from "react";
import { Person, UZBEK_GENERATIONS, User } from "@/lib/types";
import { 
  Search, 
  Filter, 
  User as UserIcon, 
  Edit3, 
  Trash2, 
  Lock, 
  Plus, 
  MapPin, 
  Briefcase 
} from "lucide-react";

interface ListViewProps {
  people: (Person & { can_edit?: boolean; created_by_name?: string })[];
  currentUser: User | null;
  onSelectPerson: (person: Person) => void;
  onEditPerson: (person: Person) => void;
  onDeletePerson: (personId: number) => void;
  onOpenAddModal: () => void;
}

export const ListView: React.FC<ListViewProps> = ({
  people,
  currentUser,
  onSelectPerson,
  onEditPerson,
  onDeletePerson,
  onOpenAddModal,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGen, setSelectedGen] = useState<string>("all");
  const [onlyMine, setOnlyMine] = useState(false);

  const filteredPeople = useMemo(() => {
    return people.filter((p) => {
      // Search text match
      const query = searchQuery.toLowerCase().trim();
      const nameMatch =
        p.first_name.toLowerCase().includes(query) ||
        p.last_name.toLowerCase().includes(query) ||
        (p.patronymic && p.patronymic.toLowerCase().includes(query)) ||
        (p.birth_place && p.birth_place.toLowerCase().includes(query)) ||
        (p.occupation && p.occupation.toLowerCase().includes(query));

      if (query && !nameMatch) return false;

      // Generation filter
      if (selectedGen !== "all" && p.generation_level !== Number(selectedGen)) {
        return false;
      }

      // My entries only
      if (onlyMine && currentUser && p.created_by !== currentUser.id) {
        return false;
      }

      return true;
    });
  }, [people, searchQuery, selectedGen, onlyMine, currentUser]);

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
            placeholder="Ism, familiya, kasbi yoki tug'ilgan joyi bo'yicha qidiring..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Filters Group */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Filter size={16} color="var(--text-muted)" />
            <select
              id="select-filter-gen"
              className="form-select"
              style={{ width: "auto", minWidth: "160px" }}
              value={selectedGen}
              onChange={(e) => setSelectedGen(e.target.value)}
            >
              <option value="all">Barcha bo&apos;g&apos;inlar</option>
              {[7, 6, 5, 4, 3, 2, 1].map((g) => (
                <option key={g} value={g}>
                  {g}-bo&apos;g&apos;in ({UZBEK_GENERATIONS[g].title_uz})
                </option>
              ))}
            </select>
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
              <span>Yangi shaxs</span>
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
          Topildi: <strong style={{ color: "var(--text-primary)" }}>{filteredPeople.length}</strong> ta shaxs
        </span>
        <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
          🔒 Siz faqat o&apos;zingiz kiritgan yozuvlarni o&apos;zgartirishingiz mumkin
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
            Hech qanday ma&apos;lumot topilmadi
          </h3>
          <p style={{ fontSize: "14px", maxWidth: "400px", margin: "0 auto" }}>
            Qidiruv so&apos;zini o&apos;zgartirib ko&apos;ring yoki yangi oila a&apos;zosini qo&apos;shing.
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

            return (
              <div
                key={person.id}
                className="glass-panel"
                onClick={() => onSelectPerson(person)}
                style={{
                  padding: "20px",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  gap: "14px",
                  borderLeft: `5px solid ${isMale ? "var(--male-color)" : "var(--female-color)"}`,
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                    <span className={`gen-badge gen-badge-${person.generation_level}`}>
                      {person.generation_level}-bo&apos;g&apos;in • {UZBEK_GENERATIONS[person.generation_level]?.title_uz}
                    </span>
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

                  <h3 style={{ fontSize: "18px", fontWeight: 700, color: "var(--text-primary)" }}>
                    {person.first_name} {person.last_name}
                  </h3>
                  {person.patronymic && (
                    <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "2px" }}>
                      {person.patronymic}
                    </p>
                  )}

                  <p style={{ fontSize: "13px", color: "var(--text-gold)", marginTop: "6px", fontWeight: 600 }}>
                    {person.birth_year ? `${person.birth_year}-yil` : "?"} —{" "}
                    {person.is_alive ? "hozir" : person.death_year ? `${person.death_year}-yil` : "?"}
                  </p>

                  <div style={{ marginTop: "10px", display: "flex", flexDirection: "column", gap: "4px", fontSize: "12px", color: "var(--text-muted)" }}>
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
