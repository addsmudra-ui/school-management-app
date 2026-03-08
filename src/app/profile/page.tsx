
"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, MapPin, Heart, LogOut, ChevronRight, Newspaper, Camera, Loader2 } from "lucide-react";
import { NewsService } from "@/lib/storage";
import { NewsPost } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import Link from "next/link";

export default function ProfilePage() {
  const [user, setUser] = useState<{ name: string; role: string; location: string; photo?: string } | null>(null);
  const [likedNews, setLikedNews] = useState<NewsPost[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const loadProfileData = useCallback(() => {
    if (typeof window === 'undefined') return;
    
    const name = localStorage.getItem('mandalPulse_userName');
    const role = localStorage.getItem('mandalPulse_role');
    const state = localStorage.getItem('mandalPulse_state');
    const district = localStorage.getItem('mandalPulse_district');
    const mandal = localStorage.getItem('mandalPulse_mandal');
    const photo = localStorage.getItem('mandalPulse_userPhoto');

    if (name) {
      setUser({
        name,
        role: role || 'user',
        location: state ? `${mandal}, ${district}, ${state}` : 'Location not set',
        photo: photo || undefined
      });

      const likedIds = NewsService.getLikedPostIds();
      const allNews = NewsService.getAll();
      setLikedNews(allNews.filter(n => likedIds.includes(n.id)));
    }
  }, []);

  useEffect(() => {
    loadProfileData();
    window.addEventListener('mandalPulse_likesChanged', loadProfileData);
    window.addEventListener('mandalPulse_authChanged', loadProfileData);
    return () => {
      window.removeEventListener('mandalPulse_likesChanged', loadProfileData);
      window.removeEventListener('mandalPulse_authChanged', loadProfileData);
    };
  }, [loadProfileData]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validation: Type
    if (!['image/jpeg', 'image/jpg'].includes(file.type)) {
      toast({
        variant: "destructive",
        title: "అనుమతించబడని ఫైల్",
        description: "దయచేసి కేవలం JPG లేదా JPEG చిత్రాలను మాత్రమే అప్‌లోడ్ చేయండి.",
      });
      return;
    }

    // Validation: Size (1MB)
    if (file.size > 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "పెద్ద ఫైల్",
        description: "చిత్రం పరిమాణం 1MB కంటే తక్కువ ఉండాలి.",
      });
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      localStorage.setItem('mandalPulse_userPhoto', base64String);
      setIsUploading(false);
      loadProfileData();
      window.dispatchEvent(new Event('mandalPulse_authChanged'));
      toast({
        title: "ఫోటో అప్‌లోడ్ అయ్యింది",
        description: "మీ ప్రొఫైల్ ఫోటో విజయవంతంగా మార్చబడింది.",
      });
    };
    reader.readAsDataURL(file);
  };

  const handleLogout = () => {
    localStorage.removeItem('mandalPulse_role');
    localStorage.removeItem('mandalPulse_userName');
    localStorage.removeItem('mandalPulse_state');
    localStorage.removeItem('mandalPulse_district');
    localStorage.removeItem('mandalPulse_mandal');
    localStorage.removeItem('mandalPulse_userPhoto');
    window.dispatchEvent(new Event('mandalPulse_authChanged'));
    window.location.href = '/login';
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Please log in to view your profile.</p>
          <Button asChild>
            <Link href="/login">Login Now</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50/50 pb-24 md:pt-20">
      <Navbar />
      
      <div className="max-w-2xl mx-auto px-4 pt-8 space-y-6">
        {/* Profile Header */}
        <Card className="border-none shadow-xl rounded-3xl overflow-hidden bg-white">
          <div className="h-24 bg-primary/10 relative" />
          <CardContent className="relative pt-0 px-6 pb-6">
            <div className="absolute -top-12 left-6">
              <div 
                className="relative w-24 h-24 rounded-3xl bg-primary flex items-center justify-center text-white text-4xl font-bold shadow-xl border-4 border-white overflow-hidden group cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                {user.photo ? (
                  <Image src={user.photo} alt={user.name} fill className="object-cover" />
                ) : (
                  user.name[0]
                )}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  {isUploading ? <Loader2 className="w-6 h-6 animate-spin text-white" /> : <Camera className="w-6 h-6 text-white" />}
                </div>
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept=".jpg,.jpeg" 
                onChange={handlePhotoUpload} 
              />
            </div>
            
            <div className="mt-14 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-2xl font-bold">{user.name}</h1>
                  <p className="text-muted-foreground text-sm flex items-center gap-1 mt-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {user.location}
                  </p>
                </div>
                <Badge variant="secondary" className="bg-primary/5 text-primary border-primary/10 capitalize h-6">
                  {user.role}
                </Badge>
              </div>

              <div className="flex gap-3 pt-2">
                <Button variant="outline" className="flex-1 gap-2 rounded-xl" onClick={handleLogout}>
                  <LogOut className="w-4 h-4" />
                  Logout
                </Button>
                {user.role === 'admin' && (
                  <Button className="flex-1 gap-2 rounded-xl" asChild>
                    <Link href="/admin">Admin Panel</Link>
                  </Button>
                )}
                {user.role === 'reporter' && (
                  <Button className="flex-1 gap-2 rounded-xl" asChild>
                    <Link href="/reporter">My Dashboard</Link>
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Liked News Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Heart className="w-5 h-5 text-destructive fill-destructive" />
              నచ్చిన వార్తలు (Liked News)
            </h2>
            <Badge variant="outline" className="rounded-full">
              {likedNews.length}
            </Badge>
          </div>

          <div className="grid gap-4">
            {likedNews.length > 0 ? (
              likedNews.map((news) => (
                <Link key={news.id} href={`/?postId=${news.id}`}>
                  <Card className="overflow-hidden border-none shadow-md group hover:shadow-lg transition-all rounded-2xl cursor-pointer">
                    <div className="flex">
                      <div className="relative w-32 h-32 shrink-0">
                        <Image src={news.image_url} alt={news.title} fill className="object-cover" />
                      </div>
                      <div className="p-4 flex-1 flex flex-col justify-between min-w-0">
                        <div>
                          <h3 className="font-bold text-sm line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                            {news.title}
                          </h3>
                          <p className="text-[10px] text-muted-foreground mt-2 flex items-center gap-1">
                            <MapPin className="w-2.5 h-2.5" />
                            {news.location.mandal}, {news.location.district}
                          </p>
                        </div>
                        <div className="text-[10px] font-bold text-primary flex items-center gap-0.5 mt-2 group-hover:underline">
                          View Story <ChevronRight className="w-3 h-3" />
                        </div>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))
            ) : (
              <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-muted">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Newspaper className="w-8 h-8 text-muted-foreground/30" />
                </div>
                <p className="text-muted-foreground font-medium">మీరు ఇంకా ఎటువంటి వార్తలను లైక్ చేయలేదు.</p>
                <Button variant="link" asChild className="mt-2">
                  <Link href="/">వార్తలు చూడండి</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
