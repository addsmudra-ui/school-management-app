"use client";

import { useState, useRef, useEffect } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { LOCATIONS } from "@/lib/mock-data";
import { generateHeadlines } from "@/ai/flows/reporter-ai-headline-generation";
import { summarizeArticleForReporter } from "@/ai/flows/reporter-ai-content-summarization";
import { Sparkles, Loader2, Send, Wand2, Upload, X, ImageIcon, Hash, User } from "lucide-react";
import Image from "next/image";

export default function ReporterPage() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [district, setDistrict] = useState("");
  const [mandal, setMandal] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isGeneratingHeadlines, setIsGeneratingHeadlines] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reporterInfo, setReporterInfo] = useState({ name: "Reporter", id: "REP000" });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Simulating fetching logged in reporter info
    setReporterInfo({
      name: "రాహుల్ కుమార్",
      id: "REP001"
    });
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "అసమర్థిత ఫార్మాట్ (Unsupported Format)",
        description: "దయచేసి JPG లేదా JPEG చిత్రాలను మాత్రమే అప్‌లోడ్ చేయండి.",
        variant: "destructive",
      });
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const maxSize = 1 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        title: "చిత్రం పరిమాణం పెద్దదిగా ఉంది (Image too large)",
        description: "చిత్రం 1MB కంటే తక్కువ ఉండాలి.",
        variant: "destructive",
      });
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleGenerateHeadlines = async () => {
    if (!content) {
      toast({ title: "Error", description: "ముందుగా కంటెంట్‌ను నమోదు చేయండి", variant: "destructive" });
      return;
    }
    setIsGeneratingHeadlines(true);
    try {
      const result = await generateHeadlines({ articleContent: content });
      if (result.headlines?.length > 0) {
        setTitle(result.headlines[0]);
        toast({ title: "Success", description: "హెడ్ లైన్ రూపొందించబడింది!" });
      }
    } catch (error) {
      toast({ title: "Error", description: "హెడ్ లైన్ రూపొందించడం విఫలమైంది", variant: "destructive" });
    } finally {
      setIsGeneratingHeadlines(false);
    }
  };

  const handleSummarize = async () => {
    if (!content) {
      toast({ title: "Error", description: "వివరమైన కంటెంట్‌ను నమోదు చేయండి", variant: "destructive" });
      return;
    }
    setIsSummarizing(true);
    try {
      const result = await summarizeArticleForReporter({ detailedArticle: content });
      setContent(result.summary);
      toast({ title: "Success", description: "కంటెంట్ సంగ్రహించబడింది!" });
    } catch (error) {
      toast({ title: "Error", description: "సారాంశం విఫలమైంది", variant: "destructive" });
    } finally {
      setIsSummarizing(false);
    }
  };

  const generateUniqueCode = () => {
    return Math.floor(10000 + Math.random() * 90000).toString();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content || !district || !mandal || !imagePreview) {
      toast({ 
        title: "Error", 
        description: "అన్ని ఫీల్డ్‌లు మరియు చిత్రం తప్పనిసరి.", 
        variant: "destructive" 
      });
      return;
    }
    setIsSubmitting(true);
    
    const newCode = generateUniqueCode();
    
    // Simulate Firestore submission
    setTimeout(() => {
      setIsSubmitting(false);
      toast({ 
        title: "Success", 
        description: `వార్తలు సమర్పించబడ్డాయి! యూనిక్ కోడ్: ${newCode}` 
      });
      setTitle("");
      setContent("");
      setDistrict("");
      setMandal("");
      setImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }, 1500);
  };

  return (
    <main className="min-h-screen bg-background pt-20 pb-24 md:pb-8">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4">
        <Card className="shadow-lg border-none">
          <CardHeader className="bg-primary/5 rounded-t-lg">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl font-headline text-primary">వార్తలను సమర్పించండి</CardTitle>
                <CardDescription>స్థానిక సంఘటన వివరాలను నమోదు చేయండి.</CardDescription>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1 text-xs font-bold text-muted-foreground uppercase mb-1">
                  <User className="w-3 h-3" />
                  రిపోర్టర్ వివరాలు
                </div>
                <p className="text-sm font-bold text-foreground">{reporterInfo.name}</p>
                <p className="text-[10px] font-mono text-muted-foreground">ID: {reporterInfo.id}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>జిల్లా (District)</Label>
                  <Select onValueChange={setDistrict} value={district}>
                    <SelectTrigger>
                      <SelectValue placeholder="జిల్లాను ఎంచుకోండి" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(LOCATIONS).map((d) => (
                        <SelectItem key={d} value={d}>{d}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>మండలం (Mandal)</Label>
                  <Select onValueChange={setMandal} value={mandal} disabled={!district}>
                    <SelectTrigger>
                      <SelectValue placeholder="మండలాన్ని ఎంచుకోండి" />
                    </SelectTrigger>
                    <SelectContent>
                      {district && LOCATIONS[district as keyof typeof LOCATIONS].map((m) => (
                        <SelectItem key={m} value={m}>{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-end">
                  <Label htmlFor="title">వార్త ముఖ్యాంశం (Headline)</Label>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 text-accent hover:text-accent hover:bg-accent/10"
                    onClick={handleGenerateHeadlines}
                    disabled={isGeneratingHeadlines}
                  >
                    {isGeneratingHeadlines ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Sparkles className="w-3 h-3 mr-1" />}
                    AI హెడ్‌లైన్
                  </Button>
                </div>
                <Input 
                  id="title" 
                  placeholder="ఆకర్షణీయమైన హెడ్‌లైన్‌ను నమోదు చేయండి" 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-end">
                  <Label htmlFor="content">వార్త వివరాలు (Report Content)</Label>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 text-accent hover:text-accent hover:bg-accent/10"
                    onClick={handleSummarize}
                    disabled={isSummarizing}
                  >
                    {isSummarizing ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Wand2 className="w-3 h-3 mr-1" />}
                    AI సారాంశం
                  </Button>
                </div>
                <Textarea 
                  id="content" 
                  className="min-h-[200px]" 
                  placeholder="వార్తలను వివరంగా వివరించండి..." 
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>చిత్రాన్ని అప్‌లోడ్ చేయండి</Label>
                {!imagePreview ? (
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-muted rounded-lg p-10 text-center bg-muted/20 hover:bg-muted/30 transition-colors cursor-pointer group"
                  >
                    <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-2 group-hover:text-primary transition-colors" />
                    <p className="text-sm font-medium text-foreground">క్లిక్ చేయండి లేదా డ్రాగ్ చేయండి</p>
                    <p className="text-xs text-muted-foreground mt-1">JPG/JPEG మాత్రమే (గరిష్టంగా 1MB)</p>
                  </div>
                ) : (
                  <div className="relative rounded-lg overflow-hidden border border-muted aspect-video">
                    <Image 
                      src={imagePreview} 
                      alt="Preview" 
                      fill 
                      className="object-cover"
                    />
                    <Button 
                      variant="destructive" 
                      size="icon" 
                      className="absolute top-2 right-2 h-8 w-8 rounded-full shadow-lg"
                      onClick={removeImage}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                    <div className="absolute bottom-2 left-2 bg-black/60 text-white px-2 py-1 rounded text-[10px] flex items-center gap-1">
                      <ImageIcon className="w-3 h-3" />
                      Image Ready
                    </div>
                  </div>
                )}
                <input 
                  type="file" 
                  ref={fileInputRef}
                  className="hidden" 
                  accept=".jpg,.jpeg,image/jpeg"
                  onChange={handleFileChange}
                />
              </div>
            </div>

            <Button 
              className="w-full h-12 text-lg font-semibold" 
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? <Loader2 className="mr-2 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              సమర్పించండి
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
