
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
      // Don't toggle if user is touching the navbar, a button, or a dialog
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
                title: "బ్రేకింగ్ న్యూస్! (Breaking)",
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
        return {
          text: "text-rose-600",
          bg: "bg-rose-50",
          border: "border-rose-200",
          icon: "text-rose-500",
          hover: "hover:text-rose-700"
        };
      case 'reporter':
        return {
          text: "text-cyan-600",
          bg: "bg-cyan-50",
          border: "border-cyan-200",
          icon: "text-cyan-500",
          hover: "hover:text-cyan-700"
        };
      default:
        return {
          text: "text-primary",
          bg: "bg-primary/5",
          border: "border-primary/10",
          icon: "text-primary",
          hover: "hover:text-primary"
        };
    }
  };

  const theme = getRoleTheme();

  return (
    <nav className={cn(
      "fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-muted transition-all duration-500 pb-safe md:top-0 md:bottom-auto md:border-t-0 md:border-b shadow-[0_-10px_40px_rgba(0,0,0,0.05)] md:shadow-lg",
      isMinimized ? "h-14 opacity-95 backdrop-blur-md translate-y-2 md:translate-y-0" : "h-16 opacity-100"
    )}>
      <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
        {/* Logo - ALWAYS Fully Visible */}
        <Link href="/" className={cn("flex items-center gap-2 font-bold text-xl shrink-0", theme.text)}>
          <div className="relative w-8 h-8 flex items-center justify-center overflow-hidden shrink-0">
            {branding?.appLogo ? (
              <Image src={branding.appLogo} alt="Logo" fill className="object-contain" priority />
            ) : (
              <Newspaper className="w-6 h-6" />
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
          "hidden lg:flex items-center gap-2 px-4 py-1.5 border rounded-full text-xs font-bold transition-all duration-300",
          theme.bg, theme.border, theme.text,
          isMinimized ? "scale-0 w-0 opacity-0" : "scale-100"
        )}>
          <MapPin className={cn("w-3.5 h-3.5", theme.icon)} />
          <span>
            {location.district === "All" 
              ? "Location: Global" 
              : `Location: ${location.mandal === "All" ? "All Mandals" : location.mandal}, ${location.district}`}
          </span>
        </div>

        <div className="flex flex-1 justify-around md:justify-end md:gap-8 items-center h-full">
          {/* Home Icon - Hide on minimize */}
          <Link href="/" className={cn(
            "flex flex-col md:flex-row items-center gap-1 text-muted-foreground transition-all duration-300",
            theme.hover,
            isMinimized ? "opacity-0 translate-y-4 pointer-events-none w-0" : "opacity-100"
          )}>
            <Newspaper className="w-5 h-5" />
            <span className="text-[10px] md:text-sm font-semibold">Home</span>
          </Link>

          {/* Notification Icon - ALWAYS Visible & Enhanced when minimized */}
          <Sheet open={isNotifOpen} onOpenChange={(open) => { setIsNotifOpen(open); if (open) markAsRead(); }}>
            <SheetTrigger asChild>
              <button className={cn(
                "flex flex-col md:flex-row items-center gap-1 text-muted-foreground transition-all duration-300 relative px-4",
                theme.hover,
                isMinimized ? "scale-125" : "scale-100"
              )}>
                <div className="relative">
                  <Bell className={cn("w-5 h-5", hasNewNotif && "animate-bell", hasNewNotif && theme.text)} />
                  {hasNewNotif && (
                    <span className={cn("absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border-2 border-white animate-pulse", role === 'admin' ? "bg-rose-500" : "bg-primary")} />
                  )}
                </div>
                {!isMinimized && <span className="text-[10px] md:text-sm font-semibold">Alerts</span>}
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[90%] sm:max-w-sm p-0 z-[100]">
              <SheetHeader className={cn("p-6 border-b", theme.bg)}>
                <SheetTitle className="flex items-center gap-2">
                  <Bell className={cn("w-5 h-5", theme.icon)} />
                  నోటిఫికేషన్లు (Notifications)
                </SheetTitle>
              </SheetHeader>
              <div className="flex flex-col h-full overflow-y-auto p-4 space-y-4 pb-32">
                {notifications && notifications.length > 0 ? (
                  notifications.map((n) => (
                    <div 
                      key={n.id} 
                      onClick={() => handleNotifClick(n.postId)}
                      className={cn(
                        "p-4 rounded-2xl border transition-all group",
                        n.postId ? "cursor-pointer bg-white border-muted hover:shadow-md" : "bg-muted/30 border-transparent"
                      )}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <Badge variant="secondary" className={cn("text-[10px] font-bold uppercase tracking-tighter border-none", theme.bg, theme.text)}>
                          {n.target}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">
                          {n.timestamp?.toDate ? format(n.timestamp.toDate(), 'h:mm a') : 'Just now'}
                        </span>
                      </div>
                      <h4 className="font-bold text-sm mb-1">{n.title}</h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">{n.body}</p>
                      {n.postId && (
                        <div className={cn("mt-2 text-[10px] font-bold flex items-center gap-1 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity", theme.text)}>
                          View Details <ChevronRight className="w-3 h-3" />
                        </div>
                      )}
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

          {/* Post Icon - Hide on minimize */}
          {canPost && (
            <Link href="/reporter" className={cn(
              "flex flex-col md:flex-row items-center gap-1 text-muted-foreground transition-all duration-300",
              theme.hover,
              isMinimized ? "opacity-0 translate-y-4 pointer-events-none w-0" : "opacity-100"
            )}>
              <PlusCircle className="w-5 h-5" />
              <span className="text-[10px] md:text-sm font-semibold">Post</span>
            </Link>
          )}

          {/* Admin Icon - Hide on minimize */}
          {(role === 'admin' || role === 'editor') && (
            <Link href="/admin" className={cn(
              "flex flex-col md:flex-row items-center gap-1 text-muted-foreground transition-all duration-300",
              theme.hover,
              isMinimized ? "opacity-0 translate-y-4 pointer-events-none w-0" : "opacity-100"
            )}>
              <LayoutDashboard className="w-5 h-5" />
              <span className="text-[10px] md:text-sm font-semibold">Moderate</span>
            </Link>
          )}

          {/* Profile Icon - Hide on minimize */}
          <Link href={userName ? "/profile" : "/login"} className={cn(
            "flex flex-col md:flex-row items-center gap-1 text-muted-foreground transition-all duration-300",
            theme.hover,
            isMinimized ? "opacity-0 translate-y-4 pointer-events-none w-0" : "opacity-100"
          )}>
            {userPhoto ? (
              <div className={cn("relative w-6 h-6 rounded-full overflow-hidden border", theme.border)}>
                <Image src={userPhoto} alt={userName} fill className="object-cover opacity-100" />
              </div>
            ) : (
              <User className={cn("w-5 h-5", theme.icon)} />
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
