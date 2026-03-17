
"use client";

import { useState, useRef, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Megaphone, Plus, Upload, X, Loader2, Globe, Trash2, ExternalLink, MapPin } from "lucide-react";
import { AdService } from "@/lib/storage";
import { useToast } from "@/hooks/use-toast";
import { useFirestore, useCollection, useDoc, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, doc } from "firebase/firestore";
import { STATES as MOCK_STATES, LOCATIONS_BY_STATE as MOCK_LOCATIONS } from "@/lib/mock-data";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";

export default function AdsManagement() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [link, setLink] = useState("");
  const [state, setState] = useState("");
  const [district, setDistrict] = useState("All");
  const [mandal, setMandal] = useState("All");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch Locations
  const locRef = useMemoFirebase(() => firestore ? doc(firestore, 'metadata', 'locations') : null, [firestore]);
  const { data: locationsDoc } = useDoc(locRef);
  
  const availableLocations = useMemo(() => {
    if (!locationsDoc) return MOCK_LOCATIONS;
    const { id, ...statesOnly } = locationsDoc as any;
    return statesOnly;
  }, [locationsDoc]);

  const availableStates = Object.keys(availableLocations).length > 0 ? Object.keys(availableLocations) : MOCK_STATES;

  // Fetch Existing Ads
  const adsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'ads'), orderBy('timestamp', 'desc'));
  }, [firestore]);

  const { data: ads, isLoading } = useCollection(adsQuery);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleCreateAd = async () => {
    if (!firestore || !imagePreview || !state) {
      toast({ variant: "destructive", title: "Missing Info", description: "Image and State are required." });
      return;
    }

    setIsSubmitting(true);
    try {
      AdService.add(firestore, {
        image_url: imagePreview,
        link: link || "",
        location: { state, district, mandal },
        status: 'active'
      });

      toast({ title: "Ad Created", description: "The ad story is now live." });
      setLink(""); setState(""); setDistrict("All"); setMandal("All"); setImagePreview(null);
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "Failed to create ad." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAd = (id: string) => {
    if (!firestore || !confirm("ఈ ప్రకటనను శాశ్వతంగా తొలగించాలనుకుంటున్నారా?")) return;
    AdService.delete(firestore, id);
    toast({ title: "Ad Deleted" });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div>
        <h1 className="text-3xl font-bold font-headline tracking-tight">ప్రకటనల నిర్వహణ (Ads)</h1>
        <p className="text-muted-foreground mt-1">హైపర్ లోకల్ ప్రకటనలను ఇక్కడ నిర్వహించండి.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Create Ad Form */}
        <Card className="border-none shadow-xl rounded-3xl overflow-hidden bg-white h-fit">
          <CardHeader className="bg-primary/5 border-b border-primary/10">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Plus className="w-5 h-5 text-primary" />
              కొత్త ప్రకటనను సృష్టించండి
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-muted-foreground">ప్రకటన చిత్రం (Full Screen Image)</Label>
              {!imagePreview ? (
                <div onClick={() => fileInputRef.current?.click()} className="aspect-[9/16] border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors group">
                  <Upload className="w-10 h-10 text-muted-foreground group-hover:text-primary transition-colors" />
                  <p className="text-xs font-bold mt-2">Upload Ad Story</p>
                </div>
              ) : (
                <div className="relative aspect-[9/16] rounded-2xl overflow-hidden shadow-lg group">
                  <Image src={imagePreview} alt="Preview" fill className="object-cover" />
                  <Button variant="destructive" size="icon" className="absolute top-2 right-2 rounded-full h-8 w-8" onClick={() => setImagePreview(null)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-muted-foreground">వెబ్‌సైట్ లింక్ (Optional)</Label>
              <Input value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://..." className="rounded-xl" />
            </div>

            <div className="space-y-4 pt-2 border-t">
              <Label className="text-[10px] font-black uppercase text-primary tracking-widest">టార్గెట్ లొకేషన్ (Targeting)</Label>
              <div className="space-y-3">
                <Select onValueChange={(v) => { setState(v); setDistrict("All"); setMandal("All"); }} value={state}>
                  <SelectTrigger className="rounded-xl h-11"><SelectValue placeholder="రాష్ట్రం" /></SelectTrigger>
                  <SelectContent>{availableStates.sort().map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
                <Select onValueChange={(v) => { setDistrict(v); setMandal("All"); }} value={district} disabled={!state}>
                  <SelectTrigger className="rounded-xl h-11"><SelectValue placeholder="జిల్లా" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">అన్ని జిల్లాలు</SelectItem>
                    {state && availableLocations[state] && Object.keys(availableLocations[state]).sort().map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select onValueChange={setMandal} value={mandal} disabled={district === "All"}>
                  <SelectTrigger className="rounded-xl h-11"><SelectValue placeholder="మండలం" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">అన్ని మండలాలు</SelectItem>
                    {district !== "All" && availableLocations[state]?.[district]?.map((m: string) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button className="w-full h-12 rounded-xl font-bold shadow-lg shadow-primary/20" onClick={handleCreateAd} disabled={isSubmitting || !imagePreview || !state}>
              {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : <Megaphone className="mr-2 h-4 w-4" />}
              ప్రకటనను ప్రచురించండి
            </Button>
          </CardContent>
        </Card>

        {/* Ads List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-muted-foreground" />
              ప్రస్తుత ప్రకటనలు (Active Ads)
            </h2>
            <Badge variant="outline" className="bg-white">{ads?.length || 0}</Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {isLoading ? (
              <div className="col-span-full py-20 text-center"><Loader2 className="animate-spin mx-auto text-primary" /></div>
            ) : ads && ads.length > 0 ? (
              ads.map((ad) => (
                <Card key={ad.id} className="overflow-hidden border-none shadow-md group rounded-3xl bg-white">
                  <div className="flex aspect-[9/10]">
                    <div className="relative w-full h-full">
                      <Image src={ad.image_url} alt="Ad" fill className="object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                      <div className="absolute bottom-4 left-4 right-4 space-y-2">
                        <div className="flex flex-wrap gap-1.5">
                          <Badge className="bg-white/20 backdrop-blur-md text-white border-none text-[10px]">
                            {ad.location.state}
                          </Badge>
                          <Badge className="bg-primary/80 text-white border-none text-[10px]">
                            {ad.location.district}
                          </Badge>
                          <Badge className="bg-accent/80 text-white border-none text-[10px]">
                            {ad.location.mandal}
                          </Badge>
                        </div>
                        {ad.link && (
                          <div className="flex items-center gap-1.5 text-white/70 text-[10px] truncate">
                            <ExternalLink className="w-3 h-3" />
                            {ad.link}
                          </div>
                        )}
                      </div>
                      <Button 
                        variant="destructive" 
                        size="icon" 
                        className="absolute top-2 right-2 rounded-full h-8 w-8 shadow-lg z-10"
                        onClick={() => handleDeleteAd(ad.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <div className="col-span-full text-center py-24 bg-white rounded-3xl border-2 border-dashed border-muted">
                <p className="text-muted-foreground italic">ప్రకటనలు ఏవీ లేవు.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
