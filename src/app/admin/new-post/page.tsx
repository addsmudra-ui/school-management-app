
"use client";

import { useState, useRef, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Newspaper, Send, Upload, X, Loader2, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { STATES as MOCK_STATES, LOCATIONS_BY_STATE as MOCK_LOCATIONS } from "@/lib/mock-data";
import { NewsService } from "@/lib/storage";
import { useFirestore, useUser, useDoc, useMemoFirebase } from "@/firebase";
import Image from "next/image";
import { doc } from "firebase/firestore";
import { addWatermark } from "@/lib/watermark";

export default function AdminNewPost() {
  const firestore = useFirestore();
  const { user } = useUser();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [state, setState] = useState("");
  const [district, setDistrict] = useState("");
  const [mandal, setMandal] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Real-time branding for watermark
  const brandingRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'config', 'admin');
  }, [firestore]);
  const { data: branding } = useDoc(brandingRef);

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
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore || !user) return;

    if (!title || !content || !state || !district || !mandal || !imagePreview) {
      toast({ title: "Error", description: "All fields are required.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    
    try {
      NewsService.add(firestore, {
        unique_code: Math.floor(10000 + Math.random() * 90000).toString(),
        title,
        content,
        image_url: imagePreview,
        location: { state, district, mandal },
        status: 'approved',
        author_id: user.uid,
        author_name: user.displayName || "Admin Office",
        author_role: "Desk Incharge",
        likes: 0,
        commentsCount: 0
      });

      toast({ title: "వార్త ప్రచురించబడింది", description: "వార్త విజయవంతంగా లైవ్ చేయబడింది." });
      
      // Reset
      setTitle("");
      setContent("");
      setState("");
      setDistrict("");
      setMandal("");
      setImagePreview(null);
    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: "Could not publish news.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
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
          <p className="text-muted-foreground mt-1 text-sm md:text-base">అడ్మిన్ హోదాలో నేరుగా వార్తలను ప్రచురించండి.</p>
        </div>
      </div>

      <Card className="border-none shadow-xl rounded-[2rem] overflow-hidden bg-white">
        <CardContent className="p-4 md:p-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground ml-1">రాష్ట్రం</Label>
              <Select onValueChange={(v) => { setState(v); setDistrict(""); setMandal(""); }} value={state}>
                <SelectTrigger className="h-12 rounded-xl border-primary/10 bg-slate-50/50"><SelectValue placeholder="రాష్ట్రం" /></SelectTrigger>
                <SelectContent>{availableStates.sort().map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground ml-1">జిల్లా</Label>
              <Select onValueChange={(v) => { setDistrict(v); setMandal(""); }} value={district} disabled={!state}>
                <SelectTrigger className="h-12 rounded-xl border-primary/10 bg-slate-50/50"><SelectValue placeholder="జిల్లా" /></SelectTrigger>
                <SelectContent>
                  {state && availableLocations[state] && Object.keys(availableLocations[state]).sort().map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground ml-1">మండలం</Label>
              <Select onValueChange={(v) => setMandal(v)} value={mandal} disabled={!district}>
                <SelectTrigger className="h-12 rounded-xl border-primary/10 bg-slate-50/50"><SelectValue placeholder="మండలం" /></SelectTrigger>
                <SelectContent>
                  {district && availableLocations[state]?.[district]?.map((m: string) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3">
            <Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground ml-1">ముఖ్యాంశం (Headline)</Label>
            <Input 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              placeholder="వార్త ముఖ్యాంశం రాయండి..." 
              className="h-14 text-lg md:text-xl font-bold rounded-2xl border-primary/10 focus:ring-primary/20"
            />
          </div>

          <div className="space-y-3">
            <Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground ml-1">వార్త వివరాలు (Content)</Label>
            <Textarea 
              value={content} 
              onChange={(e) => setContent(e.target.value)} 
              placeholder="పూర్తి వివరాలు ఇక్కడ నమోదు చేయండి..." 
              className="min-h-[200px] md:min-h-[250px] text-base md:text-lg leading-relaxed rounded-2xl border-primary/10 focus:ring-primary/20 p-4 md:p-6"
            />
          </div>

          <div className="space-y-3">
            <Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground ml-1">చిత్రం (Image)</Label>
            {!imagePreview ? (
              <div 
                onClick={() => fileInputRef.current?.click()} 
                className="border-2 border-dashed rounded-3xl p-8 md:p-16 text-center cursor-pointer hover:bg-primary/5 transition-all border-slate-200 group"
              >
                <div className="w-12 h-12 md:w-16 md:h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <Upload className="w-6 h-6 md:w-8 md:h-8 text-slate-400 group-hover:text-primary" />
                </div>
                <p className="text-base md:text-lg font-bold text-slate-700">చిత్రాన్ని అప్‌లోడ్ చేయండి</p>
                <p className="text-xs text-slate-400 mt-2">JPG/JPEG format, max 1MB</p>
              </div>
            ) : (
              <div className="relative aspect-video rounded-3xl overflow-hidden shadow-2xl group border-4 border-white max-w-2xl mx-auto">
                <Image src={imagePreview} alt="Preview" fill className="object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                   <Button 
                    variant="destructive" 
                    size="lg" 
                    className="rounded-full h-12 w-12 md:h-14 md:w-14 p-0 shadow-lg" 
                    onClick={() => setImagePreview(null)}
                  >
                    <X className="w-5 h-5 md:w-6 md:h-6" />
                  </Button>
                </div>
              </div>
            )}
            <input type="file" ref={fileInputRef} className="hidden" accept=".jpg,.jpeg" onChange={handleFileChange} />
          </div>

          <Button className="w-full h-14 md:h-16 text-lg md:text-xl font-bold shadow-2xl shadow-primary/30 rounded-2xl mt-8" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : <Send className="mr-2 h-5 w-5 md:h-6 md:w-6" />}
            వార్తను ప్రచురించండి
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
