import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Shajara (Yetti Pusht) — Raqamli Nasabnoma va Oila Shajarasi",
  description: "O'zbek xalqining 7 ajdodini bilish qadriyatiga asoslangan, xavfsiz va chop etishga tayyor raqamli shajara tizimi.",
  keywords: ["shajara", "yetti pusht", "nasabnoma", "family tree", "uzbekistan shajara", "ajdodlar"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="uz" data-theme="dark">
      <body>
        <div className="ambient-bg" />
        {children}
      </body>
    </html>
  );
}
