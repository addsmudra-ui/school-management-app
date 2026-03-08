'use client';

import { Navbar } from "@/components/layout/Navbar";
import { NewsCard } from "@/components/news/NewsCard";
import { useEffect, useState, Suspense } from "react";
import { Newspaper, MapPin, SlidersHorizontal, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFirestore, useCollection, useMemoFirebase, useUser } from "@/firebase";
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
  const { user, isUserLoading } = useUser();
  
  const [selectedDistrict, setSelectedDistrict] = useState<string>("");
  const [selectedMandal, setSelectedMandal] = useState<string>("");
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);

  useEffect(() => {
    const savedDistrict = localStorage.getItem('mandalPulse_district') || "Warangal";
    const savedMandal = localStorage.getItem('mandalPulse_mandal') || "All";
    setSelectedDistrict(savedDistrict);
    setSelectedMandal(savedMandal);
  }, []);

  const newsQuery = useMemoFirebase(() => {
    // CRITICAL: Ensure firestore, location, and user are ready.
    if (!firestore || !selectedDistrict || isUserLoading || !user?.uid) return null;
    
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
  }, [firestore, selectedDistrict, selectedMandal, user?.uid, isUserLoading]);

  const { data: news, isLoading } = useCollection(newsQuery);

  const handleLocationUpdate = () => {
    localStorage.setItem('mandalPulse_district', selectedDistrict);
    localStorage.setItem('mandalPulse_mandal', selectedMandal);
    setIsLocationModalOpen(false);
    window.dispatchEvent(new Event('mandalPulse_locationChanged'));
  };

  if (isUserLoading || (isLoading && !news)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-primary animate-spin" />
          <p className="text-primary font-medium">వార్తలు లోడ్ అవుతున్నాయి...</p>
        </div>
      </div>
    );
  }

  return (
    <>
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
                <SlidersHorizontal className="w-3 h-3" />
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
        {news && news.length > 0 ? (
          news.map((item) => (
            <section key={item.id} id={`post-${item.id}`} className="news-card-snap">
              <NewsCard news={item as any} />
            </section>
          ))
        ) : (
          <div className="flex items-center justify-center h-screen px-6 text-center">
            <div className="max-w-xs">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <MapPin className="w-10 h-10 text-primary/40" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">వార్తలు ఏవీ లేవు</h3>
              <p className="text-muted-foreground mb-8 text-sm">ప్రస్తుతానికి ఇక్కడ వార్తలు ఏవీ లేవు. దయచేసి వేరే ప్రాంతాన్ని ఎంచుకోండి.</p>
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
