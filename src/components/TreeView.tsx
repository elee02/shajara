"use client";

import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { Person, User, UZBEK_GENERATION_LABELS, BranchSide } from "@/lib/types";
import { getKinshipTitle } from "@/lib/kinship";
import { 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  User as UserIcon, 
  Plus, 
  Edit3, 
  Lock, 
  MapPin, 
  Phone,
  Sparkles,
  Users,
  Heart,
  Target,
  ToggleLeft,
  ToggleRight
} from "lucide-react";

interface TreeViewProps {
  people: (Person & { can_edit?: boolean; created_by_name?: string })[];
  currentUser: User | null;
  onSelectPerson: (person: Person) => void;
  onAddRelated: (parentId: number, relationType: "child" | "father") => void;
  onEditPerson: (person: Person) => void;
}

interface ConnectorLine {
  id: string;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  type: "parent-child" | "spouse";
}

export const TreeView: React.FC<TreeViewProps> = ({
  people,
  currentUser,
  onSelectPerson,
  onAddRelated,
  onEditPerson,
}) => {
  const [scale, setScale] = useState<number>(0.9);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 10 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [activeSide, setActiveSide] = useState<"all" | BranchSide>("all");

  // Relative-to-me controls
  const [enableKinship, setEnableKinship] = useState<boolean>(true);
  const [focusPersonId, setFocusPersonId] = useState<number | null>(null);

  // Computed connector lines
  const [lines, setLines] = useState<ConnectorLine[]>([]);

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Initialize focus person: default to current user's entry (or person 7 Javohir)
  useEffect(() => {
    if (focusPersonId === null && people.length > 0) {
      // Find person matching user or fallback to Javohir (id 7) or first person
      const selfPerson = people.find((p) => p.relationship_title === "O'zi" || p.id === 7) || people[0];
      if (selfPerson) {
        setFocusPersonId(selfPerson.id);
      }
    }
  }, [people, focusPersonId]);

  const focusPerson = useMemo(() => {
    return people.find((p) => p.id === focusPersonId) || null;
  }, [people, focusPersonId]);

  // Filter people by branch side if chosen
  const filteredPeople = useMemo(() => {
    if (activeSide === "all") return people;
    return people.filter((p) => p.branch_side === activeSide);
  }, [people, activeSide]);

  // Group into generation levels
  const uniqueGenLevels = useMemo(() => {
    return Array.from(new Set(people.map((p) => p.generation_level))).sort((a, b) => b - a);
  }, [people]);

  // Group each generation's people into Family Units (Couples & Individuals)
  const familyUnitsByGen = useMemo(() => {
    return uniqueGenLevels.map((gen) => {
      const genPeople = filteredPeople.filter((p) => p.generation_level === gen);
      const visited = new Set<number>();
      const units: { id: string; primary: Person; spouse?: Person }[] = [];

      genPeople.forEach((person) => {
        if (visited.has(person.id)) return;

        // Check if spouse exists in same generation or tree
        let spouse: Person | undefined = undefined;
        if (person.spouse_id) {
          spouse = genPeople.find((p) => p.id === person.spouse_id);
          if (!spouse) {
            spouse = people.find((p) => p.id === person.spouse_id);
          }
        } else {
          // Check reverse
          spouse = genPeople.find((p) => p.spouse_id === person.id);
        }

        if (spouse) {
          visited.add(person.id);
          visited.add(spouse.id);
          // Put male first if applicable
          if (person.gender === "female" && spouse.gender === "male") {
            units.push({ id: `couple-${spouse.id}-${person.id}`, primary: spouse, spouse: person });
          } else {
            units.push({ id: `couple-${person.id}-${spouse.id}`, primary: person, spouse });
          }
        } else {
          visited.add(person.id);
          units.push({ id: `single-${person.id}`, primary: person });
        }
      });

      return {
        level: gen,
        label: UZBEK_GENERATION_LABELS[gen] || { title_uz: `${gen}-bo'g'in`, desc: "" },
        units,
      };
    });
  }, [uniqueGenLevels, filteredPeople, people]);

  // Recompute SVG connector lines based on DOM positions
  const updateConnectorLines = useCallback(() => {
    if (!canvasRef.current) return;

    const canvasRect = canvasRef.current.getBoundingClientRect();
    const newLines: ConnectorLine[] = [];

    // Map card positions
    const cardPositions = new Map<number, { topX: number; topY: number; bottomX: number; bottomY: number; rightX: number; leftX: number; midY: number }>();

    people.forEach((person) => {
      const el = document.getElementById(`person-card-${person.id}`);
      if (!el) return;

      const rect = el.getBoundingClientRect();
      const left = (rect.left - canvasRect.left) / scale;
      const top = (rect.top - canvasRect.top) / scale;
      const width = rect.width / scale;
      const height = rect.height / scale;

      cardPositions.set(person.id, {
        topX: left + width / 2,
        topY: top,
        bottomX: left + width / 2,
        bottomY: top + height,
        leftX: left,
        rightX: left + width,
        midY: top + height / 2,
      });
    });

    // 1. Spouses horizontal links
    const visitedSpouses = new Set<string>();
    people.forEach((p) => {
      if (p.spouse_id && cardPositions.has(p.id) && cardPositions.has(p.spouse_id)) {
        const pairKey = [p.id, p.spouse_id].sort().join("-");
        if (!visitedSpouses.has(pairKey)) {
          visitedSpouses.add(pairKey);
          const pos1 = cardPositions.get(p.id)!;
          const pos2 = cardPositions.get(p.spouse_id)!;

          const isLeft = pos1.rightX < pos2.leftX;
          newLines.push({
            id: `spouse-${pairKey}`,
            fromX: isLeft ? pos1.rightX : pos1.leftX,
            fromY: pos1.midY,
            toX: isLeft ? pos2.leftX : pos2.rightX,
            toY: pos2.midY,
            type: "spouse",
          });
        }
      }
    });

    // 2. Parent-to-Child links
    people.forEach((child) => {
      const childPos = cardPositions.get(child.id);
      if (!childPos) return;

      const fatherPos = child.father_id ? cardPositions.get(child.father_id) : null;
      const motherPos = child.mother_id ? cardPositions.get(child.mother_id) : null;

      let parentOriginX: number | null = null;
      let parentOriginY: number | null = null;

      if (fatherPos && motherPos) {
        // Line starts midway between father and mother
        parentOriginX = (fatherPos.bottomX + motherPos.bottomX) / 2;
        parentOriginY = Math.max(fatherPos.bottomY, motherPos.bottomY);
      } else if (fatherPos) {
        parentOriginX = fatherPos.bottomX;
        parentOriginY = fatherPos.bottomY;
      } else if (motherPos) {
        parentOriginX = motherPos.bottomX;
        parentOriginY = motherPos.bottomY;
      }

      if (parentOriginX !== null && parentOriginY !== null) {
        newLines.push({
          id: `child-${child.id}-parent`,
          fromX: parentOriginX,
          fromY: parentOriginY,
          toX: childPos.topX,
          toY: childPos.topY,
          type: "parent-child",
        });
      }
    });

    setLines(newLines);
  }, [people, scale]);

  // Recalculate positions after DOM renders
  useEffect(() => {
    const timer = setTimeout(() => {
      updateConnectorLines();
    }, 150);
    window.addEventListener("resize", updateConnectorLines);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", updateConnectorLines);
    };
  }, [updateConnectorLines, familyUnitsByGen, activeSide]);

  // Mouse pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest(".person-node-card") || (e.target as HTMLElement).closest("button") || (e.target as HTMLElement).closest("select")) {
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
    setScale(0.9);
    setPan({ x: 0, y: 10 });
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
      {/* Zoom and Reset Controls */}
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
          onClick={() => {
            setScale((s) => Math.min(s + 0.15, 2.0));
            setTimeout(updateConnectorLines, 50);
          }}
          className="btn btn-secondary btn-icon"
          title="Kattalashtirish"
          style={{ width: "36px", height: "36px" }}
        >
          <ZoomIn size={18} />
        </button>
        <button
          id="btn-zoom-out"
          onClick={() => {
            setScale((s) => Math.max(s - 0.15, 0.4));
            setTimeout(updateConnectorLines, 50);
          }}
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

      {/* Floating Top Controls: Dynamic Kinship & Branch Filter */}
      <div
        className="no-print"
        style={{
          position: "absolute",
          top: "20px",
          left: "20px",
          zIndex: 40,
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          maxWidth: "calc(100vw - 120px)",
        }}
      >
        {/* Row 1: Kinship Mode Toggle & Focus Person Selector */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            background: "var(--bg-card)",
            padding: "8px 16px",
            borderRadius: "var(--radius-lg)",
            border: "1px solid var(--border-primary)",
            backdropFilter: "blur(16px)",
            boxShadow: "var(--shadow-gold)",
            flexWrap: "wrap",
          }}
        >
          <button
            onClick={() => setEnableKinship(!enableKinship)}
            className="btn btn-sm"
            style={{
              background: enableKinship ? "var(--gold-gradient)" : "var(--bg-tertiary)",
              color: enableKinship ? "#0b0f19" : "var(--text-muted)",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontWeight: 700,
            }}
            title="Qarindoshlik nomlarini dinamik ko'rsatish"
          >
            {enableKinship ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
            <span>Nisbiy nomlanish: {enableKinship ? "YOQILGAN" : "O'CHIRILGAN"}</span>
          </button>

          {enableKinship && (
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "12px", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "4px" }}>
                <Target size={14} color="var(--text-gold)" /> Kimga nisbatan:
              </span>
              <select
                id="select-focus-person"
                className="form-select"
                style={{
                  padding: "4px 10px",
                  fontSize: "12px",
                  height: "32px",
                  background: "var(--bg-secondary)",
                  color: "var(--text-gold)",
                  fontWeight: 700,
                  borderColor: "var(--gold-500)",
                }}
                value={focusPersonId || ""}
                onChange={(e) => setFocusPersonId(Number(e.target.value))}
              >
                {people.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.first_name} {p.last_name} ({p.birth_year || "?"})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Row 2: Branch Side Quick Filter */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            background: "var(--bg-card)",
            padding: "5px 12px",
            borderRadius: "var(--radius-lg)",
            border: "1px solid var(--border-subtle)",
            backdropFilter: "blur(12px)",
            boxShadow: "var(--shadow-md)",
            flexWrap: "wrap",
          }}
        >
          <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-gold)", display: "flex", alignItems: "center", gap: "4px" }}>
            <Users size={13} /> Tarmoq:
          </span>
          <button
            onClick={() => setActiveSide("all")}
            className="btn btn-sm"
            style={{
              background: activeSide === "all" ? "var(--gold-gradient)" : "transparent",
              color: activeSide === "all" ? "#000" : "var(--text-secondary)",
              padding: "3px 8px",
              fontSize: "11px",
              borderRadius: "5px",
            }}
          >
            Barchasi ({people.length})
          </button>
          <button
            onClick={() => setActiveSide("father")}
            className="btn btn-sm"
            style={{
              background: activeSide === "father" ? "rgba(56, 189, 248, 0.25)" : "transparent",
              color: activeSide === "father" ? "#38bdf8" : "var(--text-muted)",
              border: activeSide === "father" ? "1px solid #38bdf8" : "none",
              padding: "3px 8px",
              fontSize: "11px",
              borderRadius: "5px",
            }}
          >
            Ota tomoni
          </button>
          <button
            onClick={() => setActiveSide("mother")}
            className="btn btn-sm"
            style={{
              background: activeSide === "mother" ? "rgba(244, 114, 182, 0.25)" : "transparent",
              color: activeSide === "mother" ? "#f472b6" : "var(--text-muted)",
              border: activeSide === "mother" ? "1px solid #f472b6" : "none",
              padding: "3px 8px",
              fontSize: "11px",
              borderRadius: "5px",
            }}
          >
            Ona tomoni
          </button>
          <button
            onClick={() => setActiveSide("direct")}
            className="btn btn-sm"
            style={{
              background: activeSide === "direct" ? "rgba(52, 211, 153, 0.25)" : "transparent",
              color: activeSide === "direct" ? "#34d399" : "var(--text-muted)",
              border: activeSide === "direct" ? "1px solid #34d399" : "none",
              padding: "3px 8px",
              fontSize: "11px",
              borderRadius: "5px",
            }}
          >
            O&apos;z avlodlari
          </button>
        </div>
      </div>

      {/* Pannable & Zoomable Canvas Area */}
      <div
        ref={canvasRef}
        id="tree-diagram-export-target"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
          transformOrigin: "top center",
          transition: isDragging ? "none" : "transform 0.15s ease-out",
          padding: "100px 60px 180px 60px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "70px",
          minWidth: "1500px",
          position: "relative",
        }}
      >
        {/* SVG Connectors Overlay */}
        <svg
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
            zIndex: 1,
          }}
        >
          <defs>
            {/* Arrow marker for parent-child links */}
            <marker
              id="arrow-down"
              viewBox="0 0 10 10"
              refX="6"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 8 5 L 0 9 z" fill="var(--gold-500)" />
            </marker>

            {/* Marriage Heart / Knot marker */}
            <linearGradient id="gold-line-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fcd34d" />
              <stop offset="50%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#b45309" />
            </linearGradient>
          </defs>

          {lines.map((line) => {
            if (line.type === "spouse") {
              // Horizontal marriage connection line with rings
              return (
                <g key={line.id}>
                  <line
                    x1={line.fromX}
                    y1={line.fromY}
                    x2={line.toX}
                    y2={line.toY}
                    stroke="#d4af37"
                    strokeWidth="3"
                    strokeDasharray="4 3"
                  />
                  <circle
                    cx={(line.fromX + line.toX) / 2}
                    cy={(line.fromY + line.toY) / 2}
                    r="8"
                    fill="var(--bg-secondary)"
                    stroke="#d4af37"
                    strokeWidth="2"
                  />
                </g>
              );
            } else {
              // Cubic bezier curve descending from parent to child
              const midY = (line.fromY + line.toY) / 2;
              const pathD = `M ${line.fromX} ${line.fromY} C ${line.fromX} ${midY}, ${line.toX} ${midY}, ${line.toX} ${line.toY}`;

              return (
                <path
                  key={line.id}
                  d={pathD}
                  fill="none"
                  stroke="url(#gold-line-grad)"
                  strokeWidth="2.5"
                  markerEnd="url(#arrow-down)"
                  opacity="0.8"
                />
              );
            }
          })}
        </svg>

        {/* Generations & Couple Units */}
        {familyUnitsByGen.map((genTier) => {
          if (genTier.units.length === 0) return null;

          return (
            <div
              key={genTier.level}
              style={{
                width: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                position: "relative",
                zIndex: 2,
              }}
            >
              {/* Generation Header Ribbon */}
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "10px",
                  background: "var(--bg-secondary)",
                  border: "1px solid var(--border-primary)",
                  padding: "6px 22px",
                  borderRadius: "9999px",
                  marginBottom: "24px",
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
              </div>

              {/* Family Units (Couples & Individuals) */}
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  justifyContent: "center",
                  gap: "40px",
                  maxWidth: "1800px",
                }}
              >
                {genTier.units.map((unit) => {
                  return (
                    <div
                      key={unit.id}
                      className="family-unit-cluster"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "16px",
                        background: unit.spouse ? "rgba(212, 175, 55, 0.04)" : "transparent",
                        border: unit.spouse ? "1px dashed rgba(212, 175, 55, 0.25)" : "none",
                        padding: unit.spouse ? "8px 12px" : "0",
                        borderRadius: "18px",
                      }}
                    >
                      {/* Primary Person */}
                      {renderPersonCard(unit.primary)}

                      {/* Marital Badge between husband & wife */}
                      {unit.spouse && (
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "2px",
                            color: "var(--text-gold)",
                          }}
                          title="Turmush o'rtoqlar (Er-Xotin)"
                        >
                          <div
                            style={{
                              width: "28px",
                              height: "28px",
                              borderRadius: "50%",
                              background: "rgba(212, 175, 55, 0.15)",
                              border: "1px solid var(--gold-500)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <Heart size={14} fill="#f59e0b" color="#f59e0b" />
                          </div>
                          <span style={{ fontSize: "9px", fontWeight: 700, color: "var(--text-gold)" }}>ER-XOTIN</span>
                        </div>
                      )}

                      {/* Spouse Person */}
                      {unit.spouse && renderPersonCard(unit.spouse)}
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

  function renderPersonCard(person: Person) {
    const isOwner = currentUser?.id === person.created_by || currentUser?.role === "admin";
    const isMale = person.gender === "male";
    const portrait = person.photo_url || (person.photos && person.photos[0]) || null;
    const isCurrentFocus = focusPersonId === person.id;

    // Calculate dynamic kinship title relative to focus person
    const kinshipLabel = enableKinship
      ? getKinshipTitle(person, focusPerson, people)
      : (person.relationship_title || `${person.generation_level}-bo'g'in`);

    return (
      <div
        key={person.id}
        id={`person-card-${person.id}`}
        className={`person-node-card glass-panel`}
        onClick={() => onSelectPerson(person)}
        style={{
          width: "260px",
          padding: "14px",
          cursor: "pointer",
          position: "relative",
          borderTop: `4px solid ${isMale ? "var(--male-color)" : "var(--female-color)"}`,
          border: isCurrentFocus ? "2px solid var(--gold-500)" : undefined,
          boxShadow: isCurrentFocus ? "var(--shadow-gold)" : "var(--shadow-md)",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          borderRadius: "var(--radius-md)",
          transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
          background: isCurrentFocus ? "var(--bg-tertiary)" : "var(--bg-card)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-4px)";
          e.currentTarget.style.borderColor = "var(--border-focus)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.borderColor = isCurrentFocus ? "var(--gold-500)" : "var(--border-subtle)";
        }}
      >
        {/* Top Header: Portrait + Kinship Badge */}
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          {/* Portrait Thumbnail */}
          <div
            style={{
              width: "50px",
              height: "50px",
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
                size={26}
                color={isMale ? "var(--male-color)" : "var(--female-color)"}
              />
            )}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Kinship or Generation Title */}
            <div
              style={{
                fontSize: "11px",
                fontWeight: 800,
                color: isCurrentFocus ? "#000" : "var(--text-gold)",
                display: "inline-block",
                background: isCurrentFocus ? "var(--gold-gradient)" : "rgba(212, 175, 55, 0.15)",
                padding: "2px 7px",
                borderRadius: "4px",
                marginBottom: "3px",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                maxWidth: "100%",
              }}
            >
              {isCurrentFocus ? "🎯 O'ZINGIZ" : `⭐ ${kinshipLabel}`}
            </div>

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
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "11px" }}>
          <span style={{ color: "var(--text-gold)", fontWeight: 600 }}>
            {person.birth_year ? `${person.birth_year}-y.` : "?"} —{" "}
            {person.is_alive ? "hozir" : person.death_year ? `${person.death_year}-y.` : "?"}
          </span>

          <span
            style={{
              fontSize: "10px",
              fontWeight: 600,
              color: person.is_alive ? "var(--emerald-500)" : "var(--text-muted)",
            }}
          >
            {person.is_alive ? "• Hayot" : "• Vafot"}
          </span>
        </div>

        {/* Location & Contact Snippet */}
        <div style={{ display: "flex", flexDirection: "column", gap: "2px", fontSize: "11px", color: "var(--text-muted)" }}>
          {person.phone && (
            <div style={{ display: "flex", alignItems: "center", gap: "5px", color: "var(--emerald-500)" }}>
              <Phone size={11} />
              <span>{person.phone}</span>
            </div>
          )}
          {person.birth_place && (
            <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              <MapPin size={11} />
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {person.birth_place}
              </span>
            </div>
          )}
        </div>

        {/* Card Footer: Set As Focus & Edit Controls */}
        <div
          style={{
            marginTop: "2px",
            paddingTop: "6px",
            borderTop: "1px solid var(--border-subtle)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: "11px",
          }}
        >
          {/* Target button to set relative-to this person */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setFocusPersonId(person.id);
              setEnableKinship(true);
            }}
            className="btn btn-sm"
            style={{
              padding: "2px 6px",
              fontSize: "10px",
              background: isCurrentFocus ? "rgba(212, 175, 55, 0.2)" : "transparent",
              color: isCurrentFocus ? "var(--text-gold)" : "var(--text-muted)",
              border: "none",
            }}
            title="Barcha qarindoshlarni ushbu shaxsga nisbatan hisoblash"
          >
            <Target size={11} />
            <span>{isCurrentFocus ? "Tanlangan" : "Menga qiyos"}</span>
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            {isOwner ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEditPerson(person);
                }}
                className="btn btn-sm btn-secondary"
                style={{ padding: "2px 5px", fontSize: "10px" }}
                title="Tahrirlash / Qarindoshlik nomini o'zgartirish"
              >
                <Edit3 size={11} />
              </button>
            ) : (
              <span style={{ color: "var(--text-muted)" }} title="Himoyalangan">
                <Lock size={10} />
              </span>
            )}

            {currentUser && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAddRelated(person.id, "child");
                }}
                className="btn btn-sm btn-outline"
                style={{ padding: "2px 5px", fontSize: "10px" }}
                title="Farzand qo'shish"
              >
                <Plus size={11} />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }
};
