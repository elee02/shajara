"use client";

import React, { useState, useEffect, useRef } from "react";
import { Person, BranchSide, COMMON_RELATIONSHIPS, Gender } from "@/lib/types";
import { X, Save, AlertCircle, Upload, Phone, Image as ImageIcon, Trash2 } from "lucide-react";

interface PersonFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  personToEdit?: Person | null;
  presetFatherId?: number | null;
  presetMotherId?: number | null;
  presetGenLevel?: number | null;
  presetBranchSide?: BranchSide;
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
  presetBranchSide,
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
  const [phone, setPhone] = useState("");
  const [branchSide, setBranchSide] = useState<BranchSide>("direct");
  const [relationshipTitle, setRelationshipTitle] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string>("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [fatherId, setFatherId] = useState<string>("");
  const [motherId, setMotherId] = useState<string>("");
  const [spouseId, setSpouseId] = useState<string>("");
  const [genLevel, setGenLevel] = useState<number>(1);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

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
      setPhone(personToEdit.phone || "");
      setBranchSide(personToEdit.branch_side || "direct");
      setRelationshipTitle(personToEdit.relationship_title || "");
      setPhotoUrl(personToEdit.photo_url || (personToEdit.photos?.[0] || ""));
      setPhotos(personToEdit.photos || (personToEdit.photo_url ? [personToEdit.photo_url] : []));
      setFatherId(personToEdit.father_id ? String(personToEdit.father_id) : "");
      setMotherId(personToEdit.mother_id ? String(personToEdit.mother_id) : "");
      setSpouseId(personToEdit.spouse_id ? String(personToEdit.spouse_id) : "");
      setGenLevel(personToEdit.generation_level !== undefined ? personToEdit.generation_level : 1);
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
      setPhone("");
      setBranchSide(presetBranchSide || "direct");
      setRelationshipTitle("");
      setPhotoUrl("");
      setPhotos([]);
      setFatherId(presetFatherId ? String(presetFatherId) : "");
      setMotherId(presetMotherId ? String(presetMotherId) : "");
      setSpouseId("");
      setGenLevel(presetGenLevel !== undefined && presetGenLevel !== null ? presetGenLevel : 1);
    }
    setError(null);
  }, [personToEdit, presetFatherId, presetMotherId, presetGenLevel, presetBranchSide, isOpen]);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setIsUploading(true);
      setError(null);

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Rasm yuklashda xatolik");
        }

        setPhotos((prev) => [...prev, data.url]);
        if (!photoUrl) {
          setPhotoUrl(data.url);
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Rasm yuklab bo'lmadi");
      }
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemovePhoto = (urlToRemove: string) => {
    setPhotos((prev) => prev.filter((u) => u !== urlToRemove));
    if (photoUrl === urlToRemove) {
      const remaining = photos.filter((u) => u !== urlToRemove);
      setPhotoUrl(remaining.length > 0 ? remaining[0] : "");
    }
  };

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
        phone: phone.trim() || null,
        branch_side: branchSide,
        relationship_title: relationshipTitle.trim() || null,
        photo_url: photoUrl || (photos.length > 0 ? photos[0] : null),
        photos: photos,
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
        style={{ maxWidth: "700px" }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <div>
            <h2 style={{ fontSize: "20px", fontWeight: 700, fontFamily: "var(--font-serif)", color: "var(--text-gold)" }}>
              {personToEdit ? "Qarindosh ma'lumotlarini tahrirlash" : "Yangi qarindosh qo'shish"}
            </h2>
            <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>
              Yuz suratlari, yaqinlik darajasi va aloqa ma&apos;lumotlarini kiriting
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
          {/* Photo / Portrait Upload Section */}
          <div
            style={{
              background: "var(--bg-tertiary)",
              border: "1px dashed var(--border-primary)",
              borderRadius: "var(--radius-lg)",
              padding: "16px",
              marginBottom: "20px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <ImageIcon size={18} color="var(--text-gold)" />
                <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)" }}>
                  Portret va fotosuratlar
                </span>
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="btn btn-outline btn-sm"
              >
                <Upload size={14} />
                <span>{isUploading ? "Yuklanmoqda..." : "Rasm tanlash"}</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                style={{ display: "none" }}
                onChange={handleFileUpload}
              />
            </div>

            {/* Photos preview gallery */}
            {photos.length === 0 ? (
              <p style={{ fontSize: "12px", color: "var(--text-muted)", textAlign: "center", padding: "10px" }}>
                Ajdodingiz yoki qarindoshingiz suratini yuklang (Telefon yoki kompyuterdan)
              </p>
            ) : (
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "8px" }}>
                {photos.map((url, idx) => (
                  <div
                    key={idx}
                    style={{
                      position: "relative",
                      width: "80px",
                      height: "80px",
                      borderRadius: "10px",
                      overflow: "hidden",
                      border: photoUrl === url ? "2px solid var(--gold-500)" : "1px solid var(--border-subtle)",
                      cursor: "pointer",
                    }}
                    onClick={() => setPhotoUrl(url)}
                    title={photoUrl === url ? "Asosiy portret" : "Asosiy qilish uchun bosing"}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={url}
                      alt="Uploaded face"
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                    {photoUrl === url && (
                      <span
                        style={{
                          position: "absolute",
                          bottom: "0",
                          left: "0",
                          right: "0",
                          background: "rgba(212, 175, 55, 0.9)",
                          color: "#000",
                          fontSize: "9px",
                          fontWeight: 800,
                          textAlign: "center",
                          padding: "1px 0",
                        }}
                      >
                        ASOSIY
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemovePhoto(url);
                      }}
                      style={{
                        position: "absolute",
                        top: "2px",
                        right: "2px",
                        background: "rgba(0,0,0,0.6)",
                        color: "#ef4444",
                        border: "none",
                        borderRadius: "50%",
                        width: "20px",
                        height: "20px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Family Side & Relativeness */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div className="form-group">
              <label className="form-label">Qaysi tomondan qarindosh? *</label>
              <select
                id="select-branch-side"
                className="form-select"
                value={branchSide}
                onChange={(e) => setBranchSide(e.target.value as BranchSide)}
              >
                <option value="father">Ota tomoni (Paternal / Amaki, Amma, Ota bobo)</option>
                <option value="mother">Ona tomoni (Maternal / Tog&apos;a, Xola, Katta ota, Katta ona)</option>
                <option value="direct">O&apos;z avlodlari / Jigarlar (Aka, Uka, Farzand, Nabira)</option>
                <option value="in_laws">Qudachilik / Turmush o&apos;rtog&apos;i tomoni (In-laws)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Sizga yaqinligi (Qarindoshlik darajasi)</label>
              <input
                id="input-rel-title"
                type="text"
                list="rel-suggestions"
                className="form-input"
                placeholder="Masalan: Katta tog'am, Amaki, Xolavachcha..."
                value={relationshipTitle}
                onChange={(e) => setRelationshipTitle(e.target.value)}
              />
              <datalist id="rel-suggestions">
                {COMMON_RELATIONSHIPS.map((r) => (
                  <option key={r.id} value={r.label} />
                ))}
              </datalist>
            </div>
          </div>

          {/* Generation & Gender Row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div className="form-group">
              <label className="form-label">Bo&apos;g&apos;in / Ajdodlar darajasi *</label>
              <select
                id="select-gen-level"
                className="form-select"
                value={genLevel}
                onChange={(e) => setGenLevel(Number(e.target.value))}
              >
                <option value={7}>7-bo&apos;g&apos;in (Tovur bobo - Yetti pusht boshi)</option>
                <option value={6}>6-bo&apos;g&apos;in (Chilla bobo)</option>
                <option value={5}>5-bo&apos;g&apos;in (Bo&apos;g&apos;in bobo)</option>
                <option value={4}>4-bo&apos;g&apos;in (Katta bobo / Katta buvi)</option>
                <option value={3}>3-bo&apos;g&apos;in (Bobo / Buvi — Ota yoki Ona tomondan)</option>
                <option value={2}>2-bo&apos;g&apos;in (Ota-Ona, Tog&apos;a, Amaki, Xola, Amma)</option>
                <option value={1}>1-bo&apos;g&apos;in (O&apos;zi, Aka-uka, Opa-singil, Tengdoshlar)</option>
                <option value={0}>0-bo&apos;g&apos;in (Farzandlar va Jiyanlar)</option>
                <option value={-1}>-1 bo&apos;g&apos;in (Nabiralar)</option>
                <option value={-2}>-2 bo&apos;g&apos;in (Evaralar)</option>
                <option value={-3}>-3 bo&apos;g&apos;in (Chevaralar)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Jinsi *</label>
              <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
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
                placeholder="Masalan: Nodir"
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
                placeholder="Masalan: Mansurov"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Patronymic & Phone (to remember contacts) */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div className="form-group">
              <label className="form-label">Otasining ismi (Sharifi)</label>
              <input
                id="input-patronymic"
                type="text"
                className="form-input"
                placeholder="Akrom o'g'li / qizi"
                value={patronymic}
                onChange={(e) => setPatronymic(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Telefon raqami (Aloqa uchun)</label>
              <div style={{ position: "relative" }}>
                <Phone size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                <input
                  id="input-phone"
                  type="text"
                  className="form-input"
                  style={{ paddingLeft: "38px" }}
                  placeholder="+998 90 123 45 67"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Life dates */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", alignItems: "flex-end" }}>
            <div className="form-group">
              <label className="form-label">Tug&apos;ilgan yili</label>
              <input
                id="input-birth-year"
                type="number"
                className="form-input"
                placeholder="1974"
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
                  placeholder="2015"
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
              <label className="form-label">Tug&apos;ilgan / Yashash joyi</label>
              <input
                id="input-birth-place"
                type="text"
                className="form-input"
                placeholder="Farg'ona, Toshkent, Samarqand..."
                value={birthPlace}
                onChange={(e) => setBirthPlace(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Kasbi / Qiziqishi</label>
              <input
                id="input-occupation"
                type="text"
                className="form-input"
                placeholder="Jurnalist, O'qituvchi, Shifokor..."
                value={occupation}
                onChange={(e) => setOccupation(e.target.value)}
              />
            </div>
          </div>

          {/* Parent Links */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div className="form-group">
              <label className="form-label">Otasi (Daraxtdagi)</label>
              <select
                id="select-father"
                className="form-select"
                value={fatherId}
                onChange={(e) => setFatherId(e.target.value)}
              >
                <option value="">-- Otasi tanlanmagan --</option>
                {potentialFathers.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.first_name} {p.last_name} ({p.birth_year || "?"}) — {p.relationship_title || `${p.generation_level}-bo'g'in`}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Onasi (Daraxtdagi)</label>
              <select
                id="select-mother"
                className="form-select"
                value={motherId}
                onChange={(e) => setMotherId(e.target.value)}
              >
                <option value="">-- Onasi tanlanmagan --</option>
                {potentialMothers.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.first_name} {p.last_name} ({p.birth_year || "?"}) — {p.relationship_title || `${p.generation_level}-bo'g'in`}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Bio & Family memories */}
          <div className="form-group">
            <label className="form-label">Xarakteri, xotiralar va yodda qolgan voqealar</label>
            <textarea
              id="textarea-bio"
              className="form-textarea"
              rows={3}
              placeholder="Qarindoshingiz haqida xotiralar, sevimli mashg'ulotlari, birga o'tgan damlar..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
            />
          </div>

          {/* Actions */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "24px" }}>
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Bekor qilish
            </button>
            <button
              id="btn-submit-person-form"
              type="submit"
              disabled={isSubmitting || isUploading}
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
