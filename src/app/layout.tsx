import type { Metadata } from "next";
import { NavShell } from "@/components/layout/nav-shell";
import { AuthProvider } from "@/components/auth/auth-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "TribalScholar AI — AI-Enabled Scholarship & Fellowship Management System",
  description:
    "SIH 26239: Intelligent, configurable, evidence-aware scholarship case orchestration platform for Scheduled Tribes.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col bg-slate-50 antialiased">
        <AuthProvider>
          <NavShell />
          <main className="container mx-auto flex-1 px-4 py-8">{children}</main>
          <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
            <div className="container mx-auto">
              TribalScholar AI &bull; Smart India Hackathon Problem Statement 26239 &bull; Ministry
              of Tribal Affairs
            </div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
