"use client";

import React, { useState } from "react";
import { Person, User, UZBEK_GENERATION_LABELS } from "@/lib/types";
import { getDynamicBranchSide, getKinshipTitle } from "@/lib/kinship";
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
  ShieldCheck,
  Phone,
  HeartHandshake,
  Compass
} from "lucide-react";

interface PersonModalProps {
  person: Person & { can_edit?: boolean; created_by_name?: string } | null;
  currentUser: User | null;
  allPeople: Person[];
  focusPerson?: Person | null;
  onSetFocus?: (personId: number) => void;
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
  focusPerson = null,
  onSetFocus,
  onClose,
  onEdit,
  onDelete,
  onSelectRelative,
  onAddChild,
}) => {
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  if (!person) return null;

  const isOwner = currentUser?.id === person.created_by || currentUser?.role === "admin";
  const genInfo = UZBEK_GENERATION_LABELS[person.generation_level] || { title_uz: `${person.generation_level}-bo'g'in`, desc: "" };

  const father = person.father_id ? allPeople.find((p) => p.id === person.father_id) : null;
  const mother = person.mother_id ? allPeople.find((p) => p.id === person.mother_id) : null;
  const spouse = person.spouse_id ? allPeople.find((p) => p.id === person.spouse_id) : null;
  const children = allPeople.filter((p) => p.father_id === person.id || p.mother_id === person.id);

  const mainPhoto = selectedPhoto || person.photo_url || (person.photos && person.photos[0]) || null;
  const photosList = person.photos || (person.photo_url ? [person.photo_url] : []);

  const dynSide = getDynamicBranchSide(person, focusPerson, allPeople);
  const dynTitle = getKinshipTitle(person, focusPerson, allPeople);

  const branchSideLabels: Record<string, { label: string; color: string; bg: string }> = {
    father: { label: "Ota tomoni (Paternal)", color: "#38bdf8", bg: "rgba(56, 189, 248, 0.15)" },
    mother: { label: "Ona tomoni (Maternal)", color: "#f472b6", bg: "rgba(244, 114, 182, 0.15)" },
    direct: { label: "O'z oilasi & Avlodlar", color: "#34d399", bg: "rgba(52, 211, 153, 0.15)" },
    in_laws: { label: "Qudachilik", color: "#c084fc", bg: "rgba(192, 132, 252, 0.15)" },
  };

  const sideBadge = branchSideLabels[person.branch_side] || branchSideLabels.direct;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "660px" }}
      >
        {/* Header & Portrait */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "18px" }}>
          <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
            {/* Portrait Frame */}
            <div
              style={{
                width: "84px",
                height: "84px",
                borderRadius: "50%",
                overflow: "hidden",
                border: "3px solid var(--gold-500)",
                boxShadow: "var(--shadow-gold)",
                background: "var(--bg-tertiary)",
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {mainPhoto ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={mainPhoto}
                  alt={person.first_name}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <UserIcon
                  size={42}
                  color={person.gender === "male" ? "var(--male-color)" : "var(--female-color)"}
                />
              )}
            </div>

            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "6px" }}>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    padding: "2px 8px",
                    borderRadius: "9999px",
                    background: sideBadge.bg,
                    color: sideBadge.color,
                  }}
                >
                  {sideBadge.label}
                </span>

                {person.relationship_title && (
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: 700,
                      background: "rgba(212, 175, 55, 0.2)",
                      color: "var(--text-gold)",
                      padding: "2px 10px",
                      borderRadius: "9999px",
                      border: "1px solid rgba(212, 175, 55, 0.4)",
                    }}
                  >
                    ⭐ {person.relationship_title}
                  </span>
                )}
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
          </div>

          <button onClick={onClose} className="btn btn-secondary btn-icon" style={{ width: "32px", height: "32px" }}>
            <X size={18} />
          </button>
        </div>

        {/* Gallery thumbnails if multiple pictures */}
        {photosList.length > 1 && (
          <div style={{ marginBottom: "16px", display: "flex", gap: "8px", alignItems: "center" }}>
            <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Rasmlar:</span>
            {photosList.map((url, i) => (
              <div
                key={i}
                onClick={() => setSelectedPhoto(url)}
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "8px",
                  overflow: "hidden",
                  cursor: "pointer",
                  border: mainPhoto === url ? "2px solid var(--gold-500)" : "1px solid var(--border-subtle)",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="Gallery" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
            ))}
          </div>
        )}

        {/* Quick Contact & Details Ribbon */}
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
              <strong>Jinsi:</strong> {person.gender === "male" ? "Erkak" : "Ayol"} • {genInfo.title_uz}
            </span>
          </div>

          {person.phone && (
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px" }}>
              <Phone size={16} color="var(--emerald-500)" />
              <span>
                <strong>Tel:</strong>{" "}
                <a
                  href={`tel:${person.phone}`}
                  style={{ color: "var(--emerald-500)", textDecoration: "none", fontWeight: 600 }}
                >
                  {person.phone}
                </a>
              </span>
            </div>
          )}

          {person.birth_place && (
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px" }}>
              <MapPin size={16} color="var(--text-gold)" />
              <span>
                <strong>Manzil:</strong> {person.birth_place}
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

        {/* Bio / Memories */}
        {person.bio && (
          <div style={{ marginBottom: "20px" }}>
            <h4 style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "6px" }}>
              Xotiralar va ma&apos;lumotlar
            </h4>
            <p style={{ fontSize: "14px", lineHeight: "1.6", color: "var(--text-primary)", background: "var(--bg-tertiary)", padding: "14px", borderRadius: "var(--radius-md)" }}>
              {person.bio}
            </p>
          </div>
        )}

        {/* Family Ties */}
        <div style={{ marginBottom: "20px" }}>
          <h4 style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "10px" }}>
            Yaqin qarindoshlar aloqasi
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
                <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>{father.relationship_title || father.birth_year || "?"}</span>
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
                <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>{mother.relationship_title || mother.birth_year || "?"}</span>
              </div>
            )}

            {spouse && (
              <div
                onClick={() => onSelectRelative(spouse.id)}
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
                  <HeartHandshake size={15} color="var(--emerald-500)" />
                  <span style={{ fontSize: "13px" }}>
                    <strong style={{ color: "var(--text-gold)" }}>Turmush o&apos;rtog&apos;i:</strong> {spouse.first_name} {spouse.last_name}
                  </span>
                </div>
                <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>{spouse.birth_year || "?"}</span>
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
                      {ch.first_name} {ch.last_name} ({ch.relationship_title || ch.birth_year || "?"})
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
              <ShieldCheck size={14} /> Sizning kiritmangiz
            </span>
          ) : (
            <span style={{ color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "4px" }}>
              <Lock size={13} /> Himoyalangan
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
