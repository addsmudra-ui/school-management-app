"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Newspaper, User, PlusCircle, LayoutDashboard, LogOut } from "lucide-react";
import { useState, useEffect } from "react";

export function Navbar() {
  const [role, setRole] = useState<'user' | 'reporter' | 'admin' | null>(null);

  // Simulation of auth state
  useEffect(() => {
    const savedRole = localStorage.getItem('mandalPulse_role') as any;
    setRole(savedRole || 'user');
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('mandalPulse_role');
    window.location.href = '/login';
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-muted h-16 md:top-0 md:bottom-auto">
      <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-primary font-bold text-xl hidden md:flex">
          <Newspaper className="w-6 h-6" />
          <span>MandalPulse</span>
        </Link>

        <div className="flex flex-1 justify-around md:justify-end md:gap-8 items-center h-full">
          <Link href="/" className="flex flex-col md:flex-row items-center gap-1 text-muted-foreground hover:text-primary transition-colors">
            <Newspaper className="w-5 h-5" />
            <span className="text-[10px] md:text-sm font-medium">Home</span>
          </Link>

          {(role === 'reporter' || role === 'admin') && (
            <Link href="/reporter" className="flex flex-col md:flex-row items-center gap-1 text-muted-foreground hover:text-primary transition-colors">
              <PlusCircle className="w-5 h-5" />
              <span className="text-[10px] md:text-sm font-medium">Post</span>
            </Link>
          )}

          {role === 'admin' && (
            <Link href="/admin" className="flex flex-col md:flex-row items-center gap-1 text-muted-foreground hover:text-primary transition-colors">
              <LayoutDashboard className="w-5 h-5" />
              <span className="text-[10px] md:text-sm font-medium">Moderate</span>
            </Link>
          )}

          <Link href="/login" className="flex flex-col md:flex-row items-center gap-1 text-muted-foreground hover:text-primary transition-colors">
            <User className="w-5 h-5" />
            <span className="text-[10px] md:text-sm font-medium">Account</span>
          </Link>

          <button 
            onClick={handleLogout}
            className="hidden md:flex flex-row items-center gap-1 text-destructive hover:opacity-80 transition-colors ml-4"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
