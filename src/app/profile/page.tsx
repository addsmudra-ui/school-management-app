"use client";

import { useRef, useState, useEffect, useMemo, Suspense } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, MapPin, Heart, LogOut, ChevronRight, Newspaper, Camera, Loader2, Shield, FileText, Edit2, Save, X, Phone, Mail, Search, CheckCircle2, AlertTriangle, MessageSquare, LayoutDashboard, Zap } from "lucide-react";
import { NewsPost, STATES as MOCK_STATES, LOCATIONS_BY_STATE as MOCK_LOCATIONS } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import Link from "next/link";
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase, useAuth } from "@/firebase";
import { doc, collection } from "firebase/firestore";
import { UserService, NewsService } from "@/lib/storage";
import { updateDocumentNonBlocking } from "@/firebase/non-blocking-updates";

function ProfileContent() {
  const { user } = useUser();
  const firestore = useFirestore();
  const auth = useAuth();
  const { toast } = useToast();
  
  const [isUploading, setIsUploading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editState, setEditState] = useState("");
  const [editDistrict, setEditDistrict] = useState("");
  const [editMandal, setEditMandal] = useState("");

  const [factCheckId, setFactCheckId] = useState("");
  const [factCheckResult, setFactCheckResult] = useState<NewsPost | null | 'not_found'>(null);
  const [isSearching, setIsSearching] = useState(false);

  const profileRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user?.uid]);
  
  const { data: profile, isLoading: isProfileLoading } = useDoc(user?.uid ? profileRef : null);

  useEffect(() => {
    if (profile) {
      localStorage.setItem('teluguNewsPulse_userName', profile.name);
      localStorage.setItem('teluguNewsPulse_role', profile.role);
      localStorage.setItem('teluguNewsPulse_userStatus', profile.status);
      if (profile.location) {
        localStorage.setItem('teluguNewsPulse_state', profile.location.state);
        localStorage.setItem('teluguNewsPulse_district', profile.location.district);
        localStorage.setItem('teluguNewsPulse_mandal', profile.location.mandal);
      }
      if (profile.photo) localStorage.setItem('teluguNewsPulse_userPhoto', profile.photo);
      window.dispatchEvent(new Event('teluguNewsPulse_authChanged'));
    }
  }, [profile]);

  const locRef = useMemoFirebase(() => firestore ? doc(firestore, 'metadata', 'locations') : null, [firestore]);
  const { data: locationsDoc } = useDoc(locRef);
  
  const availableLocations = useMemo(() => {
    if (!locationsDoc) return MOCK_LOCATIONS;
    const { id, ...statesOnly } = locationsDoc as any;
    return statesOnly;
  }, [locationsDoc]);

  const availableStates = Object.keys(availableLocations).length > 0 ? Object.keys(availableLocations) : MOCK_STATES;

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

  const likesRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, 'users', user.uid, 'private', 'likes');
  }, [firestore, user?.uid]);
  const { data: likesDoc } = useDoc(user?.uid ? likesRef : null);
  const likedPostIds = Array.isArray(likesDoc?.postIds) ? likesDoc.postIds : [];

  const newsRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'approved_news_posts');
  }, [firestore]);
  const { data: allNews } = useCollection<NewsPost>(newsRef);

  const likedNews = allNews?.filter(n => likedPostIds.includes(n.id)) || [];
  
  const localNewsCount = useMemo(() => {
    if (!allNews || !profile?.location) return 0;
    return allNews.filter(n => 
      n.location.district === profile.location?.district && 
      (profile.location?.mandal === 'All' || n.location.mandal === profile.location?.mandal)
    ).length;
  }, [allNews, profile?.location]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profileRef) return;
    if (file.size > 1024 * 1024) { toast({ variant: "destructive", title: "Too Large", description: "Max 1MB." }); return; }

    setIsUploading(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      updateDocumentNonBlocking(profileRef, { photo: base64String });
      setIsUploading(false);
      localStorage.setItem('teluguNewsPulse_userPhoto', base64String);
      window.dispatchEvent(new Event('teluguNewsPulse_authChanged'));
      toast({ title: "Photo Updated" });
    };
    reader.readAsDataURL(file);
  };

  const handleSaveChanges = async () => {
    if (!firestore || !user?.uid) return;
    setIsSaving(true);
    try {
      const updates: any = { name: editName, phone: editPhone, email: editEmail };
      if (editState && editDistrict && editMandal) {
        updates.location = { state: editState, district: editDistrict, mandal: editMandal };
      }
      await UserService.update(firestore, user.uid, updates);
      setIsEditing(false);
      toast({ title: "Profile Updated" });
    } catch (error) {
      toast({ variant: "destructive", title: "Failed" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleFactCheck = async () => {
    if (!factCheckId || !firestore) return;
    setIsSearching(true);
    setFactCheckResult(null);
    try {
      const result = await NewsService.getByCode(firestore, factCheckId);
      setFactCheckResult(result || 'not_found');
    } catch (e) {
      toast({ variant: "destructive", title: "Error" });
    } finally {
      setIsSearching(false);
    }
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      localStorage.clear();
      window.dispatchEvent(new Event('teluguNewsPulse_authChanged'));
      window.location.href = '/login';
    } catch (err) { console.error(err); }
  };

  if (isProfileLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="w-10 h-10 text-primary animate-spin" /></div>;
  }

  if (!user || user.isAnonymous || (!profile && !isProfileLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-8">
        <div className="text-center space-y-6 max-w-sm animate-in zoom-in-95">
          <div className="w-20 h-20 bg-orange-100 rounded-3xl flex items-center justify-center mx-auto"><User className="w-10 h-10 text-orange-600" /></div>
          <h2 className="text-2xl font-black">Dashboard Locked</h2>
          <Button asChild className="w-full h-14 rounded-2xl text-lg font-bold shadow-xl shadow-orange-500/20"><Link href="/login">Login / Sign Up</Link></Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-5 pt-8 space-y-6">
        {/* Profile Header */}
        <div className="bg-gradient-to-r from-orange-500 to-yellow-400 rounded-[2rem] p-8 text-white shadow-lg animate-in fade-in duration-500">
          <div className="flex flex-col items-center gap-6">
            <div className="relative w-24 h-24 rounded-3xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white text-3xl font-bold shadow-xl border-2 border-white/30 overflow-hidden group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              {profile.photo ? <Image src={profile.photo} alt={profile.name} fill className="object-cover" /> : profile.name?.[0] || 'U'}
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                {isUploading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Camera className="w-6 h-6" />}
              </div>
            </div>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handlePhotoUpload} />
            <div className="text-center w-full px-4">
              <h1 className="text-2xl font-black tracking-tight leading-tight mb-2 line-clamp-2 break-words">
                నమస్కారం, {profile.name}!
              </h1>
              <p className="opacity-90 font-bold text-sm flex items-center justify-center gap-1.5">
                <MapPin className="w-4 h-4" />
                {profile.location ? `${profile.location.mandal}, ${profile.location.district}` : 'Location not set'}
              </p>
              <div className="mt-4 flex justify-center gap-2">
                <Badge className="bg-white/20 border-none text-white font-black text-[11px] uppercase tracking-widest px-3 py-1">{profile.role}</Badge>
                {profile.status === 'approved' && <Badge className="bg-emerald-500 text-white border-none font-black text-[11px] uppercase tracking-widest px-3 py-1">Verified</Badge>}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="border-none shadow-sm rounded-2xl bg-white"><CardContent className="p-4 flex flex-col items-center text-center"><div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center mb-2"><Heart className="w-5 h-5 text-orange-600 fill-orange-600" /></div><p className="text-2xl font-black text-slate-900">{likedPostIds.length}</p><p className="text-[11px] font-bold text-muted-foreground uppercase">Liked</p></CardContent></Card>
          <Card className="border-none shadow-sm rounded-2xl bg-white"><CardContent className="p-4 flex flex-col items-center text-center"><div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center mb-2"><Zap className="w-5 h-5 text-yellow-600 fill-yellow-600" /></div><p className="text-2xl font-black text-slate-900">{localNewsCount}</p><p className="text-[11px] font-bold text-muted-foreground uppercase">Local</p></CardContent></Card>
          <Card className="border-none shadow-sm rounded-2xl bg-white"><CardContent className="p-4 flex flex-col items-center text-center"><div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mb-2"><Shield className="w-5 h-5 text-blue-600 fill-blue-600" /></div><p className="text-2xl font-black text-slate-900">Active</p><p className="text-[11px] font-bold text-muted-foreground uppercase">Status</p></CardContent></Card>
        </div>

        {/* Settings */}
        <Card className="border-none shadow-md rounded-[2rem] overflow-hidden bg-white">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 flex flex-row items-center justify-between py-4 px-6">
            <CardTitle className="text-lg font-black flex items-center gap-2"><LayoutDashboard className="w-5 h-5 text-primary" /> Settings</CardTitle>
            {!isEditing && <Button variant="ghost" size="sm" className="h-8 text-xs font-bold" onClick={() => setIsEditing(true)}><Edit2 className="w-4 h-4 mr-1.5" /> Edit</Button>}
          </CardHeader>
          <CardContent className="p-6">
            {!isEditing ? (
              <div className="space-y-5 animate-in fade-in duration-300">
                <div className="grid grid-cols-2 gap-6">
                  <div><Label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Full Name</Label><p className="text-base font-bold text-slate-900">{profile.name}</p></div>
                  <div><Label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Contact</Label><p className="text-base font-bold text-slate-900">{profile.phone || profile.email || 'Not set'}</p></div>
                </div>
                <div className="pt-5 border-t flex flex-col gap-3">
                  {profile.role === 'reporter' && <Button className="w-full h-12 rounded-xl text-base font-black bg-cyan-600 hover:bg-cyan-700 shadow-lg shadow-cyan-600/20" asChild><Link href="/reporter"><Newspaper className="w-5 h-5 mr-2" /> వార్తలు పంపండి</Link></Button>}
                  {(profile.role === 'admin' || profile.role === 'editor') && <Button className="w-full h-12 rounded-xl text-base font-black bg-rose-600 hover:bg-rose-700 shadow-lg shadow-rose-600/20" asChild><Link href="/admin"><Shield className="w-5 h-5 mr-2" /> అడ్మిన్ ప్యానెల్</Link></Button>}
                  <Button variant="outline" className="w-full h-12 rounded-xl text-base font-black text-destructive" onClick={handleLogout}><LogOut className="w-5 h-5 mr-2" /> Logout</Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
                <div className="space-y-2"><Label className="text-[11px] font-black uppercase text-primary">Full Name</Label><Input value={editName} onChange={(e) => setEditName(e.target.value)} className="h-11 text-base" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label className="text-[11px] font-black uppercase text-primary">Phone</Label><Input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} className="h-11 text-base" /></div>
                  <div className="space-y-2"><Label className="text-[11px] font-black uppercase text-primary">Email</Label><Input value={editEmail} onChange={(e) => setEditEmail(e.target.value)} className="h-11 text-base" /></div>
                </div>
                <div className="space-y-3 pt-2"><Label className="text-[11px] font-black uppercase text-primary">Location</Label><div className="grid grid-cols-3 gap-2"><Select value={editState} onValueChange={(v) => { setEditState(v); setEditDistrict(""); setEditMandal(""); }}><SelectTrigger className="h-10 text-sm"><SelectValue placeholder="State" /></SelectTrigger><SelectContent>{availableStates.map(s => <SelectItem key={s} value={s} className="text-sm">{s}</SelectItem>)}</SelectContent></Select><Select value={editDistrict} onValueChange={(v) => { setEditDistrict(v); setEditMandal(""); }} disabled={!editState}><SelectTrigger className="h-10 text-sm"><SelectValue placeholder="Dist" /></SelectTrigger><SelectContent>{editState && Object.keys(availableLocations[editState]).map(d => <SelectItem key={d} value={d} className="text-sm">{d}</SelectItem>)}</SelectContent></Select><Select value={editMandal} onValueChange={setEditMandal} disabled={!editDistrict}><SelectTrigger className="h-10 text-sm"><SelectValue placeholder="Mandal" /></SelectTrigger><SelectContent>{editDistrict && availableLocations[editState]?.[editDistrict]?.map((m: string) => <SelectItem key={m} value={m} className="text-sm">{m}</SelectItem>)}</SelectContent></Select></div></div>
                <div className="flex gap-3 pt-4">
                  <Button variant="ghost" size="sm" className="flex-1 h-11 text-sm" onClick={() => setIsEditing(false)}>Cancel</Button>
                  <Button size="sm" className="flex-1 h-11 text-sm font-bold" onClick={handleSaveChanges} disabled={isSaving || !editName}>{isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />} Save</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Fact Check */}
        <Card className="border-none shadow-md rounded-[2rem] bg-white">
          <CardHeader className="bg-emerald-50/50 border-b border-emerald-100 py-4 px-6"><CardTitle className="text-lg font-bold flex items-center gap-2 text-emerald-700"><CheckCircle2 className="w-5 h-5" /> Fact Check</CardTitle></CardHeader>
          <CardContent className="p-5 space-y-4">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-tight">వార్త యొక్క 5 అంకెల ID ని నమోదు చేయండి.</p>
            <div className="flex gap-3"><Input placeholder="News ID" value={factCheckId} onChange={(e) => setFactCheckId(e.target.value.replace(/\D/g, '').slice(0, 5))} className="h-11 text-base text-center tracking-widest font-black" /><Button size="icon" className="h-11 w-11 shrink-0" onClick={handleFactCheck} disabled={isSearching || factCheckId.length < 5}>{isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}</Button></div>
            {factCheckResult === 'not_found' && <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl flex items-start gap-3 animate-in slide-in-from-top-1"><AlertTriangle className="w-4 h-4 text-rose-600 mt-0.5" /><div className="space-y-1"><p className="text-xs font-bold text-rose-900">కనుగొనబడలేదు!</p><p className="text-xs text-rose-800 leading-tight">నమోదు చేసిన ID ధృవీకరించబడలేదు.</p></div></div>}
            {factCheckResult && typeof factCheckResult === 'object' && <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl space-y-2 animate-in slide-in-from-top-1"><div className="flex items-center gap-2.5"><CheckCircle2 className="w-4 h-4 text-emerald-600" /><div className="space-y-0"><p className="text-xs font-bold text-emerald-900">Verified (ధృవీకరించబడింది)</p></div></div><p className="text-sm font-bold text-emerald-900 truncate">{factCheckResult.title}</p><Button size="sm" variant="link" className="text-emerald-700 h-auto p-0 text-[11px] font-black uppercase" asChild><Link href={`/?postId=${factCheckResult.id}`}>వార్తను చూడండి</Link></Button></div>}
          </CardContent>
        </Card>

        {/* Liked History */}
        <div className="space-y-3 pb-8">
          <div className="flex items-center justify-between px-2"><h2 className="text-sm font-black flex items-center gap-2 uppercase text-slate-700"><Heart className="w-4 h-4 text-rose-500 fill-rose-500" /> మీకు నచ్చిన వార్తలు</h2><Badge variant="secondary" className="text-[11px] h-6 px-2">{likedNews.length}</Badge></div>
          <div className="space-y-3">
            {likedNews.length > 0 ? likedNews.map((news) => (
              <Link key={news.id} href={`/?postId=${news.id}`}><Card className="border-none shadow-sm rounded-2xl overflow-hidden bg-white hover:bg-slate-50 transition-all"><div className="flex p-2 gap-4"><div className="relative w-24 h-20 rounded-xl overflow-hidden shrink-0"><Image src={news.image_url} alt={news.title} fill className="object-cover" /></div><div className="flex-1 min-w-0 py-1"><div className="flex items-center gap-2 mb-1"><Badge className="text-[9px] h-4 font-bold bg-primary/10 text-primary border-none px-1.5">{news.location.mandal}</Badge><span className="text-[10px] text-muted-foreground font-mono">ID: {news.unique_code}</span></div><h3 className="text-sm font-bold text-slate-900 line-clamp-2 leading-tight">{news.title}</h3></div></div></Card></Link>
            )) : <div className="text-center py-12 bg-white rounded-2xl border-2 border-dashed border-muted"><Heart className="w-8 h-8 text-muted-foreground/20 mx-auto mb-3" /><p className="text-muted-foreground italic text-sm">ఇంకా వార్తలు లేవు.</p></div>}
          </div>
        </div>
        
        <Footer />
      </div>
  );
}

export default function ProfilePage() {
  const { isUserLoading } = useUser();

  if (isUserLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="w-10 h-10 text-primary animate-spin" /></div>;
  }

  return (
    <main className="min-h-screen bg-slate-50/50 pb-24 md:pt-16">
      <Suspense fallback={<div>Loading...</div>}>
        <Navbar />
      </Suspense>
      <ProfileContent />
    </main>
  );
}
