"use client";

import React, { useState } from "react";
import { User } from "@/lib/types";
import { X, LogIn, UserPlus, Key, Mail, User as UserIcon, AlertCircle } from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: User) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [tab, setTab] = useState<"login" | "register">("login");
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Kirishda xatolik yuz berdi");
      }

      onSuccess(data.user);
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Kirishda xatolik");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password, full_name: fullName }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Ro'yxatdan o'tishda xatolik yuz berdi");
      }

      onSuccess(data.user);
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Ro'yxatdan o'tishda xatolik");
      }
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (u: string, p: string) => {
    setTab("login");
    setLogin(u);
    setPassword(p);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "440px" }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <div>
            <h2 style={{ fontSize: "20px", fontWeight: 700, fontFamily: "var(--font-serif)", color: "var(--text-gold)" }}>
              {tab === "login" ? "Shajaraga kirish" : "Yangi hisob yaratish"}
            </h2>
            <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>
              O&apos;z shajarangizni kiritish va tahrirlash uchun kiring
            </p>
          </div>
          <button onClick={onClose} className="btn btn-secondary btn-icon" style={{ width: "32px", height: "32px" }}>
            <X size={18} />
          </button>
        </div>

        {/* Tab switch */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "4px",
            background: "var(--bg-tertiary)",
            padding: "4px",
            borderRadius: "var(--radius-md)",
            marginBottom: "20px",
          }}
        >
          <button
            id="tab-btn-login"
            type="button"
            onClick={() => {
              setTab("login");
              setError(null);
            }}
            className="btn btn-sm"
            style={{
              background: tab === "login" ? "var(--bg-card-hover)" : "transparent",
              color: tab === "login" ? "var(--text-gold)" : "var(--text-muted)",
              border: tab === "login" ? "1px solid var(--border-primary)" : "none",
            }}
          >
            <LogIn size={14} />
            <span>Kirish</span>
          </button>
          <button
            id="tab-btn-register"
            type="button"
            onClick={() => {
              setTab("register");
              setError(null);
            }}
            className="btn btn-sm"
            style={{
              background: tab === "register" ? "var(--bg-card-hover)" : "transparent",
              color: tab === "register" ? "var(--text-gold)" : "var(--text-muted)",
              border: tab === "register" ? "1px solid var(--border-primary)" : "none",
            }}
          >
            <UserPlus size={14} />
            <span>Ro&apos;yxatdan o&apos;tish</span>
          </button>
        </div>

        {error && (
          <div
            style={{
              padding: "10px 14px",
              background: "rgba(239, 68, 68, 0.15)",
              border: "1px solid rgba(239, 68, 68, 0.4)",
              borderRadius: "var(--radius-md)",
              color: "#f87171",
              fontSize: "13px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "16px",
            }}
          >
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {tab === "login" ? (
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label">Login yoki Email</label>
              <div style={{ position: "relative" }}>
                <UserIcon size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                <input
                  id="input-login-identity"
                  type="text"
                  className="form-input"
                  style={{ paddingLeft: "38px" }}
                  placeholder="admin yoki elyor@shajara.uz"
                  value={login}
                  onChange={(e) => setLogin(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Parol</label>
              <div style={{ position: "relative" }}>
                <Key size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                <input
                  id="input-login-password"
                  type="password"
                  className="form-input"
                  style={{ paddingLeft: "38px" }}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button
              id="btn-submit-login"
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ width: "100%", marginTop: "12px" }}
            >
              <LogIn size={16} />
              <span>{loading ? "Kirilmoqda..." : "Tizimga kirish"}</span>
            </button>

            {/* Quick Demo Credentials */}
            <div style={{ marginTop: "18px", padding: "12px", background: "var(--bg-primary)", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)" }}>
              <span style={{ fontSize: "11px", color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>
                Sinov hisoblari (bosing):
              </span>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  type="button"
                  onClick={() => fillDemo("admin", "admin123")}
                  className="btn btn-sm btn-secondary"
                  style={{ fontSize: "11px", flex: 1 }}
                >
                  Admin (admin123)
                </button>
                <button
                  type="button"
                  onClick={() => fillDemo("elyor", "user123")}
                  className="btn btn-sm btn-secondary"
                  style={{ fontSize: "11px", flex: 1 }}
                >
                  Elyor (user123)
                </button>
              </div>
            </div>
          </form>
        ) : (
          <form onSubmit={handleRegister}>
            <div className="form-group">
              <label className="form-label">To&apos;liq ismingiz</label>
              <div style={{ position: "relative" }}>
                <UserIcon size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                <input
                  id="input-reg-name"
                  type="text"
                  className="form-input"
                  style={{ paddingLeft: "38px" }}
                  placeholder="Jasur Shermatov"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Foydalanuvchi nomi (Username)</label>
              <input
                id="input-reg-username"
                type="text"
                className="form-input"
                placeholder="jasur98"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email manzili</label>
              <div style={{ position: "relative" }}>
                <Mail size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                <input
                  id="input-reg-email"
                  type="email"
                  className="form-input"
                  style={{ paddingLeft: "38px" }}
                  placeholder="jasur@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Parol (kamida 6 belgi)</label>
              <div style={{ position: "relative" }}>
                <Key size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                <input
                  id="input-reg-password"
                  type="password"
                  className="form-input"
                  style={{ paddingLeft: "38px" }}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
            </div>

            <button
              id="btn-submit-register"
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ width: "100%", marginTop: "12px" }}
            >
              <UserPlus size={16} />
              <span>{loading ? "Yaratilmoqda..." : "Ro'yxatdan o'tish"}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
