"use client";

import { useRef, useState, useEffect, useMemo } from "react";
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

export const dynamic = 'force-dynamic';

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

  // Fact Check State
  const [factCheckId, setFactCheckId] = useState("");
  const [factCheckResult, setFactCheckResult] = useState<NewsPost | null | 'not_found'>(null);
  const [isSearching, setIsSearching] = useState(false);

  // Real-time Profile Data
  const profileRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user?.uid]);
  
  const { data: profile, isLoading: isProfileLoading } = useDoc(user?.uid ? profileRef : null);

  // Dynamic locations from Firestore
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
  const { data: likesDoc } = useDoc(user?.uid ? likesRef : null);
  const likedPostIds = Array.isArray(likesDoc?.postIds) ? likesDoc.postIds : [];

  // Real-time Approved News
  const newsRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'approved_news_posts');
  }, [firestore]);
  const { data: allNews } = useCollection<NewsPost>(newsRef);

  const likedNews = allNews?.filter(n => likedPostIds.includes(n.id)) || [];
  
  // Calculate local news count
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
      
      localStorage.setItem('teluguNewsPulse_userName', editName);
      if (editPhone) localStorage.setItem('teluguNewsPulse_userPhone', editPhone);
      if (editState) {
        localStorage.setItem('teluguNewsPulse_state', editState);
        localStorage.setItem('teluguNewsPulse_district', editDistrict);
        localStorage.setItem('teluguNewsPulse_mandal', editMandal);
      }
      
      window.dispatchEvent(new Event('teluguNewsPulse_authChanged'));
      setIsEditing(false);
      toast({ title: "Profile Updated", description: "Your changes have been saved successfully." });
    } catch (error) {
      toast({ variant: "destructive", title: "Update Failed", description: "Could not save changes." });
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
      if (result) {
        setFactCheckResult(result);
      } else {
        setFactCheckResult('not_found');
      }
    } catch (e) {
      toast({ variant: "destructive", title: "Search Error" });
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
        {/* Dynamic Header */}
        <div className="bg-gradient-to-r from-orange-500 to-yellow-400 rounded-[2rem] p-8 text-white shadow-xl animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div 
              className="relative w-24 h-24 rounded-3xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white text-3xl font-bold shadow-2xl border-4 border-white/30 overflow-hidden group cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              {profile.photo ? (
                <Image src={profile.photo} alt={profile.name} fill className="object-cover" />
              ) : (
                profile.name?.[0] || 'U'
              )}
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                {isUploading ? <Loader2 className="w-5 h-5 animate-spin text-white" /> : <Camera className="w-5 h-5 text-white" />}
              </div>
            </div>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handlePhotoUpload} />
            
            <div className="text-center md:text-left flex-1">
              <h1 className="text-3xl font-black tracking-tight leading-tight mb-1 truncate">నమస్కారం, {profile.name}!</h1>
              <p className="opacity-90 font-bold text-sm flex items-center justify-center md:justify-start gap-1.5">
                <MapPin className="w-4 h-4" />
                {profile.location ? `${profile.location.mandal}, ${profile.location.district}` : 'Location not set'}
              </p>
              <div className="mt-4 flex flex-wrap justify-center md:justify-start gap-2">
                <Badge className="bg-white/20 hover:bg-white/30 border-none text-white font-black text-[10px] uppercase tracking-widest px-3">
                  {profile.role}
                </Badge>
                {profile.status === 'approved' && (
                  <Badge className="bg-emerald-500 text-white border-none font-black text-[10px] uppercase tracking-widest px-3">
                    Verified Account
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Card className="border-none shadow-md rounded-2xl bg-white overflow-hidden">
            <CardContent className="p-4 flex flex-col items-center text-center">
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center mb-2">
                <Heart className="w-5 h-5 text-orange-600 fill-orange-600" />
              </div>
              <p className="text-2xl font-black text-slate-900">{likedPostIds.length}</p>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Liked News</p>
            </CardContent>
          </Card>
          <Card className="border-none shadow-md rounded-2xl bg-white overflow-hidden">
            <CardContent className="p-4 flex flex-col items-center text-center">
              <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center mb-2">
                <Zap className="w-5 h-5 text-yellow-600 fill-yellow-600" />
              </div>
              <p className="text-2xl font-black text-slate-900">{localNewsCount}</p>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Local Pulse</p>
            </CardContent>
          </Card>
          <Card className="border-none shadow-md rounded-2xl bg-white overflow-hidden hidden md:block">
            <CardContent className="p-4 flex flex-col items-center text-center">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mb-2">
                <Shield className="w-5 h-5 text-blue-600 fill-blue-600" />
              </div>
              <p className="text-2xl font-black text-slate-900">Active</p>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Status</p>
            </CardContent>
          </Card>
        </div>

        {/* Actions & Settings */}
        <Card className="border-none shadow-xl rounded-[2rem] overflow-hidden bg-white">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-black flex items-center gap-2">
              <LayoutDashboard className="w-5 h-5 text-primary" />
              Dashboard Settings
            </CardTitle>
            {!isEditing && (
              <Button variant="ghost" size="sm" className="rounded-xl h-9 px-4 font-bold text-primary hover:bg-primary/5" onClick={() => setIsEditing(true)}>
                <Edit2 className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
            )}
          </CardHeader>
          <CardContent className="p-8">
            {!isEditing ? (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Full Name</Label>
                    <p className="text-lg font-bold text-slate-900">{profile.name}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Contact</Label>
                    <p className="text-lg font-bold text-slate-900">{profile.phone || profile.email || 'Not set'}</p>
                  </div>
                </div>

                <div className="pt-6 border-t flex flex-col gap-3">
                  {profile.role === 'reporter' && (
                    <Button className="w-full gap-2 rounded-2xl h-14 font-black text-base bg-cyan-600 hover:bg-cyan-700 shadow-xl shadow-cyan-600/20" asChild>
                      <Link href="/reporter">
                        <Newspaper className="w-5 h-5" />
                        వార్తలు పంపండి (Submit News)
                      </Link>
                    </Button>
                  )}
                  {profile.role === 'admin' && (
                    <Button className="w-full gap-2 rounded-2xl h-14 font-black text-base bg-rose-600 hover:bg-rose-700 shadow-xl shadow-rose-600/20" asChild>
                      <Link href="/admin">
                        <Shield className="w-5 h-5" />
                        అడ్మిన్ ప్యానెల్ (Admin Panel)
                      </Link>
                    </Button>
                  )}
                  <Button variant="outline" className="w-full gap-2 rounded-2xl h-14 font-black text-base text-destructive hover:bg-destructive/5" onClick={handleLogout}>
                    <LogOut className="w-5 h-5" />
                    Logout Account
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-5 animate-in slide-in-from-top-2 duration-300">
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">పూర్తి పేరు (Full Name)</Label>
                    <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="h-12 rounded-xl bg-slate-50 border-none font-bold text-lg" />
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
                  
                  <div className="space-y-3 pt-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">ప్రాంతం (Location)</Label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      <Select value={editState} onValueChange={(val) => { setEditState(val); setEditDistrict(""); setEditMandal(""); }}>
                        <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-none font-bold text-sm"><SelectValue placeholder="State" /></SelectTrigger>
                        <SelectContent>
                          {availableStates.sort().map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Select value={editDistrict} onValueChange={(val) => { setEditDistrict(val); setEditMandal(""); }} disabled={!editState}>
                        <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-none font-bold text-sm"><SelectValue placeholder="District" /></SelectTrigger>
                        <SelectContent>
                          {editState && availableLocations[editState] && Object.keys(availableLocations[editState]).sort().map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Select value={editMandal} onValueChange={setEditMandal} disabled={!editDistrict}>
                        <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-none font-bold text-sm"><SelectValue placeholder="Mandal" /></SelectTrigger>
                        <SelectContent>
                          {editDistrict && availableLocations[editState]?.[editDistrict]?.map((m: string) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button variant="ghost" size="lg" className="flex-1 rounded-xl h-12 font-bold" onClick={() => setIsEditing(false)}>
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                  <Button size="lg" className="flex-1 gap-2 rounded-xl h-12 font-bold shadow-xl shadow-primary/20" onClick={handleSaveChanges} disabled={isSaving || !editName}>
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save Changes
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Fact Check Section */}
        <Card className="border-none shadow-xl rounded-3xl overflow-hidden bg-white">
          <CardHeader className="bg-emerald-50/50 border-b border-emerald-100 py-4 px-6">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Fact Check (వార్త ధృవీకరణ)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-3">
            <p className="text-[10px] text-muted-foreground font-medium">వార్త యొక్క 5 అంకెల ID ని నమోదు చేసి తనిఖీ చేయండి.</p>
            <div className="flex gap-2">
              <Input 
                placeholder="News ID (e.g. 10021)" 
                value={factCheckId}
                onChange={(e) => setFactCheckId(e.target.value.replace(/\D/g, '').slice(0, 5))}
                className="h-10 rounded-xl bg-slate-50 border-none font-bold text-center tracking-widest text-sm"
              />
              <Button size="icon" className="h-10 w-10 rounded-xl shadow-md shrink-0" onClick={handleFactCheck} disabled={isSearching || factCheckId.length < 5}>
                {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              </Button>
            </div>

            {factCheckResult === 'not_found' && (
              <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl flex items-start gap-2 animate-in zoom-in-95">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-rose-900">వార్త కనుగొనబడలేదు!</p>
                  <p className="text-[10px] text-rose-800 leading-tight">నమోదు చేసిన ID అధికారికంగా ధృవీకరించబడలేదు.</p>
                </div>
              </div>
            )}

            {factCheckResult && typeof factCheckResult === 'object' && (
              <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl space-y-2 animate-in zoom-in-95">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-emerald-900">Verified (ధృవీకరించబడింది)</p>
                    <p className="text-[9px] text-emerald-800 uppercase font-black tracking-widest">Official Story</p>
                  </div>
                </div>
                <div className="pt-1.5 border-t border-emerald-200">
                  <p className="text-xs font-bold text-emerald-900 truncate">{factCheckResult.title}</p>
                </div>
                <Button size="sm" variant="link" className="text-emerald-700 h-auto p-0 font-bold text-[10px]" asChild>
                  <Link href={`/?postId=${factCheckResult.id}`}>వార్తను చూడండి <ChevronRight className="w-2.5 h-2.5 ml-1" /></Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Legal & Feedback */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Link href="/guidelines" className="group">
            <Card className="border-none shadow-md rounded-2xl bg-white hover:bg-slate-50 transition-colors cursor-pointer p-3.5 h-full">
              <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform">
                <FileText className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-[11px] font-bold text-slate-900">Guidelines</p>
              <p className="text-[9px] text-muted-foreground mt-0.5">నిబంధనలు</p>
            </Card>
          </Link>
          <Link href="/privacy" className="group">
            <Card className="border-none shadow-md rounded-2xl bg-white hover:bg-slate-50 transition-colors cursor-pointer p-3.5 h-full">
              <div className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform">
                <Shield className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-[11px] font-bold text-slate-900">Privacy Policy</p>
              <p className="text-[9px] text-muted-foreground mt-0.5">గోప్యతా విధానం</p>
            </Card>
          </Link>
          <a href="mailto:telugunewspulseinfo@gmail.com" className="group">
            <Card className="border-none shadow-md rounded-2xl bg-white hover:bg-slate-50 transition-colors cursor-pointer p-3.5 h-full border-l-4 border-l-primary/30">
              <div className="w-9 h-9 bg-primary/5 rounded-xl flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform">
                <MessageSquare className="w-4 h-4 text-primary" />
              </div>
              <p className="text-[11px] font-bold text-slate-900">Help & Feedback</p>
              <p className="text-[9px] text-muted-foreground mt-0.5">ఫిర్యాదులు చేయండి</p>
            </Card>
          </a>
        </div>

        {/* Liked News History */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-base font-bold flex items-center gap-2">
              <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
              మీకు నచ్చిన వార్తలు
            </h2>
            <Badge variant="secondary" className="rounded-full text-[10px] px-2">{likedNews.length}</Badge>
          </div>

          <div className="space-y-2.5">
            {likedNews.length > 0 ? (
              likedNews.map((news) => (
                <Link key={news.id} href={`/?postId=${news.id}`}>
                  <Card className="border-none shadow-sm rounded-2xl overflow-hidden bg-white hover:shadow-md transition-all group">
                    <div className="flex p-2 gap-3">
                      <div className="relative w-20 h-16 rounded-lg overflow-hidden shrink-0">
                        <Image src={news.image_url} alt={news.title} fill className="object-cover group-hover:scale-110 transition-transform duration-500" />
                      </div>
                      <div className="flex-1 min-w-0 py-0.5">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <Badge className="text-[7px] h-3.5 font-bold bg-primary/10 text-primary border-none px-1.5">{news.location.mandal}</Badge>
                          <span className="text-[8px] text-muted-foreground font-mono">ID: {news.unique_code}</span>
                        </div>
                        <h3 className="text-[11px] font-bold text-slate-900 line-clamp-2 leading-tight">{news.title}</h3>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))
            ) : (
              <div className="text-center py-12 bg-white rounded-3xl border-2 border-dashed border-muted">
                <Heart className="w-8 h-8 text-muted-foreground/20 mx-auto mb-3" />
                <p className="text-muted-foreground italic text-[11px]">ఇంకా వార్తలు ఏవీ లేవు.</p>
              </div>
            )}
          </div>
        </div>
        
        <Footer />
      </div>
    </main>
  );
}
