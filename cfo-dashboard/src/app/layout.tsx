import type { Metadata } from "next";
import "./globals.css";
import NavBar from "@/components/NavBar";

export const metadata: Metadata = {
  title: "CFO Dashboard — AskLien.ai",
  description: "Wekelijks cash- en groei-overzicht voor AskLien.ai",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl">
      <body>
        <NavBar />
        <main className="mx-auto max-w-6xl px-4 pb-20 pt-4">{children}</main>
      </body>
    </html>
  );
}
