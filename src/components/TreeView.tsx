"use client";

import React, { useState, useRef } from "react";
import { Person, UZBEK_GENERATIONS, User } from "@/lib/types";
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
  Sparkles,
  Heart
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
  const [highlightGen, setHighlightGen] = useState<number | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Group people by generation level (7 down to 1)
  const generations = [7, 6, 5, 4, 3, 2, 1];
  const peopleByGen = generations.map((gen) => ({
    level: gen,
    info: UZBEK_GENERATIONS[gen],
    members: people.filter((p) => p.generation_level === gen),
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
      {/* Canvas Floating Controls */}
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

      {/* Generation Quick Filter Bar */}
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
          maxWidth: "calc(100vw - 120px)",
          overflowX: "auto",
        }}
      >
        <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-gold)", display: "flex", alignItems: "center", gap: "4px" }}>
          <Sparkles size={14} /> Yetti Pusht:
        </span>
        <button
          onClick={() => setHighlightGen(null)}
          className="btn btn-sm"
          style={{
            background: highlightGen === null ? "var(--gold-gradient)" : "transparent",
            color: highlightGen === null ? "#000" : "var(--text-secondary)",
            padding: "4px 8px",
            fontSize: "11px",
            borderRadius: "6px",
          }}
        >
          Barchasi
        </button>
        {generations.map((g) => (
          <button
            key={g}
            onClick={() => setHighlightGen(highlightGen === g ? null : g)}
            className="btn btn-sm"
            style={{
              background: highlightGen === g ? "var(--bg-tertiary)" : "transparent",
              color: highlightGen === g ? "var(--text-gold)" : "var(--text-muted)",
              border: highlightGen === g ? "1px solid var(--border-primary)" : "none",
              padding: "4px 8px",
              fontSize: "11px",
              borderRadius: "6px",
              whiteSpace: "nowrap",
            }}
          >
            {g}. {UZBEK_GENERATIONS[g].title_uz}
          </button>
        ))}
      </div>

      {/* Pannable & Zoomable Transform Area */}
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
          minWidth: "1200px",
        }}
      >
        {peopleByGen.map((genTier) => {
          const isFaded = highlightGen !== null && highlightGen !== genTier.level;
          const isHighlighted = highlightGen === genTier.level;

          return (
            <div
              key={genTier.level}
              style={{
                width: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                opacity: isFaded ? 0.35 : 1,
                transition: "opacity 0.25s ease",
              }}
            >
              {/* Generation Header Pill */}
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "10px",
                  background: isHighlighted ? "var(--bg-tertiary)" : "var(--bg-secondary)",
                  border: `1px solid ${isHighlighted ? "var(--gold-500)" : "var(--border-primary)"}`,
                  padding: "6px 20px",
                  borderRadius: "9999px",
                  marginBottom: "20px",
                  boxShadow: isHighlighted ? "var(--gold-glow)" : "var(--shadow-sm)",
                }}
              >
                <span className={`gen-badge gen-badge-${genTier.level}`}>
                  {genTier.level}-BO&apos;G&apos;IN
                </span>
                <span style={{
                  fontFamily: "var(--font-serif)",
                  fontWeight: 700,
                  fontSize: "14px",
                  color: "var(--text-gold)",
                  letterSpacing: "0.03em"
                }}>
                  {genTier.info.title_uz}
                </span>
                <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                  ({genTier.members.length} a&apos;zo)
                </span>
              </div>

              {/* Members Row */}
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  justifyContent: "center",
                  gap: "24px",
                  maxWidth: "1400px",
                }}
              >
                {genTier.members.length === 0 ? (
                  <div
                    style={{
                      padding: "16px 28px",
                      borderRadius: "var(--radius-md)",
                      border: "1px dashed var(--border-subtle)",
                      color: "var(--text-muted)",
                      fontSize: "13px",
                      fontStyle: "italic",
                    }}
                  >
                    Bu bo&apos;g&apos;inda hozircha shaxslar yo&apos;q
                  </div>
                ) : (
                  genTier.members.map((person) => {
                    const isOwner = currentUser?.id === person.created_by || currentUser?.role === "admin";
                    const isMale = person.gender === "male";

                    return (
                      <div
                        key={person.id}
                        id={`person-card-${person.id}`}
                        className={`person-node-card glass-panel`}
                        onClick={() => onSelectPerson(person)}
                        style={{
                          width: "270px",
                          padding: "18px",
                          cursor: "pointer",
                          position: "relative",
                          borderTop: `4px solid ${isMale ? "var(--male-color)" : "var(--female-color)"}`,
                          boxShadow: genTier.level === 7 ? "var(--shadow-gold)" : "var(--shadow-md)",
                          display: "flex",
                          flexDirection: "column",
                          gap: "10px",
                          borderRadius: "var(--radius-md)",
                          transform: "translateY(0)",
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
                        {/* Top Meta: Gender & Living Status */}
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <span
                            style={{
                              fontSize: "11px",
                              fontWeight: 700,
                              padding: "2px 8px",
                              borderRadius: "6px",
                              background: isMale ? "var(--male-bg)" : "var(--female-bg)",
                              color: isMale ? "var(--male-color)" : "var(--female-color)",
                            }}
                          >
                            {isMale ? "Erkak" : "Ayol"}
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

                        {/* Name and Years */}
                        <div>
                          <h3
                            style={{
                              fontSize: "16px",
                              fontWeight: 700,
                              color: "var(--text-primary)",
                              lineHeight: "1.3",
                            }}
                          >
                            {person.first_name} {person.last_name}
                          </h3>
                          {person.patronymic && (
                            <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "2px" }}>
                              {person.patronymic}
                            </p>
                          )}
                          <p style={{ fontSize: "12px", color: "var(--text-gold)", marginTop: "4px", fontWeight: 600 }}>
                            {person.birth_year ? person.birth_year : "?"} -{" "}
                            {person.is_alive ? "hozir" : person.death_year || "?"}
                          </p>
                        </div>

                        {/* Details snippet: Place & Occupation */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "11px", color: "var(--text-muted)" }}>
                          {person.birth_place && (
                            <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                              <MapPin size={12} />
                              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {person.birth_place}
                              </span>
                            </div>
                          )}
                          {person.occupation && (
                            <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
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
                            marginTop: "6px",
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
                                title="Tahrirlash (Siz kiritgansiz)"
                              >
                                <Edit3 size={11} />
                                <span>Tahrirlash</span>
                              </button>
                            ) : (
                              <span
                                style={{ color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "3px" }}
                                title="Faqat kiritgan shaxs yoki admin tahrirlashi mumkin"
                              >
                                <Lock size={11} />
                              </span>
                            )}

                            {/* Add relative button */}
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
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
