'use client';

import { Navbar } from "@/components/layout/Navbar";
import { NewsCard } from "@/components/news/NewsCard";
import { useEffect, useState, Suspense, useMemo } from "react";
import { MapPin, SlidersHorizontal, Loader2, Globe, AlertCircle, Info, Newspaper } from "lucide-react";
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

  // Real-time branding
  const brandingRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'config', 'admin');
  }, [firestore]);
  const { data: branding } = useDoc(brandingRef);

  const locRef = useMemoFirebase(() => firestore ? doc(firestore, 'metadata', 'locations') : null, [firestore]);
  const { data: locationsDoc } = useDoc(locRef);
  
  const dynamicLocations = useMemo(() => {
    if (!locationsDoc) return MOCK_LOCATIONS;
    return Object.values(locationsDoc).reduce((acc: any, stateObj: any) => {
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

  const isActuallyGlobal = forceGlobal || selectedDistrict === "All";

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-md border-b border-muted p-3 md:hidden">
        <div className="max-w-md mx-auto flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="relative w-7 h-7 flex items-center justify-center">
                {branding?.appLogo ? (
                  <Image src={branding.appLogo} alt="Logo" fill className="object-contain" />
                ) : (
                  <Newspaper className="w-5 h-5 text-primary" />
                )}
              </div>
              <span className="font-headline font-bold text-sm tracking-tight">{branding?.appName || 'MandalPulse'}</span>
            </div>
            
            <Dialog open={isLocationModalOpen} onOpenChange={setIsLocationModalOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="rounded-full gap-1.5 h-8 border-primary/20 text-primary hover:bg-primary/5 px-3">
                  <MapPin className="w-3 h-3" />
                  <span className="text-[10px] font-bold">
                    {isActuallyGlobal ? "Global" : (selectedMandal === "All" ? selectedDistrict : selectedMandal)}
                  </span>
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[92%] max-w-sm rounded-2xl p-6">
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold">ప్రాంతాన్ని ఎంచుకోండి</DialogTitle>
                </DialogHeader>
                <div className="space-y-5 py-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">జిల్లా</label>
                    <Select value={selectedDistrict} onValueChange={(val) => { setSelectedDistrict(val); setSelectedMandal("All"); }}>
                      <SelectTrigger className="w-full h-12"><SelectValue placeholder="జిల్లాను ఎంచుకోండి" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="All">అన్ని జిల్లాలు (All Districts)</SelectItem>
                        {Object.keys(dynamicLocations).sort().map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">మండలం</label>
                    <Select value={selectedMandal} onValueChange={setSelectedMandal} disabled={selectedDistrict === "All"}>
                      <SelectTrigger className="w-full h-12"><SelectValue placeholder="మండలాన్ని ఎంచుకోండి" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="All">అన్ని మండలాలు</SelectItem>
                        {selectedDistrict !== "All" && dynamicLocations[selectedDistrict]?.map((m: string) => (
                          <SelectItem key={m} value={m}>{m}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button className="w-full h-12 text-lg mt-2 shadow-lg shadow-primary/20" onClick={handleLocationUpdate}>వార్తలు చూడండి</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <div className="news-scroll-container">
        {allNews && allNews.length > 0 && (
          <div className="absolute top-20 left-0 right-0 z-30 px-4 pointer-events-none md:top-24">
            {isFallbackActive ? (
              <div className="max-w-md mx-auto bg-amber-50 border border-amber-200 p-3 rounded-xl shadow-lg flex items-center gap-3 animate-in slide-in-from-top-4 duration-500 backdrop-blur-sm">
                <div className="bg-amber-500 p-2 rounded-lg shrink-0">
                  <Globe className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold text-amber-800 leading-tight">మీ ప్రాంతంలో వార్తలు లేవు.</p>
                  <p className="text-[10px] text-amber-700 opacity-80 mt-0.5">ప్రస్తుతం అన్ని ప్రాంతాల వార్తలను (Global News) చూస్తున్నారు.</p>
                </div>
                <Button variant="ghost" size="sm" className="h-6 text-[10px] text-amber-900 pointer-events-auto hover:bg-amber-100" onClick={handleResetToGlobal}>
                  Global Feed
                </Button>
              </div>
            ) : !isActuallyGlobal && localCount > 0 && (
              <div className="max-w-md mx-auto bg-emerald-50 border border-emerald-200 p-2 rounded-xl shadow-md flex items-center gap-2 animate-in slide-in-from-top-4 duration-500 backdrop-blur-sm opacity-90">
                <div className="bg-emerald-500 p-1.5 rounded-lg shrink-0">
                  <Info className="w-3.5 h-3.5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-bold text-emerald-800 leading-tight">మీ ప్రాంతీయ వార్తలు పైన ఉన్నాయి.</p>
                  <p className="text-[9px] text-emerald-700 opacity-80 mt-0.5">మరిన్ని వార్తల కోసం క్రిందికి స్క్రోల్ చేయండి.</p>
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
          <div className="flex items-center justify-center h-screen px-6 text-center">
            <div className="max-w-xs">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="w-10 h-10 text-primary/40" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">వార్తలు ఏవీ లేవు</h3>
              <p className="text-muted-foreground mb-8 text-sm">ప్రస్తుతానికి ఎటువంటి వార్తలు అందుబాటులో లేవు.</p>
              <Button className="w-full" onClick={() => setIsLocationModalOpen(true)}>ప్రాంతాన్ని మార్చండి</Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default function Home() {
  return (
    <main className="h-screen bg-background overflow-hidden overscroll-none">
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
