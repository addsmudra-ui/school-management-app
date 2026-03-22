"use client";

import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  UserPlus, Trash2, Search, MapPin, Loader2, 
  ShieldCheck, ShieldAlert, Phone, UserCog, Mail
} from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { UserProfile, STATES as MOCK_STATES, LOCATIONS_BY_STATE as MOCK_LOCATIONS } from "@/lib/mock-data";
import { UserService } from "@/lib/storage";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { useFirestore, useCollection, useDoc, useMemoFirebase } from "@/firebase";
import { collection, query, limit, orderBy, doc } from "firebase/firestore";

export default function AdminUsers() {
  const firestore = useFirestore();
  const [search, setSearch] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const { toast } = useToast();

  // Firestore Query
  const usersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'users'), orderBy('name', 'asc'), limit(500));
  }, [firestore]);

  const { data: users, isLoading } = useCollection<UserProfile>(usersQuery);

  const locRef = useMemoFirebase(() => firestore ? doc(firestore, 'metadata', 'locations') : null, [firestore]);
  const { data: locationsDoc } = useDoc(locRef);
  
  const availableLocations = useMemo(() => {
    if (!locationsDoc) return MOCK_LOCATIONS;
    const { id, ...statesOnly } = locationsDoc as any;
    return statesOnly;
  }, [locationsDoc]);

  const availableStates = Object.keys(availableLocations).length > 0 ? Object.keys(availableLocations) : MOCK_STATES;

  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newState, setNewState] = useState("");
  const [newDistrict, setNewDistrict] = useState("");
  const [newMandal, setNewMandal] = useState("");
  const [newRole, setNewRole] = useState<'reporter' | 'user' | 'editor'>('reporter');
  const [isCreating, setIsCreating] = useState(false);

  const handleToggleStatus = (id: string, currentStatus: string) => {
    if (!firestore) return;
    const newStatus = currentStatus === 'approved' ? 'pending' : 'approved';
    UserService.update(firestore, id, { status: newStatus as any });
    toast({
      title: "వినియోగదారు స్థితి మార్చబడింది",
      description: `User status changed to ${newStatus}.`,
    });
  };

  const handleDeleteUser = (id: string, name: string) => {
    if (!firestore) return;
    if (confirm(`${name} అకౌంట్‌ను శాశ్వతంగా తొలగించాలనుకుంటున్నారా?`)) {
      UserService.delete(firestore, id);
      toast({
        title: "వినియోగదారు తొలగించబడ్డారు",
        description: `${name} has been deleted from the system.`,
        variant: "destructive"
      });
    }
  };

  const handleAddUser = async () => {
    if (!firestore || !newName || (!newPhone && !newEmail) || !newState || !newDistrict || !newMandal) {
      toast({ title: "Validation Error", description: "Please fill name, contact, and location.", variant: "destructive" });
      return;
    }

    setIsCreating(true);
    const newUser: UserProfile = {
      id: "MANUAL_" + Date.now(),
      name: newName,
      phone: newPhone ? (newPhone.startsWith('+') ? newPhone : `+91${newPhone}`) : undefined,
      email: newEmail || undefined,
      role: newRole as any,
      status: 'approved',
      location: { state: newState, district: newDistrict, mandal: newMandal }
    };

    try {
      await UserService.create(firestore, newUser);
      setIsAddDialogOpen(false);
      toast({ title: "Provisioned", description: `Provisioned ${newRole} account for ${newName}.` });
      setNewName(""); setNewPhone(""); setNewEmail(""); setNewState(""); setNewDistrict(""); setNewMandal("");
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setIsCreating(false);
    }
  };

  const filtered = users?.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) || 
    u.phone?.includes(search) ||
    u.role.includes(search)
  ) || [];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline tracking-tight">సిబ్బంది నిర్వహణ (Staff)</h1>
          <p className="text-muted-foreground mt-1">ప్లాట్‌ఫారమ్ సిబ్బంది జాబితాను ఇక్కడ చూడవచ్చు.</p>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 shadow-lg shadow-primary/20 h-11 rounded-xl">
              <UserPlus className="w-4 h-4" />
              సిబ్బందిని చేర్చండి (Add Staff)
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md rounded-3xl overflow-hidden">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">కొత్త సిబ్బందిని చేర్చండి</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto px-1">
              <div className="space-y-2">
                <Label>పూర్తి పేరు (Full Name)</Label>
                <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Name" className="rounded-xl" />
              </div>
              <div className="grid grid-cols-1 gap-3">
                <div className="space-y-2">
                  <Label>ఫోన్ నంబర్ (Recognized Phone)</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-muted-foreground text-xs">+91</span>
                    <Input value={newPhone} onChange={(e) => setNewPhone(e.target.value)} placeholder="10 digits" className="rounded-xl pl-10" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>ఈమెయిల్ (Optional Email)</Label>
                  <Input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="email@example.com" className="rounded-xl" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>పాత్ర (Role)</Label>
                <Select onValueChange={(v: any) => setNewRole(v)} value={newRole}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="editor">ఎడిటర్ (Editor)</SelectItem>
                    <SelectItem value="reporter">రిపోర్టర్ (Reporter)</SelectItem>
                    <SelectItem value="user">పాఠకుడు (User)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>రాష్ట్రం</Label>
                <Select onValueChange={(v) => { setState(v); setNewDistrict(""); setNewMandal(""); }} value={newState}>
                  <SelectTrigger className="rounded-xl"><SelectValue placeholder="రాష్ట్రం" /></SelectTrigger>
                  <SelectContent>{availableStates.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>జిల్లా</Label>
                  <Select onValueChange={(v) => { setNewDistrict(v); setNewMandal(""); }} value={newDistrict} disabled={!newState}>
                    <SelectTrigger className="rounded-xl"><SelectValue placeholder="జిల్లా" /></SelectTrigger>
                    <SelectContent>
                      {newState && availableLocations[newState] && Object.keys(availableLocations[newState]).map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>మండలం</Label>
                  <Select onValueChange={setNewMandal} value={newMandal} disabled={!newDistrict}>
                    <SelectTrigger className="rounded-xl"><SelectValue placeholder="మండలం" /></SelectTrigger>
                    <SelectContent>
                      {newDistrict && availableLocations[newState]?.[newDistrict]?.map((m: string) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter className="bg-slate-50 p-4 -m-6 mt-4">
              <Button variant="outline" className="rounded-xl" onClick={() => setIsAddDialogOpen(false)}>రద్దు</Button>
              <Button className="rounded-xl px-8" onClick={handleAddUser} disabled={isCreating}>
                {isCreating ? <Loader2 className="animate-spin mr-2" /> : null}
                ఖాతాను సృష్టించండి
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input 
          placeholder="పేరు, పాత్ర లేదా ఫోన్ ద్వారా వెతకండి..." 
          className="pl-10 h-12 bg-white rounded-xl border-muted shadow-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Card className="border-none shadow-xl rounded-2xl overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="font-bold py-4 pl-6">పేరు (Name)</TableHead>
                <TableHead className="font-bold">పాత్ర (Role)</TableHead>
                <TableHead className="font-bold">సంప్రదించండి (Contact)</TableHead>
                <TableHead className="font-bold">ప్రాంతం (Location)</TableHead>
                <TableHead className="font-bold text-center">స్థితి (Status)</TableHead>
                <TableHead className="font-bold text-right pr-6">చర్యలు (Actions)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="h-48 text-center text-muted-foreground">వినియోగదారులను లోడ్ చేస్తోంది...</TableCell></TableRow>
              ) : filtered.length > 0 ? (
                filtered.map((user) => (
                  <TableRow key={user.id} className="hover:bg-muted/10 transition-colors">
                    <TableCell className="pl-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0">
                          {user.name[0]}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900 truncate">{user.name}</span>
                          {user.id.startsWith('MANUAL_') && <span className="text-[8px] font-black text-rose-500 uppercase tracking-tighter">Pre-Provisioned</span>}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        {user.email === 'admin@telugunewspulse.com' ? (
                          <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
                        ) : user.role === 'editor' ? (
                          <UserCog className="w-3.5 h-3.5 text-amber-500" />
                        ) : (
                          <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                        )}
                        <Badge variant="outline" className="capitalize text-[10px] font-bold border-muted-foreground/20">
                          {user.email === 'admin@telugunewspulse.com' ? 'Admin' : user.role}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-[11px] font-medium flex flex-col gap-0.5 text-muted-foreground">
                        <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {user.phone || '-'}</span>
                        <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {user.email || '-'}</span>
                      </span>
                    </TableCell>
                    <TableCell>
                      {user.location ? (
                        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                          <MapPin className="w-3 h-3 text-primary" />
                          <span className="truncate max-w-[150px]">{user.location.mandal}, {user.location.district}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">Global</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge 
                        variant="secondary" 
                        className={cn(
                          "font-bold text-[10px] uppercase",
                          user.status === 'approved' ? "bg-emerald-50 text-emerald-700" :
                          user.status === 'pending' ? "bg-amber-50 text-amber-700" :
                          "bg-rose-50 text-rose-700"
                        )}
                      >
                        {user.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <div className="flex justify-end items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Switch 
                            checked={user.status === 'approved'} 
                            onCheckedChange={() => handleToggleStatus(user.id, user.status)}
                            disabled={user.email === 'admin@telugunewspulse.com'}
                          />
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-9 w-9 text-muted-foreground hover:text-destructive rounded-full"
                          onClick={() => handleDeleteUser(user.id, user.name)}
                          disabled={user.email === 'admin@telugunewspulse.com'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-48 text-center text-muted-foreground italic">
                    వినియోగదారులు ఎవరూ లేరు.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}