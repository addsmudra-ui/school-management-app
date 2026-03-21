
'use client';

import Image from "next/image";
import { AdPost } from "@/lib/storage";
import { ExternalLink, Info, Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AdCardProps {
  ad: AdPost;
}

export function AdCard({ ad }: AdCardProps) {
  const handleLinkClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (ad.link) {
      window.open(ad.link, '_blank');
    }
  };

  return (
    <div className="w-full h-full max-w-full md:max-w-xl mx-auto bg-black relative flex flex-col md:h-[95dvh] md:rounded-[2rem] md:shadow-2xl overflow-hidden animate-in fade-in duration-500">
      <div className="relative w-full h-full">
        <Image
          src={ad.image_url}
          alt="Advertisement"
          fill
          priority
          className="object-cover"
        />
        
        {/* Ad Tag */}
        <div className="absolute top-4 left-4 z-20">
          <div className="bg-black/40 backdrop-blur-md text-white px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 border border-white/10 shadow-2xl">
            <Megaphone className="w-3 h-3 text-primary animate-pulse" />
            Sponsored
          </div>
        </div>

        {/* Hyperlocal Tag */}
        <div className="absolute top-4 right-4 z-20">
          <div className="bg-white/10 backdrop-blur-md text-white px-2.5 py-1 rounded-full text-[9px] font-bold border border-white/10">
            {ad.location.mandal === "All" ? ad.location.district : ad.location.mandal}
          </div>
        </div>

        {/* Content Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent pointer-events-none" />

        <div className="absolute bottom-10 left-0 right-0 p-6 flex flex-col items-center gap-4 text-center">
          <div className="space-y-1.5">
            <p className="text-white/60 text-[10px] font-bold uppercase tracking-[0.3em]">Special Promotion</p>
            <h3 className="text-white font-black text-base leading-tight">హైపర్ లోకల్ ఆఫర్స్ కోసం క్లిక్ చేయండి</h3>
          </div>

          {ad.link && (
            <Button 
              size="lg" 
              className="rounded-full h-14 px-8 text-base font-black bg-primary text-white shadow-xl hover:scale-105 transition-transform group"
              onClick={handleLinkClick}
            >
              Learn More
              <ExternalLink className="ml-2 w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
