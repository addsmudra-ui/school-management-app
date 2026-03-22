"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Palette, Upload, X, Check, Loader2, KeyRound, Eye, EyeOff } from "lucide-react";
import { AdminService } from "@/lib/storage";
import { useToast } from "@/hooks/use-toast";
import { useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import Image from "next/image";

export default function BrandingPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isUpdating, setIsUpdating] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [appName, setAppName] = useState("");
  const [accessKey, setAccessKey] = useState("");
  const [showKey, setShowKey] = useState(false);

  const brandingRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'config', 'admin');
  }, [firestore]);

  const { data: branding, isLoading } = useDoc(brandingRef);

  // Initialize form state when data loads
  useEffect(() => {
    if (branding) {
      setAppName(branding.appName || "Telugu News Pulse");
      setLogoPreview(branding.appLogo || null);
      setAccessKey(branding.password || "admin123");
    }
  }, [branding]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'].includes(file.type)) {
      toast({
        variant: "destructive",
        title: "Invalid file",
        description: "Please upload a PNG, JPG or SVG image.",
      });
      return;
    }

    if (file.size > 500 * 1024) {
      toast({
        variant: "destructive",
        title: "File too large",
        description: "Logo must be smaller than 500KB.",
      });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => setLogoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!firestore) return;
    setIsUpdating(true);
    try {
      await AdminService.updateBranding(firestore, {
        appLogo: logoPreview || undefined,
        appName: appName || undefined,
        password: accessKey || undefined
      });
      toast({ title: "Branding & Security Updated", description: "App settings have been successfully updated." });
    } catch (error) {
      toast({ variant: "destructive", title: "Update Failed", description: "Could not save changes." });
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex items-center gap-3">
        <div className="bg-primary/10 p-3 rounded-2xl">
          <Palette className="w-7 h-7 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold font-headline">యాప్ కాన్ఫిగరేషన్ (Branding)</h1>
          <p className="text-muted-foreground mt-1">యాప్ పేరు, లోగో మరియు సెక్యూరిటీ కీని ఇక్కడ నిర్వహించండి.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-8">
          <Card className="border-none shadow-xl rounded-[2rem] overflow-hidden bg-white">
            <CardHeader className="bg-slate-50/50 border-b pb-6">
              <CardTitle className="text-xl font-bold">బ్రాండింగ్ (Identity)</CardTitle>
              <CardDescription>యాప్ పేరు మరియు లోగో వివరాలు</CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              <div className="space-y-3">
                <Label className="font-bold text-[10px] uppercase tracking-widest text-muted-foreground ml-1">యాప్ పేరు (App Name)</Label>
                <Input 
                  value={appName} 
                  onChange={(e) => setAppName(e.target.value)} 
                  placeholder="ఉదా: Telugu News Pulse"
                  className="h-12 rounded-xl text-base font-bold"
                />
              </div>

              <div className="space-y-4">
                <Label className="font-bold text-[10px] uppercase tracking-widest text-muted-foreground ml-1">యాప్ లోగో (App Logo)</Label>
                
                <div className="flex flex-col gap-6 items-start">
                  {!logoPreview ? (
                    <div 
                      onClick={() => fileInputRef.current?.click()} 
                      className="w-full aspect-square border-2 border-dashed rounded-3xl flex flex-col items-center justify-center cursor-pointer hover:bg-primary/5 transition-all border-slate-200 group"
                    >
                      <Upload className="w-10 h-10 text-slate-400 group-hover:text-primary mb-2" />
                      <span className="text-xs font-bold text-slate-500">Upload Logo</span>
                    </div>
                  ) : (
                    <div className="relative w-full aspect-square bg-slate-50 rounded-3xl flex items-center justify-center border p-6 group shadow-inner">
                      <Image 
                        src={logoPreview} 
                        alt="App Logo" 
                        width={250} 
                        height={250} 
                        className="object-contain max-h-full" 
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-3xl">
                        <Button variant="destructive" size="icon" onClick={() => setLogoPreview(null)} className="rounded-full">
                          <X className="w-5 h-5" />
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="w-full space-y-4 pt-2">
                    <div className="bg-blue-50 p-5 rounded-2xl border border-blue-100 shadow-sm">
                      <h4 className="font-bold text-blue-800 text-[10px] uppercase tracking-widest mb-3">Live Header Preview</h4>
                      <div className="bg-white p-3 rounded-xl border flex items-center gap-3">
                        <div className="bg-primary/10 p-2 rounded-lg relative w-10 h-10 flex items-center justify-center overflow-hidden">
                          {logoPreview ? (
                            <Image src={logoPreview} alt="Logo" fill className="object-contain p-1" />
                          ) : (
                            <Palette className="w-5 h-5 text-primary" />
                          )}
                        </div>
                        <span className="font-bold text-base truncate">{appName || "Telugu News Pulse"}</span>
                      </div>
                    </div>
                    <p className="text-[10px] text-muted-foreground leading-relaxed text-center font-medium">
                      Best size: 512x512px. Supports PNG, JPG, and SVG (Max 500KB).
                    </p>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                    <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="rounded-xl w-full h-12 font-bold border-primary/20 hover:bg-primary/5">
                      Change Logo Image
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          <Card className="border-none shadow-xl rounded-[2rem] overflow-hidden bg-white">
            <CardHeader className="bg-rose-50/50 border-b pb-6">
              <CardTitle className="text-xl font-bold flex items-center gap-2 text-rose-700">
                <KeyRound className="w-6 h-6" />
                సెక్యూరిటీ (Security)
              </CardTitle>
              <CardDescription>సిబ్బంది లాగిన్ కోసం యాక్సెస్ కీ</CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="p-6 rounded-2xl bg-slate-50 border space-y-4">
                <Label className="font-bold text-[10px] uppercase tracking-widest text-primary ml-1">మాస్టర్ యాక్సెస్ కీ (Staff Access Key)</Label>
                <div className="relative">
                  <Input 
                    type={showKey ? "text" : "password"}
                    value={accessKey} 
                    onChange={(e) => setAccessKey(e.target.value)} 
                    placeholder="యాక్సెస్ కీని నమోదు చేయండి"
                    className="h-14 rounded-xl text-xl font-black tracking-widest pr-12"
                  />
                  <button 
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors"
                  >
                    {showKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed italic">
                  ఈ కీ ద్వారానే ఎడిటర్లు మరియు రిపోర్టర్లు స్టాఫ్ పోర్టల్ లోకి ప్రవేశిస్తారు. దీనిని ఎప్పటికప్పుడు మారుస్తూ ఉండటం మంచిది.
                </p>
              </div>

              <div className="bg-amber-50 p-5 rounded-2xl border border-amber-100 space-y-2">
                <h4 className="font-bold text-amber-800 text-xs flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  గమనిక (Important)
                </h4>
                <p className="text-[11px] text-amber-900 leading-relaxed font-medium">
                  మీరు ఈ కీని మార్చినప్పుడు, పాత కీతో లాగిన్ అయి ఉన్న స్టాఫ్ మెంబర్లు వెంటనే లాగౌట్ కారు, కానీ కొత్త సెషన్లకు కొత్త కీ అవసరమవుతుంది.
                </p>
              </div>
            </CardContent>
          </Card>

          <Button 
            className="w-full h-20 text-xl font-black rounded-3xl shadow-2xl shadow-primary/30 transition-all hover:scale-[1.02] active:scale-95" 
            onClick={handleSave} 
            disabled={isUpdating}
          >
            {isUpdating ? <Loader2 className="animate-spin mr-3 w-6 h-6" /> : <Check className="mr-3 w-6 h-6" />}
            అన్ని మార్పులను సేవ్ చేయండి
          </Button>
        </div>
      </div>
    </div>
  );
}