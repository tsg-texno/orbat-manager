'use client';
import { useEffect, useState } from 'react';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Header } from './Header';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [dark, setDark] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('orbat_theme');
    const preferDark = stored ? stored === 'dark' : true;
    setDark(preferDark);
    document.documentElement.classList.toggle('dark', preferDark);
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    localStorage.setItem('orbat_theme', next ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', next);
  };

  if (!mounted) return <div className="min-h-screen bg-background" />;

  return (
    <TooltipProvider>
      <Header />
      <main className="flex-1 p-4 md:p-6">{children}</main>
    </TooltipProvider>
  );
}
