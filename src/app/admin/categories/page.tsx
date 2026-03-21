"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LayoutGrid, Plus, Trash2, Home, Flag, Globe, Wallet, HeartPulse, Film, Trophy, Cpu, Loader2 } from "lucide-react";
import { CategoryService } from "@/lib/storage";
import { useToast } from "@/hooks/use-toast";
import { useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { Badge } from "@/components/ui/badge";

export default function CategoriesManagement() {
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [newLabel, setNewLabel] = useState("");
  const [newValue, setNewValue] = useState("");
  const [selectedIcon, setSelectedIcon] = useState("Newspaper");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch Categories
  const catRef = useMemoFirebase(() => firestore ? doc(firestore, 'metadata', 'categories') : null, [firestore]);
  const { data: categoriesDoc, isLoading } = useDoc(catRef);
  
  const categories = useMemo(() => {
    return categoriesDoc?.items || [];
  }, [categoriesDoc]);

  const handleCreate = async () => {
    if (!firestore || !newLabel || !newValue) return;
    
    setIsSubmitting(true);
    try {
      CategoryService.add(firestore, {
        label: newLabel,
        value: newValue,
        icon: selectedIcon
      });
      toast({ title: "Section Created", description: `${newLabel} has been added.` });
      setNewLabel(""); setNewValue("");
    } catch (e) {
      toast({ variant: "destructive", title: "Error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (cat: any) => {
    if (!firestore || !confirm(`${cat.label} సెక్షన్‌ను తొలగించాలనుకుంటున్నారా?`)) return;
    CategoryService.remove(firestore, cat);
    toast({ title: "Section Deleted" });
  };

  const iconOptions = [
    { name: "Home", icon: Home },
    { name: "Flag", icon: Flag },
    { name: "Globe", icon: Globe },
    { name: "Wallet", icon: Wallet },
    { name: "HeartPulse", icon: HeartPulse },
    { name: "Film", icon: Film },
    { name: "Trophy", icon: Trophy },
    { name: "Cpu", icon: Cpu }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div>
        <h1 className="text-3xl font-bold font-headline tracking-tight">సెక్షన్ల నిర్వహణ (Sections)</h1>
        <p className="text-muted-foreground mt-1">న్యూస్ ఫీడ్ సెక్షన్లను ఇక్కడ నిర్వహించండి.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="border-none shadow-xl rounded-3xl overflow-hidden bg-white h-fit">
          <CardHeader className="bg-primary/5 border-b border-primary/10">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Plus className="w-5 h-5 text-primary" />
              కొత్త సెక్షన్‌ను చేర్చండి
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">పేరు (Telugu Label)</Label>
              <Input value={newLabel} onChange={(e) => setNewLabel(e.target.value)} placeholder="ఉదా: వినోదం" className="rounded-xl h-11" />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Key (English ID)</Label>
              <Input value={newValue} onChange={(e) => setNewValue(e.target.value)} placeholder="e.g. Entertainment" className="rounded-xl h-11" />
            </div>

            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">ఐకాన్ (Icon)</Label>
              <div className="grid grid-cols-4 gap-2">
                {iconOptions.map((opt) => (
                  <button
                    key={opt.name}
                    onClick={() => setSelectedIcon(opt.name)}
                    className={`p-3 rounded-xl border flex items-center justify-center transition-all ${
                      selectedIcon === opt.name 
                        ? "bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-105" 
                        : "bg-slate-50 border-slate-100 text-slate-400 hover:bg-slate-100"
                    }`}
                  >
                    <opt.icon className="w-5 h-5" />
                  </button>
                ))}
              </div>
            </div>

            <Button className="w-full h-12 rounded-xl font-bold" onClick={handleCreate} disabled={isSubmitting || !newLabel || !newValue}>
              {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : <Plus className="mr-2 h-4 w-4" />}
              సెక్షన్‌ను జోడించు
            </Button>
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <LayoutGrid className="w-5 h-5 text-muted-foreground" />
              ప్రస్తుత సెక్షన్లు (Active Sections)
            </h2>
            <Badge variant="outline" className="bg-white">{categories?.length || 0}</Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {isLoading ? (
              <div className="col-span-full py-20 text-center"><Loader2 className="animate-spin mx-auto text-primary" /></div>
            ) : categories.length > 0 ? (
              categories.map((cat: any) => {
                const IconComp = iconOptions.find(i => i.name === cat.icon)?.icon || Globe;
                return (
                  <Card key={cat.value} className="overflow-hidden border-none shadow-md group rounded-2xl bg-white border border-slate-100">
                    <CardContent className="p-5 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                          <IconComp className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{cat.label}</p>
                          <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">{cat.value}</p>
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="rounded-full text-slate-300 hover:text-destructive hover:bg-destructive/5 transition-colors"
                        onClick={() => handleDelete(cat)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <div className="col-span-full text-center py-24 bg-white rounded-3xl border-2 border-dashed border-muted">
                <p className="text-muted-foreground italic">సెక్షన్లు ఏవీ లేవు.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
