
'use client';

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
import { Sparkles, Loader2, Send, Upload, X, FileText, Briefcase, Pencil, Trash2, Star, Clock } from "lucide-react";
import Image from "next/image";
import { useFirestore, useUser, useCollection, useDoc, useMemoFirebase } from "@/firebase";
import { collection, query, where, orderBy, doc } from "firebase/firestore";

export default function ReporterPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState("submit");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [state, setState] = useState("");
  const [district, setDistrict] = useState("");
  const [mandal, setMandal] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Real-time user profile for status
  const userDocRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  const { data: userProfile } = useDoc(userDocRef);

  // Real-time news list
  const myNewsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, 'pending_news_posts'),
      where('author_id', '==', user.uid),
      orderBy('timestamp', 'desc')
    );
  }, [firestore, user]);

  const { data: myNews } = useCollection(myNewsQuery);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (userProfile?.status !== 'approved') return;

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

      if (editingId) {
        // Handle edit logic if needed
      } else {
        NewsService.add(firestore, postData);
      }

      toast({ title: "వార్తలు సమర్పించబడ్డాయి" });
      setTitle(""); setContent(""); setState(""); setDistrict(""); setMandal(""); setImagePreview(null);
      setActiveTab("portfolio");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (userProfile?.status === 'pending' || !userProfile) {
    return (
      <main className="min-h-screen bg-background pt-20">
        <Navbar />
        <div className="max-w-xl mx-auto px-4 py-12 text-center space-y-6">
          <Clock className="w-16 h-16 text-amber-600 mx-auto animate-pulse" />
          <h1 className="text-2xl font-bold">ప్రొఫైల్ ఆమోదం కోసం వేచి ఉంది</h1>
          <p className="text-muted-foreground">మీ రిపోర్టర్ ప్రొఫైల్ ప్రస్తుతం అడ్మిన్ పరిశీలనలో ఉంది.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background pt-20 pb-24 md:pb-8">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="submit"><FileText className="w-4 h-4 mr-2" /> వార్తను పంపండి</TabsTrigger>
            <TabsTrigger value="portfolio"><Briefcase className="w-4 h-4 mr-2" /> నా పోర్ట్‌ఫోలియో</TabsTrigger>
          </TabsList>

          <TabsContent value="submit" className="animate-in fade-in duration-500">
            <Card>
              <CardHeader><CardTitle>వార్తను సమర్పించండి</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Select onValueChange={setState} value={state}><SelectTrigger><SelectValue placeholder="రాష్ట్రం" /></SelectTrigger><SelectContent>{STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
                  <Select onValueChange={setDistrict} value={district} disabled={!state}><SelectTrigger><SelectValue placeholder="జిల్లా" /></SelectTrigger><SelectContent>{state && Object.keys(LOCATIONS_BY_STATE[state]).map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent></Select>
                  <Select onValueChange={setMandal} value={mandal} disabled={!district}><SelectTrigger><SelectValue placeholder="మండలం" /></SelectTrigger><SelectContent>{district && LOCATIONS_BY_STATE[state][district].map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent></Select>
                </div>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="ముఖ్యాంశం" />
                <Textarea className="min-h-[150px]" value={content} onChange={(e) => setContent(e.target.value)} placeholder="వివరంగా రాయండి..." />
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
                      <Button variant="destructive" size="icon" className="absolute top-2 right-2 rounded-full" onClick={() => setImagePreview(null)}><X className="w-4 h-4" /></Button>
                    </div>
                  )}
                  <input type="file" ref={fileInputRef} className="hidden" accept=".jpg,.jpeg" onChange={handleFileChange} />
                </div>
                <Button className="w-full h-12 text-lg" onClick={handleSubmit} disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : <Send className="mr-2 h-4 w-4" />}
                  సమర్పించు
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="portfolio">
            <div className="grid gap-4">
              {myNews && myNews.length > 0 ? (
                myNews.map((post) => (
                  <Card key={post.id} className="overflow-hidden">
                    <div className="flex flex-col sm:flex-row">
                      <div className="relative w-full sm:w-48 h-32">
                        <Image src={post.image_url} alt={post.title} fill className="object-cover" />
                      </div>
                      <div className="p-4 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-[10px] font-mono text-muted-foreground uppercase">CODE: {post.unique_code}</span>
                            <Badge variant={post.status === 'rejected' ? 'destructive' : 'secondary'}>{post.status}</Badge>
                          </div>
                          <h3 className="font-bold text-lg line-clamp-1">{post.title}</h3>
                          <p className="text-xs text-muted-foreground">
                            {post.location.mandal}, {post.location.district} • {post.timestamp?.toDate ? post.timestamp.toDate().toLocaleDateString() : "Pending"}
                          </p>
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
