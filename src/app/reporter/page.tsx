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
import { Sparkles, Loader2, Send, Upload, X, FileText, Briefcase, MapPin, Star, Clock, CheckCircle2, AlertCircle, Wand2, Heart, MessageCircle, ChevronRight, Newspaper, Edit2, Save } from "lucide-react";
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
  
  // Edit State
  const [editingPost, setEditingPost] = useState<any>(null);
  const [isEditModalOpen, setIsEditOpen] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  // Fetch dynamic locations from Firestore
  const locDocRef = useMemoFirebase(() => firestore ? doc(firestore, 'metadata', 'locations') : null, [firestore]);
  const { data: locationsDoc } = useDoc(locDocRef);

  const availableLocations = useMemo(() => {
    if (!locationsDoc) return MOCK_LOCATIONS;
    const { id, ...statesOnly } = locationsDoc as any;
    return statesOnly;
  }, [locationsDoc]);

  const availableStates = Object.keys(availableLocations).length > 0 ? Object.keys(availableLocations) : MOCK_STATES;

  // Real-time branding for watermark
  const brandingRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'config', 'admin');
  }, [firestore]);
  const { data: branding } = useDoc(brandingRef);

  // Real-time user profile for status
  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user?.uid]);
  const { data: userProfile, isLoading: isProfileLoading } = useDoc(userDocRef);

  // Real-time news lists
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

  const globalApprovedQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'approved_news_posts'), limit(20));
  }, [firestore]);

  const { data: rawPendingNews } = useCollection(pendingNewsQuery);
  const { data: rawApprovedNews } = useCollection(approvedNewsQuery);
  const { data: rawGlobalNews, isLoading: isGlobalLoading } = useCollection<NewsPost>(globalApprovedQuery);

  // Client-side sorting
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

  const globalNews = useMemo(() => {
    if (!rawGlobalNews) return [];
    return [...rawGlobalNews].sort((a, b) => {
      const timeA = a.timestamp?.toDate ? a.timestamp.toDate().getTime() : 0;
      const timeB = b.timestamp?.toDate ? b.timestamp.toDate().getTime() : 0;
      return timeB - timeA;
    });
  }, [rawGlobalNews]);

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
    if (!content) {
      toast({ title: "ముందుగా వార్త రాయండి", description: "హెడ్‌లైన్స్ కోసం వార్త వివరాలు అవసరం.", variant: "destructive" });
      return;
    }
    setIsGeneratingAI(true);
    try {
      const result = await generateHeadlines({ articleContent: content });
      setAiHeadlines(result.headlines);
      toast({ title: "AI హెడ్‌లైన్స్ సిద్ధం!" });
    } catch (error) {
      toast({ title: "AI Error", description: "హెడ్‌లైన్స్ జనరేట్ చేయడం సాధ్యపడలేదు.", variant: "destructive" });
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
      toast({ title: "వార్త క్లుప్తీకరించబడింది (Summarized)" });
    } catch (error) {
      toast({ title: "AI Error", description: "సారాంశం జనరేట్ చేయడం సాధ్యపడలేదు.", variant: "destructive" });
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userProfile) {
      toast({ title: "Error", description: "Profile not loaded.", variant: "destructive" });
      return;
    }

    if (userProfile.status !== 'approved') {
      toast({ title: "Permission Denied", description: "మీ అకౌంట్ ఇంకా ఆమోదించబడలేదు.", variant: "destructive" });
      return;
    }

    if (!title || !content || !state || !district || !mandal || !imagePreview) {
      toast({ title: "Error", description: "అన్ని ఫీల్డ్‌లు తప్పనిసరి.", variant: "destructive" });
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
        author_name: userProfile.name || user?.displayName || "Reporter",
        engagement: { likes: 0, comments: 0, commentList: [] }
      };

      NewsService.add(firestore!, postData);

      toast({ title: "వార్తలు సమర్పించబడ్డాయి", description: "అడ్మిన్ ఆమోదం కోసం పంపబడింది." });
      setTitle(""); setContent(""); setState(""); setDistrict(""); setMandal(""); setImagePreview(null);
      setAiHeadlines([]);
      setActiveTab("portfolio");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEdit = (post: any) => {
    setEditingPost({ ...post });
    setIsEditOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!firestore || !editingPost) return;
    setIsSubmitting(true);
    try {
      await NewsService.update(firestore, editingPost.id, editingPost);
      setIsEditOpen(false);
      toast({ title: "వార్తలు నవీకరించబడ్డాయి", description: "మార్పులు విజయవంతంగా సేవ్ చేయబడ్డాయి." });
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "Could not save changes." });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isProfileLoading) {
    return (
      <main className="min-h-screen bg-background pt-20">
        <Navbar />
        <div className="flex justify-center items-center h-[60vh]">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
      </main>
    );
  }

  if (userProfile?.status === 'pending') {
    return (
      <main className="min-h-screen bg-background pt-20">
        <Navbar />
        <div className="max-w-xl mx-auto px-4 py-12 text-center space-y-6 animate-in fade-in duration-700">
          <div className="w-24 h-24 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Clock className="w-12 h-12 text-amber-600 animate-pulse" />
          </div>
          <h1 className="text-3xl font-bold font-headline">ప్రొఫైల్ ఆమోదం కోసం వేచి ఉంది</h1>
          <p className="text-muted-foreground text-lg">
            మీ రిపోర్టర్ ప్రొఫైల్ ప్రస్తుతం అడ్మిన్ పరిశీలనలో ఉంది. ఆమోదం పొందిన తర్వాత మీరు వార్తలను సమర్పించవచ్చు.
          </p>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col">
      <Navbar />
      <main className="flex-1 overflow-y-auto pt-20 pb-24 md:pb-8 scroll-smooth">
        <div className="max-w-4xl mx-auto px-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 bg-white p-1 rounded-2xl shadow-sm border border-muted">
              <TabsTrigger value="submit" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white h-11">
                <Pencil className="w-4 h-4 mr-2 hidden sm:inline" /> వార్త
              </TabsTrigger>
              <TabsTrigger value="portfolio" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white h-11">
                <Briefcase className="w-4 h-4 mr-2 hidden sm:inline" /> పోర్ట్‌ఫోలియో
              </TabsTrigger>
              <TabsTrigger value="feed" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white h-11">
                <Newspaper className="w-4 h-4 mr-2 hidden sm:inline" /> తాజా వార్తలు
              </TabsTrigger>
            </TabsList>

            <TabsContent value="submit" className="animate-in fade-in duration-500">
              <form onSubmit={handleSubmit}>
                <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
                  <CardHeader className="bg-primary/5 border-b border-primary/10">
                    <CardTitle className="text-xl font-bold font-headline">కొత్త వార్తను సమర్పించండి</CardTitle>
                    <CardDescription>మీ మండలం మరియు జిల్లా వార్తలను ఇక్కడ నమోదు చేయండి.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6 p-4 md:p-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase text-muted-foreground">రాష్ట్రం</Label>
                        <Select onValueChange={(v) => { setState(v); setDistrict(""); setMandal(""); }} value={state}>
                          <SelectTrigger className="rounded-xl h-12"><SelectValue placeholder="రాష్ట్రం" /></SelectTrigger>
                          <SelectContent>
                            {availableStates.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase text-muted-foreground">జిల్లా</Label>
                        <Select onValueChange={(v) => { setDistrict(v); setMandal(""); }} value={district} disabled={!state}>
                          <SelectTrigger className="rounded-xl h-12"><SelectValue placeholder="జిల్లా" /></SelectTrigger>
                          <SelectContent>
                            {state && availableLocations[state] && Object.keys(availableLocations[state]).sort().map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase text-muted-foreground">మండలం</Label>
                        <Select onValueChange={setMandal} value={mandal} disabled={!district}>
                          <SelectTrigger className="rounded-xl h-12"><SelectValue placeholder="మండలం" /></SelectTrigger>
                          <SelectContent>
                            {district && availableLocations[state]?.[district]?.map((m: string) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase text-muted-foreground">వార్త వివరాలు (Content)</Label>
                        <div className="relative">
                          <Textarea 
                            className="min-h-[200px] rounded-2xl p-4 text-base leading-relaxed border-muted focus:ring-primary" 
                            value={content} 
                            onChange={(e) => setContent(e.target.value)} 
                            placeholder="వార్త పూర్తి వివరాలు ఇక్కడ రాయండి..." 
                          />
                          <Button 
                            type="button"
                            variant="secondary" 
                            size="sm" 
                            className="absolute bottom-4 right-4 gap-2 rounded-full bg-accent/10 text-accent hover:bg-accent/20"
                            onClick={handleAiSummarize}
                            disabled={isGeneratingAI || !content}
                          >
                            {isGeneratingAI ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
                            AI సారాంశం
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase text-muted-foreground">ముఖ్యాంశం (Headline)</Label>
                        <div className="flex gap-2">
                          <Input 
                            value={title} 
                            onChange={(e) => setTitle(e.target.value)} 
                            placeholder="వార్త ముఖ్యాంశం..." 
                            className="h-12 rounded-xl font-bold text-lg"
                          />
                          <Button 
                            type="button"
                            variant="outline" 
                            className="h-12 rounded-xl gap-2 border-primary/20 text-primary hover:bg-primary/5"
                            onClick={handleAiHeadlines}
                            disabled={isGeneratingAI || !content}
                          >
                            {isGeneratingAI ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                            AI
                          </Button>
                        </div>
                        {aiHeadlines.length > 0 && (
                          <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 space-y-2 animate-in slide-in-from-top-2">
                            <p className="text-[10px] font-bold uppercase text-primary mb-2">AI సూచించిన ముఖ్యాంశాలు:</p>
                            <div className="flex flex-wrap gap-2">
                              {aiHeadlines.map((h, i) => (
                                <Badge 
                                  key={i} 
                                  variant="secondary" 
                                  className="cursor-pointer hover:bg-primary hover:text-white transition-colors py-1.5 px-3 rounded-lg"
                                  onClick={() => setTitle(h)}
                                >
                                  {h}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase text-muted-foreground">చిత్రం (Image)</Label>
                      {!imagePreview ? (
                        <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer hover:bg-muted/50 transition-colors border-muted group">
                          <Upload className="w-10 h-10 mx-auto mb-3 text-muted-foreground group-hover:text-primary transition-colors" />
                          <p className="text-sm font-bold">చిత్రాన్ని అప్‌లోడ్ చేయండి</p>
                          <p className="text-xs text-muted-foreground mt-1">JPG/JPEG మాత్రమే (Max 1MB)</p>
                        </div>
                      ) : (
                        <div className="relative aspect-video rounded-2xl overflow-hidden shadow-lg group">
                          <Image src={imagePreview} alt="Preview" fill className="object-cover" />
                          <Button 
                            type="button"
                            variant="destructive" 
                            size="icon" 
                            className="absolute top-4 right-4 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" 
                            onClick={() => setImagePreview(null)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                      <input type="file" ref={fileInputRef} className="hidden" accept=".jpg,.jpeg" onChange={(e) => handleFileChange(e, 'submit')} />
                    </div>

                    <Button type="submit" className="w-full h-14 text-xl font-bold shadow-lg shadow-primary/20 rounded-2xl" disabled={isSubmitting}>
                      {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : <Send className="mr-2 h-5 w-5" />}
                      సమర్పించు
                    </Button>
                  </CardContent>
                </Card>
              </form>
            </TabsContent>

            <TabsContent value="portfolio" className="space-y-8">
              <div className="grid grid-cols-2 gap-4">
                <Card className="border-none shadow-md bg-white rounded-2xl p-4 text-center">
                  <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">పరిశీలనలో</p>
                  <h3 className="text-3xl font-bold text-amber-500 mt-1">{pendingNews.length}</h3>
                </Card>
                <Card className="border-none shadow-md bg-white rounded-2xl p-4 text-center">
                  <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">ప్రచురించబడినవి</p>
                  <h3 className="text-3xl font-bold text-emerald-500 mt-1">{approvedNews.length}</h3>
                </Card>
              </div>

              <div className="space-y-6">
                <h2 className="text-xl font-bold font-headline px-2">నా వార్తా ప్రస్థానం</h2>

                {pendingNews.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold uppercase text-muted-foreground tracking-widest flex items-center gap-2 px-2">
                      <Clock className="w-3.5 h-3.5" />
                      ఎడిటోరియల్ స్టేజ్
                    </h3>
                    {pendingNews.map((post) => (
                      <PortfolioCard key={post.id} post={post as any} onEdit={() => handleOpenEdit(post)} />
                    ))}
                  </div>
                )}

                {approvedNews.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold uppercase text-emerald-600 tracking-widest flex items-center gap-2 px-2">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      లైవ్ వార్తలు
                    </h3>
                    {approvedNews.map((post) => (
                      <PortfolioCard key={post.id} post={post as any} isPublished />
                    ))}
                  </div>
                )}

                {pendingNews.length === 0 && approvedNews.length === 0 && (
                  <div className="text-center py-24 bg-white rounded-3xl border-2 border-dashed border-muted">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                      <FileText className="w-10 h-10 text-muted-foreground/20" />
                    </div>
                    <h3 className="text-lg font-bold">వార్తలు ఏవీ లేవు</h3>
                    <p className="text-muted-foreground">మీరు ఇంకా ఎటువంటి వార్తలను సమర్పించలేదు.</p>
                    <Button variant="link" className="mt-2" onClick={() => setActiveTab("submit")}>మొదటి వార్త రాయండి</Button>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="feed" className="space-y-6">
               <div className="flex items-center justify-between px-2">
                  <div>
                    <h2 className="text-xl font-bold font-headline">తాజా వార్తలు</h2>
                    <p className="text-sm text-muted-foreground">అన్ని ప్రాంతాల నుండి తాజా అప్‌డేట్‌లు.</p>
                  </div>
                  <Badge variant="outline" className="bg-white">{globalNews.length} Posts</Badge>
               </div>

               <div className="grid gap-6">
                 {isGlobalLoading ? (
                   <div className="py-20 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" /></div>
                 ) : globalNews.length > 0 ? (
                   globalNews.map((post) => (
                     <PortfolioCard key={post.id} post={post as any} isPublished />
                   ))
                 ) : (
                   <div className="text-center py-24 bg-white rounded-3xl border border-muted">
                     <p className="text-muted-foreground italic">తాజా వార్తలు ఏవీ లేవు.</p>
                   </div>
                 )}
               </div>
            </TabsContent>
          </Tabs>
          <Footer />
        </div>
      </main>

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl p-0">
          <DialogHeader className="p-6 bg-slate-50 border-b">
            <DialogTitle className="text-2xl font-bold">వార్తను సవరించండి</DialogTitle>
          </DialogHeader>
          
          {editingPost && (
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>రాష్ట్రం</Label>
                  <Select 
                    value={editingPost.location.state} 
                    onValueChange={(val) => setEditingPost({
                      ...editingPost, 
                      location: { ...editingPost.location, state: val, district: "", mandal: "" }
                    })}
                  >
                    <SelectTrigger className="rounded-xl h-11"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {availableStates.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>జిల్లా</Label>
                  <Select 
                    value={editingPost.location.district} 
                    onValueChange={(val) => setEditingPost({
                      ...editingPost, 
                      location: { ...editingPost.location, district: val, mandal: "" }
                    })}
                    disabled={!editingPost.location.state}
                  >
                    <SelectTrigger className="rounded-xl h-11"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {editingPost.location.state && availableLocations[editingPost.location.state] && 
                        Object.keys(availableLocations[editingPost.location.state]).sort().map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>మండలం</Label>
                  <Select 
                    value={editingPost.location.mandal} 
                    onValueChange={(val) => setEditingPost({
                      ...editingPost, 
                      location: { ...editingPost.location, mandal: val }
                    })}
                    disabled={!editingPost.location.district}
                  >
                    <SelectTrigger className="rounded-xl h-11"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {editingPost.location.district && availableLocations[editingPost.location.state]?.[editingPost.location.district]?.map((m: string) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>ముఖ్యాంశం (Headline)</Label>
                <Input 
                  value={editingPost.title} 
                  onChange={(e) => setEditingPost({ ...editingPost, title: e.target.value })}
                  className="rounded-xl h-11 font-bold"
                />
              </div>

              <div className="space-y-2">
                <Label>వార్త వివరాలు (Content)</Label>
                <Textarea 
                  value={editingPost.content} 
                  onChange={(e) => setEditingPost({ ...editingPost, content: e.target.value })}
                  className="min-h-[200px] rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label>చిత్రం (Image)</Label>
                <div className="relative aspect-video rounded-2xl overflow-hidden shadow-md group">
                  <Image src={editingPost.image_url} alt="Edit Preview" fill className="object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button variant="secondary" className="rounded-full" onClick={() => editFileInputRef.current?.click()}>
                      మార్చండి
                    </Button>
                  </div>
                </div>
                <input 
                  type="file" 
                  ref={editFileInputRef} 
                  className="hidden" 
                  accept=".jpg,.jpeg" 
                  onChange={(e) => handleFileChange(e, 'edit')} 
                />
              </div>
            </div>
          )}

          <DialogFooter className="p-6 bg-slate-50 border-t">
            <Button variant="outline" className="rounded-xl" onClick={() => setIsEditOpen(false)}>రద్దు</Button>
            <Button className="rounded-xl px-8" onClick={handleSaveEdit} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2 h-4 w-4" />}
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
    <Card className="overflow-hidden border-none shadow-md hover:shadow-xl transition-all rounded-3xl bg-white group">
      <div className="flex flex-col sm:flex-row">
        <div className="relative w-full sm:w-64 h-48 shrink-0">
          <Image src={post.image_url} alt={post.title} fill className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <div className="absolute bottom-4 left-4 flex gap-2">
            <Badge className={cn("rounded-full border-none px-3 py-1 text-[10px] font-bold uppercase", config.color)}>
              <config.icon className="w-3 h-3 mr-1" />
              {config.label}
            </Badge>
          </div>
        </div>
        <div className="p-6 flex-1 flex flex-col justify-between min-w-0">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-mono font-bold text-primary/60 uppercase tracking-tighter bg-primary/5 px-2 py-0.5 rounded">
                CODE: {post.unique_code}
              </span>
              <span className="text-[10px] text-muted-foreground font-medium">
                {post.timestamp?.toDate ? post.timestamp.toDate().toLocaleDateString('te-IN', { month: 'short', day: 'numeric', year: 'numeric' }) : "Just now"}
              </span>
            </div>
            
            <div>
              <h3 className="font-bold text-xl line-clamp-1 group-hover:text-primary transition-colors leading-snug">
                {post.title}
              </h3>
              <p className="text-sm text-muted-foreground mt-2 line-clamp-2 leading-relaxed">
                {post.content}
              </p>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between border-t pt-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <Heart className={cn("w-4 h-4", isPublished ? "text-rose-500 fill-rose-500" : "text-muted-foreground/40")} />
                <span className="text-xs font-bold text-slate-700">{post.likes || 0}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <MessageCircle className={cn("w-4 h-4", isPublished ? "text-primary fill-primary/10" : "text-muted-foreground/40")} />
                <span className="text-xs font-bold text-slate-700">{post.commentsCount || 0}</span>
              </div>
              <div className="flex items-center gap-1.5 ml-2 border-l pl-4 hidden xs:flex">
                <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-[11px] font-bold text-muted-foreground">{post.location.mandal}</span>
              </div>
            </div>

            <div className="flex gap-2">
              {post.status === 'pending' && onEdit && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 gap-1.5 text-xs font-bold text-amber-600 hover:bg-amber-50 rounded-full"
                  onClick={onEdit}
                >
                  <Edit2 className="w-3 h-3" />
                  సవరించండి
                </Button>
              )}
              {isPublished && (
                <Link href={`/?postId=${post.id}`}>
                  <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs font-bold text-primary hover:bg-primary/5 rounded-full">
                    View Live
                    <ChevronRight className="w-3 h-3" />
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

function Pencil(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
      <path d="m15 5 4 4" />
    </svg>
  );
}
