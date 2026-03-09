'use client';

import { Navbar } from "@/components/layout/Navbar";
import { NewsCard } from "@/components/news/NewsCard";
import { useEffect, useState, Suspense } from "react";
import { MapPin, SlidersHorizontal, Loader2, Globe, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, where, orderBy, limit } from "firebase/firestore";
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
import { LOCATIONS } from "@/lib/mock-data";

function NewsFeedContent() {
  const firestore = useFirestore();
  const [selectedDistrict, setSelectedDistrict] = useState<string>("Warangal");
  const [selectedMandal, setSelectedMandal] = useState<string>("All");
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const savedDistrict = localStorage.getItem('mandalPulse_district');
    const savedMandal = localStorage.getItem('mandalPulse_mandal');
    if (savedDistrict) setSelectedDistrict(savedDistrict);
    if (savedMandal) setSelectedMandal(savedMandal);
  }, []);

  // Primary Local Query
  const localNewsQuery = useMemoFirebase(() => {
    if (!firestore || !selectedDistrict) return null;
    
    let q = query(
      collection(firestore, 'approved_news_posts'),
      where('location.district', '==', selectedDistrict),
      orderBy('timestamp', 'desc'),
      limit(20)
    );

    if (selectedMandal && selectedMandal !== "All") {
      q = query(q, where('location.mandal', '==', selectedMandal));
    }

    return q;
  }, [firestore, selectedDistrict, selectedMandal]);

  // Fallback Global Query
  const globalNewsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'approved_news_posts'),
      orderBy('timestamp', 'desc'),
      limit(20)
    );
  }, [firestore]);

  const { data: localNews, isLoading: isLocalLoading } = useCollection(localNewsQuery);
  const { data: globalNews, isLoading: isGlobalLoading } = useCollection(globalNewsQuery);

  const handleLocationUpdate = () => {
    localStorage.setItem('mandalPulse_district', selectedDistrict);
    localStorage.setItem('mandalPulse_mandal', selectedMandal);
    setIsLocationModalOpen(false);
    window.dispatchEvent(new Event('mandalPulse_locationChanged'));
  };

  if (isLocalLoading && !localNews) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-primary animate-spin" />
          <p className="text-primary font-medium">వార్తలు లోడ్ అవుతున్నాయి...</p>
        </div>
      </div>
    );
  }

  const hasLocalNews = localNews && localNews.length > 0;
  const feedToDisplay = hasLocalNews ? localNews : globalNews;

  return (
    <>
      {/* Mobile Location Header */}
      <div className="fixed top-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-md border-b border-muted p-3 md:hidden">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-primary/10 p-1.5 rounded-lg">
              <MapPin className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">మీ ప్రాంతం</p>
              <h2 className="text-sm font-bold flex items-center gap-1">
                {selectedMandal === "All" || !selectedMandal ? "అన్ని మండలాలు" : selectedMandal}, {selectedDistrict}
              </h2>
            </div>
          </div>
          
          <Dialog open={isLocationModalOpen} onOpenChange={setIsLocationModalOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="rounded-full gap-1 h-8 border-primary/20 text-primary hover:bg-primary/5">
                <SlidersHorizontal className="w-3" />
                మార్చండి
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
                      {Object.keys(LOCATIONS).map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">మండలం</label>
                  <Select value={selectedMandal} onValueChange={setSelectedMandal} disabled={!selectedDistrict}>
                    <SelectTrigger className="w-full h-12"><SelectValue placeholder="మండలాన్ని ఎంచుకోండి" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">అన్ని మండలాలు</SelectItem>
                      {selectedDistrict && (LOCATIONS as any)[selectedDistrict].map((m: string) => (
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

      <div className="news-scroll-container">
        {/* Fallback Message if viewing Global news because local is empty */}
        {!hasLocalNews && globalNews && globalNews.length > 0 && (
          <div className="absolute top-20 left-0 right-0 z-30 px-4 pointer-events-none md:top-24">
            <div className="max-w-md mx-auto bg-amber-50 border border-amber-200 p-3 rounded-xl shadow-sm flex items-center gap-3 animate-in slide-in-from-top-4 duration-500">
              <div className="bg-amber-500 p-2 rounded-lg">
                <Globe className="w-4 h-4 text-white" />
              </div>
              <p className="text-xs font-bold text-amber-800 leading-tight">
                మీ ప్రాంతంలో వార్తలు లేవు. <br/>
                <span className="text-[10px] opacity-70">ప్రస్తుతం అన్ని ప్రాంతాల వార్తలను చూస్తున్నారు.</span>
              </p>
            </div>
          </div>
        )}

        {feedToDisplay && feedToDisplay.length > 0 ? (
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