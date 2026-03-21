"use client";

import Link from "next/link";
import Image from "next/image";
import { Newspaper, User, PlusCircle, LayoutDashboard, Bell, ChevronRight, MapPin, FileText, Shield, Info, AlertTriangle, ExternalLink, Home, Flag, Globe, Wallet, HeartPulse, Film, Trophy, Cpu } from "lucide-react";
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { SentNotification } from "@/lib/storage";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc } from "@/firebase";
import { collection, query, orderBy, limit, doc } from "firebase/firestore";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LOCATIONS as MOCK_LOCATIONS, NEWS_CATEGORIES } from "@/lib/mock-data";

export function Navbar() {
  const firestore = useFirestore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { user, isUserLoading } = useUser();
  const [role, setRole] = useState<'user' | 'reporter' | 'admin' | 'editor' | null>(null);
  const [userName, setUserName] = useState<string>("");
  const [userStatus, setUserStatus] = useState<string>("");
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const [location, setLocation] = useState({ mandal: "", district: "" });
  const [hasNewNotif, setHasNewNotif] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isLegalOpen, setIsLegalOpen] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  
  const [isMinimized, setIsMinimized] = useState(false);
  const lastToastedId = useRef<string | null>(null);

  const selectedCategory = searchParams.get('category') || 'Home';

  // Real-time branding
  const brandingRef = useMemoFirebase(() => firestore ? doc(firestore, 'config', 'admin') : null, [firestore]);
  const { data: branding } = useDoc(brandingRef);

  // Real-time categories
  const catRef = useMemoFirebase(() => firestore ? doc(firestore, 'metadata', 'categories') : null, [firestore]);
  const { data: categoriesDoc } = useDoc(catRef);
  const dynamicCategories = useMemo(() => categoriesDoc?.items || NEWS_CATEGORIES, [categoriesDoc]);

  // Real-time Profile
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

  const locDocRef = useMemoFirebase(() => firestore ? doc(firestore, 'metadata', 'locations') : null, [firestore]);
  const { data: locationsDoc } = useDoc(locDocRef);
  
  const dynamicLocations = useMemo(() => {
    if (!locationsDoc) return MOCK_LOCATIONS;
    const { id, ...statesOnly } = locationsDoc as any;
    return Object.values(statesOnly).reduce((acc: any, stateObj: any) => {
      if (typeof stateObj !== 'object' || stateObj === null) return acc;
      return { ...acc, ...stateObj };
    }, {});
  }, [locationsDoc]);

  useEffect(() => {
    const handleTouch = (e: any) => {
      if (e.target.closest('nav') || e.target.closest('button') || e.target.closest('[role="dialog"]') || e.target.closest('[role="menu"]')) return;
      setIsMinimized(prev => !prev);
    };
    window.addEventListener('mousedown', handleTouch);
    return () => window.removeEventListener('mousedown', handleTouch);
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
      setRole(localStorage.getItem('teluguNewsPulse_role') as any);
      setUserName(localStorage.getItem('teluguNewsPulse_userName') || "");
      setUserStatus(localStorage.getItem('teluguNewsPulse_userStatus') || "");
      setUserPhoto(localStorage.getItem('teluguNewsPulse_userPhoto') || null);
    }
  }, [profile]);

  useEffect(() => {
    updateAuthState(); updateLocationState();
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
          if (latest.timestamp?.toDate && (new Date().getTime() - latest.timestamp.toDate().getTime() < 120000)) {
            toast({ title: "బ్రేకింగ్ న్యూస్!", description: latest.title });
          }
        }
        lastToastedId.current = latest.id;
      }
    }
  }, [notifications, toast]);

  const markAsRead = () => {
    if (notifications?.length) {
      localStorage.setItem('teluguNewsPulse_lastSeenNotif', notifications[0].id);
      setHasNewNotif(false);
    }
  };

  const handleNotifClick = (postId?: string) => {
    setIsNotifOpen(false);
    if (postId) router.push(`/?postId=${postId}`);
  };

  const handleLocationUpdate = (dist: string, mandal: string) => {
    localStorage.setItem('teluguNewsPulse_district', dist);
    localStorage.setItem('teluguNewsPulse_mandal', mandal);
    setIsLocationModalOpen(false);
    window.dispatchEvent(new Event('teluguNewsPulse_locationChanged'));
  };

  const handleCategorySelect = (cat: string) => {
    router.push(`/?category=${cat}`);
    setIsLegalOpen(false);
  };

  const canPost = role === 'admin' || role === 'editor' || (role === 'reporter' && userStatus === 'approved');

  const getRoleTheme = () => {
    if (role === 'admin' || role === 'editor') return { text: "text-rose-600", bg: "bg-rose-50", border: "border-rose-200", icon: "text-rose-500", hover: "hover:text-rose-700" };
    if (role === 'reporter') return { text: "text-cyan-600", bg: "bg-cyan-50", border: "border-cyan-200", icon: "text-cyan-500", hover: "hover:text-cyan-700" };
    return { text: "text-primary", bg: "bg-primary/5", border: "border-primary/10", icon: "text-primary", hover: "hover:text-primary" };
  };

  const theme = getRoleTheme();

  const getCategoryIcon = (iconName: string) => {
    switch(iconName) {
      case 'Home': return <Home className="w-4 h-4" />;
      case 'Flag': return <Flag className="w-4 h-4" />;
      case 'Globe': return <Globe className="w-4 h-4" />;
      case 'Wallet': return <Wallet className="w-4 h-4" />;
      case 'HeartPulse': return <HeartPulse className="w-4 h-4" />;
      case 'Film': return <Film className="w-4 h-4" />;
      case 'Trophy': return <Trophy className="w-4 h-4" />;
      case 'Cpu': return <Cpu className="w-4 h-4" />;
      default: return <Newspaper className="w-4 h-4" />;
    }
  };

  return (
    <nav className={cn(
      "fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-muted transition-all duration-500 pb-safe md:top-0 md:bottom-auto md:border-t-0 md:border-b shadow-lg",
      isMinimized ? "h-12 opacity-95 backdrop-blur-md translate-y-1 md:translate-y-0" : "h-14 opacity-100"
    )}>
      <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
        
        <Sheet open={isLegalOpen} onOpenChange={setIsLegalOpen}>
          <SheetTrigger asChild>
            <button className={cn("flex items-center gap-1.5 font-bold text-lg shrink-0", theme.text)}>
              <div className="relative w-7 h-7 flex items-center justify-center overflow-hidden shrink-0">
                {branding?.appLogo ? <Image src={branding.appLogo} alt="Logo" fill className="object-contain" priority /> : <Newspaper className="w-5 h-5" />}
              </div>
              <span className={cn("hidden sm:inline font-headline tracking-tight transition-all duration-300 overflow-hidden", isMinimized ? "max-w-0 opacity-0" : "max-w-xs opacity-100")}>
                {branding?.appName || 'Telugu News Pulse'}
              </span>
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[85%] sm:max-w-xs p-0 z-[110] border-none shadow-2xl">
            <SheetHeader className={cn("p-6 border-b", theme.bg)}>
              <div className="flex flex-col items-center gap-3">
                <div className="relative w-12 h-12 flex items-center justify-center overflow-hidden shrink-0">
                  {branding?.appLogo ? <Image src={branding.appLogo} alt="Logo" fill className="object-contain" priority /> : <Newspaper className="w-8 h-8 text-primary" />}
                </div>
                <SheetTitle className="text-sm font-black tracking-tight">{branding?.appName || 'Telugu News Pulse'}</SheetTitle>
              </div>
            </SheetHeader>
            
            <div className="flex flex-col h-full overflow-y-auto pb-32">
              <div className="p-4 space-y-4 border-b">
                <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest px-2 mb-2">Sections (న్యూస్ సెక్షన్స్)</p>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => handleCategorySelect('All')} className={cn("flex items-center gap-3 p-2.5 rounded-xl transition-all border", selectedCategory === 'All' ? "bg-primary text-white border-primary shadow-md" : "bg-slate-50 border-transparent hover:bg-slate-100")}>
                    <Globe className={cn("w-4 h-4", selectedCategory === 'All' ? "text-white" : "text-primary")} />
                    <span className="text-[10px] font-bold">All (అన్నీ)</span>
                  </button>
                  {dynamicCategories.map((cat: any) => (
                    <button key={cat.value} onClick={() => handleCategorySelect(cat.value)} className={cn("flex items-center gap-3 p-2.5 rounded-xl transition-all border", selectedCategory === cat.value ? "bg-primary text-white border-primary shadow-md" : "bg-slate-50 border-transparent hover:bg-slate-100")}>
                      <div className={cn("shrink-0", selectedCategory === cat.value ? "text-white" : "text-primary")}>{getCategoryIcon(cat.icon)}</div>
                      <span className="text-[10px] font-bold truncate">{cat.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {userName && (
                <div className="p-4 border-b bg-slate-50/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full border bg-white overflow-hidden shrink-0">
                      {userPhoto ? <Image src={userPhoto} alt={userName} width={40} height={40} className="object-cover" /> : <User className="w-full h-full p-2 text-muted-foreground" />}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-black truncate">{userName}</span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Badge variant="outline" className="text-[8px] font-bold uppercase border-muted-foreground/20 px-1 h-4">{role}</Badge>
                        <span className="text-[8px] text-muted-foreground font-medium flex items-center gap-0.5"><MapPin className="w-2 h-2" />{location.mandal}, {location.district}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="p-4 space-y-4">
                <div className="space-y-1">
                  <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest px-2 mb-2">Legal & Information</p>
                  <Link href="/privacy" onClick={() => setIsLegalOpen(false)} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors group"><Shield className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" /><span className="text-[11px] font-bold">Privacy Policy</span><ChevronRight className="w-3 h-3 ml-auto text-muted-foreground/50" /></Link>
                  <Link href="/guidelines" onClick={() => setIsLegalOpen(false)} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors group"><FileText className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" /><span className="text-[11px] font-bold">Terms & Conditions</span><ChevronRight className="w-3 h-3 ml-auto text-muted-foreground/50" /></Link>
                  <div className="p-2.5 rounded-xl bg-amber-50/50 border border-amber-100">
                    <div className="flex items-center gap-2 mb-1.5"><AlertTriangle className="w-3.5 h-3.5 text-amber-600" /><span className="text-[10px] font-black uppercase tracking-tight text-amber-800">Disclaimer</span></div>
                    <p className="text-[9px] text-amber-900 leading-relaxed font-medium opacity-80">ఈ యాప్‌లో ప్రచురించబడే వార్తలు మరియు అభిప్రాయాలు సంబంధిత రిపోర్టర్లవే. ప్లాట్‌ఫారమ్ ఏవైనా వాస్తవాలకు లేదా వార్తా కంటెంట్‌కు బాధ్యత వహించదు.</p>
                  </div>
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        <div className="flex flex-1 justify-around md:justify-end md:gap-6 items-center h-full">
          <Link href="/" className={cn("flex flex-col md:flex-row items-center gap-0.5 text-muted-foreground transition-all duration-300", theme.hover, isMinimized ? "opacity-0 translate-y-4 pointer-events-none w-0" : "opacity-100")}><Home className="w-4 h-4" /><span className="text-[9px] md:text-xs font-semibold">Home</span></Link>

          <Dialog open={isLocationModalOpen} onOpenChange={setIsLocationModalOpen}>
            <DialogTrigger asChild><button className={cn("flex flex-col md:flex-row items-center gap-0.5 text-muted-foreground transition-all duration-300 relative px-3", theme.hover, isMinimized ? "scale-110" : "scale-100")}><MapPin className={cn("w-4 h-4", !isMinimized && theme.text)} />{!isMinimized && <span className="text-[9px] md:text-xs font-semibold max-w-[60px] truncate">{location.district === "All" ? "Global" : location.mandal === "All" ? location.district : location.mandal}</span>}</button></DialogTrigger>
            <DialogContent className="w-[92%] max-w-sm rounded-[2rem] p-8 border-none shadow-2xl">
              <DialogHeader><DialogTitle className="text-xl font-black text-center mb-4">ప్రాంతాన్ని ఎంచుకోండి</DialogTitle></DialogHeader>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-primary uppercase tracking-widest ml-1">జిల్లా (District)</label>
                  <Select value={location.district} onValueChange={(val) => handleLocationUpdate(val, "All")}>
                    <SelectTrigger className="w-full h-12 rounded-2xl border-slate-100 bg-slate-50 font-bold text-xs"><SelectValue placeholder="జిల్లాను ఎంచుకోండి" /></SelectTrigger>
                    <SelectContent><SelectItem value="All">అన్ని జిల్లాలు (All Districts)</SelectItem>{Object.keys(dynamicLocations).sort().map((d) => <SelectItem key={d} value={d} className="font-bold text-xs">{d}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                {location.district !== "All" && (
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-primary uppercase tracking-widest ml-1">మండలం (Mandal)</label>
                    <Select value={location.mandal} onValueChange={(val) => handleLocationUpdate(location.district, val)}>
                      <SelectTrigger className="w-full h-12 rounded-2xl border-slate-100 bg-slate-50 font-bold text-xs"><SelectValue placeholder="మండలాన్ని ఎంచుకోండి" /></SelectTrigger>
                      <SelectContent><SelectItem value="All">అన్ని మండలాలు</SelectItem>{dynamicLocations[location.district]?.map((m: string) => <SelectItem key={m} value={m} className="font-bold text-xs">{m}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                )}
                <Button className="w-full h-12 text-sm font-bold rounded-2xl shadow-xl shadow-primary/20" onClick={() => setIsLocationModalOpen(false)}>వార్తలు చూడండి</Button>
              </div>
            </DialogContent>
          </Dialog>

          <Sheet open={isNotifOpen} onOpenChange={(open) => { setIsNotifOpen(open); if (open) markAsRead(); }}>
            <SheetTrigger asChild><button className={cn("flex flex-col md:flex-row items-center gap-0.5 text-muted-foreground transition-all duration-300 relative px-3", theme.hover, isMinimized ? "scale-110" : "scale-100")}><div className="relative"><Bell className={cn("w-4 h-4", hasNewNotif && "animate-bell", hasNewNotif && theme.text)} />{hasNewNotif && <span className={cn("absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full border border-white animate-pulse", role === 'admin' ? "bg-rose-500" : "bg-primary")} />}</div>{!isMinimized && <span className="text-[9px] md:text-xs font-semibold">Alerts</span>}</button></SheetTrigger>
            <SheetContent side="right" className="w-[85%] sm:max-w-xs p-0 z-[100] border-none shadow-2xl">
              <SheetHeader className={cn("p-4 border-b", theme.bg)}><SheetTitle className="flex items-center gap-2 text-base"><Bell className={cn("w-4 h-4", theme.icon)} />నోటిఫికేషన్లు</SheetTitle></SheetHeader>
              <div className="flex flex-col h-full overflow-y-auto p-3 space-y-3 pb-32">
                {notifications?.map((n) => (
                  <div key={n.id} onClick={() => handleNotifClick(n.postId)} className={cn("p-3 rounded-xl border transition-all group", n.postId ? "cursor-pointer bg-white border-muted hover:shadow-md" : "bg-muted/20 border-transparent")}>
                    <div className="flex justify-between items-start mb-0.5"><Badge variant="secondary" className={cn("text-[8px] font-bold uppercase px-1.5 border-none", theme.bg, theme.text)}>{n.target}</Badge><span className="text-[8px] text-muted-foreground">{n.timestamp?.toDate ? format(n.timestamp.toDate(), 'h:mm a') : 'Just now'}</span></div>
                    <h4 className="font-bold text-xs mb-0.5 line-clamp-1">{n.title}</h4>
                    <p className="text-[10px] text-muted-foreground leading-relaxed line-clamp-2">{n.body}</p>
                  </div>
                ))}
              </div>
            </SheetContent>
          </Sheet>

          {canPost && <Link href="/reporter" className={cn("flex flex-col md:flex-row items-center gap-0.5 text-muted-foreground transition-all duration-300", theme.hover, isMinimized ? "opacity-0 translate-y-4 pointer-events-none w-0" : "opacity-100")}><PlusCircle className="w-4 h-4" /><span className="text-[9px] md:text-xs font-semibold">Post</span></Link>}
          {(role === 'admin' || role === 'editor') && <Link href="/admin" className={cn("flex flex-col md:flex-row items-center gap-0.5 text-muted-foreground transition-all duration-300", theme.hover, isMinimized ? "opacity-0 translate-y-4 pointer-events-none w-0" : "opacity-100")}><LayoutDashboard className="w-4 h-4" /><span className="text-[9px] md:text-xs font-semibold">Moderate</span></Link>}
          <Link href={userName ? "/profile" : "/login"} className={cn("flex flex-col md:flex-row items-center gap-0.5 text-muted-foreground transition-all duration-300", theme.hover, isMinimized ? "opacity-0 translate-y-4 pointer-events-none w-0" : "opacity-100")}>{userPhoto ? <div className={cn("relative w-5 h-5 rounded-full overflow-hidden border", theme.border)}><Image src={userPhoto} alt={userName} fill className="object-cover" /></div> : <User className={cn("w-4 h-4", theme.icon)} />}<span className="text-[9px] md:text-xs font-semibold truncate max-w-[50px] md:max-w-none">{userName || "Profile"}</span></Link>
        </div>
      </div>
    </nav>
  );
}
