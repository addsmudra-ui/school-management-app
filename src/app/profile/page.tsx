"use client";

import { useRef, useState, useEffect, useMemo } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, MapPin, Heart, LogOut, ChevronRight, Newspaper, Camera, Loader2, Shield, FileText, Edit2, Save, X, Phone, Mail } from "lucide-react";
import { NewsPost, STATES as MOCK_STATES, LOCATIONS_BY_STATE as MOCK_LOCATIONS } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import Link from "next/link";
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase, useAuth } from "@/firebase";
import { doc, collection } from "firebase/firestore";
import { UserService } from "@/lib/storage";
import { updateDocumentNonBlocking } from "@/firebase/non-blocking-updates";

export default function ProfilePage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const auth = useAuth();
  const { toast } = useToast();
  
  const [isUploading, setIsUploading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editState, setEditState] = useState("");
  const [editDistrict, setEditDistrict] = useState("");
  const [editMandal, setEditMandal] = useState("");

  // Real-time Profile Data
  const profileRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user?.uid]);
  const { data: profile, isLoading: isProfileLoading } = useDoc(profileRef);

  // Dynamic locations from Firestore for the edit form
  const locRef = useMemoFirebase(() => firestore ? doc(firestore, 'metadata', 'locations') : null, [firestore]);
  const { data: locationsDoc } = useDoc(locRef);
  
  const availableLocations = useMemo(() => {
    if (!locationsDoc) return MOCK_LOCATIONS;
    const { id, ...statesOnly } = locationsDoc as any;
    return statesOnly;
  }, [locationsDoc]);

  const availableStates = Object.keys(availableLocations).length > 0 ? Object.keys(availableLocations) : MOCK_STATES;

  // Initialize form when editing starts
  useEffect(() => {
    if (profile && isEditing) {
      setEditName(profile.name || "");
      setEditPhone(profile.phone || "");
      setEditEmail(profile.email || "");
      setEditState(profile.location?.state || "");
      setEditDistrict(profile.location?.district || "");
      setEditMandal(profile.location?.mandal || "");
    }
  }, [profile, isEditing]);

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

    if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
      toast({
        variant: "destructive",
        title: "Invalid File",
        description: "Please upload a JPG or PNG image.",
      });
      return;
    }

    if (file.size > 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "File Too Large",
        description: "Image must be under 1MB.",
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
      toast({ title: "Photo Updated" });
    };
    reader.readAsDataURL(file);
  };

  const handleSaveChanges = async () => {
    if (!firestore || !user?.uid) return;
    setIsSaving(true);

    try {
      const updates: any = {
        name: editName,
        phone: editPhone,
        email: editEmail,
      };

      if (editState && editDistrict && editMandal) {
        updates.location = {
          state: editState,
          district: editDistrict,
          mandal: editMandal
        };
      }

      await UserService.update(firestore, user.uid, updates);
      
      // Update local cache for immediate Navbar feedback
      localStorage.setItem('mandalPulse_userName', editName);
      if (editPhone) localStorage.setItem('mandalPulse_userPhone', editPhone);
      if (editState) {
        localStorage.setItem('mandalPulse_state', editState);
        localStorage.setItem('mandalPulse_district', editDistrict);
        localStorage.setItem('mandalPulse_mandal', editMandal);
      }
      
      window.dispatchEvent(new Event('mandalPulse_authChanged'));
      setIsEditing(false);
      toast({ title: "Profile Updated", description: "Your changes have been saved successfully." });
    } catch (error) {
      toast({ variant: "destructive", title: "Update Failed", description: "Could not save changes." });
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      localStorage.clear();
      window.dispatchEvent(new Event('mandalPulse_authChanged'));
      window.location.href = '/login';
    } catch (err) {
      console.error("Logout failed:", err);
    }
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
          <p className="text-muted-foreground font-medium">ప్రొఫైల్ చూడటానికి లాగిన్ అవ్వండి.</p>
          <Button asChild className="rounded-xl px-8 shadow-lg shadow-primary/20">
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
        {/* Profile Header & Info */}
        <Card className="border-none shadow-xl rounded-3xl overflow-hidden bg-white">
          <div className="h-28 bg-gradient-to-r from-primary/20 to-accent/20 relative" />
          <CardContent className="relative pt-0 px-6 pb-6">
            <div className="absolute -top-14 left-6">
              <div 
                className="relative w-28 h-28 rounded-3xl bg-primary flex items-center justify-center text-white text-4xl font-bold shadow-2xl border-4 border-white overflow-hidden group cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                {profile.photo ? (
                  <Image src={profile.photo} alt={profile.name} fill className="object-cover" />
                ) : (
                  profile.name?.[0] || 'U'
                )}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  {isUploading ? <Loader2 className="w-8 h-8 animate-spin text-white" /> : <Camera className="w-8 h-8 text-white" />}
                </div>
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handlePhotoUpload} 
              />
            </div>
            
            <div className="mt-16 space-y-6">
              {!isEditing ? (
                <div className="animate-in fade-in duration-300">
                  <div className="flex justify-between items-start">
                    <div>
                      <h1 className="text-3xl font-black tracking-tight text-slate-900">{profile.name}</h1>
                      <div className="flex flex-col gap-1.5 mt-2">
                        <p className="text-muted-foreground text-sm font-bold flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-primary" />
                          {profile.location ? `${profile.location.mandal}, ${profile.location.district}` : 'Location not set'}
                        </p>
                        {profile.phone && (
                          <p className="text-muted-foreground text-sm font-medium flex items-center gap-2">
                            <Phone className="w-4 h-4 text-slate-400" />
                            {profile.phone}
                          </p>
                        )}
                        {profile.email && (
                          <p className="text-muted-foreground text-sm font-medium flex items-center gap-2">
                            <Mail className="w-4 h-4 text-slate-400" />
                            {profile.email}
                          </p>
                        )}
                      </div>
                    </div>
                    <Badge variant="secondary" className="bg-primary/5 text-primary border-primary/10 capitalize px-4 py-1 text-xs font-bold rounded-full">
                      {profile.role}
                    </Badge>
                  </div>

                  <div className="flex gap-3 pt-6">
                    <Button variant="outline" className="flex-1 gap-2 rounded-2xl h-12 font-bold" onClick={() => setIsEditing(true)}>
                      <Edit2 className="w-4 h-4" />
                      Edit Profile
                    </Button>
                    <Button variant="outline" className="flex-1 gap-2 rounded-2xl h-12 font-bold text-destructive hover:bg-destructive/5" onClick={handleLogout}>
                      <LogOut className="w-4 h-4" />
                      Logout
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-5 animate-in slide-in-from-top-4 duration-300">
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">పూర్తి పేరు (Full Name)</Label>
                      <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="h-12 rounded-xl bg-slate-50 border-none font-bold" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">ఫోన్ (Phone)</Label>
                        <Input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} className="h-12 rounded-xl bg-slate-50 border-none font-bold" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">ఈమెయిల్ (Email)</Label>
                        <Input value={editEmail} onChange={(e) => setEditEmail(e.target.value)} className="h-12 rounded-xl bg-slate-50 border-none font-bold" />
                      </div>
                    </div>
                    
                    <div className="space-y-4 pt-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">ప్రాంతం (Location)</Label>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <Select value={editState} onValueChange={(val) => { setEditState(val); setEditDistrict(""); setEditMandal(""); }}>
                          <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-none font-bold"><SelectValue placeholder="State" /></SelectTrigger>
                          <SelectContent>
                            {availableStates.sort().map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <Select value={editDistrict} onValueChange={(val) => { setEditDistrict(val); setEditMandal(""); }} disabled={!editState}>
                          <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-none font-bold"><SelectValue placeholder="District" /></SelectTrigger>
                          <SelectContent>
                            {editState && availableLocations[editState] && Object.keys(availableLocations[editState]).sort().map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <Select value={editMandal} onValueChange={setEditMandal} disabled={!editDistrict}>
                          <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-none font-bold"><SelectValue placeholder="Mandal" /></SelectTrigger>
                          <SelectContent>
                            {editDistrict && availableLocations[editState]?.[editDistrict]?.map((m: string) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button variant="ghost" className="flex-1 rounded-2xl h-12 font-bold" onClick={() => setIsEditing(false)}>
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                    <Button className="flex-1 gap-2 rounded-2xl h-12 font-bold shadow-xl shadow-primary/20" onClick={handleSaveChanges} disabled={isSaving || !editName}>
                      {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      Save Changes
                    </Button>
                  </div>
                </div>
              )}

              {profile.role === 'reporter' && !isEditing && (
                <Button className="w-full gap-2 rounded-2xl h-14 font-black text-lg bg-cyan-600 hover:bg-cyan-700 shadow-xl shadow-cyan-600/20" asChild>
                  <Link href="/reporter">
                    <Newspaper className="w-5 h-5" />
                    వార్తలు పంపండి (Submit News)
                  </Link>
                </Button>
              )}
              {profile.role === 'admin' && !isEditing && (
                <Button className="w-full gap-2 rounded-2xl h-14 font-black text-lg bg-rose-600 hover:bg-rose-700 shadow-xl shadow-rose-600/20" asChild>
                  <Link href="/admin">
                    <Shield className="w-5 h-5" />
                    అడ్మిన్ ప్యానెల్ (Admin Panel)
                  </Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Legal & Info Section */}
        <Card className="border-none shadow-md rounded-[2rem] overflow-hidden bg-white">
          <CardContent className="p-2">
            <Link href="/privacy" className="flex items-center justify-between p-5 hover:bg-slate-50 transition-colors rounded-2xl group">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                  <Shield className="w-5 h-5 text-blue-600" />
                </div>
                <span className="font-bold text-slate-700">గోప్యతా విధానం (Privacy Policy)</span>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-transform group-hover:translate-x-1" />
            </Link>
            <div className="h-px bg-slate-50 mx-6" />
            <Link href="/guidelines" className="flex items-center justify-between p-5 hover:bg-slate-50 transition-colors rounded-2xl group">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                  <FileText className="w-5 h-5 text-amber-600" />
                </div>
                <span className="font-bold text-slate-700">నిబంధనలు (Content Guidelines)</span>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-transform group-hover:translate-x-1" />
            </Link>
          </CardContent>
        </Card>

        {/* Liked News Section */}
        <div className="space-y-4 pb-12">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-xl font-black flex items-center gap-2 text-slate-900">
              <Heart className="w-6 h-6 text-rose-500 fill-rose-500" />
              నచ్చిన వార్తలు (Liked)
            </h2>
            <Badge variant="secondary" className="rounded-full bg-white border px-3">
              {likedNews.length}
            </Badge>
          </div>

          <div className="grid gap-4">
            {likedNews.length > 0 ? (
              likedNews.map((news) => (
                <Link key={news.id} href={`/?postId=${news.id}`}>
                  <Card className="overflow-hidden border-none shadow-md group hover:shadow-xl transition-all rounded-[1.5rem] cursor-pointer bg-white">
                    <div className="flex items-stretch h-32">
                      <div className="relative w-32 shrink-0">
                        <Image src={news.image_url} alt={news.title} fill className="object-cover" />
                      </div>
                      <div className="p-4 flex-1 flex flex-col justify-between min-w-0">
                        <div>
                          <h3 className="font-bold text-sm line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                            {news.title}
                          </h3>
                          <div className="flex items-center gap-1.5 mt-2">
                            <MapPin className="w-3 h-3 text-primary" />
                            <span className="text-[10px] font-bold text-muted-foreground">{news.location.mandal}, {news.location.district}</span>
                          </div>
                        </div>
                        <div className="text-[10px] font-black text-primary flex items-center gap-1 uppercase tracking-widest mt-auto">
                          View Story <ChevronRight className="w-3 h-3" />
                        </div>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))
            ) : (
              <div className="text-center py-20 bg-white rounded-[2.5rem] border-2 border-dashed border-slate-100">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Newspaper className="w-10 h-10 text-slate-200" />
                </div>
                <p className="text-slate-400 font-bold">మీరు ఇంకా ఎటువంటి వార్తలను లైక్ చేయలేదు.</p>
                <Button variant="link" asChild className="mt-2 font-bold text-primary">
                  <Link href="/">వార్తలు చూడండి</Link>
                </Button>
              </div>
            )}
          </div>
        </div>

        <Footer />
      </div>
    </main>
  );
}
