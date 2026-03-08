"use client";

import { Navbar } from "@/components/layout/Navbar";
import { NewsCard } from "@/components/news/NewsCard";
import { MOCK_NEWS, LOCATIONS } from "@/lib/mock-data";
import { useEffect, useState } from "react";
import { Newspaper, MapPin, ChevronDown, SlidersHorizontal } from "lucide-react";
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

export default function Home() {
  const [selectedDistrict, setSelectedDistrict] = useState<string>("");
  const [selectedMandal, setSelectedMandal] = useState<string>("");
  const [news, setNews] = useState(MOCK_NEWS);
  const [loading, setLoading] = useState(true);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);

  useEffect(() => {
    // Load saved location from localStorage
    const savedDistrict = localStorage.getItem('mandalPulse_district') || "Warangal";
    const savedMandal = localStorage.getItem('mandalPulse_mandal') || "Hanamkonda";
    setSelectedDistrict(savedDistrict);
    setSelectedMandal(savedMandal);
    
    // Initial fetch/filter
    filterNews(savedDistrict, savedMandal);
    
    const timer = setTimeout(() => {
      setLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  const filterNews = (district: string, mandal: string) => {
    const filtered = MOCK_NEWS.filter(item => 
      item.location.district === district && 
      (mandal === "All" || item.location.mandal === mandal)
    );
    setNews(filtered);
  };

  const handleLocationUpdate = () => {
    localStorage.setItem('mandalPulse_district', selectedDistrict);
    localStorage.setItem('mandalPulse_mandal', selectedMandal);
    filterNews(selectedDistrict, selectedMandal);
    setIsLocationModalOpen(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <Newspaper className="w-12 h-12 text-primary animate-pulse" />
          <p className="text-primary font-medium">వార్తలు లోడ్ అవుతున్నాయి... (Loading news...)</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background pb-16 md:pt-16 md:pb-0">
      <Navbar />
      
      {/* Location Header */}
      <div className="fixed top-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-md border-b border-muted p-3 md:hidden">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">మీ ప్రాంతం (Your Location)</p>
              <h2 className="text-sm font-bold flex items-center gap-1">
                {selectedMandal}, {selectedDistrict}
              </h2>
            </div>
          </div>
          
          <Dialog open={isLocationModalOpen} onOpenChange={setIsLocationModalOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="rounded-full gap-1 h-8 border-primary/20 text-primary">
                <SlidersHorizontal className="w-3 h-3" />
                మార్చండి (Change)
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[90%] rounded-2xl">
              <DialogHeader>
                <DialogTitle>ప్రాంతాన్ని ఎంచుకోండి (Select Location)</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase">జిల్లా (District)</label>
                  <Select 
                    value={selectedDistrict} 
                    onValueChange={(val) => {
                      setSelectedDistrict(val);
                      setSelectedMandal("");
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="జిల్లాను ఎంచుకోండి" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(LOCATIONS).map((d) => (
                        <SelectItem key={d} value={d}>{d}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase">మండలం (Mandal)</label>
                  <Select 
                    value={selectedMandal} 
                    onValueChange={setSelectedMandal}
                    disabled={!selectedDistrict}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="మండలాన్ని ఎంచుకోండి" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">అన్ని మండలాలు (All Mandals)</SelectItem>
                      {selectedDistrict && (LOCATIONS as any)[selectedDistrict].map((m: string) => (
                        <SelectItem key={m} value={m}>{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <Button className="w-full mt-2" onClick={handleLocationUpdate}>
                  వార్తలు చూడండి (View News)
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="news-scroll-container mt-14 md:mt-0">
        {news.length > 0 ? (
          news.map((item) => (
            <section key={item.id} className="news-card-snap flex items-center justify-center px-4">
              <NewsCard news={item} />
            </section>
          ))
        ) : (
          <div className="flex items-center justify-center h-screen px-6 text-center">
            <div>
              <MapPin className="w-16 h-16 text-primary mx-auto mb-4 opacity-20" />
              <h3 className="text-xl font-bold text-foreground mb-2">వార్తలు ఏవీ లేవు (No News Found)</h3>
              <p className="text-muted-foreground mb-6">ప్రస్తుతానికి {selectedMandal}లో వార్తలు ఏవీ లేవు. దయచేసి వేరే ప్రాంతాన్ని ఎంచుకోండి.</p>
              <Button onClick={() => setIsLocationModalOpen(true)}>ప్రాంతాన్ని మార్చండి</Button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
