'use client';

import { useState, useEffect } from 'react';

/**
 * A simple, consistent footer component for the application.
 * Displays copyright information with dynamic year to avoid hydration mismatches.
 */
export function Footer() {
  const [year, setYear] = useState<number | null>(null);

  useEffect(() => {
    setYear(new Date().getFullYear());
  }, []);

  return (
    <footer className="py-12 mt-auto text-center">
      <div className="max-w-md mx-auto px-4">
        <div className="h-px w-12 bg-muted-foreground/20 mx-auto mb-6" />
        <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-bold opacity-50">
          © {year || '2025'} Telugu News Pulse. All Rights Reserved.
        </p>
      </div>
    </footer>
  );
}
