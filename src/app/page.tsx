"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Person, User } from "@/lib/types";
import { Navbar } from "@/components/Navbar";
import { TreeView } from "@/components/TreeView";
import { ListView } from "@/components/ListView";
import { PersonModal } from "@/components/PersonModal";
import { PersonFormModal } from "@/components/PersonFormModal";
import { AuthModal } from "@/components/AuthModal";
import { ExportPdfModal } from "@/components/ExportPdfModal";
import { 
  Users, 
  Layers, 
  ShieldCheck, 
  Info,
  CheckCircle,
  AlertCircle
} from "lucide-react";

export default function Home() {
  const [people, setPeople] = useState<(Person & { can_edit?: boolean; created_by_name?: string })[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<"tree" | "list">("tree");
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  // Modals state
  const [selectedPerson, setSelectedPerson] = useState<(Person & { can_edit?: boolean; created_by_name?: string }) | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [personToEdit, setPersonToEdit] = useState<Person | null>(null);
  const [presetFatherId, setPresetFatherId] = useState<number | null>(null);
  const [presetMotherId, setPresetMotherId] = useState<number | null>(null);
  const [presetGenLevel, setPresetGenLevel] = useState<number | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);

  // Toast banner
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4500);
  };

  // Fetch initial user & people
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch current session
      const authRes = await fetch("/api/auth/me");
      const authData = await authRes.json();
      setCurrentUser(authData.user);

      // Fetch people
      const peopleRes = await fetch("/api/people");
      const peopleData = await peopleRes.json();
      if (peopleRes.ok) {
        setPeople(peopleData.people || []);
      }
    } catch (err: unknown) {
      console.error("Fetch data error:", err);
      showToast("Ma'lumotlarni yuklashda xatolik", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Theme toggle
  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    document.documentElement.setAttribute("data-theme", nextTheme);
  };

  // Logout handler
  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setCurrentUser(null);
      showToast("Tizimdan muvaffaqiyatli chiqdingiz");
      fetchData();
    } catch (err: unknown) {
      console.error("Logout error:", err);
    }
  };

  // Add person handler
  const handleOpenAddModal = (parentId?: number, relationType?: "child" | "father") => {
    if (!currentUser) {
      setIsAuthOpen(true);
      return;
    }

    setPersonToEdit(null);

    if (parentId && relationType === "child") {
      const parent = people.find((p) => p.id === parentId);
      if (parent?.gender === "male") {
        setPresetFatherId(parentId);
        setPresetMotherId(null);
      } else {
        setPresetFatherId(null);
        setPresetMotherId(parentId);
      }
      setPresetGenLevel(Math.max(1, (parent?.generation_level || 2) - 1));
    } else {
      setPresetFatherId(null);
      setPresetMotherId(null);
      setPresetGenLevel(1);
    }

    setIsFormOpen(true);
  };

  // Edit person handler
  const handleEditPerson = (person: Person) => {
    setPersonToEdit(person);
    setIsFormOpen(true);
  };

  // Save person (POST or PUT)
  const handleSavePerson = async (formData: Partial<Person>) => {
    if (personToEdit) {
      // PUT
      const res = await fetch(`/api/people/${personToEdit.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Tahrirlashda xatolik");
      }

      showToast("Ma'lumot muvaffaqiyatli yangilandi");
    } else {
      // POST
      const res = await fetch("/api/people", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Qo'shishda xatolik");
      }

      showToast("Yangi shaxs shajaraga muvaffaqiyatli qo'shildi");
    }

    fetchData();
  };

  // Delete person handler
  const handleDeletePerson = async (personId: number) => {
    try {
      const res = await fetch(`/api/people/${personId}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "O'chirishda xatolik");
      }

      showToast("Yozuv o'chirildi");
      if (selectedPerson?.id === personId) {
        setSelectedPerson(null);
      }
      fetchData();
    } catch (err: unknown) {
      if (err instanceof Error) {
        showToast(err.message, "error");
      }
    }
  };

  // Stats
  const totalGenerations = new Set(people.map((p) => p.generation_level)).size;
  const myEntriesCount = currentUser ? people.filter((p) => p.created_by === currentUser.id).length : 0;

  return (
    <main style={{ minHeight: "100vh", position: "relative", zIndex: 1 }}>
      {/* Navbar */}
      <Navbar
        user={currentUser}
        activeView={activeView}
        onViewChange={setActiveView}
        onOpenAddModal={() => handleOpenAddModal()}
        onOpenAuthModal={() => setIsAuthOpen(true)}
        onOpenExportModal={() => setIsExportOpen(true)}
        onLogout={handleLogout}
        theme={theme}
        onToggleTheme={toggleTheme}
        totalPeople={people.length}
      />

      {/* Floating Toast Notification */}
      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: "24px",
            right: "24px",
            zIndex: 1000,
            padding: "12px 20px",
            background: toast.type === "success" ? "rgba(16, 185, 129, 0.95)" : "rgba(239, 68, 68, 0.95)",
            color: "#ffffff",
            borderRadius: "var(--radius-md)",
            boxShadow: "var(--shadow-lg)",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            fontSize: "14px",
            fontWeight: 600,
            backdropFilter: "blur(8px)",
            animation: "fadeIn 0.2s ease",
          }}
        >
          {toast.type === "success" ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Hero / Quick Stats Ribbon */}
      <div
        className="no-print"
        style={{
          background: "var(--bg-card)",
          borderBottom: "1px solid var(--border-subtle)",
          padding: "10px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "12px",
          fontSize: "13px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "20px", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--text-secondary)" }}>
            <Users size={16} color="var(--text-gold)" />
            <span>Jami shaxslar: <strong style={{ color: "var(--text-primary)" }}>{people.length}</strong></span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--text-secondary)" }}>
            <Layers size={16} color="var(--emerald-500)" />
            <span>Qamrab olingan bo&apos;g&apos;inlar: <strong style={{ color: "var(--text-primary)" }}>{totalGenerations} / 7</strong></span>
          </div>
          {currentUser && (
            <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--text-secondary)" }}>
              <ShieldCheck size={16} color="var(--male-color)" />
              <span>Siz kiritgan yozuvlar: <strong style={{ color: "var(--text-primary)" }}>{myEntriesCount}</strong></span>
            </div>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--text-muted)", fontSize: "12px" }}>
          <Info size={14} />
          <span>Har bir oila a&apos;zosi faqat o&apos;zi kiritgan ma&apos;lumotlarni tahrirlashi mumkin.</span>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div style={{ height: "60vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "16px" }}>
          <div style={{ width: "40px", height: "40px", border: "3px solid var(--border-primary)", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
          <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>Shajara ma&apos;lumotlari yuklanmoqda...</p>
          <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
        </div>
      ) : activeView === "tree" ? (
        <TreeView
          people={people}
          currentUser={currentUser}
          onSelectPerson={(p) => setSelectedPerson(p)}
          onAddRelated={(parentId, rel) => handleOpenAddModal(parentId, rel)}
          onEditPerson={handleEditPerson}
        />
      ) : (
        <ListView
          people={people}
          currentUser={currentUser}
          onSelectPerson={(p) => setSelectedPerson(p)}
          onEditPerson={handleEditPerson}
          onDeletePerson={handleDeletePerson}
          onOpenAddModal={() => handleOpenAddModal()}
        />
      )}

      {/* Modals */}
      <PersonModal
        person={selectedPerson}
        currentUser={currentUser}
        allPeople={people}
        onClose={() => setSelectedPerson(null)}
        onEdit={handleEditPerson}
        onDelete={handleDeletePerson}
        onSelectRelative={(id) => {
          const relative = people.find((p) => p.id === id);
          if (relative) setSelectedPerson(relative);
        }}
        onAddChild={(parentId) => handleOpenAddModal(parentId, "child")}
      />

      <PersonFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        personToEdit={personToEdit}
        presetFatherId={presetFatherId}
        presetMotherId={presetMotherId}
        presetGenLevel={presetGenLevel}
        allPeople={people}
        onSave={handleSavePerson}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={(u) => {
          setCurrentUser(u);
          showToast(`Xush kelibsiz, ${u.full_name}!`);
          fetchData();
        }}
      />

      <ExportPdfModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        people={people}
      />
    </main>
  );
}
