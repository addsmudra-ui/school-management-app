
"use client";

import { useState, useRef, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Newspaper, Send, Upload, X, Loader2, MapPin, Video, VideoOff, Globe, Flag, Wallet, HeartPulse, Trophy, Film, Home as HomeIcon, Cpu, Image as ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { STATES as MOCK_STATES, LOCATIONS_BY_STATE as MOCK_LOCATIONS, NEWS_CATEGORIES } from "@/lib/mock-data";
import { NewsService } from "@/lib/storage";
import { useFirestore, useUser, useDoc, useMemoFirebase } from "@/firebase";
import Image from "next/image";
import { doc } from "firebase/firestore";
import { addWatermark } from "@/lib/watermark";
import { cn } from "@/lib/utils";

export default function AdminNewPost() {
  const firestore = useFirestore();
  const { user } = useUser();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<string>("Home");
  const [state, setState] = useState("");
  const [district, setDistrict] = useState("");
  const [mandal, setMandal] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Real-time branding for watermark
  const brandingRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'config', 'admin');
  }, [firestore]);
  const { data: branding } = useDoc(brandingRef);

  // Dynamic Categories
  const catRef = useMemoFirebase(() => firestore ? doc(firestore, 'metadata', 'categories') : null, [firestore]);
  const { data: categoriesDoc } = useDoc(catRef);
  const availableCategories = useMemo(() => categoriesDoc?.items || NEWS_CATEGORIES, [categoriesDoc]);

  // Dynamic locations from Firestore
  const locRef = useMemoFirebase(() => firestore ? doc(firestore, 'metadata', 'locations') : null, [firestore]);
  const { data: locationsDoc } = useDoc(locRef);
  
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
      setVideoUrl(null); // Enforcement: only one media type
    };
    reader.readAsDataURL(file);
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > 10 * 1024 * 1024) {
      toast({ variant: "destructive", title: "Video too large", description: "Please upload a clip smaller than 10MB." });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setVideoUrl(reader.result as string);
      setImagePreview(null); // Enforcement: only one media type
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore || !user) return;

    if (!title || !content || !state || !district || !mandal || (!imagePreview && !videoUrl)) {
      toast({ title: "Error", description: "All fields are required. Please provide either an image or a video.", variant: "destructive" });
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
        status: 'approved',
        author_id: user.uid,
        author_name: user.displayName || "Admin Office",
        author_role: "Desk Incharge",
        likes: 0,
        commentsCount: 0
      });

      toast({ title: "వార్త ప్రచురించబడింది", description: "వార్త విజయవంతంగా లైవ్ చేయబడింది." });
      
      setTitle(""); setContent(""); setCategory("Home"); setState(""); setDistrict(""); setMandal(""); setImagePreview(null); setVideoUrl(null);
    } catch (error) {
      toast({ title: "Error", description: "Could not publish news.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

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
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      <div className="flex items-center gap-3">
        <div className="bg-primary/10 p-2.5 rounded-2xl">
          <Newspaper className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold font-headline">కొత్త వార్త రాయండి</h1>
          <p className="text-muted-foreground mt-1 text-xs md:text-sm">అడ్మిన్ హోదాలో నేరుగా వార్తలను ప్రచురించండి.</p>
        </div>
      </div>

      <Card className="border-none shadow-xl rounded-[2rem] overflow-hidden bg-white">
        <CardContent className="p-4 md:p-8 space-y-8">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="font-bold text-[10px] uppercase tracking-widest text-muted-foreground ml-1">న్యూస్ సెక్షన్ (Category)</Label>
              <Select onValueChange={setCategory} value={category}>
                <SelectTrigger className="h-12 rounded-xl border-primary/10 bg-slate-50/50">
                  <div className="flex items-center gap-2">
                    {getCategoryIcon(category)}
                    <SelectValue />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {availableCategories.map((cat: any) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      <div className="flex items-center gap-2">
                        <span className="opacity-50">{cat.label}</span>
                        <span className="text-[10px] font-bold uppercase tracking-tighter">({cat.value})</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-2">
                <Label className="font-bold text-[10px] uppercase tracking-widest text-muted-foreground ml-1">రాష్ట్రం</Label>
                <Select onValueChange={(v) => { setState(v); setDistrict(""); setMandal(""); }} value={state}>
                  <SelectTrigger className="h-12 rounded-xl border-primary/10 bg-slate-50/50"><SelectValue placeholder="State" /></SelectTrigger>
                  <SelectContent>{availableStates.sort().map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="font-bold text-[10px] uppercase tracking-widest text-muted-foreground ml-1">జిల్లా</Label>
                <Select onValueChange={(v) => { setDistrict(v); setMandal(""); }} value={district} disabled={!state}>
                  <SelectTrigger className="h-12 rounded-xl border-primary/10 bg-slate-50/50"><SelectValue placeholder="District" /></SelectTrigger>
                  <SelectContent>
                    {state && availableLocations[state] && Object.keys(availableLocations[state]).sort().map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="font-bold text-[10px] uppercase tracking-widest text-muted-foreground ml-1">మండలం</Label>
                <Select onValueChange={setMandal} value={mandal} disabled={!district}>
                  <SelectTrigger className="h-12 rounded-xl border-primary/10 bg-slate-50/50"><SelectValue placeholder="Mandal" /></SelectTrigger>
                  <SelectContent>
                    {district && availableLocations[state]?.[district]?.map((m: string) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Label className="font-bold text-[10px] uppercase tracking-widest text-muted-foreground ml-1">ముఖ్యాంశం (Headline)</Label>
            <Input 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              placeholder="వార్త ముఖ్యాంశం రాయండి..." 
              className="h-14 text-sm md:text-lg font-bold rounded-2xl border-primary/10 focus:ring-primary/20"
            />
          </div>

          <div className="space-y-3">
            <Label className="font-bold text-[10px] uppercase tracking-widest text-muted-foreground ml-1">వార్త వివరాలు (Content)</Label>
            <Textarea 
              value={content} 
              onChange={(e) => setContent(e.target.value)} 
              placeholder="పూర్తి వివరాలు ఇక్కడ నమోదు చేయండి..." 
              className="min-h-[150px] md:min-h-[200px] text-xs md:text-sm leading-relaxed rounded-2xl border-primary/10 focus:ring-primary/20 p-4"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className={cn("space-y-3 transition-all", videoUrl && "opacity-40 pointer-events-none grayscale")}>
              <Label className="font-bold text-[10px] uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-2">
                <ImageIcon className="w-3 h-3" />
                చిత్రం (Image)
              </Label>
              {!imagePreview ? (
                <div onClick={() => !videoUrl && fileInputRef.current?.click()} className="border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer hover:bg-primary/5 transition-all border-slate-200 group h-[200px] flex flex-col justify-center">
                  <Upload className="w-8 h-8 text-slate-400 group-hover:text-primary mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-500">Upload Image</p>
                </div>
              ) : (
                <div className="relative aspect-video rounded-3xl overflow-hidden shadow-lg group border-2 border-white h-[200px]">
                  <Image src={imagePreview} alt="Preview" fill className="object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                     <Button variant="destructive" size="icon" className="rounded-full" onClick={() => setImagePreview(null)}><X className="w-4 h-4" /></Button>
                  </div>
                </div>
              )}
              <input type="file" ref={fileInputRef} className="hidden" accept=".jpg,.jpeg,.png" onChange={handleFileChange} />
            </div>

            <div className={cn("space-y-3 transition-all", imagePreview && "opacity-40 pointer-events-none grayscale")}>
              <Label className="font-bold text-[10px] uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-2">
                <Video className="w-3 h-3 text-rose-500" />
                వీడియో (Video - Optional)
              </Label>
              {!videoUrl ? (
                <div onClick={() => !imagePreview && videoInputRef.current?.click()} className="border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer hover:bg-rose-50/50 transition-all border-slate-200 group h-[200px] flex flex-col justify-center">
                  <Video className="w-8 h-8 text-slate-400 group-hover:text-rose-500 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-500">Upload Short Clip</p>
                  <p className="text-[8px] text-muted-foreground mt-1">Max 10MB</p>
                </div>
              ) : (
                <div className="relative aspect-video rounded-3xl overflow-hidden shadow-lg group border-2 border-white h-[200px] bg-black">
                  <video src={videoUrl} className="w-full h-full object-contain" controls />
                  <Button variant="destructive" size="icon" className="absolute top-2 right-2 rounded-full h-8 w-8 z-10" onClick={() => setVideoUrl(null)}><X className="w-4 h-4" /></Button>
                </div>
              )}
              <input type="file" ref={videoInputRef} className="hidden" accept="video/*" onChange={handleVideoChange} />
            </div>
          </div>

          <Button className="w-full h-14 text-sm md:text-base font-bold shadow-2xl shadow-primary/30 rounded-2xl mt-4" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : <Send className="mr-2 h-4 w-4" />}
            వార్తను ప్రచురించండి
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
