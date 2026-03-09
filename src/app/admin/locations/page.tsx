"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Plus, Trash2, Globe, Search, PlusCircle } from "lucide-react";
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

  const availableLocations = locationsDoc || MOCK_LOCATIONS;
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

  const currentStateDistricts = availableLocations[selectedState] || {};

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline tracking-tight">ప్రాంతాల నిర్వహణ (Locations)</h1>
          <p className="text-muted-foreground mt-1">కొత్త రాష్ట్రాలు, జిల్లాలు మరియు మండలాలను ఇక్కడ జోడించవచ్చు.</p>
        </div>
        <Select value={selectedState} onValueChange={setSelectedState}>
          <SelectTrigger className="w-[200px] h-11 bg-white shadow-sm">
            <Globe className="w-4 h-4 mr-2" />
            <SelectValue placeholder="రాష్ట్రం ఎంచుకోండి" />
          </SelectTrigger>
          <SelectContent>
            {availableStates.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Add Section */}
        <div className="space-y-6">
          <Card className="border-none shadow-xl rounded-2xl">
            <CardHeader>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-indigo-500" />
                కొత్త రాష్ట్రం
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>రాష్ట్రం పేరు (State Name)</Label>
                <Input 
                  value={newStateName} 
                  onChange={(e) => setNewStateName(e.target.value)} 
                  placeholder="ఉదా: తెలంగాణ"
                />
              </div>
              <Button className="w-full bg-indigo-600 hover:bg-indigo-700" onClick={handleAddState} disabled={!newStateName}>
                రాష్ట్రం జోడించు
              </Button>
            </CardContent>
          </Card>

          <Card className="border-none shadow-xl rounded-2xl">
            <CardHeader>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Plus className="w-5 h-5 text-primary" />
                జిల్లాను చేర్చండి
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>జిల్లా పేరు (District Name)</Label>
                <Input 
                  value={newDistrict} 
                  onChange={(e) => setNewDistrict(e.target.value)} 
                  placeholder="ఉదా: కొత్తగూడెం"
                />
              </div>
              <Button className="w-full" onClick={handleAddDistrict} disabled={!newDistrict}>
                జిల్లాను జోడించు
              </Button>
            </CardContent>
          </Card>

          <Card className="border-none shadow-xl rounded-2xl">
            <CardHeader>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Plus className="w-5 h-5 text-accent" />
                మండలాన్ని చేర్చండి
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>జిల్లాను ఎంచుకోండి</Label>
                <Select value={targetDistrict} onValueChange={setTargetDistrict}>
                  <SelectTrigger><SelectValue placeholder="జిల్లా" /></SelectTrigger>
                  <SelectContent>
                    {Object.keys(currentStateDistricts).map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>మండలం పేరు (Mandal Name)</Label>
                <Input 
                  value={newMandal} 
                  onChange={(e) => setNewMandal(e.target.value)} 
                  placeholder="ఉదా: కొత్త మండలం"
                />
              </div>
              <Button className="w-full" onClick={handleAddMandal} disabled={!targetDistrict || !newMandal}>
                మండలాన్ని జోడించు
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* List Section */}
        <div className="lg:col-span-2 space-y-4">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="ప్రాంతాలను వెతకండి..." className="pl-10 h-12 bg-white rounded-xl shadow-sm border-muted" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(currentStateDistricts).length > 0 ? (
              Object.entries(currentStateDistricts).map(([district, mandals]: [string, any]) => (
                <Card key={district} className="border-none shadow-md rounded-2xl overflow-hidden group hover:shadow-lg transition-all">
                  <CardHeader className="bg-primary/5 py-4 border-b border-primary/10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-primary" />
                        <h3 className="font-bold text-primary">{district}</h3>
                      </div>
                      <Badge variant="outline" className="bg-white">{mandals?.length || 0} మండలాలు</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="flex flex-wrap gap-2">
                      {mandals && mandals.length > 0 ? mandals.map((mandal: string) => (
                        <Badge key={mandal} variant="secondary" className="font-normal bg-slate-100 hover:bg-slate-200 transition-colors">
                          {mandal}
                        </Badge>
                      )) : (
                        <span className="text-xs text-muted-foreground italic">మండలాలు లేవు.</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-full py-20 text-center bg-white rounded-3xl border-2 border-dashed border-muted">
                <p className="text-muted-foreground italic">ఈ రాష్ట్రంలో జిల్లాలు ఏవీ లేవు.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
