
"use client";

import { useState, useRef, useEffect } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { STATES, LOCATIONS_BY_STATE, NewsPost } from "@/lib/mock-data";
import { NewsService } from "@/lib/storage";
import { Sparkles, Loader2, Send, Upload, X, FileText, Briefcase, Pencil, Trash2, Star } from "lucide-react";
import Image from "next/image";

export default function ReporterPage() {
  const [activeTab, setActiveTab] = useState("submit");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [state, setState] = useState("");
  const [district, setDistrict] = useState("");
  const [mandal, setMandal] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [myNews, setMyNews] = useState<NewsPost[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    const loadMyNews = () => {
      // For demo purposes, we're considering REP001 as the current user
      const allNews = NewsService.getAll();
      setMyNews(allNews.filter(n => n.author_id === "REP001" || n.author_id === "NEW_REP"));
    };

    loadMyNews();
    window.addEventListener('mandalPulse_newsChanged', loadMyNews);
    return () => window.removeEventListener('mandalPulse_newsChanged', loadMyNews);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleEdit = (post: NewsPost) => {
    setEditingId(post.id);
    setTitle(post.title);
    setContent(post.content);
    setState(post.location.state);
    setDistrict(post.location.district);
    setMandal(post.location.mandal);
    setImagePreview(post.image_url);
    setActiveTab("submit");
  };

  const handleDelete = (id: string) => {
    NewsService.delete(id);
    toast({ title: "వార్త తొలగించబడింది", variant: "destructive" });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content || !state || !district || !mandal || !imagePreview) {
      toast({ title: "Error", description: "అన్ని ఫీల్డ్‌లు తప్పనిసరి.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    
    setTimeout(() => {
      const post: NewsPost = {
        id: editingId || Date.now().toString(),
        unique_code: editingId ? (myNews.find(n => n.id === editingId)?.unique_code || "00000") : Math.floor(10000 + Math.random() * 90000).toString(),
        title,
        content,
        image_url: imagePreview,
        location: { state, district, mandal },
        status: 'pending',
        author_id: "REP001",
        author_name: localStorage.getItem('mandalPulse_userName') || "రాహుల్ కుమార్",
        timestamp: new Date().toISOString(),
        engagement: { likes: 0, comments: 0, commentList: [] }
      };

      if (editingId) {
        NewsService.update(editingId, post);
      } else {
        NewsService.add(post);
      }

      setIsSubmitting(false);
      toast({ title: editingId ? "వార్తలు నవీకరించబడ్డాయి" : "వార్తలు సమర్పించబడ్డాయి" });
      
      setEditingId(null);
      setTitle("");
      setContent("");
      setState("");
      setDistrict("");
      setMandal("");
      setImagePreview(null);
    }, 1000);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved': return <Badge className="bg-emerald-500">Approved (Success)</Badge>;
      case 'rejected': return <Badge variant="destructive">Rejected</Badge>;
      default: return <Badge variant="secondary" className="bg-amber-100 text-amber-700">Pending Review</Badge>;
    }
  };

  return (
    <main className="min-h-screen bg-background pt-20 pb-24 md:pb-8">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 bg-white shadow-sm h-14 p-1 rounded-xl">
            <TabsTrigger value="submit" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white">
              <FileText className="w-4 h-4 mr-2" />
              వార్తను పంపండి
            </TabsTrigger>
            <TabsTrigger value="portfolio" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white">
              <Briefcase className="w-4 h-4 mr-2" />
              నా పోర్ట్‌ఫోలియో
            </TabsTrigger>
          </TabsList>

          <TabsContent value="submit" className="animate-in fade-in duration-500">
            <Card className="shadow-lg border-none">
              <CardHeader className="bg-primary/5 rounded-t-lg">
                <CardTitle className="text-2xl font-headline text-primary">
                  {editingId ? "వార్తను నవీకరించండి" : "వార్తను సమర్పించండి"}
                </CardTitle>
                <CardDescription>స్థానిక సంఘటన వివరాలను నమోదు చేయండి.</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>రాష్ట్రం</Label>
                    <Select onValueChange={(v) => { setState(v); setDistrict(""); setMandal(""); }} value={state}>
                      <SelectTrigger><SelectValue placeholder="రాష్ట్రం" /></SelectTrigger>
                      <SelectContent>{STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>జిల్లా</Label>
                    <Select onValueChange={(v) => { setDistrict(v); setMandal(""); }} value={district} disabled={!state}>
                      <SelectTrigger><SelectValue placeholder="జిల్లా" /></SelectTrigger>
                      <SelectContent>
                        {state && Object.keys(LOCATIONS_BY_STATE[state]).map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>మండలం</Label>
                    <Select onValueChange={setMandal} value={mandal} disabled={!district}>
                      <SelectTrigger><SelectValue placeholder="మండలం" /></SelectTrigger>
                      <SelectContent>
                        {district && LOCATIONS_BY_STATE[state][district].map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>వార్త ముఖ్యాంశం</Label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="ముఖ్యాంశం" />
                </div>

                <div className="space-y-2">
                  <Label>వార్త వివరాలు</Label>
                  <Textarea className="min-h-[150px]" value={content} onChange={(e) => setContent(e.target.value)} placeholder="వివరంగా రాయండి..." />
                </div>

                <div className="space-y-2">
                  <Label>చిత్రం</Label>
                  {!imagePreview ? (
                    <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed rounded-lg p-10 text-center cursor-pointer hover:bg-muted/50">
                      <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm">JPG/JPEG మాత్రమే (Max 1MB)</p>
                    </div>
                  ) : (
                    <div className="relative aspect-video rounded-lg overflow-hidden group">
                      <Image src={imagePreview} alt="Preview" fill className="object-cover" />
                      <Button variant="destructive" size="icon" className="absolute top-2 right-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => setImagePreview(null)}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                  <input type="file" ref={fileInputRef} className="hidden" accept=".jpg,.jpeg" onChange={handleFileChange} />
                </div>

                <div className="flex gap-3">
                  {editingId && (
                    <Button variant="outline" className="flex-1" onClick={() => { setEditingId(null); setTitle(""); setContent(""); setImagePreview(null); }}>రద్దు చేయి</Button>
                  )}
                  <Button className="flex-1 h-12 text-lg" onClick={handleSubmit} disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : <Send className="mr-2 h-4 w-4" />}
                    {editingId ? "నవీకరించు" : "సమర్పించు"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="portfolio" className="animate-in fade-in duration-500">
            <div className="grid gap-4">
              {myNews.length > 0 ? (
                myNews.map((post) => (
                  <Card key={post.id} className="overflow-hidden border-none shadow-md">
                    <div className="flex flex-col sm:flex-row">
                      <div className="relative w-full sm:w-48 h-32">
                        <Image src={post.image_url} alt={post.title} fill className="object-cover" />
                      </div>
                      <div className="p-4 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-[10px] font-mono text-muted-foreground uppercase">CODE: {post.unique_code}</span>
                            {getStatusBadge(post.status)}
                          </div>
                          <h3 className="font-bold text-lg line-clamp-1">{post.title}</h3>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <p className="text-xs text-muted-foreground">
                              {post.location.mandal}, {post.location.district} • {new Date(post.timestamp).toLocaleDateString()}
                            </p>
                            {post.author_role && (
                              <Badge variant="outline" className="text-[10px] h-4 py-0 px-1 border-primary/30 text-primary">
                                {post.author_role}
                              </Badge>
                            )}
                            {post.author_stars && (
                              <div className="flex items-center gap-0.5">
                                {Array.from({length: post.author_stars}).map((_, i) => (
                                  <Star key={i} className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2 mt-4 justify-end">
                          <Button variant="outline" size="sm" onClick={() => handleEdit(post)} disabled={post.status === 'approved'}>
                            <Pencil className="w-3 h-3 mr-1" /> ఎడిట్
                          </Button>
                          <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive/5 border-destructive/20" onClick={() => handleDelete(post.id)}>
                            <Trash2 className="w-3 h-3 mr-1" /> డిలీట్
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))
              ) : (
                <div className="text-center py-20 bg-white rounded-2xl shadow-sm">
                  <FileText className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
                  <p className="text-muted-foreground">మీరు ఇంకా ఎటువంటి వార్తలను సమర్పించలేదు.</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
