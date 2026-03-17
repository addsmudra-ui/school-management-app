
'use client';

import { useState, useRef, useMemo, useEffect } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { STATES as MOCK_STATES, LOCATIONS_BY_STATE as MOCK_LOCATIONS, NewsPost } from "@/lib/mock-data";
import { NewsService } from "@/lib/storage";
import { Sparkles, Loader2, Send, Upload, X, FileText, Briefcase, MapPin, Star, Clock, CheckCircle2, AlertCircle, Wand2, Heart, MessageCircle, ChevronRight, Newspaper, Edit2, Save, Pencil } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useFirestore, useUser, useCollection, useDoc, useMemoFirebase } from "@/firebase";
import { collection, query, where, doc, limit } from "firebase/firestore";
import { generateHeadlines } from "@/ai/flows/reporter-ai-headline-generation";
import { summarizeArticleForReporter } from "@/ai/flows/reporter-ai-content-summarization";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { addWatermark } from "@/lib/watermark";

export default function ReporterPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState("submit");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [state, setState] = useState("");
  const [district, setDistrict] = useState("");
  const [mandal, setMandal] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiHeadlines, setAiHeadlines] = useState<string[]>([]);
  
  const [editingPost, setEditingPost] = useState<any>(null);
  const [isEditModalOpen, setIsEditOpen] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  const locDocRef = useMemoFirebase(() => firestore ? doc(firestore, 'metadata', 'locations') : null, [firestore]);
  const { data: locationsDoc } = useDoc(locDocRef);

  const availableLocations = useMemo(() => {
    if (!locationsDoc) return MOCK_LOCATIONS;
    const { id, ...statesOnly } = locationsDoc as any;
    return statesOnly;
  }, [locationsDoc]);

  const availableStates = Object.keys(availableLocations).length > 0 ? Object.keys(availableLocations) : MOCK_STATES;

  const brandingRef = useMemoFirebase(() => firestore ? doc(firestore, 'config', 'admin') : null, [firestore]);
  const { data: branding } = useDoc(brandingRef);

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user?.uid]);
  const { data: userProfile, isLoading: isProfileLoading } = useDoc(userDocRef);

  const pendingNewsQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return query(
      collection(firestore, 'pending_news_posts'),
      where('author_id', '==', user.uid)
    );
  }, [firestore, user?.uid]);

  const approvedNewsQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return query(
      collection(firestore, 'approved_news_posts'),
      where('author_id', '==', user.uid)
    );
  }, [firestore, user?.uid]);

  const { data: rawPendingNews } = useCollection(pendingNewsQuery);
  const { data: rawApprovedNews } = useCollection(approvedNewsQuery);

  const pendingNews = useMemo(() => {
    if (!rawPendingNews) return [];
    return [...rawPendingNews].sort((a, b) => {
      const timeA = a.timestamp?.toDate ? a.timestamp.toDate().getTime() : 0;
      const timeB = b.timestamp?.toDate ? b.timestamp.toDate().getTime() : 0;
      return timeB - timeA;
    });
  }, [rawPendingNews]);

  const approvedNews = useMemo(() => {
    if (!rawApprovedNews) return [];
    return [...rawApprovedNews].sort((a, b) => {
      const timeA = a.timestamp?.toDate ? a.timestamp.toDate().getTime() : 0;
      const timeB = b.timestamp?.toDate ? b.timestamp.toDate().getTime() : 0;
      return timeB - timeA;
    });
  }, [rawApprovedNews]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, target: 'submit' | 'edit') => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      const appName = branding?.appName || "News Pulse";
      const logo = branding?.appLogo;
      const watermarked = await addWatermark(base64, appName, logo);
      
      if (target === 'submit') setImagePreview(watermarked);
      else setEditingPost({ ...editingPost, image_url: watermarked });
    };
    reader.readAsDataURL(file);
  };

  const handleAiHeadlines = async () => {
    if (!content) return;
    setIsGeneratingAI(true);
    try {
      const result = await generateHeadlines({ articleContent: content });
      setAiHeadlines(result.headlines);
    } catch (error) {
      toast({ title: "AI Error", variant: "destructive" });
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleAiSummarize = async () => {
    if (!content) return;
    setIsGeneratingAI(true);
    try {
      const result = await summarizeArticleForReporter({ detailedArticle: content });
      setContent(result.summary);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile || userProfile.status !== 'approved' || !title || !content || !state || !district || !mandal || !imagePreview) {
      toast({ title: "Validation Error", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      const postData = {
        unique_code: Math.floor(10000 + Math.random() * 90000).toString(),
        title,
        content,
        image_url: imagePreview,
        location: { state, district, mandal },
        status: 'pending' as const,
        author_id: user?.uid || "",
        author_name: userProfile.name || "Reporter",
        engagement: { likes: 0, comments: 0, commentList: [] }
      };
      NewsService.add(firestore!, postData);
      toast({ title: "సమర్పించబడింది", description: "అడ్మిన్ ఆమోదం కోసం వేచి ఉండండి." });
      setTitle(""); setContent(""); setState(""); setDistrict(""); setMandal(""); setImagePreview(null);
      setActiveTab("portfolio");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!firestore || !editingPost) return;
    setIsSubmitting(true);
    try {
      await NewsService.update(firestore, editingPost.id, { ...editingPost, status: 'pending' });
      setIsEditOpen(false);
      toast({ title: "నవీకరించబడింది", description: "మార్పులు మళ్ళీ సమీక్ష కోసం పంపబడ్డాయి." });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isProfileLoading) {
    return <main className="pt-20 text-center"><Loader2 className="animate-spin mx-auto" /></main>;
  }

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col">
      <Navbar />
      <main className="flex-1 pt-20 pb-24 px-4 max-w-4xl mx-auto w-full">
        {/* Reporter Profile Header Card */}
        {userProfile && (
          <Card className="border-none shadow-xl rounded-3xl overflow-hidden bg-white mb-6 border-b-4 border-cyan-500/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-5">
                {/* Photo and Name are clearly separate elements in a row */}
                <div className="relative w-16 h-16 rounded-2xl bg-cyan-50 flex items-center justify-center text-cyan-600 text-xl font-bold shadow-sm border-2 border-white overflow-hidden shrink-0">
                  {userProfile.photo ? (
                    <Image src={userProfile.photo} alt={userProfile.name} fill className="object-cover" />
                  ) : (
                    userProfile.name?.[0] || 'R'
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-2xl font-black text-slate-900 truncate leading-none mb-1.5">{userProfile.name}</h2>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className="bg-cyan-50 text-cyan-700 border-cyan-100 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-tighter">
                      {userProfile.role}
                    </Badge>
                    {userProfile.author_stars && (
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: userProfile.author_stars }).map((_, i) => (
                          <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <Button variant="outline" size="sm" asChild className="rounded-xl h-10 px-4 font-bold text-xs gap-1.5 border-slate-200">
                  <Link href="/profile">
                    <Edit2 className="w-3 h-3 text-cyan-600" />
                    Profile
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-2 bg-white rounded-2xl border p-1 h-12 shadow-sm">
            <TabsTrigger value="submit" className="rounded-xl"><Pencil className="w-4 h-4 mr-2" /> వార్త రాయండి</TabsTrigger>
            <TabsTrigger value="portfolio" className="rounded-xl"><Briefcase className="w-4 h-4 mr-2" /> నా వార్తలు</TabsTrigger>
          </TabsList>

          <TabsContent value="submit" className="animate-in fade-in duration-500">
            <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
              <CardHeader className="bg-primary/5 border-b py-8">
                <CardTitle className="text-2xl font-bold font-headline">వార్తను సమర్పించండి</CardTitle>
                <CardDescription>స్థానిక వార్తలను ప్రజలకు తెలియజేయండి.</CardDescription>
              </CardHeader>
              <CardContent className="p-6 md:p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Select onValueChange={(v) => { setState(v); setDistrict(""); setMandal(""); }} value={state}>
                    <SelectTrigger className="h-12 rounded-xl"><SelectValue placeholder="రాష్ట్రం" /></SelectTrigger>
                    <SelectContent>{availableStates.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                  <Select onValueChange={(v) => { setDistrict(v); setMandal(""); }} value={district} disabled={!state}>
                    <SelectTrigger className="h-12 rounded-xl"><SelectValue placeholder="జిల్లా" /></SelectTrigger>
                    <SelectContent>
                      {state && availableLocations[state] && Object.keys(availableLocations[state]).map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Select onValueChange={setMandal} value={mandal} disabled={!district}>
                    <SelectTrigger className="h-12 rounded-xl"><SelectValue placeholder="మండలం" /></SelectTrigger>
                    <SelectContent>
                      {district && availableLocations[state]?.[district]?.map((m: string) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4">
                  <div className="relative">
                    <Textarea 
                      className="min-h-[250px] rounded-2xl p-6 text-lg border-muted focus:ring-primary" 
                      value={content} 
                      onChange={(e) => setContent(e.target.value)} 
                      placeholder="వార్త పూర్తి వివరాలు..." 
                    />
                    <Button 
                      type="button"
                      variant="secondary" 
                      className="absolute bottom-4 right-4 rounded-full gap-2"
                      onClick={handleAiSummarize}
                      disabled={isGeneratingAI || !content}
                    >
                      {isGeneratingAI ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                      AI సారాంశం
                    </Button>
                  </div>

                  <div className="flex gap-3">
                    <Input 
                      value={title} 
                      onChange={(e) => setTitle(e.target.value)} 
                      placeholder="ముఖ్యాంశం (Headline)..." 
                      className="h-14 rounded-xl font-bold text-xl"
                    />
                    <Button 
                      type="button"
                      variant="outline" 
                      className="h-14 rounded-xl px-6"
                      onClick={handleAiHeadlines}
                      disabled={isGeneratingAI || !content}
                    >
                      {isGeneratingAI ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  {!imagePreview ? (
                    <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed rounded-3xl p-16 text-center cursor-pointer hover:bg-muted/50 border-muted group">
                      <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      <p className="font-bold text-lg">చిత్రాన్ని అప్‌లోడ్ చేయండి</p>
                    </div>
                  ) : (
                    <div className="relative aspect-video rounded-3xl overflow-hidden shadow-lg group">
                      <Image src={imagePreview} alt="Preview" fill className="object-cover" />
                      <Button 
                        variant="destructive" 
                        size="icon" 
                        className="absolute top-4 right-4 rounded-full" 
                        onClick={() => setImagePreview(null)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                  <input type="file" ref={fileInputRef} className="hidden" accept=".jpg,.jpeg" onChange={(e) => handleFileChange(e, 'submit')} />
                </div>

                <Button className="w-full h-16 text-2xl font-bold rounded-2xl shadow-xl" onClick={handleSubmit} disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : <Send className="mr-2" />}
                  సమర్పించు
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="portfolio" className="space-y-8">
            <div className="grid gap-6">
              {pendingNews.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    పరిశీలనలో (Reviewing)
                  </h3>
                  {pendingNews.map(post => <PortfolioCard key={post.id} post={post} onEdit={() => { setEditingPost({...post}); setIsEditOpen(true); }} />)}
                </div>
              )}
              {approvedNews.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-sm font-black uppercase tracking-widest text-emerald-600 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    ప్రచురించబడినవి (Live)
                  </h3>
                  {approvedNews.map(post => <PortfolioCard key={post.id} post={post} isPublished />)}
                </div>
              )}
              {pendingNews.length === 0 && approvedNews.length === 0 && (
                <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-muted">
                  <FileText className="w-12 h-12 mx-auto opacity-20 mb-4" />
                  <p className="text-muted-foreground">మీరు ఇంకా ఎటువంటి వార్తలను సమర్పించలేదు.</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
        <Footer />
      </main>

      <Dialog open={isEditModalOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-3xl rounded-3xl p-0 overflow-hidden">
          <DialogHeader className="p-6 bg-slate-50 border-b">
            <DialogTitle className="text-2xl font-bold">వార్తను సవరించండి</DialogTitle>
          </DialogHeader>
          <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
            {editingPost && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Select value={editingPost.location.state} onValueChange={v => setEditingPost({...editingPost, location: {...editingPost.location, state: v}})}>
                    <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>{availableStates.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                  <Select value={editingPost.location.district} onValueChange={v => setEditingPost({...editingPost, location: {...editingPost.location, district: v}})}>
                    <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>{editingPost.location.state && Object.keys(availableLocations[editingPost.location.state] || {}).map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                  </Select>
                  <Select value={editingPost.location.mandal} onValueChange={v => setEditingPost({...editingPost, location: {...editingPost.location, mandal: v}})}>
                    <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>{editingPost.location.district && (availableLocations[editingPost.location.state]?.[editingPost.location.district] as string[])?.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <Input value={editingPost.title} onChange={e => setEditingPost({...editingPost, title: e.target.value})} className="h-12 rounded-xl font-bold" />
                <Textarea value={editingPost.content} onChange={e => setEditingPost({...editingPost, content: e.target.value})} className="min-h-[200px] rounded-xl" />
              </>
            )}
          </div>
          <DialogFooter className="p-6 bg-slate-50 border-t">
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>రద్దు</Button>
            <Button className="px-8 font-bold" onClick={handleSaveEdit} disabled={isSubmitting}>
              సేవ్ చేయండి
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PortfolioCard({ post, isPublished, onEdit }: { post: any, isPublished?: boolean, onEdit?: () => void }) {
  const statusConfig = {
    pending: { color: "bg-amber-50 text-amber-700", icon: Clock, label: "పరిశీలనలో" },
    approved: { color: "bg-emerald-50 text-emerald-700", icon: CheckCircle2, label: "ప్రచురించబడింది" },
    rejected: { color: "bg-rose-50 text-rose-700", icon: AlertCircle, label: "తిరస్కరించబడింది" }
  };

  const config = statusConfig[post.status as keyof typeof statusConfig] || statusConfig.pending;

  return (
    <Card className="overflow-hidden border-none shadow-md rounded-3xl bg-white group">
      <div className="flex flex-col sm:flex-row">
        <div className="relative w-full sm:w-48 h-40 shrink-0">
          <Image src={post.image_url} alt={post.title} fill className="object-cover" />
          <div className="absolute top-2 left-2">
            <Badge className={cn("rounded-full border-none px-2 py-0.5 text-[9px] font-bold uppercase shadow-lg", config.color)}>
              <config.icon className="w-2.5 h-2.5 mr-1" />
              {config.label}
            </Badge>
          </div>
        </div>
        <div className="p-5 flex-1 min-w-0">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[9px] font-mono font-bold bg-muted px-2 py-0.5 rounded">ID: {post.unique_code}</span>
            <span className="text-[10px] text-muted-foreground">{post.timestamp?.toDate ? post.timestamp.toDate().toLocaleDateString() : "Today"}</span>
          </div>
          <h3 className="font-bold text-lg line-clamp-1 mb-1">{post.title}</h3>
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed mb-4">{post.content}</p>
          
          {post.status === 'rejected' && post.rejection_reason && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-100 rounded-xl">
              <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-1">తిరస్కరణ కారణం (Reason):</p>
              <p className="text-xs font-bold text-rose-800">{post.rejection_reason}</p>
            </div>
          )}

          <div className="flex justify-between items-center border-t pt-3">
            <div className="flex gap-3 text-muted-foreground">
              <span className="text-[10px] font-bold flex items-center gap-1"><Heart className="w-3 h-3" /> {post.likes || 0}</span>
              <span className="text-[10px] font-bold flex items-center gap-1"><MessageCircle className="w-3 h-3" /> {post.commentsCount || 0}</span>
            </div>
            <div className="flex gap-2">
              {(post.status === 'pending' || post.status === 'rejected') && onEdit && (
                <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs font-bold text-primary rounded-full hover:bg-primary/5" onClick={onEdit}>
                  <Edit2 className="w-3 h-3" /> సవరించండి
                </Button>
              )}
              {isPublished && (
                <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs font-bold text-primary rounded-full" asChild>
                  <Link href={`/?postId=${post.id}`}>View Live</Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
