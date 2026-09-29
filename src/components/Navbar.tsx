"use client";

import React from "react";
import { User } from "@/lib/types";
import { 
  GitFork, 
  List, 
  PlusCircle, 
  FileDown, 
  Sun, 
  Moon, 
  LogIn, 
  LogOut, 
  User as UserIcon,
  ShieldCheck
} from "lucide-react";

interface NavbarProps {
  user: User | null;
  activeView: "tree" | "list";
  onViewChange: (view: "tree" | "list") => void;
  onOpenAddModal: () => void;
  onOpenAuthModal: () => void;
  onOpenExportModal: () => void;
  onLogout: () => void;
  theme: "dark" | "light";
  onToggleTheme: () => void;
  totalPeople: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  activeView,
  onViewChange,
  onOpenAddModal,
  onOpenAuthModal,
  onOpenExportModal,
  onLogout,
  theme,
  onToggleTheme,
  totalPeople,
}) => {
  return (
    <header className="no-print" style={{
      position: "sticky",
      top: 0,
      zIndex: 100,
      background: "var(--bg-secondary)",
      borderBottom: "1px solid var(--border-primary)",
      backdropFilter: "blur(20px)",
      WebkitBackdropFilter: "blur(20px)",
      padding: "12px 24px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      flexWrap: "wrap",
      gap: "14px"
    }}>
      {/* Brand logo & title */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <div style={{
          width: "42px",
          height: "42px",
          borderRadius: "12px",
          background: "var(--gold-gradient)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "var(--shadow-gold)",
          color: "#0b0f19"
        }}>
          <GitFork size={24} strokeWidth={2.5} />
        </div>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <h1 style={{
              fontFamily: "var(--font-serif)",
              fontSize: "20px",
              fontWeight: 800,
              letterSpacing: "0.04em",
              background: "var(--gold-gradient)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent"
            }}>
              SHAJARA
            </h1>
            <span style={{
              fontSize: "11px",
              background: "rgba(212, 175, 55, 0.15)",
              color: "var(--text-gold)",
              padding: "2px 8px",
              borderRadius: "9999px",
              fontWeight: 700,
              border: "1px solid rgba(212, 175, 55, 0.3)"
            }}>
              YETTI PUSHT
            </span>
          </div>
          <p style={{ fontSize: "11px", color: "var(--text-muted)", letterSpacing: "0.02em" }}>
            Ajdodlar xotirasi va oilaviy nasabnoma • {totalPeople} a&apos;zo
          </p>
        </div>
      </div>

      {/* Middle View Selector: Tree / List */}
      <div style={{
        display: "flex",
        background: "var(--bg-tertiary)",
        padding: "4px",
        borderRadius: "var(--radius-md)",
        border: "1px solid var(--border-subtle)"
      }}>
        <button
          id="btn-view-tree"
          onClick={() => onViewChange("tree")}
          className="btn btn-sm"
          style={{
            background: activeView === "tree" ? "var(--bg-card-hover)" : "transparent",
            color: activeView === "tree" ? "var(--text-gold)" : "var(--text-secondary)",
            border: activeView === "tree" ? "1px solid var(--border-primary)" : "1px solid transparent",
            borderRadius: "var(--radius-sm)"
          }}
        >
          <GitFork size={15} />
          <span>Shajara daraxti</span>
        </button>
        <button
          id="btn-view-list"
          onClick={() => onViewChange("list")}
          className="btn btn-sm"
          style={{
            background: activeView === "list" ? "var(--bg-card-hover)" : "transparent",
            color: activeView === "list" ? "var(--text-gold)" : "var(--text-secondary)",
            border: activeView === "list" ? "1px solid var(--border-primary)" : "1px solid transparent",
            borderRadius: "var(--radius-sm)"
          }}
        >
          <List size={15} />
          <span>Ro&apos;yxat</span>
        </button>
      </div>

      {/* Right Controls: Add, Export, Theme, Auth */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        {/* PDF Export Button */}
        <button
          id="btn-export-pdf-nav"
          onClick={onOpenExportModal}
          className="btn btn-outline btn-sm"
          title="PDF formatida yuklab olish yoki chop etish"
        >
          <FileDown size={16} />
          <span>PDF / Chop etish</span>
        </button>

        {/* Add Person (Logged in) */}
        {user ? (
          <button
            id="btn-add-person-nav"
            onClick={onOpenAddModal}
            className="btn btn-primary btn-sm"
          >
            <PlusCircle size={16} />
            <span>Shaxs qo&apos;shish</span>
          </button>
        ) : (
          <button
            id="btn-login-to-add"
            onClick={onOpenAuthModal}
            className="btn btn-primary btn-sm"
            title="Shajaraga yangi shaxslarni kiritish uchun tizimga kiring"
          >
            <LogIn size={16} />
            <span>Kiritish uchun kiring</span>
          </button>
        )}

        {/* Theme Toggle */}
        <button
          id="btn-theme-toggle"
          onClick={onToggleTheme}
          className="btn btn-secondary btn-icon"
          title="Mavzuni almashtirish (Tun/Kun)"
          style={{ width: "36px", height: "36px" }}
        >
          {theme === "dark" ? <Sun size={17} color="#f59e0b" /> : <Moon size={17} />}
        </button>

        {/* User Account / Login */}
        {user ? (
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            background: "var(--bg-tertiary)",
            padding: "4px 8px 4px 12px",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--border-subtle)"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              {user.role === "admin" ? (
                <span title="Administrator" style={{ display: "inline-flex" }}>
                  <ShieldCheck size={16} color="#d4af37" />
                </span>
              ) : (
                <span title="Foydalanuvchi" style={{ display: "inline-flex" }}>
                  <UserIcon size={16} color="var(--text-secondary)" />
                </span>
              )}
              <span style={{ fontSize: "13px", fontWeight: 600 }}>{user.full_name}</span>
            </div>
            <button
              id="btn-logout"
              onClick={onLogout}
              className="btn btn-sm btn-secondary"
              title="Tizimdan chiqish"
              style={{ padding: "4px 8px", background: "transparent", border: "none" }}
            >
              <LogOut size={15} color="#ef4444" />
            </button>
          </div>
        ) : (
          <button
            id="btn-auth-open"
            onClick={onOpenAuthModal}
            className="btn btn-secondary btn-sm"
          >
            <LogIn size={15} />
            <span>Kirish / Ro&apos;yxat</span>
          </button>
        )}
      </div>
    </header>
  );
};
