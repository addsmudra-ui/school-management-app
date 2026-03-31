
'use client';

import React, { useState, useRef, useMemo, Suspense } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  Newspaper, Send, Upload, X, Loader2, MapPin, Video, 
  Sparkles, Type, FileText, CheckCircle2, Clock, XCircle,
  AlertTriangle, ChevronRight, Home as HomeIcon, Flag, 
  Globe, Wallet, HeartPulse, Trophy, Film, Cpu, Image as ImageIcon
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { STATES as MOCK_STATES, LOCATIONS_BY_STATE as MOCK_LOCATIONS, NEWS_CATEGORIES, NewsPost } from "@/lib/mock-data";
import { NewsService } from "@/lib/storage";
import { useFirestore, useUser, useDoc, useCollection, useMemoFirebase } from "@/firebase";
import Image from "next/image";
import { doc, collection, query, where, orderBy, limit } from "firebase/firestore";
import { addWatermark } from "@/lib/watermark";
import { generateHeadlines } from "@/ai/flows/reporter-ai-headline-generation";
import { summarizeArticleForReporter } from "@/ai/flows/reporter-ai-content-summarization";
import Link from "next/link";
import { cn } from "@/lib/utils";

function ReporterContent() {
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();
  
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<string>("Home");
  const [state, setState] = useState("");
  const [district, setDistrict] = useState("");
  const [mandal, setMandal] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [isGeneratingHeadlines, setIsGeneratingHeadlines] = useState(false);
  const [aiHeadlines, setAiHeadlines] = useState<string[]>([]);
  const [isSummarizing, setIsSummarizing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const profileRef = useMemoFirebase(() => (firestore && user?.uid) ? doc(firestore, 'users', user.uid) : null, [firestore, user?.uid]);
  const brandingRef = useMemoFirebase(() => firestore ? doc(firestore, 'config', 'admin') : null, [firestore]);
  const { data: profile, isLoading: isProfileLoading } = useDoc(profileRef);
  const { data: branding } = useDoc(brandingRef);

  const submissionsQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return query(
      collection(firestore, 'pending_news_posts'),
      where('author_id', '==', user.uid),
      orderBy('timestamp', 'desc'),
      limit(5)
    );
  }, [firestore, user?.uid]);
  const { data: recentSubmissions } = useCollection<NewsPost>(submissionsQuery);

  const locRef = useMemoFirebase(() => firestore ? doc(firestore, 'metadata', 'locations') : null, [firestore]);
  const catRef = useMemoFirebase(() => firestore ? doc(firestore, 'metadata', 'categories') : null, [firestore]);
  const { data: locationsDoc } = useDoc(locRef);
  const { data: categoriesDoc } = useDoc(catRef);

  const availableCategories = useMemo(() => categoriesDoc?.items || NEWS_CATEGORIES, [categoriesDoc]);
  const availableLocations = useMemo(() => {
    if (!locationsDoc) return MOCK_LOCATIONS;
    const { id, ...statesOnly } = locationsDoc as any;
    return statesOnly;
  }, [locationsDoc]);
  const availableStates = Object.keys(availableLocations).length > 0 ? Object.keys(availableLocations) : MOCK_STATES;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      const appName = branding?.appName || "News Pulse";
      const logo = branding?.appLogo;
      const watermarked = await addWatermark(base64, appName, logo);
      
      setImagePreview(watermarked);
      setVideoUrl(null); // Clear video when image is picked
    };
    reader.readAsDataURL(file);
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast({ variant: "destructive", title: "Video too large", description: "Max 10MB clips allowed." });
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setVideoUrl(reader.result as string);
      setImagePreview(null); // Clear image when video is picked
    };
    reader.readAsDataURL(file);
  };

  const handleAiHeadlines = async () => {
    if (!content || content.length < 50) {
      toast({ variant: "destructive", title: "Content Required", description: "Please write some content first." });
      return;
    }
    setIsGeneratingHeadlines(true);
    try {
      const result = await generateHeadlines({ articleContent: content });
      setAiHeadlines(result.headlines);
    } catch (e) {
      toast({ variant: "destructive", title: "AI Error", description: "Could not generate headlines." });
    } finally {
      setIsGeneratingHeadlines(false);
    }
  };

  const handleAiSummarize = async () => {
    if (!content || content.length < 100) {
      toast({ variant: "destructive", title: "Content Required", description: "Need at least 100 words to summarize." });
      return;
    }
    setIsSummarizing(true);
    try {
      const result = await summarizeArticleForReporter({ detailedArticle: content });
      setContent(result.summary);
      toast({ title: "Summarized!", description: "Article has been condensed." });
    } catch (e) {
      toast({ variant: "destructive", title: "AI Error", description: "Summarization failed." });
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore || !user || !profile) return;

    if (!title || !content || !state || !district || !mandal) {
      toast({ 
        title: "Error", 
        description: "దయచేసి ముఖ్యాంశం, వివరాలు మరియు ప్రాంతాన్ని నమోదు చేయండి.", 
        variant: "destructive" 
      });
      return;
    }

    setIsSubmitting(true);
    try {
      NewsService.add(firestore, {
        unique_code: Math.floor(10000 + Math.random() * 90000).toString(),
        title,
        content,
        category: category as any,
        image_url: imagePreview || "",
        video_url: videoUrl || undefined,
        location: { state, district, mandal },
        status: 'pending',
        author_id: user.uid,
        author_name: profile.name,
        author_role: (profile.role === 'admin' || profile.role === 'editor') ? 'Desk Incharge' : 'Reporter',
        author_stars: 3,
        likes: 0,
        commentsCount: 0
      });

      toast({ title: "వార్త పంపబడింది", description: "మీ వార్త రివ్యూ కోసం పంపబడింది. ఆమోదం పొందాక లైవ్ అవుతుంది." });
      
      setTitle(""); setContent(""); setCategory("Home"); setState(""); setDistrict(""); setMandal(""); setImagePreview(null); setVideoUrl(null); setAiHeadlines([]);
    } catch (error) {
      toast({ title: "Error", description: "Failed to submit news.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isUserLoading || isProfileLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-10 h-10 text-primary animate-spin" /></div>;
  }

  if (!profile || (profile.role !== 'reporter' && profile.role !== 'admin' && profile.role !== 'editor')) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center">
        <AlertTriangle className="w-14 h-14 text-amber-500 mb-6" />
        <h2 className="text-2xl font-black">Access Restricted</h2>
        <p className="text-base text-muted-foreground mt-3 max-w-xs">This page is for authorized reporters only.</p>
        <Button asChild className="mt-8 h-12 rounded-xl px-8"><Link href="/profile">Back to Profile</Link></Button>
      </div>
    );
  }

  if (profile.role === 'reporter' && profile.status !== 'approved') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center">
        <Clock className="w-14 h-14 text-blue-500 mb-6 animate-pulse" />
        <h2 className="text-2xl font-black">అప్రూవల్ పెండింగ్</h2>
        <p className="text-base text-muted-foreground mt-3 max-w-sm">మీ అకౌంట్ ఇంకా వెరిఫై చేయబడలేదు. అడ్మిన్ ఆమోదం పొందిన తర్వాత మీరు వార్తలను పంపవచ్చు.</p>
        <Button asChild variant="outline" className="mt-8 h-12 rounded-xl px-8"><Link href="/">Return Home</Link></Button>
      </div>
    );
  }

  const getCategoryIcon = (val: string) => {
    const iconName = availableCategories.find((c: any) => c.value === val)?.icon;
    switch(iconName) {
      case 'Home': return <HomeIcon className="w-4 h-4" />;
      case 'Flag': return <Flag className="w-4 h-4" />;
      case 'Globe': return <Globe className="w-4 h-4" />;
      case 'Wallet': return <Wallet className="w-4 h-4" />;
      case 'HeartPulse': return <HeartPulse className="w-4 h-4" />;
      case 'Film': return <Film className="w-4 h-4" />;
      case 'Trophy': return <Trophy className="w-4 h-4" />;
      case 'Cpu': return <Cpu className="w-4 h-4" />;
      default: return <Newspaper className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 pb-24 md:pt-20">
      <Navbar />
      <div className="max-w-4xl mx-auto px-5 pt-10 space-y-10">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="bg-primary/10 p-3 rounded-2xl">
              <Newspaper className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold font-headline tracking-tight">రిపోర్టర్ డ్యాష్‌బోర్డ్</h1>
              <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest mt-1">Reporter: {profile.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/guidelines">
              <Button variant="outline" size="sm" className="h-10 text-xs font-bold rounded-xl border-primary/20 px-4">
                <FileText className="w-4 h-4 mr-2" /> నిబంధనలు
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-8">
            <Card className="border-none shadow-xl rounded-[2.5rem] overflow-hidden bg-white">
              <CardHeader className="bg-primary/5 border-b border-primary/10 py-8 px-10">
                <CardTitle className="text-xl font-black flex items-center gap-3">
                  <Type className="w-6 h-6 text-primary" />
                  వార్తను రాయండి (Write News)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 md:p-10 space-y-8">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">రాష్ట్రం (State)</Label>
                    <Select onValueChange={(v) => { setState(v); setDistrict(""); setMandal(""); }} value={state}>
                      <SelectTrigger className="h-12 text-base rounded-xl"><SelectValue placeholder="State" /></SelectTrigger>
                      <SelectContent>{availableStates.sort().map(s => <SelectItem key={s} value={s} className="text-base">{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">జిల్లా (District)</Label>
                      <Select onValueChange={(v) => { setDistrict(v); setMandal(""); }} value={district} disabled={!state}>
                        <SelectTrigger className="h-12 text-base rounded-xl"><SelectValue placeholder="District" /></SelectTrigger>
                        <SelectContent>{state && availableLocations[state] && Object.keys(availableLocations[state]).sort().map(d => <SelectItem key={d} value={d} className="text-base">{d}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">మండలం (Mandal)</Label>
                      <Select onValueChange={setMandal} value={mandal} disabled={!district}>
                        <SelectTrigger className="h-12 text-base rounded-xl"><SelectValue placeholder="Mandal" /></SelectTrigger>
                        <SelectContent>{district && availableLocations[state]?.[district]?.map((m: string) => <SelectItem key={m} value={m} className="text-base">{m}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">సెక్షన్ (Category)</Label>
                  <Select onValueChange={setCategory} value={category}>
                    <SelectTrigger className="h-12 text-base rounded-xl">
                      <div className="flex items-center gap-3">{getCategoryIcon(category)}<SelectValue /></div>
                    </SelectTrigger>
                    <SelectContent>
                      {availableCategories.map((cat: any) => (
                        <SelectItem key={cat.value} value={cat.value} className="text-base">
                          <div className="flex items-center gap-3">
                            <span className="opacity-50">{cat.label}</span>
                            <span className="text-[10px] font-black uppercase tracking-tighter">({cat.value})</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">ముఖ్యాంశం (Headline)</Label>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 text-[10px] font-black text-primary uppercase gap-2"
                      onClick={handleAiHeadlines}
                      disabled={isGeneratingHeadlines}
                    >
                      {isGeneratingHeadlines ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                      Generate Catchy Headlines
                    </Button>
                  </div>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="వార్త ముఖ్యాంశం ఇక్కడ నమోదు చేయండి..." className="h-14 text-lg font-bold rounded-xl" />
                  
                  {aiHeadlines.length > 0 && (
                    <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 space-y-3 animate-in slide-in-from-top-2">
                      <p className="text-[10px] font-black text-primary uppercase mb-1">AI Suggested Headlines (Tap to use):</p>
                      <div className="flex flex-col gap-2">
                        {aiHeadlines.map((h, i) => (
                          <button key={i} onClick={() => setTitle(h)} className="text-sm text-left font-bold text-slate-700 hover:text-primary transition-colors p-2 rounded-lg hover:bg-white">
                            {h}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">వార్త వివరాలు (Content)</Label>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 text-[10px] font-black text-primary uppercase gap-2"
                      onClick={handleAiSummarize}
                      disabled={isSummarizing}
                    >
                      {isSummarizing ? <Loader2 className="w-3 h-3 animate-spin" /> : <FileText className="w-3 h-3" />}
                      Summarize Article
                    </Button>
                  </div>
                  <Textarea 
                    value={content} 
                    onChange={(e) => setContent(e.target.value)} 
                    placeholder="వార్త పూర్తి వివరాలు ఇక్కడ రాయండి..." 
                    className="min-h-[300px] text-base leading-relaxed rounded-xl p-5"
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b pb-2">
                    <Label className="text-xs font-black uppercase tracking-widest text-primary ml-1">మీడియా అప్‌లోడ్ (Media - Optional)</Label>
                    <Badge variant="secondary" className="text-[10px] font-bold uppercase bg-amber-50 text-amber-700 border-none">ఒకటి మాత్రమే (Any One)</Badge>
                  </div>
                  <p className="text-[10px] text-muted-foreground italic">మీరు కావాలనుకుంటే ఒక చిత్రం లేదా వీడియోను ఎంచుకోవచ్చు.</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-2">
                    {/* Image Upload Section */}
                    <div className={cn("space-y-3 transition-all", videoUrl && "opacity-40 pointer-events-none grayscale")}>
                      <Label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                        <ImageIcon className="w-3 h-3" />
                        చిత్రం (Image)
                      </Label>
                      {!imagePreview ? (
                        <div onClick={() => !videoUrl && fileInputRef.current?.click()} className="aspect-video border-2 border-dashed rounded-3xl flex flex-col items-center justify-center cursor-pointer hover:bg-primary/5 border-slate-200 transition-all group">
                          <Upload className="w-8 h-8 text-slate-400 group-hover:text-primary mb-3" />
                          <span className="text-sm font-bold text-slate-500">Upload Photo</span>
                        </div>
                      ) : (
                        <div className="relative aspect-video rounded-3xl overflow-hidden shadow-md group">
                          <Image src={imagePreview} alt="Preview" fill className="object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Button variant="destructive" size="icon" className="h-10 w-10 rounded-full" onClick={() => setImagePreview(null)}><X className="w-5 h-5" /></Button>
                          </div>
                        </div>
                      )}
                      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                    </div>

                    {/* Video Upload Section */}
                    <div className={cn("space-y-3 transition-all", imagePreview && "opacity-40 pointer-events-none grayscale")}>
                      <Label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                        <Video className="w-3 h-3 text-rose-500" />
                        వీడియో (Video)
                      </Label>
                      {!videoUrl ? (
                        <div onClick={() => !imagePreview && videoInputRef.current?.click()} className="aspect-video border-2 border-dashed rounded-3xl flex flex-col items-center justify-center cursor-pointer hover:bg-rose-50/50 border-slate-200 transition-all group">
                          <Video className="w-8 h-8 text-slate-400 group-hover:text-rose-500 mb-3" />
                          <span className="text-sm font-bold text-slate-500">Upload Clip</span>
                          <p className="text-[10px] text-muted-foreground mt-1">Max 10MB</p>
                        </div>
                      ) : (
                        <div className="relative aspect-video rounded-3xl overflow-hidden shadow-md bg-black">
                          <video src={videoUrl} className="w-full h-full object-contain" controls />
                          <Button variant="destructive" size="icon" className="absolute top-3 right-3 h-10 w-10 rounded-full z-10" onClick={() => setVideoUrl(null)}><X className="w-5 h-5" /></Button>
                        </div>
                      )}
                      <input type="file" ref={videoInputRef} className="hidden" accept="video/*" onChange={handleVideoChange} />
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t">
                  <Button className="w-full h-16 text-lg font-black rounded-2xl shadow-xl shadow-primary/20 transition-transform active:scale-95" onClick={handleSubmit} disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="animate-spin mr-3 w-5 h-5" /> : <Send className="mr-3 w-5 h-5" />}
                    రివ్యూ కోసం పంపండి (Submit for Review)
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar: Status & History */}
          <div className="space-y-8">
            <Card className="border-none shadow-lg rounded-[2rem] bg-white overflow-hidden">
              <CardHeader className="bg-slate-50 py-5 px-8 border-b">
                <CardTitle className="text-base font-black flex items-center gap-3">
                  <Clock className="w-5 h-5 text-primary" />
                  ఇటీవలి సబ్మిషన్స్
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-slate-50">
                  {recentSubmissions && recentSubmissions.length > 0 ? (
                    recentSubmissions.map((post) => (
                      <div key={post.id} className="p-5 hover:bg-slate-50/50 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                          <Badge variant="secondary" className={`text-[9px] font-black uppercase tracking-tighter border-none px-2 h-5 ${
                            post.status === 'approved' ? 'bg-emerald-50 text-emerald-700' :
                            post.status === 'rejected' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'
                          }`}>
                            {post.status}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground font-mono">ID: {post.unique_code}</span>
                        </div>
                        <h4 className="text-sm font-bold line-clamp-1 mb-1.5">{post.title}</h4>
                        <p className="text-[10px] text-muted-foreground flex items-center gap-1.5">
                          <MapPin className="w-3 h-3" /> {post.location.mandal} • 
                          {post.timestamp?.toDate ? post.timestamp.toDate().toLocaleDateString() : 'Just now'}
                        </p>
                        {post.status === 'rejected' && post.rejection_reason && (
                          <div className="mt-3 p-3 bg-rose-50 border border-rose-100 rounded-xl">
                            <p className="text-[10px] font-black text-rose-900 uppercase mb-1">Feedback:</p>
                            <p className="text-xs text-rose-800 italic leading-tight">{post.rejection_reason}</p>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-20 px-8 opacity-40">
                      <Clock className="w-10 h-10 mx-auto mb-3" />
                      <p className="text-sm italic">ఇంకా వార్తలు ఏవీ పంపలేదు.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg rounded-[2rem] bg-gradient-to-br from-indigo-600 to-blue-700 text-white p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Your Status</p>
                  <h3 className="text-base font-black">Sr. Reporter</h3>
                </div>
              </div>
              <div className="space-y-4">
                <div className="bg-white/10 p-4 rounded-xl border border-white/5">
                  <div className="flex justify-between text-xs mb-2">
                    <span className="font-bold opacity-80">Accuracy Rating</span>
                    <span className="font-black">4.8/5.0</span>
                  </div>
                  <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                    <div className="h-full bg-white w-[96%]" />
                  </div>
                </div>
                <p className="text-[10px] opacity-70 leading-relaxed italic">మీ వార్తల నాణ్యతను బట్టి మీ ర్యాంకింగ్ మరియు స్టార్ రేటింగ్ మెరుగుపడుతుంది.</p>
              </div>
            </Card>
          </div>
        </div>
        
        <Footer />
      </div>
    </div>
  );
}

export default function ReporterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-12 h-12 text-primary animate-spin" />
          <p className="text-lg font-medium text-slate-500">లోడ్ అవుతోంది...</p>
        </div>
      </div>
    }>
      <ReporterContent />
    </Suspense>
  );
}
