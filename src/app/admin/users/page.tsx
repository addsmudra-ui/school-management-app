"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, UserPlus, Trash2, Search, MapPin, Loader2, ShieldCheck, ShieldAlert, Phone } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { UserProfile, STATES, LOCATIONS_BY_STATE } from "@/lib/mock-data";
import { UserService } from "@/lib/storage";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, limit, orderBy } from "firebase/firestore";

export default function AdminUsers() {
  const firestore = useFirestore();
  const [search, setSearch] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const { toast } = useToast();

  const usersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'users'), orderBy('name', 'asc'), limit(500));
  }, [firestore]);

  const { data: users, isLoading } = useCollection<UserProfile>(usersQuery);

  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newState, setNewState] = useState("");
  const [newDistrict, setNewDistrict] = useState("");
  const [newMandal, setNewMandal] = useState("");
  const [newRole, setNewRole] = useState<'reporter' | 'admin' | 'user' | 'editor'>('reporter');
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
    if (!firestore || !newName || !newPhone || !newState || !newDistrict || !newMandal) {
      toast({ title: "Validation Error", description: "Please fill all required fields.", variant: "destructive" });
      return;
    }

    setIsCreating(true);
    const newUser: UserProfile = {
      id: "MANUAL_" + Date.now(),
      name: newName,
      phone: newPhone,
      role: newRole,
      status: 'approved',
      location: { state: newState, district: newDistrict, mandal: newMandal }
    };

    try {
      await UserService.create(firestore, newUser);
      setIsAddDialogOpen(false);
      toast({ title: "వినియోగదారు చేర్చబడ్డారు", description: `Successfully created ${newRole} account.` });
      setNewName(""); setNewPhone(""); setNewState(""); setNewDistrict(""); setNewMandal("");
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setIsCreating(false);
    }
  };

  const filtered = users?.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) || 
    u.phone.includes(search) ||
    u.role.includes(search)
  ) || [];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline tracking-tight">రిపోర్టర్ల నిర్వహణ (Staff)</h1>
          <p className="text-muted-foreground mt-1">ప్లాట్‌ఫారమ్ రిపోర్టర్ల జాబితాను ఇక్కడ చూడవచ్చు.</p>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 shadow-lg shadow-primary/20 h-11 rounded-xl">
              <UserPlus className="w-4 h-4" />
              రిపోర్టర్‌ను చేర్చండి
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md rounded-3xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">కొత్త వినియోగదారు</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>పేరు (Name)</Label>
                <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="పూర్తి పేరు" className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label>ఫోన్ నంబర్</Label>
                <Input value={newPhone} onChange={(e) => setNewPhone(e.target.value)} placeholder="10 అంకెల నంబర్" className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label>పాత్ర (Role)</Label>
                <Select onValueChange={(v: any) => setNewRole(v)} value={newRole}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="reporter">రిపోర్టర్ (Reporter)</SelectItem>
                    <SelectItem value="user">పాఠకుడు (User)</SelectItem>
                    <SelectItem value="admin">అడ్మిన్ (Admin)</SelectItem>
                    <SelectItem value="editor">ఎడిటర్ (Editor)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>రాష్ట్రం</Label>
                <Select onValueChange={(v) => { setNewState(v); setNewDistrict(""); setNewMandal(""); }} value={newState}>
                  <SelectTrigger className="rounded-xl"><SelectValue placeholder="రాష్ట్రం" /></SelectTrigger>
                  <SelectContent>{STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>జిల్లా</Label>
                  <Select onValueChange={(v) => { setNewDistrict(v); setNewMandal(""); }} value={newDistrict} disabled={!newState}>
                    <SelectTrigger className="rounded-xl"><SelectValue placeholder="జిల్లా" /></SelectTrigger>
                    <SelectContent>
                      {newState && Object.keys(LOCATIONS_BY_STATE[newState]).map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>మండలం</Label>
                  <Select onValueChange={setNewMandal} value={newMandal} disabled={!newDistrict}>
                    <SelectTrigger className="rounded-xl"><SelectValue placeholder="మండలం" /></SelectTrigger>
                    <SelectContent>
                      {newDistrict && LOCATIONS_BY_STATE[newState][newDistrict].map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" className="rounded-xl" onClick={() => setIsAddDialogOpen(false)}>రద్దు</Button>
              <Button className="rounded-xl" onClick={handleAddUser} disabled={isCreating}>
                {isCreating ? <Loader2 className="animate-spin mr-2" /> : null}
                సృష్టించు
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input 
          placeholder="రిపోర్టర్ పేరు లేదా ఫోన్ నంబర్ ద్వారా వెతకండి..." 
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
                <TableHead className="font-bold py-4 pl-6">రిపోర్టర్ (Name & Phone)</TableHead>
                <TableHead className="font-bold">పాత్ర (Role)</TableHead>
                <TableHead className="font-bold">ప్రాంతం (Location)</TableHead>
                <TableHead className="font-bold text-center">స్థితి (Status)</TableHead>
                <TableHead className="font-bold text-right pr-6">చర్యలు (Actions)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="h-48 text-center text-muted-foreground">వినియోగదారులను లోడ్ చేస్తోంది...</TableCell></TableRow>
              ) : filtered.length > 0 ? (
                filtered.map((user) => (
                  <TableRow key={user.id} className="hover:bg-muted/10 transition-colors">
                    <TableCell className="pl-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0">
                          {user.name[0]}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-bold text-slate-900 truncate">{user.name}</span>
                          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {user.phone}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        {user.role === 'admin' ? <ShieldAlert className="w-3.5 h-3.5 text-rose-500" /> : <ShieldCheck className="w-3.5 h-3.5 text-primary" />}
                        <Badge variant="outline" className="capitalize text-[10px] font-bold border-muted-foreground/20">{user.role}</Badge>
                      </div>
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
                          />
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-9 w-9 text-muted-foreground hover:text-destructive rounded-full"
                          onClick={() => handleDeleteUser(user.id, user.name)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-48 text-center text-muted-foreground italic">
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