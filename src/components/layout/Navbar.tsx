"use client";

import Link from "next/link";
import Image from "next/image";
import { Newspaper, User, PlusCircle, LayoutDashboard, LogOut, MapPin } from "lucide-react";
import { useState, useEffect, useCallback } from "react";

export function Navbar() {
  const [role, setRole] = useState<'user' | 'reporter' | 'admin' | null>(null);
  const [userName, setUserName] = useState<string>("");
  const [userStatus, setUserStatus] = useState<string>("");
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const [location, setLocation] = useState({ mandal: "", district: "" });

  const updateLocationState = useCallback(() => {
    if (typeof window === 'undefined') return;
    const savedDistrict = localStorage.getItem('mandalPulse_district') || "Warangal";
    const savedMandal = localStorage.getItem('mandalPulse_mandal') || "All";
    setLocation({ district: savedDistrict, mandal: savedMandal === "All" ? "అన్ని మండలాలు" : savedMandal });
  }, []);

  const updateAuthState = useCallback(() => {
    if (typeof window === 'undefined') return;
    const savedRole = localStorage.getItem('mandalPulse_role') as any;
    const savedName = localStorage.getItem('mandalPulse_userName');
    const savedStatus = localStorage.getItem('mandalPulse_userStatus');
    const savedPhoto = localStorage.getItem('mandalPulse_userPhoto');
    setRole(savedRole || 'user');
    setUserName(savedName || "");
    setUserStatus(savedStatus || "");
    setUserPhoto(savedPhoto || null);
  }, []);

  useEffect(() => {
    updateAuthState();
    updateLocationState();

    window.addEventListener('mandalPulse_locationChanged', updateLocationState);
    window.addEventListener('mandalPulse_authChanged', updateAuthState);
    
    return () => {
      window.removeEventListener('mandalPulse_locationChanged', updateLocationState);
      window.removeEventListener('mandalPulse_authChanged', updateAuthState);
    };
  }, [updateLocationState, updateAuthState]);

  const handleLogout = () => {
    localStorage.removeItem('mandalPulse_role');
    localStorage.removeItem('mandalPulse_userName');
    localStorage.removeItem('mandalPulse_userPhone');
    localStorage.removeItem('mandalPulse_userStatus');
    localStorage.removeItem('mandalPulse_state');
    localStorage.removeItem('mandalPulse_district');
    localStorage.removeItem('mandalPulse_mandal');
    localStorage.removeItem('mandalPulse_userPhoto');
    setRole(null);
    setUserName("");
    setUserPhoto(null);
    window.dispatchEvent(new Event('mandalPulse_authChanged'));
    window.location.href = '/login';
  };

  const canPost = role === 'admin' || (role === 'reporter' && userStatus === 'approved');

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-muted h-16 md:top-0 md:bottom-auto md:border-t-0 md:border-b shadow-sm">
      <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-primary font-bold text-xl">
          <Newspaper className="w-6 h-6" />
          <span className="hidden sm:inline font-headline tracking-tight">MandalPulse</span>
        </Link>

        {/* Desktop Location Display */}
        <div className="hidden md:flex items-center gap-2 px-4 py-1.5 bg-primary/5 border border-primary/10 rounded-full text-xs font-bold text-primary">
          <MapPin className="w-3.5 h-3.5" />
          <span>{location.mandal}, {location.district}</span>
        </div>

        <div className="flex flex-1 justify-around md:justify-end md:gap-8 items-center h-full">
          <Link href="/" className="flex flex-col md:flex-row items-center gap-1 text-muted-foreground hover:text-primary transition-colors">
            <Newspaper className="w-5 h-5" />
            <span className="text-[10px] md:text-sm font-semibold">Home</span>
          </Link>

          {canPost && (
            <Link href="/reporter" className="flex flex-col md:flex-row items-center gap-1 text-muted-foreground hover:text-primary transition-colors">
              <PlusCircle className="w-5 h-5" />
              <span className="text-[10px] md:text-sm font-semibold">Post</span>
            </Link>
          )}

          {role === 'admin' && (
            <Link href="/admin" className="flex flex-col md:flex-row items-center gap-1 text-muted-foreground hover:text-primary transition-colors">
              <LayoutDashboard className="w-5 h-5" />
              <span className="text-[10px] md:text-sm font-semibold">Moderate</span>
            </Link>
          )}

          <Link href={userName ? "/profile" : "/login"} className="flex flex-col md:flex-row items-center gap-1 text-muted-foreground hover:text-primary transition-colors">
            {userPhoto ? (
              <div className="relative w-6 h-6 rounded-full overflow-hidden border border-primary/20">
                <Image src={userPhoto} alt={userName} fill className="object-cover" />
              </div>
            ) : (
              <User className="w-5 h-5 text-primary" />
            )}
            <span className="text-[10px] md:text-sm font-semibold truncate max-w-[60px] md:max-w-none">
              {userName || "Login"}
            </span>
          </Link>

          {userName && (
            <button 
              onClick={handleLogout}
              className="hidden md:flex flex-row items-center gap-1 text-destructive hover:opacity-80 transition-colors ml-4"
            >
              <LogOut className="w-5 h-5" />
              <span className="text-sm font-semibold">Logout</span>
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
