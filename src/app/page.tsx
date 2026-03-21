
"use client";

import { Navbar } from "@/components/layout/Navbar";
import { NewsCard } from "@/components/news/NewsCard";
import { AdCard } from "@/components/news/AdCard";
import { useEffect, useState, Suspense, useMemo, useRef } from "react";
import { MapPin, Loader2, Globe, AlertCircle, Info, Newspaper, Construction, Home as HomeIcon, Flag, Wallet, HeartPulse, Trophy, Film, Cpu, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFirestore, useCollection, useDoc, useMemoFirebase } from "@/firebase";
import { collection, query, limit, doc, where } from "firebase/firestore";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
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
import { LOCATIONS as MOCK_LOCATIONS, NewsPost, NEWS_CATEGORIES, NewsCategory } from "@/lib/mock-data";
import { AdPost } from "@/lib/storage";
import { cn } from "@/lib/utils";

function NewsFeedContent() {
  const firestore = useFirestore();
  const searchParams = useSearchParams();
  const targetPostId = searchParams.get('postId');

  const [selectedDistrict, setSelectedDistrict] = useState<string>("All");
  const [selectedMandal, setSelectedMandal] = useState<string>("All");
  const [selectedCategory, setSelectedCategory] = useState<NewsCategory | 'All'>('Home');
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [forceGlobal, setForceGlobal] = useState(false);

  // Real-time branding and system status
  const brandingRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'config', 'admin');
  }, [firestore]);
  const { data: branding } = useDoc(brandingRef);

  const locRef = useMemoFirebase(() => firestore ? doc(firestore, 'metadata', 'locations') : null, [firestore]);
  const { data: locationsDoc } = useDoc(locRef);
  
  const dynamicLocations = useMemo(() => {
    if (!locationsDoc) return MOCK_LOCATIONS;
    const { id, ...statesOnly } = locationsDoc as any;
    return Object.values(statesOnly).reduce((acc: any, stateObj: any) => {
      if (typeof stateObj !== 'object' || stateObj === null) return acc;
      return { ...acc, ...stateObj };
    }, {});
  }, [locationsDoc]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const savedDistrict = localStorage.getItem('teluguNewsPulse_district') || "All";
    const savedMandal = localStorage.getItem('teluguNewsPulse_mandal') || "All";
    
    setSelectedDistrict(savedDistrict);
    setSelectedMandal(savedMandal);
  }, []);

  useEffect(() => {
    if (targetPostId) {
      setForceGlobal(true);
      setTimeout(() => {
        const element = document.getElementById(`post-${targetPostId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 500);
    } else {
      setForceGlobal(false);
    }
  }, [targetPostId]);

  const allApprovedQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'approved_news_posts'), limit(150));
  }, [firestore]);

  const adsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'ads'), where('status', '==', 'active'), limit(20));
  }, [firestore]);

  const { data: allNews, isLoading: isNewsLoading } = useCollection<NewsPost>(allApprovedQuery);
  const { data: allAds, isLoading: isAdsLoading } = useCollection<AdPost>(adsQuery);

  const { feedToDisplay, isFallbackActive, localCount } = useMemo(() => {
    const news = allNews || [];
    const ads = allAds || [];

    if (news.length === 0 && ads.length === 0) return { feedToDisplay: [], isFallbackActive: false, localCount: 0 };

    // Combine and sort by timestamp
    const combined: any[] = [
      ...news.map(n => ({ ...n, feedType: 'news' })),
      ...ads.map(a => ({ ...a, feedType: 'ad' }))
    ];

    const sorted = [...combined].sort((a, b) => {
      const getTime = (item: any) => {
        if (item.timestamp?.toDate) return item.timestamp.toDate().getTime();
        if (item.timestamp) return new Date(item.timestamp).getTime();
        return 0;
      };
      return getTime(b) - getTime(a);
    });

    // Category Filter
    let filtered = sorted;
    if (selectedCategory !== 'All') {
      filtered = sorted.filter(item => {
        if (item.feedType === 'ad') return true; // Ads always show
        return item.category === selectedCategory;
      });
    }

    const isGlobalFilter = selectedDistrict === "All";

    if (forceGlobal || isGlobalFilter) {
      return { feedToDisplay: filtered, isFallbackActive: false, localCount: filtered.length };
    }

    const local = filtered.filter(item => {
      const districtMatch = item.location.district === selectedDistrict;
      const mandalMatch = selectedMandal === "All" || item.location.mandal === selectedMandal;
      return districtMatch && mandalMatch;
    });

    const localIds = new Set(local.map(p => p.id));
    const others = filtered.filter(p => !localIds.has(p.id));

    return {
      feedToDisplay: [...local, ...others],
      isFallbackActive: local.length === 0 && selectedCategory === 'Home', // Only fallback if Home category
      localCount: local.length
    };
  }, [allNews, allAds, selectedDistrict, selectedMandal, forceGlobal, selectedCategory]);

  const handleLocationUpdate = () => {
    localStorage.setItem('teluguNewsPulse_district', selectedDistrict);
    localStorage.setItem('teluguNewsPulse_mandal', selectedMandal);
    setIsLocationModalOpen(false);
    setForceGlobal(false);
    window.dispatchEvent(new Event('teluguNewsPulse_locationChanged'));
  };

  const handleResetToGlobal = () => {
    setSelectedDistrict("All");
    setSelectedMandal("All");
    localStorage.setItem('teluguNewsPulse_district', "All");
    localStorage.setItem('teluguNewsPulse_mandal', "All");
    setForceGlobal(false);
    window.dispatchEvent(new Event('teluguNewsPulse_locationChanged'));
  };

  if ((isNewsLoading || isAdsLoading) && (!allNews || !allAds)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-primary animate-spin" />
          <p className="text-primary font-medium text-sm">వార్తలు లోడ్ అవుతున్నాయి...</p>
        </div>
      </div>
    );
  }

  if (branding?.systemStatus === 'maintenance') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 p-6 text-center">
        <div className="max-w-md space-y-8 animate-in zoom-in-95 duration-500">
          <div className="w-24 h-24 bg-amber-100 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-xl relative overflow-hidden">
             <div className="absolute inset-0 bg-amber-200/20 animate-pulse" />
             <Construction className="w-12 h-12 text-amber-600 relative z-10" />
          </div>
          <div className="space-y-3">
            <h1 className="text-3xl font-black tracking-tight text-slate-900 font-headline">Zone Maintenance</h1>
            <p className="text-slate-600 font-bold text-sm leading-relaxed">
              Telugu News Pulse ప్రస్తుతానికి మెయింటెనెన్స్‌లో ఉంది.<br />కాసేపటి తర్వాత మళ్ళీ ప్రయత్ండి.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const isActuallyGlobal = forceGlobal || selectedDistrict === "All";

  return (
    <>
      <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
        <Dialog open={isLocationModalOpen} onOpenChange={setIsLocationModalOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="rounded-full gap-2 h-9 border-primary/20 text-primary hover:bg-primary/5 px-3 font-bold shadow-xl bg-white/80 backdrop-blur-md text-[10px]">
              <MapPin className="w-3.5 h-3.5" />
              <span>
                {isActuallyGlobal ? "Global" : (selectedMandal === "All" ? selectedDistrict : selectedMandal)}
              </span>
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[92%] max-w-sm rounded-[2rem] p-8 border-none shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-black text-center mb-4">ప్రాంతాన్ని ఎంచుకోండి</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[9px] font-black text-primary uppercase tracking-widest ml-1">జిల్లా (District)</label>
                <Select value={selectedDistrict} onValueChange={(val) => { setSelectedDistrict(val); setSelectedMandal("All"); }}>
                  <SelectTrigger className="w-full h-12 rounded-2xl border-slate-100 bg-slate-50 font-bold text-xs"><SelectValue placeholder="జిల్లాను ఎంచుకోండి" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">అన్ని జిల్లాలు (All Districts)</SelectItem>
                    {Object.keys(dynamicLocations).sort().map((d) => <SelectItem key={d} value={d} className="font-bold text-xs">{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black text-primary uppercase tracking-widest ml-1">మండలం (Mandal)</label>
                <Select value={selectedMandal} onValueChange={setSelectedMandal} disabled={selectedDistrict === "All"}>
                  <SelectTrigger className="w-full h-12 rounded-2xl border-slate-100 bg-slate-50 font-bold text-xs"><SelectValue placeholder="మండలాన్ని ఎంచుకోండి" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">అన్ని మండలాలు</SelectItem>
                    {selectedDistrict !== "All" && dynamicLocations[selectedDistrict]?.map((m: string) => (
                      <SelectItem key={m} value={m} className="font-bold text-xs">{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button className="w-full h-12 text-sm font-bold rounded-2xl shadow-xl shadow-primary/20 transition-transform active:scale-95" onClick={handleLocationUpdate}>వార్తలు చూడండి</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Dynamic Category Scroll Bar */}
      <div className="fixed top-4 left-4 right-32 z-40">
        <div className="bg-white/80 backdrop-blur-md rounded-full shadow-lg border border-muted p-1 overflow-x-auto no-scrollbar flex items-center gap-1.5 px-2">
          <button 
            onClick={() => setSelectedCategory('All')}
            className={cn(
              "whitespace-nowrap px-3 py-1.5 rounded-full text-[9px] font-black uppercase transition-all shrink-0",
              selectedCategory === 'All' ? "bg-primary text-white" : "text-muted-foreground hover:bg-muted"
            )}
          >
            All
          </button>
          {NEWS_CATEGORIES.map((cat) => (
            <button 
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value)}
              className={cn(
                "whitespace-nowrap px-3 py-1.5 rounded-full text-[9px] font-black uppercase transition-all shrink-0 flex items-center gap-1.5",
                selectedCategory === cat.value ? "bg-primary text-white" : "text-muted-foreground hover:bg-muted"
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      <div className="news-scroll-container">
        {feedToDisplay.length > 0 && (
          <div className="absolute top-16 left-0 right-0 z-30 px-4 pointer-events-none pr-32">
            {isFallbackActive ? (
              <div className="max-w-md bg-amber-50/90 border border-amber-200 p-2.5 rounded-2xl shadow-xl flex items-center gap-3 animate-in slide-in-from-top-4 duration-500 backdrop-blur-md opacity-95">
                <div className="bg-amber-500 p-2 rounded-xl shrink-0">
                  <Globe className="w-3.5 h-3.5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-[9px] font-black text-amber-900 leading-tight">మీ ప్రాంతంలో వార్తలు లేవు.</p>
                  <p className="text-[8px] font-medium text-amber-800 opacity-80 mt-0.5">గ్లోబల్ వార్తలను చూస్తున్నారు.</p>
                </div>
                <Button variant="ghost" size="sm" className="h-7 rounded-lg text-[8px] font-black text-amber-900 pointer-events-auto hover:bg-amber-100 px-2" onClick={handleResetToGlobal}>
                  Global
                </Button>
              </div>
            ) : !isActuallyGlobal && localCount > 0 && (
              <div className="max-w-md bg-emerald-50/80 border border-emerald-200 p-2 rounded-2xl shadow-lg flex items-center gap-3 animate-in slide-in-from-top-4 duration-500 backdrop-blur-md opacity-95">
                <div className="bg-emerald-500 p-1.5 rounded-lg shrink-0">
                  <Info className="w-3 h-3 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-[9px] font-black text-emerald-900 leading-tight">మీ ప్రాంతీయ వార్తలు పైన ఉన్నాయి.</p>
                </div>
              </div>
            )}
          </div>
        )}

        {feedToDisplay.length > 0 ? (
          feedToDisplay.map((item) => (
            <section key={item.id} id={`post-${item.id}`} className="news-card-snap">
              {item.feedType === 'ad' ? (
                <AdCard ad={item as AdPost} />
              ) : (
                <NewsCard news={item as NewsPost} />
              )}
            </section>
          ))
        ) : (
          <div className="flex items-center justify-center h-full px-6 text-center">
            <div className="max-w-xs animate-in zoom-in-95 duration-500">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                <AlertCircle className="w-10 h-10 text-slate-300" />
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-2">వార్తలు ఏవీ లేవు</h3>
              <p className="text-muted-foreground mb-8 text-[10px] font-medium leading-relaxed">ప్రస్తుతానికి ఈ సెక్షన్‌లో వార్తలు అందుబాటులో లేవు.</p>
              <Button className="w-full h-12 rounded-2xl text-xs font-bold shadow-xl shadow-primary/20" onClick={() => setSelectedCategory('All')}>అన్ని వార్తలు చూడండి</Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default function Home() {
  return (
    <main className="fixed inset-0 bg-background overflow-hidden overscroll-none select-none">
      <Navbar />
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-screen bg-background">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
        </div>
      }>
        <NewsFeedContent />
      </Suspense>
    </main>
  );
}
