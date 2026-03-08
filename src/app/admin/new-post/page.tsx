"use client";

import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Newspaper, Send, Upload, X, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { STATES, LOCATIONS_BY_STATE, NewsPost } from "@/lib/mock-data";
import { NewsService } from "@/lib/storage";
import Image from "next/image";

export default function AdminNewPost() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [state, setState] = useState("");
  const [district, setDistrict] = useState("");
  const [mandal, setMandal] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content || !state || !district || !mandal || !imagePreview) {
      toast({ title: "Error", description: "All fields are required.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    
    setTimeout(() => {
      const newPost: NewsPost = {
        id: Date.now().toString(),
        unique_code: Math.floor(10000 + Math.random() * 90000).toString(),
        title,
        content,
        image_url: imagePreview,
        location: { state, district, mandal },
        status: 'approved',
        author_id: "ADMIN",
        author_name: "Admin Office",
        author_role: "Desk Incharge",
        timestamp: new Date().toISOString(),
        engagement: { likes: 0, comments: 0, commentList: [] }
      };

      NewsService.add(newPost);
      setIsSubmitting(false);
      toast({ title: "వార్త ప్రచురించబడింది", description: "వార్త విజయవంతంగా లైవ్ చేయబడింది." });
      
      // Reset
      setTitle("");
      setContent("");
      setState("");
      setDistrict("");
      setMandal("");
      setImagePreview(null);
    }, 1000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold font-headline">కొత్త వార్త రాయండి (New Post)</h1>
        <p className="text-muted-foreground mt-1">అడ్మిన్ హోదాలో నేరుగా వార్తలను ప్రచురించండి.</p>
      </div>

      <Card className="border-none shadow-xl rounded-2xl">
        <CardContent className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label className="font-bold text-xs uppercase text-muted-foreground">రాష్ట్రం (State)</Label>
              <Select onValueChange={(v) => { setState(v); setDistrict(""); setMandal(""); }} value={state}>
                <SelectTrigger className="h-11"><SelectValue placeholder="రాష్ట్రం" /></SelectTrigger>
                <SelectContent>{STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="font-bold text-xs uppercase text-muted-foreground">జిల్లా (District)</Label>
              <Select onValueChange={(v) => { setDistrict(v); setMandal(""); }} value={district} disabled={!state}>
                <SelectTrigger className="h-11"><SelectValue placeholder="జిల్లా" /></SelectTrigger>
                <SelectContent>
                  {state && Object.keys(LOCATIONS_BY_STATE[state]).map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="font-bold text-xs uppercase text-muted-foreground">మండలం (Mandal)</Label>
              <Select onValueChange={setMandal} value={mandal} disabled={!district}>
                <SelectTrigger className="h-11"><SelectValue placeholder="మండలం" /></SelectTrigger>
                <SelectContent>
                  {district && LOCATIONS_BY_STATE[state][district].map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="font-bold text-xs uppercase text-muted-foreground">ముఖ్యాంశం (Headline)</Label>
            <Input 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              placeholder="వార్త ముఖ్యాంశం రాయండి..." 
              className="h-12 text-lg font-bold"
            />
          </div>

          <div className="space-y-2">
            <Label className="font-bold text-xs uppercase text-muted-foreground">వార్త వివరాలు (Content)</Label>
            <Textarea 
              value={content} 
              onChange={(e) => setContent(e.target.value)} 
              placeholder="పూర్తి వివరాలు ఇక్కడ నమోదు చేయండి..." 
              className="min-h-[200px] text-base leading-relaxed"
            />
          </div>

          <div className="space-y-2">
            <Label className="font-bold text-xs uppercase text-muted-foreground">చిత్రం (Image)</Label>
            {!imagePreview ? (
              <div 
                onClick={() => fileInputRef.current?.click()} 
                className="border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer hover:bg-muted/50 transition-colors border-muted"
              >
                <Upload className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
                <p className="text-sm font-bold">చిత్రాన్ని అప్‌లోడ్ చేయండి</p>
                <p className="text-xs text-muted-foreground mt-1">JPG/JPEG format, max 1MB</p>
              </div>
            ) : (
              <div className="relative aspect-video rounded-2xl overflow-hidden shadow-lg group">
                <Image src={imagePreview} alt="Preview" fill className="object-cover" />
                <Button 
                  variant="destructive" 
                  size="icon" 
                  className="absolute top-4 right-4 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" 
                  onClick={() => setImagePreview(null)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}
            <input type="file" ref={fileInputRef} className="hidden" accept=".jpg,.jpeg" onChange={handleFileChange} />
          </div>

          <Button className="w-full h-14 text-xl font-bold shadow-lg shadow-primary/20" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : <Send className="mr-2 h-5 w-5" />}
            వార్తను ప్రచురించండి (Publish Now)
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
