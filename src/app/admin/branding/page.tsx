"use client";

import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Palette, Upload, X, Check, Loader2 } from "lucide-react";
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

  const brandingRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'config', 'admin');
  }, [firestore]);

  const { data: branding, isLoading } = useDoc(brandingRef);

  // Initialize form state when data loads
  useState(() => {
    if (branding) {
      setAppName(branding.appName || "MandalPulse");
      setLogoPreview(branding.appLogo || null);
    }
  });

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
        appName: appName || undefined
      });
      toast({ title: "Branding Updated", description: "The app logo and name have been updated." });
    } catch (error) {
      toast({ variant: "destructive", title: "Update Failed", description: "Could not save branding changes." });
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center p-12"><Loader2 className="animate-spin" /></div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500 pb-12">
      <div className="flex items-center gap-3">
        <div className="bg-primary/10 p-2.5 rounded-2xl">
          <Palette className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold font-headline">యాప్ బ్రాండింగ్ (Branding)</h1>
          <p className="text-muted-foreground mt-1">యాప్ పేరు మరియు లోగోను ఇక్కడ మార్చవచ్చు.</p>
        </div>
      </div>

      <Card className="border-none shadow-xl rounded-[2rem] overflow-hidden bg-white">
        <CardContent className="p-8 space-y-8">
          <div className="space-y-4">
            <Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground">యాప్ పేరు (App Name)</Label>
            <Input 
              value={appName || (branding?.appName || "")} 
              onChange={(e) => setAppName(e.target.value)} 
              placeholder="ఉదా: MandalPulse"
              className="h-12 rounded-xl"
            />
          </div>

          <div className="space-y-4">
            <Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground">యాప్ లోగో (App Logo)</Label>
            
            <div className="flex flex-col md:flex-row gap-8 items-start">
              {!logoPreview && !branding?.appLogo ? (
                <div 
                  onClick={() => fileInputRef.current?.click()} 
                  className="w-full md:w-64 aspect-square border-2 border-dashed rounded-3xl flex flex-col items-center justify-center cursor-pointer hover:bg-primary/5 transition-all border-slate-200 group"
                >
                  <Upload className="w-8 h-8 text-slate-400 group-hover:text-primary mb-2" />
                  <span className="text-xs font-bold text-slate-500">Upload Logo</span>
                </div>
              ) : (
                <div className="relative w-full md:w-64 aspect-square bg-slate-50 rounded-3xl flex items-center justify-center border p-4 group">
                  <Image 
                    src={logoPreview || branding?.appLogo || ""} 
                    alt="App Logo" 
                    width={200} 
                    height={200} 
                    className="object-contain max-h-full" 
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-3xl">
                    <Button variant="destructive" size="icon" onClick={() => setLogoPreview(null)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}

              <div className="flex-1 space-y-4 pt-2">
                <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                  <h4 className="font-bold text-blue-800 text-sm mb-1">Preview in Header</h4>
                  <div className="bg-white p-2 rounded-xl border flex items-center gap-2">
                    <div className="bg-primary/10 p-1.5 rounded-lg relative w-8 h-8 flex items-center justify-center">
                      {logoPreview ? (
                        <Image src={logoPreview} alt="Logo" fill className="object-contain p-0.5" />
                      ) : (
                        <Palette className="w-4 h-4 text-primary" />
                      )}
                    </div>
                    <span className="font-bold text-sm">{appName || branding?.appName || "MandalPulse"}</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Best size: 512x512px. Supports PNG, JPG, and SVG. 
                  Maximum size: 500KB.
                </p>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="rounded-xl">
                  Change Image
                </Button>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t">
            <Button className="w-full h-14 text-lg font-bold rounded-2xl shadow-lg shadow-primary/20" onClick={handleSave} disabled={isUpdating}>
              {isUpdating ? <Loader2 className="animate-spin mr-2" /> : <Check className="mr-2" />}
              మార్పులను సేవ్ చేయండి (Save Changes)
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
