"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Plus, Globe, PlusCircle, LayoutGrid } from "lucide-react";
import { LocationService } from "@/lib/storage";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { STATES as MOCK_STATES, LOCATIONS_BY_STATE as MOCK_LOCATIONS } from "@/lib/mock-data";
import { useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";

export default function AdminLocations() {
  const firestore = useFirestore();
  const [selectedState, setSelectedState] = useState<string>("Telangana");
  const [newStateName, setNewStateName] = useState("");
  const [newDistrict, setNewDistrict] = useState("");
  const [newMandal, setNewMandal] = useState("");
  const [targetDistrict, setTargetDistrict] = useState("");
  const { toast } = useToast();

  const locRef = useMemoFirebase(() => firestore ? doc(firestore, 'metadata', 'locations') : null, [firestore]);
  const { data: locationsDoc } = useDoc(locRef);

  // Use Firestore data or fallback to mock data
  const availableLocations = (locationsDoc as any) || MOCK_LOCATIONS;
  const availableStates = Object.keys(availableLocations).length > 0 ? Object.keys(availableLocations) : MOCK_STATES;

  const handleAddState = () => {
    if (!firestore || !newStateName) return;
    LocationService.addState(firestore, newStateName);
    setNewStateName("");
    setSelectedState(newStateName);
    toast({ title: "రాష్ట్రం జోడించబడింది", description: `${newStateName} విజయవంతంగా చేర్చబడింది.` });
  };

  const handleAddDistrict = () => {
    if (!firestore || !newDistrict) return;
    LocationService.addDistrict(firestore, selectedState, newDistrict);
    setNewDistrict("");
    toast({ title: "జిల్లా జోడించబడింది", description: `${newDistrict} విజయవంతంగా చేర్చబడింది.` });
  };

  const handleAddMandal = () => {
    if (!firestore || !targetDistrict || !newMandal) return;
    LocationService.addMandal(firestore, selectedState, targetDistrict, newMandal);
    setNewMandal("");
    toast({ title: "మండలం జోడించబడింది", description: `${newMandal} విజయవంతంగా చేర్చబడింది.` });
  };

  const currentStateDistricts = (availableLocations[selectedState] as Record<string, string[]>) || {};

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline tracking-tight">ప్రాంతాల నిర్వహణ (Locations)</h1>
          <p className="text-muted-foreground mt-1">కొత్త రాష్ట్రాలు, జిల్లాలు మరియు మండలాలను ఇక్కడ జోడించవచ్చు.</p>
        </div>
        <Select value={selectedState} onValueChange={setSelectedState}>
          <SelectTrigger className="w-[220px] h-12 bg-white shadow-md rounded-xl border-primary/20">
            <Globe className="w-4 h-4 mr-2 text-primary" />
            <SelectValue placeholder="రాష్ట్రం ఎంచుకోండి" />
          </SelectTrigger>
          <SelectContent>
            {availableStates.sort().map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Input Forms */}
        <div className="space-y-6">
          <Card className="border-none shadow-xl rounded-3xl overflow-hidden bg-white">
            <CardHeader className="bg-indigo-50/50 border-b border-indigo-100">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-indigo-500" />
                కొత్త రాష్ట్రం (State)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-muted-foreground">పేరు (State Name)</Label>
                <Input 
                  value={newStateName} 
                  onChange={(e) => setNewStateName(e.target.value)} 
                  placeholder="ఉదా: తెలంగాణ"
                  className="rounded-xl h-11"
                />
              </div>
              <Button className="w-full bg-indigo-600 hover:bg-indigo-700 rounded-xl h-11" onClick={handleAddState} disabled={!newStateName}>
                రాష్ట్రం జోడించు
              </Button>
            </CardContent>
          </Card>

          <Card className="border-none shadow-xl rounded-3xl overflow-hidden bg-white">
            <CardHeader className="bg-primary/5 border-b border-primary/10">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Plus className="w-5 h-5 text-primary" />
                జిల్లాను చేర్చండి (District)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-muted-foreground">జిల్లా పేరు (District Name)</Label>
                <Input 
                  value={newDistrict} 
                  onChange={(e) => setNewDistrict(e.target.value)} 
                  placeholder="ఉదా: కొత్తగూడెం"
                  className="rounded-xl h-11"
                />
              </div>
              <Button className="w-full rounded-xl h-11" onClick={handleAddDistrict} disabled={!newDistrict}>
                జిల్లాను జోడించు
              </Button>
            </CardContent>
          </Card>

          <Card className="border-none shadow-xl rounded-3xl overflow-hidden bg-white">
            <CardHeader className="bg-accent/5 border-b border-accent/10">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Plus className="w-5 h-5 text-accent" />
                మండలాన్ని చేర్చండి (Mandal)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-muted-foreground">జిల్లాను ఎంచుకోండి</Label>
                <Select value={targetDistrict} onValueChange={setTargetDistrict}>
                  <SelectTrigger className="rounded-xl h-11"><SelectValue placeholder="జిల్లా" /></SelectTrigger>
                  <SelectContent>
                    {Object.keys(currentStateDistricts).sort().map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-muted-foreground">మండలం పేరు (Mandal Name)</Label>
                <Input 
                  value={newMandal} 
                  onChange={(e) => setNewMandal(e.target.value)} 
                  placeholder="ఉదా: కొత్త మండలం"
                  className="rounded-xl h-11"
                />
              </div>
              <Button className="w-full bg-accent hover:bg-accent/90 rounded-xl h-11" onClick={handleAddMandal} disabled={!targetDistrict || !newMandal}>
                మండలాన్ని జోడించు
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Display List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <LayoutGrid className="w-6 h-6 text-primary" />
              {selectedState} - జిల్లాలు & మండలాలు
            </h2>
            <Badge variant="outline" className="bg-white px-3 py-1 font-bold text-primary border-primary/20">
              {Object.keys(currentStateDistricts).length} జిల్లాలు
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(currentStateDistricts).length > 0 ? (
              Object.entries(currentStateDistricts).sort(([a], [b]) => a.localeCompare(b)).map(([district, mandals]: [string, any]) => (
                <Card key={district} className="border-none shadow-md rounded-3xl overflow-hidden group hover:shadow-xl transition-all bg-white border border-slate-100">
                  <CardHeader className="bg-primary/5 py-5 px-6 border-b border-primary/10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-white rounded-lg shadow-sm flex items-center justify-center">
                          <MapPin className="w-4 h-4 text-primary" />
                        </div>
                        <h3 className="font-bold text-lg text-slate-900">{district}</h3>
                      </div>
                      <Badge variant="secondary" className="bg-white text-xs font-bold text-muted-foreground">
                        {mandals?.length || 0} Mandals
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="flex flex-wrap gap-2">
                      {mandals && mandals.length > 0 ? (
                        mandals.sort().map((mandal: string) => (
                          <Badge key={mandal} variant="secondary" className="font-medium bg-slate-50 text-slate-700 border-slate-200 py-1.5 px-3 rounded-lg hover:bg-primary/10 hover:text-primary hover:border-primary/20 transition-all cursor-default">
                            {mandal}
                          </Badge>
                        ))
                      ) : (
                        <div className="flex flex-col items-center justify-center py-4 w-full opacity-40">
                          <p className="text-xs italic text-muted-foreground">మండలాలు లేవు.</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-full py-32 text-center bg-white rounded-[2rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center space-y-4">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center">
                  <Globe className="w-8 h-8 text-slate-300" />
                </div>
                <div className="space-y-1">
                  <p className="text-slate-500 font-bold">డేటా ఏదీ లేదు</p>
                  <p className="text-sm text-slate-400 italic">ఈ రాష్ట్రంలో ఇంకా జిల్లాలు ఏవీ చేర్చబడలేదు.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
