"use client";

import React from "react";
import { Person, UZBEK_GENERATIONS, User } from "@/lib/types";
import { 
  X, 
  MapPin, 
  Briefcase, 
  Calendar, 
  User as UserIcon, 
  Edit3, 
  Trash2, 
  Lock, 
  Plus,
  GitCommit,
  ShieldCheck
} from "lucide-react";

interface PersonModalProps {
  person: Person & { can_edit?: boolean; created_by_name?: string } | null;
  currentUser: User | null;
  allPeople: Person[];
  onClose: () => void;
  onEdit: (person: Person) => void;
  onDelete: (personId: number) => void;
  onSelectRelative: (personId: number) => void;
  onAddChild: (parentId: number) => void;
}

export const PersonModal: React.FC<PersonModalProps> = ({
  person,
  currentUser,
  allPeople,
  onClose,
  onEdit,
  onDelete,
  onSelectRelative,
  onAddChild,
}) => {
  if (!person) return null;

  const isOwner = currentUser?.id === person.created_by || currentUser?.role === "admin";
  const genInfo = UZBEK_GENERATIONS[person.generation_level];

  // Relatives
  const father = person.father_id ? allPeople.find((p) => p.id === person.father_id) : null;
  const mother = person.mother_id ? allPeople.find((p) => p.id === person.mother_id) : null;
  const children = allPeople.filter((p) => p.father_id === person.id || p.mother_id === person.id);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "600px" }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
              <span className={`gen-badge gen-badge-${person.generation_level}`}>
                {person.generation_level}-bo&apos;g&apos;in
              </span>
              <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-gold)" }}>
                {genInfo?.title_uz}
              </span>
            </div>
            <h2 style={{ fontSize: "22px", fontWeight: 800, color: "var(--text-primary)" }}>
              {person.first_name} {person.last_name}
            </h2>
            {person.patronymic && (
              <p style={{ fontSize: "14px", color: "var(--text-secondary)" }}>
                {person.patronymic}
              </p>
            )}
          </div>
          <button onClick={onClose} className="btn btn-secondary btn-icon" style={{ width: "32px", height: "32px" }}>
            <X size={18} />
          </button>
        </div>

        {/* Life details */}
        <div
          className="glass-panel"
          style={{
            padding: "16px",
            marginBottom: "20px",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "14px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px" }}>
            <Calendar size={16} color="var(--text-gold)" />
            <span>
              <strong>Yillari:</strong> {person.birth_year || "?"} — {person.is_alive ? "Hozir hayot" : person.death_year || "?"}
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px" }}>
            <UserIcon size={16} color={person.gender === "male" ? "var(--male-color)" : "var(--female-color)"} />
            <span>
              <strong>Jinsi:</strong> {person.gender === "male" ? "Erkak" : "Ayol"}
            </span>
          </div>

          {person.birth_place && (
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px" }}>
              <MapPin size={16} color="var(--text-gold)" />
              <span>
                <strong>Tug&apos;ilgan joyi:</strong> {person.birth_place}
              </span>
            </div>
          )}

          {person.occupation && (
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px" }}>
              <Briefcase size={16} color="var(--text-gold)" />
              <span>
                <strong>Kasbi:</strong> {person.occupation}
              </span>
            </div>
          )}
        </div>

        {/* Bio */}
        {person.bio && (
          <div style={{ marginBottom: "20px" }}>
            <h4 style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "6px" }}>
              Tarjimai hol va esdaliklar
            </h4>
            <p style={{ fontSize: "14px", lineHeight: "1.6", color: "var(--text-primary)", background: "var(--bg-tertiary)", padding: "14px", borderRadius: "var(--radius-md)" }}>
              {person.bio}
            </p>
          </div>
        )}

        {/* Relatives Section */}
        <div style={{ marginBottom: "20px" }}>
          <h4 style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "10px" }}>
            Yaqin qarindoshlari
          </h4>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {father && (
              <div
                onClick={() => onSelectRelative(father.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 14px",
                  background: "var(--bg-tertiary)",
                  borderRadius: "var(--radius-md)",
                  cursor: "pointer",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <GitCommit size={15} color="var(--male-color)" />
                  <span style={{ fontSize: "13px" }}>
                    <strong style={{ color: "var(--text-gold)" }}>Otasi:</strong> {father.first_name} {father.last_name}
                  </span>
                </div>
                <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>{father.birth_year || "?"}</span>
              </div>
            )}

            {mother && (
              <div
                onClick={() => onSelectRelative(mother.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 14px",
                  background: "var(--bg-tertiary)",
                  borderRadius: "var(--radius-md)",
                  cursor: "pointer",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <GitCommit size={15} color="var(--female-color)" />
                  <span style={{ fontSize: "13px" }}>
                    <strong style={{ color: "var(--text-gold)" }}>Onasi:</strong> {mother.first_name} {mother.last_name}
                  </span>
                </div>
                <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>{mother.birth_year || "?"}</span>
              </div>
            )}

            {children.length > 0 && (
              <div style={{ marginTop: "4px" }}>
                <span style={{ fontSize: "12px", color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>
                  Farzandlari ({children.length}):
                </span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {children.map((ch) => (
                    <button
                      key={ch.id}
                      onClick={() => onSelectRelative(ch.id)}
                      className="btn btn-sm btn-secondary"
                      style={{ fontSize: "12px", padding: "4px 10px" }}
                    >
                      {ch.first_name} {ch.last_name} ({ch.birth_year || "?"})
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Creator attribution notice */}
        <div
          style={{
            background: "var(--bg-primary)",
            padding: "12px 16px",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--border-subtle)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: "12px",
            marginBottom: "20px",
          }}
        >
          <span style={{ color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "6px" }}>
            <UserIcon size={14} />
            Kiritgan a&apos;zo: <strong style={{ color: "var(--text-primary)" }}>{person.created_by_name || "Noma'lum"}</strong>
          </span>

          {isOwner ? (
            <span style={{ color: "var(--emerald-500)", display: "flex", alignItems: "center", gap: "4px", fontWeight: 600 }}>
              <ShieldCheck size={14} /> Sizning kiritmangiz (Tahrirlash mumkin)
            </span>
          ) : (
            <span style={{ color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "4px" }}>
              <Lock size={13} /> Himoyalangan (Faqat ko&apos;rish)
            </span>
          )}
        </div>

        {/* Actions bar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
          <div>
            {currentUser && (
              <button
                id="btn-modal-add-child"
                onClick={() => {
                  onClose();
                  onAddChild(person.id);
                }}
                className="btn btn-outline btn-sm"
              >
                <Plus size={14} />
                <span>Farzand qo&apos;shish</span>
              </button>
            )}
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            {isOwner && (
              <>
                <button
                  id="btn-modal-edit"
                  onClick={() => {
                    onClose();
                    onEdit(person);
                  }}
                  className="btn btn-primary btn-sm"
                >
                  <Edit3 size={14} />
                  <span>Tahrirlash</span>
                </button>
                <button
                  id="btn-modal-delete"
                  onClick={() => {
                    if (confirm(`Haqiqatan ham "${person.first_name} ${person.last_name}"ni shajaradan o'chirmoqchimisiz?`)) {
                      onClose();
                      onDelete(person.id);
                    }
                  }}
                  className="btn btn-danger btn-sm"
                >
                  <Trash2 size={14} />
                  <span>O&apos;chirish</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
