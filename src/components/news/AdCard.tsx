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
        <div className="absolute top-6 left-6 z-20">
          <div className="bg-black/40 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border border-white/10 shadow-2xl">
            <Megaphone className="w-4 h-4 text-primary animate-pulse" />
            Sponsored
          </div>
        </div>

        {/* Hyperlocal Tag */}
        <div className="absolute top-6 right-6 z-20">
          <div className="bg-white/10 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-[10px] font-bold border border-white/10">
            {ad.location.mandal === "All" ? ad.location.district : ad.location.mandal}
          </div>
        </div>

        {/* Content Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent pointer-events-none" />

        <div className="absolute bottom-12 left-0 right-0 p-8 flex flex-col items-center gap-6 text-center">
          <div className="space-y-2">
            <p className="text-white/60 text-xs font-bold uppercase tracking-[0.3em]">Special Promotion</p>
            <h3 className="text-white font-black text-xl leading-tight">హైపర్ లోకల్ ఆఫర్స్ కోసం క్లిక్ చేయండి</h3>
          </div>

          {ad.link && (
            <Button 
              size="lg" 
              className="rounded-full h-16 px-10 text-lg font-black bg-primary text-white shadow-xl hover:scale-105 transition-transform group"
              onClick={handleLinkClick}
            >
              Learn More
              <ExternalLink className="ml-2 w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
