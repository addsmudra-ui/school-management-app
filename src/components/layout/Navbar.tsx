
"use client";

import Link from "next/link";
import Image from "next/image";
import { Newspaper, User, PlusCircle, LayoutDashboard, Bell, ChevronRight, MapPin } from "lucide-react";
import { useState, useEffect, useCallback, useRef } from "react";
import { SentNotification } from "@/lib/storage";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc } from "@/firebase";
import { collection, query, orderBy, limit, doc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

export function Navbar() {
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const { user, isUserLoading } = useUser();
  const [role, setRole] = useState<'user' | 'reporter' | 'admin' | 'editor' | null>(null);
  const [userName, setUserName] = useState<string>("");
  const [userStatus, setUserStatus] = useState<string>("");
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const [location, setLocation] = useState({ mandal: "", district: "" });
  const [hasNewNotif, setHasNewNotif] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  
  // Navigation Visibility State
  const [isMinimized, setIsMinimized] = useState(false);
  
  const lastToastedId = useRef<string | null>(null);

  // Real-time branding
  const brandingRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'config', 'admin');
  }, [firestore]);
  const { data: branding } = useDoc(brandingRef);

  // Real-time Profile for fallback
  const profileRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user?.uid]);
  const { data: profile } = useDoc(profileRef);

  const notifQuery = useMemoFirebase(() => {
    if (!firestore || isUserLoading) return null;
    return query(collection(firestore, 'notifications'), orderBy('timestamp', 'desc'), limit(20));
  }, [firestore, isUserLoading]);

  const { data: notifications } = useCollection<SentNotification>(notifQuery);

  // Distraction-Free Interaction Logic
  useEffect(() => {
    const handleTouch = (e: any) => {
      if (e.target.closest('nav') || e.target.closest('button') || e.target.closest('[role="dialog"]')) return;
      setIsMinimized(prev => !prev);
    };

    window.addEventListener('touchstart', handleTouch);
    window.addEventListener('mousedown', handleTouch);

    return () => {
      window.removeEventListener('touchstart', handleTouch);
      window.removeEventListener('mousedown', handleTouch);
    };
  }, []);

  const updateLocationState = useCallback(() => {
    if (typeof window === 'undefined') return;
    const savedDistrict = localStorage.getItem('teluguNewsPulse_district') || "All";
    const savedMandal = localStorage.getItem('teluguNewsPulse_mandal') || "All";
    setLocation({ district: savedDistrict, mandal: savedMandal });
  }, []);

  const updateAuthState = useCallback(() => {
    if (profile) {
      setRole(profile.role);
      setUserName(profile.name);
      setUserStatus(profile.status);
      setUserPhoto(profile.photo || null);
    } else {
      if (typeof window === 'undefined') return;
      const savedRole = localStorage.getItem('teluguNewsPulse_role') as any;
      const savedName = localStorage.getItem('teluguNewsPulse_userName');
      const savedStatus = localStorage.getItem('teluguNewsPulse_userStatus');
      const savedPhoto = localStorage.getItem('teluguNewsPulse_userPhoto');
      setRole(savedRole || null);
      setUserName(savedName || "");
      setUserStatus(savedStatus || "");
      setUserPhoto(savedPhoto || null);
    }
  }, [profile]);

  useEffect(() => {
    updateAuthState();
    updateLocationState();

    window.addEventListener('teluguNewsPulse_locationChanged', updateLocationState);
    window.addEventListener('teluguNewsPulse_authChanged', updateAuthState);
    
    return () => {
      window.removeEventListener('teluguNewsPulse_locationChanged', updateLocationState);
      window.removeEventListener('teluguNewsPulse_authChanged', updateAuthState);
    };
  }, [updateLocationState, updateAuthState]);

  useEffect(() => {
    if (notifications && notifications.length > 0) {
      const latest = notifications[0];
      const lastSeen = localStorage.getItem('teluguNewsPulse_lastSeenNotif');
      
      if (lastToastedId.current !== latest.id) {
        if (latest.id !== lastSeen) {
          setHasNewNotif(true);
          if (latest.timestamp?.toDate) {
            const now = new Date().getTime();
            const notifTime = latest.timestamp.toDate().getTime();
            if (now - notifTime < 120000) {
              toast({
                title: "బ్రేకింగ్ న్యూస్!",
                description: latest.title,
              });
            }
          }
        }
        lastToastedId.current = latest.id;
      }
    }
  }, [notifications, toast]);

  const markAsRead = () => {
    if (notifications && notifications.length > 0) {
      localStorage.setItem('teluguNewsPulse_lastSeenNotif', notifications[0].id);
      setHasNewNotif(false);
    }
  };

  const handleNotifClick = (postId?: string) => {
    setIsNotifOpen(false);
    if (postId) {
      router.push(`/?postId=${postId}`);
    }
  };

  const canPost = role === 'admin' || role === 'editor' || (role === 'reporter' && userStatus === 'approved');

  const getRoleTheme = () => {
    switch (role) {
      case 'admin':
      case 'editor':
        return { text: "text-rose-600", bg: "bg-rose-50", border: "border-rose-200", icon: "text-rose-500", hover: "hover:text-rose-700" };
      case 'reporter':
        return { text: "text-cyan-600", bg: "bg-cyan-50", border: "border-cyan-200", icon: "text-cyan-500", hover: "hover:text-cyan-700" };
      default:
        return { text: "text-primary", bg: "bg-primary/5", border: "border-primary/10", icon: "text-primary", hover: "hover:text-primary" };
    }
  };

  const theme = getRoleTheme();

  return (
    <nav className={cn(
      "fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-muted transition-all duration-500 pb-safe md:top-0 md:bottom-auto md:border-t-0 md:border-b shadow-lg",
      isMinimized ? "h-12 opacity-95 backdrop-blur-md translate-y-1 md:translate-y-0" : "h-14 opacity-100"
    )}>
      <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
        <Link href="/" className={cn("flex items-center gap-1.5 font-bold text-lg shrink-0", theme.text)}>
          <div className="relative w-7 h-7 flex items-center justify-center overflow-hidden shrink-0">
            {branding?.appLogo ? (
              <Image src={branding.appLogo} alt="Logo" fill className="object-contain" priority />
            ) : (
              <Newspaper className="w-5 h-5" />
            )}
          </div>
          <span className={cn(
            "hidden sm:inline font-headline tracking-tight transition-all duration-300 overflow-hidden",
            isMinimized ? "max-w-0 opacity-0" : "max-w-xs opacity-100"
          )}>
            {branding?.appName || 'Telugu News Pulse'}
          </span>
        </Link>

        <div className={cn(
          "hidden lg:flex items-center gap-1.5 px-3 py-1 border rounded-full text-[10px] font-bold transition-all duration-300",
          theme.bg, theme.border, theme.text,
          isMinimized ? "scale-0 w-0 opacity-0" : "scale-100"
        )}>
          <MapPin className={cn("w-3 h-3", theme.icon)} />
          <span>
            {location.district === "All" 
              ? "Global" 
              : `${location.mandal === "All" ? "All Mandals" : location.mandal}, ${location.district}`}
          </span>
        </div>

        <div className="flex flex-1 justify-around md:justify-end md:gap-6 items-center h-full">
          <Link href="/" className={cn(
            "flex flex-col md:flex-row items-center gap-0.5 text-muted-foreground transition-all duration-300",
            theme.hover,
            isMinimized ? "opacity-0 translate-y-4 pointer-events-none w-0" : "opacity-100"
          )}>
            <Newspaper className="w-4 h-4" />
            <span className="text-[9px] md:text-xs font-semibold">Home</span>
          </Link>

          <Sheet open={isNotifOpen} onOpenChange={(open) => { setIsNotifOpen(open); if (open) markAsRead(); }}>
            <SheetTrigger asChild>
              <button className={cn(
                "flex flex-col md:flex-row items-center gap-0.5 text-muted-foreground transition-all duration-300 relative px-3",
                theme.hover,
                isMinimized ? "scale-110" : "scale-100"
              )}>
                <div className="relative">
                  <Bell className={cn("w-4 h-4", hasNewNotif && "animate-bell", hasNewNotif && theme.text)} />
                  {hasNewNotif && (
                    <span className={cn("absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full border border-white animate-pulse", role === 'admin' ? "bg-rose-500" : "bg-primary")} />
                  )}
                </div>
                {!isMinimized && <span className="text-[9px] md:text-xs font-semibold">Alerts</span>}
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[85%] sm:max-w-xs p-0 z-[100] border-none shadow-2xl">
              <SheetHeader className={cn("p-4 border-b", theme.bg)}>
                <SheetTitle className="flex items-center gap-2 text-base">
                  <Bell className={cn("w-4 h-4", theme.icon)} />
                  నోటిఫికేషన్లు
                </SheetTitle>
              </SheetHeader>
              <div className="flex flex-col h-full overflow-y-auto p-3 space-y-3 pb-32">
                {notifications && notifications.length > 0 ? (
                  notifications.map((n) => (
                    <div 
                      key={n.id} 
                      onClick={() => handleNotifClick(n.postId)}
                      className={cn(
                        "p-3 rounded-xl border transition-all group",
                        n.postId ? "cursor-pointer bg-white border-muted hover:shadow-md" : "bg-muted/20 border-transparent"
                      )}
                    >
                      <div className="flex justify-between items-start mb-0.5">
                        <Badge variant="secondary" className={cn("text-[8px] font-bold uppercase px-1.5 border-none", theme.bg, theme.text)}>
                          {n.target}
                        </Badge>
                        <span className="text-[8px] text-muted-foreground">
                          {n.timestamp?.toDate ? format(n.timestamp.toDate(), 'h:mm a') : 'Just now'}
                        </span>
                      </div>
                      <h4 className="font-bold text-xs mb-0.5 line-clamp-1">{n.title}</h4>
                      <p className="text-[10px] text-muted-foreground leading-relaxed line-clamp-2">{n.body}</p>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
                    <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                      <Bell className="w-6 h-6 text-muted-foreground/30" />
                    </div>
                    <p className="text-muted-foreground italic text-xs">నోటిఫికేషన్లు లేవు.</p>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>

          {canPost && (
            <Link href="/reporter" className={cn(
              "flex flex-col md:flex-row items-center gap-0.5 text-muted-foreground transition-all duration-300",
              theme.hover,
              isMinimized ? "opacity-0 translate-y-4 pointer-events-none w-0" : "opacity-100"
            )}>
              <PlusCircle className="w-4 h-4" />
              <span className="text-[9px] md:text-xs font-semibold">Post</span>
            </Link>
          )}

          {(role === 'admin' || role === 'editor') && (
            <Link href="/admin" className={cn(
              "flex flex-col md:flex-row items-center gap-0.5 text-muted-foreground transition-all duration-300",
              theme.hover,
              isMinimized ? "opacity-0 translate-y-4 pointer-events-none w-0" : "opacity-100"
            )}>
              <LayoutDashboard className="w-4 h-4" />
              <span className="text-[9px] md:text-xs font-semibold">Moderate</span>
            </Link>
          )}

          <Link href={userName ? "/profile" : "/login"} className={cn(
            "flex flex-col md:flex-row items-center gap-0.5 text-muted-foreground transition-all duration-300",
            theme.hover,
            isMinimized ? "opacity-0 translate-y-4 pointer-events-none w-0" : "opacity-100"
          )}>
            {userPhoto ? (
              <div className={cn("relative w-5 h-5 rounded-full overflow-hidden border", theme.border)}>
                <Image src={userPhoto} alt={userName} fill className="object-cover" />
              </div>
            ) : (
              <User className={cn("w-4 h-4", theme.icon)} />
            )}
            <span className="text-[9px] md:text-xs font-semibold truncate max-w-[50px] md:max-w-none">
              {userName || "Profile"}
            </span>
          </Link>
        </div>
      </div>
    </nav>
  );
}
