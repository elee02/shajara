"use client";

import React, { useState, useRef } from "react";
import { Person, User, UZBEK_GENERATION_LABELS, BranchSide } from "@/lib/types";
import { 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  User as UserIcon, 
  Plus, 
  Edit3, 
  Lock, 
  MapPin, 
  Briefcase, 
  Phone,
  Sparkles,
  Users
} from "lucide-react";

interface TreeViewProps {
  people: (Person & { can_edit?: boolean; created_by_name?: string })[];
  currentUser: User | null;
  onSelectPerson: (person: Person) => void;
  onAddRelated: (parentId: number, relationType: "child" | "father") => void;
  onEditPerson: (person: Person) => void;
}

export const TreeView: React.FC<TreeViewProps> = ({
  people,
  currentUser,
  onSelectPerson,
  onAddRelated,
  onEditPerson,
}) => {
  const [scale, setScale] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [activeSide, setActiveSide] = useState<"all" | BranchSide>("all");
  const [highlightGen, setHighlightGen] = useState<number | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Filter by side if selected
  const filteredPeople = activeSide === "all" ? people : people.filter((p) => p.branch_side === activeSide);

  // Collect all generation levels present in dataset, sorted descending (e.g. 7 down to -3)
  const uniqueGenLevels = Array.from(new Set(people.map((p) => p.generation_level))).sort((a, b) => b - a);

  const peopleByGen = uniqueGenLevels.map((gen) => ({
    level: gen,
    label: UZBEK_GENERATION_LABELS[gen] || { title_uz: `${gen}-bo'g'in`, desc: "" },
    members: filteredPeople.filter((p) => p.generation_level === gen),
  }));

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest(".person-node-card") || (e.target as HTMLElement).closest("button")) {
      return;
    }
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const resetZoom = () => {
    setScale(1);
    setPan({ x: 0, y: 0 });
  };

  const sideColors: Record<BranchSide, { border: string; bg: string; text: string }> = {
    father: { border: "#38bdf8", bg: "rgba(56, 189, 248, 0.12)", text: "#38bdf8" },
    mother: { border: "#f472b6", bg: "rgba(244, 114, 182, 0.12)", text: "#f472b6" },
    direct: { border: "#34d399", bg: "rgba(52, 211, 153, 0.12)", text: "#34d399" },
    in_laws: { border: "#c084fc", bg: "rgba(192, 132, 252, 0.12)", text: "#c084fc" },
  };

  return (
    <div
      ref={containerRef}
      id="tree-canvas-container"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      style={{
        position: "relative",
        width: "100%",
        height: "calc(100vh - 72px)",
        overflow: "hidden",
        cursor: isDragging ? "grabbing" : "grab",
        userSelect: "none",
        background: "radial-gradient(ellipse at center, var(--bg-secondary) 0%, var(--bg-primary) 100%)",
      }}
    >
      {/* Zoom controls */}
      <div
        className="no-print"
        style={{
          position: "absolute",
          top: "20px",
          right: "20px",
          zIndex: 40,
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          background: "var(--bg-card)",
          padding: "8px",
          borderRadius: "var(--radius-md)",
          border: "1px solid var(--border-subtle)",
          backdropFilter: "blur(12px)",
          boxShadow: "var(--shadow-md)",
        }}
      >
        <button
          id="btn-zoom-in"
          onClick={() => setScale((s) => Math.min(s + 0.15, 2.0))}
          className="btn btn-secondary btn-icon"
          title="Kattalashtirish"
          style={{ width: "36px", height: "36px" }}
        >
          <ZoomIn size={18} />
        </button>
        <button
          id="btn-zoom-out"
          onClick={() => setScale((s) => Math.max(s - 0.15, 0.4))}
          className="btn btn-secondary btn-icon"
          title="Kichiklashtirish"
          style={{ width: "36px", height: "36px" }}
        >
          <ZoomOut size={18} />
        </button>
        <button
          id="btn-zoom-reset"
          onClick={resetZoom}
          className="btn btn-secondary btn-icon"
          title="Ko'rinishni tiklash"
          style={{ width: "36px", height: "36px" }}
        >
          <Maximize2 size={16} />
        </button>
      </div>

      {/* Side of Family Filter Buttons */}
      <div
        className="no-print"
        style={{
          position: "absolute",
          top: "20px",
          left: "20px",
          zIndex: 40,
          display: "flex",
          alignItems: "center",
          gap: "6px",
          background: "var(--bg-card)",
          padding: "6px 12px",
          borderRadius: "var(--radius-lg)",
          border: "1px solid var(--border-subtle)",
          backdropFilter: "blur(12px)",
          boxShadow: "var(--shadow-md)",
          flexWrap: "wrap",
          maxWidth: "calc(100vw - 120px)",
        }}
      >
        <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-gold)", display: "flex", alignItems: "center", gap: "4px" }}>
          <Users size={14} /> Shoxobcha:
        </span>
        <button
          onClick={() => setActiveSide("all")}
          className="btn btn-sm"
          style={{
            background: activeSide === "all" ? "var(--gold-gradient)" : "transparent",
            color: activeSide === "all" ? "#000" : "var(--text-secondary)",
            padding: "4px 10px",
            fontSize: "12px",
            borderRadius: "6px",
          }}
        >
          Barcha qarindoshlar ({people.length})
        </button>
        <button
          onClick={() => setActiveSide("father")}
          className="btn btn-sm"
          style={{
            background: activeSide === "father" ? "rgba(56, 189, 248, 0.25)" : "transparent",
            color: activeSide === "father" ? "#38bdf8" : "var(--text-muted)",
            border: activeSide === "father" ? "1px solid #38bdf8" : "none",
            padding: "4px 10px",
            fontSize: "12px",
            borderRadius: "6px",
          }}
        >
          👨‍🦳 Ota tomoni (Amaki, Amma...)
        </button>
        <button
          onClick={() => setActiveSide("mother")}
          className="btn btn-sm"
          style={{
            background: activeSide === "mother" ? "rgba(244, 114, 182, 0.25)" : "transparent",
            color: activeSide === "mother" ? "#f472b6" : "var(--text-muted)",
            border: activeSide === "mother" ? "1px solid #f472b6" : "none",
            padding: "4px 10px",
            fontSize: "12px",
            borderRadius: "6px",
          }}
        >
          👩‍🦳 Ona tomoni (Tog&apos;a, Xola...)
        </button>
        <button
          onClick={() => setActiveSide("direct")}
          className="btn btn-sm"
          style={{
            background: activeSide === "direct" ? "rgba(52, 211, 153, 0.25)" : "transparent",
            color: activeSide === "direct" ? "#34d399" : "var(--text-muted)",
            border: activeSide === "direct" ? "1px solid #34d399" : "none",
            padding: "4px 10px",
            fontSize: "12px",
            borderRadius: "6px",
          }}
        >
          🌱 O&apos;z avlodlari (Farzand, Nabira...)
        </button>
      </div>

      {/* Canvas Canvas Transform Area */}
      <div
        id="tree-diagram-export-target"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
          transformOrigin: "top center",
          transition: isDragging ? "none" : "transform 0.15s ease-out",
          padding: "90px 40px 120px 40px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "54px",
          minWidth: "1300px",
        }}
      >
        {peopleByGen.map((genTier) => {
          if (genTier.members.length === 0) return null;

          return (
            <div
              key={genTier.level}
              style={{
                width: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              {/* Generation Header Pill */}
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "10px",
                  background: "var(--bg-secondary)",
                  border: "1px solid var(--border-primary)",
                  padding: "6px 20px",
                  borderRadius: "9999px",
                  marginBottom: "20px",
                  boxShadow: "var(--shadow-sm)",
                }}
              >
                <span className={`gen-badge gen-badge-${Math.max(1, Math.min(7, genTier.level))}`}>
                  {genTier.level >= 1 ? `${genTier.level}-BO'G'IN` : `AVLOd (${genTier.level})`}
                </span>
                <span style={{
                  fontFamily: "var(--font-serif)",
                  fontWeight: 700,
                  fontSize: "14px",
                  color: "var(--text-gold)",
                  letterSpacing: "0.03em"
                }}>
                  {genTier.label.title_uz}
                </span>
                <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                  ({genTier.members.length} qarindosh)
                </span>
              </div>

              {/* Members Cards Row */}
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  justifyContent: "center",
                  gap: "24px",
                  maxWidth: "1500px",
                }}
              >
                {genTier.members.map((person) => {
                  const isOwner = currentUser?.id === person.created_by || currentUser?.role === "admin";
                  const isMale = person.gender === "male";
                  const portrait = person.photo_url || (person.photos && person.photos[0]) || null;
                  const sideStyle = sideColors[person.branch_side] || sideColors.direct;

                  return (
                    <div
                      key={person.id}
                      id={`person-card-${person.id}`}
                      className={`person-node-card glass-panel`}
                      onClick={() => onSelectPerson(person)}
                      style={{
                        width: "290px",
                        padding: "16px",
                        cursor: "pointer",
                        position: "relative",
                        borderTop: `4px solid ${isMale ? "var(--male-color)" : "var(--female-color)"}`,
                        boxShadow: "var(--shadow-md)",
                        display: "flex",
                        flexDirection: "column",
                        gap: "12px",
                        borderRadius: "var(--radius-md)",
                        transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateY(-4px)";
                        e.currentTarget.style.borderColor = "var(--border-focus)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.borderColor = "var(--border-subtle)";
                      }}
                    >
                      {/* Top Header: Portrait + Basic Meta */}
                      <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                        {/* Portrait Thumbnail */}
                        <div
                          style={{
                            width: "56px",
                            height: "56px",
                            borderRadius: "50%",
                            overflow: "hidden",
                            border: `2px solid ${isMale ? "var(--male-color)" : "var(--female-color)"}`,
                            background: "var(--bg-tertiary)",
                            flexShrink: 0,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            boxShadow: "var(--shadow-sm)",
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
                              size={28}
                              color={isMale ? "var(--male-color)" : "var(--female-color)"}
                            />
                          )}
                        </div>

                        {/* Name and Kinship Title */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          {person.relationship_title && (
                            <div
                              style={{
                                fontSize: "11px",
                                fontWeight: 700,
                                color: sideStyle.text,
                                display: "inline-block",
                                background: sideStyle.bg,
                                padding: "1px 6px",
                                borderRadius: "4px",
                                marginBottom: "2px",
                              }}
                            >
                              ⭐ {person.relationship_title}
                            </div>
                          )}

                          <h3
                            style={{
                              fontSize: "15px",
                              fontWeight: 700,
                              color: "var(--text-primary)",
                              lineHeight: "1.2",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {person.first_name} {person.last_name}
                          </h3>

                          {person.patronymic && (
                            <p style={{ fontSize: "11px", color: "var(--text-secondary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                              {person.patronymic}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Dates & Living Status */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px" }}>
                        <span style={{ color: "var(--text-gold)", fontWeight: 600 }}>
                          {person.birth_year ? `${person.birth_year}-y.` : "?"} —{" "}
                          {person.is_alive ? "hozir" : person.death_year ? `${person.death_year}-y.` : "?"}
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

                      {/* Details snippet: Phone / Place / Occupation */}
                      <div style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "11px", color: "var(--text-muted)" }}>
                        {person.phone && (
                          <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--emerald-500)" }}>
                            <Phone size={12} />
                            <span>{person.phone}</span>
                          </div>
                        )}
                        {person.birth_place && (
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <MapPin size={12} />
                            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {person.birth_place}
                            </span>
                          </div>
                        )}
                        {person.occupation && (
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <Briefcase size={12} />
                            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {person.occupation}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Creator attribution footer */}
                      <div
                        style={{
                          marginTop: "2px",
                          paddingTop: "8px",
                          borderTop: "1px solid var(--border-subtle)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          fontSize: "11px",
                        }}
                      >
                        <span style={{ color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "4px" }}>
                          <UserIcon size={11} />
                          {person.created_by_name || "Oila a'zosi"}
                        </span>

                        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                          {isOwner ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onEditPerson(person);
                              }}
                              className="btn btn-sm btn-secondary"
                              style={{ padding: "3px 6px", fontSize: "10px", height: "auto" }}
                              title="Tahrirlash"
                            >
                              <Edit3 size={11} />
                              <span>Tahrirlash</span>
                            </button>
                          ) : (
                            <span style={{ color: "var(--text-muted)" }} title="Himoyalangan">
                              <Lock size={11} />
                            </span>
                          )}

                          {currentUser && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onAddRelated(person.id, "child");
                              }}
                              className="btn btn-sm btn-outline"
                              style={{ padding: "3px 6px", fontSize: "10px", height: "auto" }}
                              title="Farzand qo'shish"
                            >
                              <Plus size={11} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
