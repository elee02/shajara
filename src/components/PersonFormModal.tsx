"use client";

import React, { useState, useEffect } from "react";
import { Person, UZBEK_GENERATIONS, Gender } from "@/lib/types";
import { X, Save, AlertCircle } from "lucide-react";

interface PersonFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  personToEdit?: Person | null;
  presetFatherId?: number | null;
  presetMotherId?: number | null;
  presetGenLevel?: number | null;
  allPeople: Person[];
  onSave: (personData: Partial<Person>) => Promise<void>;
}

export const PersonFormModal: React.FC<PersonFormModalProps> = ({
  isOpen,
  onClose,
  personToEdit,
  presetFatherId,
  presetMotherId,
  presetGenLevel,
  allPeople,
  onSave,
}) => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [patronymic, setPatronymic] = useState("");
  const [gender, setGender] = useState<Gender>("male");
  const [birthYear, setBirthYear] = useState<string>("");
  const [deathYear, setDeathYear] = useState<string>("");
  const [isAlive, setIsAlive] = useState(true);
  const [birthPlace, setBirthPlace] = useState("");
  const [occupation, setOccupation] = useState("");
  const [bio, setBio] = useState("");
  const [fatherId, setFatherId] = useState<string>("");
  const [motherId, setMotherId] = useState<string>("");
  const [spouseId, setSpouseId] = useState<string>("");
  const [genLevel, setGenLevel] = useState<number>(1);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (personToEdit) {
      setFirstName(personToEdit.first_name);
      setLastName(personToEdit.last_name);
      setPatronymic(personToEdit.patronymic || "");
      setGender(personToEdit.gender);
      setBirthYear(personToEdit.birth_year ? String(personToEdit.birth_year) : "");
      setDeathYear(personToEdit.death_year ? String(personToEdit.death_year) : "");
      setIsAlive(personToEdit.is_alive);
      setBirthPlace(personToEdit.birth_place || "");
      setOccupation(personToEdit.occupation || "");
      setBio(personToEdit.bio || "");
      setFatherId(personToEdit.father_id ? String(personToEdit.father_id) : "");
      setMotherId(personToEdit.mother_id ? String(personToEdit.mother_id) : "");
      setSpouseId(personToEdit.spouse_id ? String(personToEdit.spouse_id) : "");
      setGenLevel(personToEdit.generation_level);
    } else {
      setFirstName("");
      setLastName("");
      setPatronymic("");
      setGender("male");
      setBirthYear("");
      setDeathYear("");
      setIsAlive(true);
      setBirthPlace("");
      setOccupation("");
      setBio("");
      setFatherId(presetFatherId ? String(presetFatherId) : "");
      setMotherId(presetMotherId ? String(presetMotherId) : "");
      setSpouseId("");
      setGenLevel(presetGenLevel || 1);
    }
    setError(null);
  }, [personToEdit, presetFatherId, presetMotherId, presetGenLevel, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      setError("Ism va familiyani kiritish majburiy!");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      await onSave({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        patronymic: patronymic.trim() || null,
        gender,
        birth_year: birthYear ? Number(birthYear) : null,
        death_year: !isAlive && deathYear ? Number(deathYear) : null,
        is_alive: isAlive,
        birth_place: birthPlace.trim() || null,
        occupation: occupation.trim() || null,
        bio: bio.trim() || null,
        father_id: fatherId ? Number(fatherId) : null,
        mother_id: motherId ? Number(motherId) : null,
        spouse_id: spouseId ? Number(spouseId) : null,
        generation_level: Number(genLevel),
      });

      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Saqlashda xatolik yuz berdi");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter candidates for parents and spouse
  const potentialFathers = allPeople.filter(
    (p) => p.gender === "male" && (!personToEdit || p.id !== personToEdit.id)
  );
  const potentialMothers = allPeople.filter(
    (p) => p.gender === "female" && (!personToEdit || p.id !== personToEdit.id)
  );
  const potentialSpouses = allPeople.filter(
    (p) => (!personToEdit || p.id !== personToEdit.id)
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "650px" }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <div>
            <h2 style={{ fontSize: "20px", fontWeight: 700, fontFamily: "var(--font-serif)", color: "var(--text-gold)" }}>
              {personToEdit ? "Shaxs ma'lumotlarini tahrirlash" : "Shajaraga yangi shaxs qo'shish"}
            </h2>
            <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>
              Yetti pusht shajarasi uchun ma&apos;lumotlarni kiriting
            </p>
          </div>
          <button onClick={onClose} className="btn btn-secondary btn-icon" style={{ width: "32px", height: "32px" }}>
            <X size={18} />
          </button>
        </div>

        {error && (
          <div
            style={{
              padding: "12px 16px",
              background: "rgba(239, 68, 68, 0.15)",
              border: "1px solid rgba(239, 68, 68, 0.4)",
              borderRadius: "var(--radius-md)",
              color: "#f87171",
              fontSize: "13px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "18px",
            }}
          >
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Generation & Gender Row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div className="form-group">
              <label className="form-label">Yetti Pusht bo&apos;g&apos;ini *</label>
              <select
                id="select-gen-level"
                className="form-select"
                value={genLevel}
                onChange={(e) => setGenLevel(Number(e.target.value))}
              >
                {[7, 6, 5, 4, 3, 2, 1].map((g) => (
                  <option key={g} value={g}>
                    {g}-bo&apos;g&apos;in — {UZBEK_GENERATIONS[g].title_uz}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Jinsi *</label>
              <div style={{ display: "flex", gap: "12px", marginTop: "4px" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "14px", cursor: "pointer" }}>
                  <input
                    type="radio"
                    name="gender"
                    checked={gender === "male"}
                    onChange={() => setGender("male")}
                    style={{ accentColor: "var(--male-color)" }}
                  />
                  Erkak
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "14px", cursor: "pointer" }}>
                  <input
                    type="radio"
                    name="gender"
                    checked={gender === "female"}
                    onChange={() => setGender("female")}
                    style={{ accentColor: "var(--female-color)" }}
                  />
                  Ayol
                </label>
              </div>
            </div>
          </div>

          {/* Name & Surname */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div className="form-group">
              <label className="form-label">Ismi *</label>
              <input
                id="input-first-name"
                type="text"
                className="form-input"
                placeholder="Masalan: Ulug'bek"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Familiyasi *</label>
              <input
                id="input-last-name"
                type="text"
                className="form-input"
                placeholder="Masalan: Shermatov"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Patronymic */}
          <div className="form-group">
            <label className="form-label">Otasining ismi (Sharifi)</label>
            <input
              id="input-patronymic"
              type="text"
              className="form-input"
              placeholder="Masalan: Rahimjon o'g'li / qizi"
              value={patronymic}
              onChange={(e) => setPatronymic(e.target.value)}
            />
          </div>

          {/* Life dates */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", alignItems: "flex-end" }}>
            <div className="form-group">
              <label className="form-label">Tug&apos;ilgan yili</label>
              <input
                id="input-birth-year"
                type="number"
                className="form-input"
                placeholder="1970"
                value={birthYear}
                onChange={(e) => setBirthYear(e.target.value)}
                min="1000"
                max="2100"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Holati</label>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontSize: "13px",
                  padding: "10px 14px",
                  background: "var(--bg-tertiary)",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--border-subtle)",
                  cursor: "pointer",
                }}
              >
                <input
                  id="checkbox-is-alive"
                  type="checkbox"
                  checked={isAlive}
                  onChange={(e) => setIsAlive(e.target.checked)}
                  style={{ accentColor: "var(--emerald-500)" }}
                />
                Hozir hayot
              </label>
            </div>

            {!isAlive && (
              <div className="form-group">
                <label className="form-label">Vafot etgan yili</label>
                <input
                  id="input-death-year"
                  type="number"
                  className="form-input"
                  placeholder="2012"
                  value={deathYear}
                  onChange={(e) => setDeathYear(e.target.value)}
                  min="1000"
                  max="2100"
                />
              </div>
            )}
          </div>

          {/* Place & Occupation */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div className="form-group">
              <label className="form-label">Tug&apos;ilgan joyi / Viloyat / Shahar</label>
              <input
                id="input-birth-place"
                type="text"
                className="form-input"
                placeholder="Toshkent, Buxoro, Samarqand..."
                value={birthPlace}
                onChange={(e) => setBirthPlace(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Kasbi / Faoliyati</label>
              <input
                id="input-occupation"
                type="text"
                className="form-input"
                placeholder="O'qituvchi, Hunarmand, Shifokor..."
                value={occupation}
                onChange={(e) => setOccupation(e.target.value)}
              />
            </div>
          </div>

          {/* Parent Links */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div className="form-group">
              <label className="form-label">Otasi (Shajaradagi)</label>
              <select
                id="select-father"
                className="form-select"
                value={fatherId}
                onChange={(e) => setFatherId(e.target.value)}
              >
                <option value="">-- Otasi tanlanmagan --</option>
                {potentialFathers.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.first_name} {p.last_name} ({p.birth_year || "?"}) — {p.generation_level}-bo&apos;g&apos;in
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Onasi (Shajaradagi)</label>
              <select
                id="select-mother"
                className="form-select"
                value={motherId}
                onChange={(e) => setMotherId(e.target.value)}
              >
                <option value="">-- Onasi tanlanmagan --</option>
                {potentialMothers.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.first_name} {p.last_name} ({p.birth_year || "?"})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Notes / Bio */}
          <div className="form-group">
            <label className="form-label">Tarjimai hol / Qo&apos;shimcha xotiralar</label>
            <textarea
              id="textarea-bio"
              className="form-textarea"
              rows={3}
              placeholder="Ajdodimiz haqida esdaliklar, fazilatlari, yashagan davri..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
            />
          </div>

          {/* Form Actions */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "24px" }}>
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Bekor qilish
            </button>
            <button
              id="btn-submit-person-form"
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary"
            >
              <Save size={16} />
              <span>{isSubmitting ? "Saqlanmoqda..." : "Saqlash"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
