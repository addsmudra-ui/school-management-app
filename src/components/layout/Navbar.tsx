
"use client";

import Link from "next/link";
import Image from "next/image";
import { Newspaper, User, PlusCircle, LayoutDashboard, LogOut, MapPin, Bell } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { SentNotification } from "@/lib/storage";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useFirestore, useCollection, useMemoFirebase, useUser } from "@/firebase";
import { collection, query, orderBy, limit } from "firebase/firestore";

export function Navbar() {
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const [role, setRole] = useState<'user' | 'reporter' | 'admin' | null>(null);
  const [userName, setUserName] = useState<string>("");
  const [userStatus, setUserStatus] = useState<string>("");
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const [location, setLocation] = useState({ mandal: "", district: "" });
  const [hasNewNotif, setHasNewNotif] = useState(false);

  const notifQuery = useMemoFirebase(() => {
    if (!firestore || isUserLoading) return null;
    return query(collection(firestore, 'notifications'), orderBy('timestamp', 'desc'), limit(20));
  }, [firestore, isUserLoading]);

  const { data: notifications } = useCollection<SentNotification>(notifQuery);

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
    setRole(savedRole || null);
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

  useEffect(() => {
    if (notifications && notifications.length > 0) {
      const lastSeen = localStorage.getItem('mandalPulse_lastSeenNotif');
      if (notifications[0].id !== lastSeen) {
        setHasNewNotif(true);
      }
    }
  }, [notifications]);

  const markAsRead = () => {
    if (notifications && notifications.length > 0) {
      localStorage.setItem('mandalPulse_lastSeenNotif', notifications[0].id);
      setHasNewNotif(false);
    }
  };

  const canPost = role === 'admin' || (role === 'reporter' && userStatus === 'approved');

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-muted h-16 md:top-0 md:bottom-auto md:border-t-0 md:border-b shadow-lg pb-safe">
      <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-primary font-bold text-xl">
          <Newspaper className="w-6 h-6" />
          <span className="hidden sm:inline font-headline tracking-tight">MandalPulse</span>
        </Link>

        <div className="hidden md:flex items-center gap-2 px-4 py-1.5 bg-primary/5 border border-primary/10 rounded-full text-xs font-bold text-primary">
          <MapPin className="w-3.5 h-3.5" />
          <span>{location.mandal}, {location.district}</span>
        </div>

        <div className="flex flex-1 justify-around md:justify-end md:gap-8 items-center h-full">
          <Link href="/" className="flex flex-col md:flex-row items-center gap-1 text-muted-foreground hover:text-primary transition-colors">
            <Newspaper className="w-5 h-5" />
            <span className="text-[10px] md:text-sm font-semibold">Home</span>
          </Link>

          <Sheet onOpenChange={(open) => open && markAsRead()}>
            <SheetTrigger asChild>
              <button className="flex flex-col md:flex-row items-center gap-1 text-muted-foreground hover:text-primary transition-colors relative">
                <div className="relative">
                  <Bell className={cn("w-5 h-5", hasNewNotif && "animate-bell")} />
                  {hasNewNotif && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white animate-pulse" />
                  )}
                </div>
                <span className="text-[10px] md:text-sm font-semibold">Alerts</span>
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[90%] sm:max-w-sm p-0 z-[100]">
              <SheetHeader className="p-6 border-b bg-primary/5">
                <SheetTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-primary" />
                  నోటిఫికేషన్లు (Notifications)
                </SheetTitle>
              </SheetHeader>
              <div className="flex flex-col h-full overflow-y-auto p-4 space-y-4 pb-32">
                {notifications && notifications.length > 0 ? (
                  notifications.map((n) => (
                    <div key={n.id} className="p-4 bg-muted/30 rounded-2xl border border-muted group hover:bg-white hover:shadow-md transition-all">
                      <div className="flex justify-between items-start mb-1">
                        <Badge variant="secondary" className="text-[10px] font-bold uppercase tracking-tighter bg-primary/10 text-primary border-none">
                          {n.target}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">
                          {n.timestamp?.toDate ? format(n.timestamp.toDate(), 'h:mm a') : 'Just now'}
                        </span>
                      </div>
                      <h4 className="font-bold text-sm mb-1">{n.title}</h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">{n.body}</p>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                      <Bell className="w-8 h-8 text-muted-foreground/30" />
                    </div>
                    <p className="text-muted-foreground italic text-sm">ప్రస్తుతానికి నోటిఫికేషన్లు ఏవీ లేవు.</p>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>

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
              {userName || "Profile"}
            </span>
          </Link>
        </div>
      </div>
    </nav>
  );
}
