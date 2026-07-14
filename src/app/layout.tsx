import type { Metadata } from "next";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import { AuthGate } from "@/components/auth/AuthGate";
import "./globals.css";

export const metadata: Metadata = {
  title: "ORBAT Manager",
  description: "Управление расстановкой отряда",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans">
        <ThemeProvider>
          <AuthGate>{children}</AuthGate>
        </ThemeProvider>
      </body>
    </html>
  );
}
