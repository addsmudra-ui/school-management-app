"use client";

import { useRef, useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, MapPin, Heart, LogOut, ChevronRight, Newspaper, Camera, Loader2, Shield, FileText } from "lucide-react";
import { NewsPost } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import Link from "next/link";
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from "@/firebase";
import { doc, collection } from "firebase/firestore";
import { updateDocumentNonBlocking } from "@/firebase/non-blocking-updates";

export default function ProfilePage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Real-time Profile Data
  const profileRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user?.uid]);
  const { data: profile, isLoading: isProfileLoading } = useDoc(profileRef);

  // Real-time Liked Posts IDs
  const likesRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, 'users', user.uid, 'private', 'likes');
  }, [firestore, user?.uid]);
  const { data: likesDoc } = useDoc(likesRef);
  const likedPostIds = likesDoc?.postIds || [];

  // Real-time Approved News
  const newsRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'approved_news_posts');
  }, [firestore]);
  const { data: allNews } = useCollection<NewsPost>(newsRef);

  const likedNews = allNews?.filter(n => likedPostIds.includes(n.id)) || [];

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profileRef) return;

    if (!['image/jpeg', 'image/jpg'].includes(file.type)) {
      toast({
        variant: "destructive",
        title: "అనుమతించబడని ఫైల్",
        description: "దయచేసి కేవలం JPG లేదా JPEG చిత్రాలను మాత్రమే అప్‌లోడ్ చేయండి.",
      });
      return;
    }

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
      updateDocumentNonBlocking(profileRef, { photo: base64String });
      setIsUploading(false);
      localStorage.setItem('mandalPulse_userPhoto', base64String);
      window.dispatchEvent(new Event('mandalPulse_authChanged'));
      toast({
        title: "ఫోటో అప్‌లోడ్ అయ్యింది",
        description: "మీ ప్రొఫైల్ ఫోటో విజయవంతంగా మార్చబడింది.",
      });
    };
    reader.readAsDataURL(file);
  };

  const handleLogout = () => {
    localStorage.clear();
    window.dispatchEvent(new Event('mandalPulse_authChanged'));
    window.location.href = '/login';
  };

  if (isUserLoading || isProfileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
      </div>
    );
  }

  if (!user || !profile) {
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
                {profile.photo ? (
                  <Image src={profile.photo} alt={profile.name} fill className="object-cover" />
                ) : (
                  profile.name?.[0] || 'U'
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
                  <h1 className="text-2xl font-bold">{profile.name}</h1>
                  <p className="text-muted-foreground text-sm flex items-center gap-1 mt-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {profile.location ? `${profile.location.mandal}, ${profile.location.district}` : 'Location not set'}
                  </p>
                </div>
                <Badge variant="secondary" className="bg-primary/5 text-primary border-primary/10 capitalize h-6">
                  {profile.role}
                </Badge>
              </div>

              <div className="flex gap-3 pt-2">
                <Button variant="outline" className="flex-1 gap-2 rounded-xl" onClick={handleLogout}>
                  <LogOut className="w-4 h-4" />
                  Logout
                </Button>
                {profile.role === 'admin' && (
                  <Button className="flex-1 gap-2 rounded-xl" asChild>
                    <Link href="/admin">Admin Panel</Link>
                  </Button>
                )}
                {profile.role === 'reporter' && (
                  <Button className="flex-1 gap-2 rounded-xl" asChild>
                    <Link href="/reporter">My Dashboard</Link>
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Legal & Info Section */}
        <Card className="border-none shadow-md rounded-2xl overflow-hidden bg-white">
          <CardContent className="p-2">
            <Link href="/privacy" className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors rounded-xl group">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                  <Shield className="w-4 h-4 text-blue-600" />
                </div>
                <span className="font-bold text-sm">గోప్యతా విధానం (Privacy Policy)</span>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
            </Link>
            <div className="h-px bg-slate-100 mx-4" />
            <Link href="/guidelines" className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors rounded-xl group">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center">
                  <FileText className="w-4 h-4 text-amber-600" />
                </div>
                <span className="font-bold text-sm">నిబంధనలు (Content Guidelines)</span>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
            </Link>
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