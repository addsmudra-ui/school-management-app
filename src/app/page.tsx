'use client';

import { Navbar } from "@/components/layout/Navbar";
import { NewsCard } from "@/components/news/NewsCard";
import { useEffect, useState, Suspense, useMemo } from "react";
import { MapPin, Loader2, Globe, AlertCircle, Info, Newspaper, Construction } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFirestore, useCollection, useDoc, useMemoFirebase } from "@/firebase";
import { collection, query, limit, doc } from "firebase/firestore";
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
import { LOCATIONS as MOCK_LOCATIONS, NewsPost } from "@/lib/mock-data";

function NewsFeedContent() {
  const firestore = useFirestore();
  const searchParams = useSearchParams();
  const targetPostId = searchParams.get('postId');

  const [selectedDistrict, setSelectedDistrict] = useState<string>("All");
  const [selectedMandal, setSelectedMandal] = useState<string>("All");
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
    // CRITICAL: Omit 'id' to prevent characters of "locations" being treated as regions
    const { id, ...statesOnly } = locationsDoc as any;
    return Object.values(statesOnly).reduce((acc: any, stateObj: any) => {
      if (typeof stateObj !== 'object' || stateObj === null) return acc;
      return { ...acc, ...stateObj };
    }, {});
  }, [locationsDoc]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const savedDistrict = localStorage.getItem('mandalPulse_district') || "All";
    const savedMandal = localStorage.getItem('mandalPulse_mandal') || "All";
    
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

  const { data: allNews, isLoading } = useCollection<NewsPost>(allApprovedQuery);

  const { feedToDisplay, isFallbackActive, localCount } = useMemo(() => {
    if (!allNews || allNews.length === 0) return { feedToDisplay: [], isFallbackActive: false, localCount: 0 };

    const sorted = [...allNews].sort((a, b) => {
      const timeA = a.timestamp?.toDate ? a.timestamp.toDate().getTime() : new Date(a.timestamp).getTime();
      const timeB = b.timestamp?.toDate ? b.timestamp.toDate().getTime() : new Date(b.timestamp).getTime();
      return timeB - timeA;
    });

    const isGlobalFilter = selectedDistrict === "All";

    if (forceGlobal || isGlobalFilter) {
      return { feedToDisplay: sorted, isFallbackActive: false, localCount: sorted.length };
    }

    const local = sorted.filter(post => {
      const districtMatch = post.location.district === selectedDistrict;
      const mandalMatch = selectedMandal === "All" || post.location.mandal === selectedMandal;
      return districtMatch && mandalMatch;
    });

    const localIds = new Set(local.map(p => p.id));
    const others = sorted.filter(p => !localIds.has(p.id));

    return {
      feedToDisplay: [...local, ...others],
      isFallbackActive: local.length === 0,
      localCount: local.length
    };
  }, [allNews, selectedDistrict, selectedMandal, forceGlobal]);

  const handleLocationUpdate = () => {
    localStorage.setItem('mandalPulse_district', selectedDistrict);
    localStorage.setItem('mandalPulse_mandal', selectedMandal);
    setIsLocationModalOpen(false);
    setForceGlobal(false);
    window.dispatchEvent(new Event('mandalPulse_locationChanged'));
  };

  const handleResetToGlobal = () => {
    setSelectedDistrict("All");
    setSelectedMandal("All");
    localStorage.setItem('mandalPulse_district', "All");
    localStorage.setItem('mandalPulse_mandal', "All");
    setForceGlobal(false);
    window.dispatchEvent(new Event('mandalPulse_locationChanged'));
  };

  if (isLoading && !allNews) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-primary animate-spin" />
          <p className="text-primary font-medium">వార్తలు లోడ్ అవుతున్నాయి...</p>
        </div>
      </div>
    );
  }

  // Handle Maintenance Mode
  if (branding?.systemStatus === 'maintenance') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 p-6 text-center">
        <div className="max-w-md space-y-6">
          <div className="w-24 h-24 bg-amber-100 rounded-3xl flex items-center justify-center mx-auto shadow-xl">
            <Construction className="w-12 h-12 text-amber-600" />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Zone Under Maintenance</h1>
          <p className="text-slate-600 font-medium">
            MandalPulse ప్రస్తుతానికి మెయింటెనెన్స్‌లో ఉంది. దయచేసి కాసేపటి తర్వాత మళ్ళీ ప్రయత్నించండి.
          </p>
        </div>
      </div>
    );
  }

  const isActuallyGlobal = forceGlobal || selectedDistrict === "All";

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-lg border-b border-slate-100 p-3 md:p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative w-8 h-8 md:w-10 md:h-10 flex items-center justify-center">
              {branding?.appLogo ? (
                <Image src={branding.appLogo} alt="Logo" fill className="object-contain opacity-50" />
              ) : (
                <Newspaper className="w-6 h-6 text-primary" />
              )}
            </div>
            <span className="font-headline font-black text-lg md:text-xl tracking-tighter text-slate-900">{branding?.appName || 'MandalPulse'}</span>
          </div>
          
          <Dialog open={isLocationModalOpen} onOpenChange={setIsLocationModalOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="rounded-full gap-2 h-10 md:h-12 border-primary/20 text-primary hover:bg-primary/5 px-4 font-bold shadow-sm">
                <MapPin className="w-4 h-4" />
                <span className="text-xs md:text-sm">
                  {isActuallyGlobal ? "Global" : (selectedMandal === "All" ? selectedDistrict : selectedMandal)}
                </span>
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[92%] max-w-sm rounded-[2rem] p-8 border-none shadow-2xl">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black text-center mb-4">ప్రాంతాన్ని ఎంచుకోండి</DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-primary uppercase tracking-widest ml-1">జిల్లా (District)</label>
                  <Select value={selectedDistrict} onValueChange={(val) => { setSelectedDistrict(val); setSelectedMandal("All"); }}>
                    <SelectTrigger className="w-full h-14 rounded-2xl border-slate-100 bg-slate-50 font-bold"><SelectValue placeholder="జిల్లాను ఎంచుకోండి" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">అన్ని జిల్లాలు (All Districts)</SelectItem>
                      {Object.keys(dynamicLocations).sort().map((d) => <SelectItem key={d} value={d} className="font-bold">{d}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-primary uppercase tracking-widest ml-1">మండలం (Mandal)</label>
                  <Select value={selectedMandal} onValueChange={setSelectedMandal} disabled={selectedDistrict === "All"}>
                    <SelectTrigger className="w-full h-14 rounded-2xl border-slate-100 bg-slate-50 font-bold"><SelectValue placeholder="మండలాన్ని ఎంచుకోండి" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">అన్ని మండలాలు</SelectItem>
                      {selectedDistrict !== "All" && dynamicLocations[selectedDistrict]?.map((m: string) => (
                        <SelectItem key={m} value={m} className="font-bold">{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button className="w-full h-14 text-lg font-bold rounded-2xl shadow-xl shadow-primary/20 transition-transform active:scale-95" onClick={handleLocationUpdate}>వార్తలు చూడండి</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="news-scroll-container">
        {/* Animated Background Icons */}
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-10">
          <Newspaper className="absolute top-[15%] left-[10%] w-32 h-32 text-primary animate-float" />
          <Newspaper className="absolute top-[40%] right-[15%] w-24 h-24 text-primary animate-float-reverse" />
          <Newspaper className="absolute bottom-[20%] left-[20%] w-40 h-40 text-primary animate-float-slow" />
          <Newspaper className="absolute top-[70%] right-[25%] w-20 h-20 text-primary animate-float" />
        </div>

        {allNews && allNews.length > 0 && (
          <div className="absolute top-[5.5rem] left-0 right-0 z-30 px-4 pointer-events-none md:top-[6rem]">
            {isFallbackActive ? (
              <div className="max-w-md mx-auto bg-amber-50/90 border border-amber-200 p-3 rounded-2xl shadow-xl flex items-center gap-3 animate-in slide-in-from-top-4 duration-500 backdrop-blur-md">
                <div className="bg-amber-500 p-2.5 rounded-xl shrink-0">
                  <Globe className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-black text-amber-900 leading-tight">మీ ప్రాంతంలో వార్తలు లేవు.</p>
                  <p className="text-[10px] font-medium text-amber-800 opacity-80 mt-0.5">ప్రస్తుతం గ్లోబల్ వార్తలను చూస్తున్నారు.</p>
                </div>
                <Button variant="ghost" size="sm" className="h-8 rounded-lg text-[10px] font-black text-amber-900 pointer-events-auto hover:bg-amber-100 px-3" onClick={handleResetToGlobal}>
                  Global
                </Button>
              </div>
            ) : !isActuallyGlobal && localCount > 0 && (
              <div className="max-w-md mx-auto bg-emerald-50/80 border border-emerald-200 p-2.5 rounded-2xl shadow-lg flex items-center gap-3 animate-in slide-in-from-top-4 duration-500 backdrop-blur-md opacity-95">
                <div className="bg-emerald-500 p-2 rounded-lg shrink-0">
                  <Info className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-black text-emerald-900 leading-tight">మీ ప్రాంతీయ వార్తలు పైన ఉన్నాయి.</p>
                  <p className="text-[9px] font-medium text-emerald-800 opacity-70 mt-0.5">స్క్రోల్ చేయండి.</p>
                </div>
              </div>
            )}
          </div>
        )}

        {feedToDisplay.length > 0 ? (
          feedToDisplay.map((item) => (
            <section key={item.id} id={`post-${item.id}`} className="news-card-snap">
              <NewsCard news={item as any} />
            </section>
          ))
        ) : (
          <div className="flex items-center justify-center h-full px-6 text-center">
            <div className="max-w-xs animate-in zoom-in-95 duration-500">
              <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
                <AlertCircle className="w-12 h-12 text-slate-300" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-2">వార్తలు ఏవీ లేవు</h3>
              <p className="text-muted-foreground mb-10 text-sm font-medium leading-relaxed">ప్రస్తుతానికి ఎటువంటి వార్తలు అందుబాటులో లేవు. దయచేసి ప్రాంతాన్ని మార్చండి.</p>
              <Button className="w-full h-14 rounded-2xl text-lg font-bold shadow-xl shadow-primary/20" onClick={() => setIsLocationModalOpen(true)}>ప్రాంతాన్ని మార్చండి</Button>
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
          <Loader2 className="w-12 h-12 text-primary animate-spin" />
        </div>
      }>
        <NewsFeedContent />
      </Suspense>
    </main>
  );
}
