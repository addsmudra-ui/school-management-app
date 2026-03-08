"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, UserPlus, CheckCircle2, XCircle, Clock, Trash2, Search, MapPin } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { UserProfile, STATES, LOCATIONS_BY_STATE } from "@/lib/mock-data";
import { UserService } from "@/lib/storage";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function AdminUsers() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [search, setSearch] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const { toast } = useToast();

  // Add User Form State
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newState, setNewState] = useState("");
  const [newDistrict, setNewDistrict] = useState("");
  const [newMandal, setNewMandal] = useState("");

  useEffect(() => {
    setUsers(UserService.getAll());
    const handleUpdate = () => setUsers(UserService.getAll());
    window.addEventListener('mandalPulse_usersChanged', handleUpdate);
    return () => window.removeEventListener('mandalPulse_usersChanged', handleUpdate);
  }, []);

  const handleStatusChange = (id: string, status: 'approved' | 'rejected') => {
    UserService.update(id, { status });
    toast({
      title: status === 'approved' ? "User Approved" : "User Rejected",
      description: `రిపోర్టర్ స్థితి విజయవంతంగా ${status === 'approved' ? 'ఆమోదించబడింది' : 'తిరస్కరించబడింది'}.`,
    });
  };

  const handleAddUser = () => {
    if (!newName || !newPhone || !newState || !newDistrict || !newMandal) {
      toast({ title: "Error", description: "All fields are required", variant: "destructive" });
      return;
    }

    const newUser: UserProfile = {
      id: "REP" + Date.now(),
      name: newName,
      phone: newPhone,
      role: 'reporter',
      status: 'approved',
      location: { state: newState, district: newDistrict, mandal: newMandal }
    };

    UserService.add(newUser);
    setIsAddDialogOpen(false);
    toast({ title: "Success", description: "కొత్త రిపోర్టర్ విజయవంతంగా సృష్టించబడ్డారు." });
    
    // Reset
    setNewName("");
    setNewPhone("");
    setNewState("");
    setNewDistrict("");
    setNewMandal("");
  };

  const filtered = users.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) || 
    u.phone.includes(search) ||
    u.role.includes(search)
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline tracking-tight">వినియోగదారుల నిర్వహణ</h1>
          <p className="text-muted-foreground mt-1">రిపోర్టర్ల ఆమోదం మరియు కొత్త రిపోర్టర్ల సృష్టి ఇక్కడ చేయవచ్చు.</p>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 shadow-lg shadow-primary/20 h-11">
              <UserPlus className="w-4 h-4" />
              కొత్త రిపోర్టర్‌ను చేర్చండి
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">రిపోర్టర్‌ను సృష్టించండి</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>పేరు (Name)</Label>
                <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="పూర్తి పేరు" />
              </div>
              <div className="space-y-2">
                <Label>ఫోన్ నంబర్ (User ID)</Label>
                <Input value={newPhone} onChange={(e) => setNewPhone(e.target.value)} placeholder="10 అంకెల నంబర్" />
              </div>
              <div className="space-y-2">
                <Label>రాష్ట్రం</Label>
                <Select onValueChange={(v) => { setNewState(v); setNewDistrict(""); setNewMandal(""); }} value={newState}>
                  <SelectTrigger><SelectValue placeholder="రాష్ట్రం ఎంచుకోండి" /></SelectTrigger>
                  <SelectContent>{STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>జిల్లా</Label>
                  <Select onValueChange={(v) => { setNewDistrict(v); setNewMandal(""); }} value={newDistrict} disabled={!newState}>
                    <SelectTrigger><SelectValue placeholder="జిల్లా" /></SelectTrigger>
                    <SelectContent>
                      {newState && Object.keys(LOCATIONS_BY_STATE[newState]).map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>మండలం</Label>
                  <Select onValueChange={setNewMandal} value={newMandal} disabled={!newDistrict}>
                    <SelectTrigger><SelectValue placeholder="మండలం" /></SelectTrigger>
                    <SelectContent>
                      {newDistrict && LOCATIONS_BY_STATE[newState][newDistrict].map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>రద్దు</Button>
              <Button onClick={handleAddUser}>రిపోర్టర్‌ను సృష్టించు</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input 
          placeholder="పేరు లేదా నంబర్ ద్వారా వెతకండి..." 
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
                <TableHead className="font-bold py-4 pl-6">పేరు & నంబర్</TableHead>
                <TableHead className="font-bold">పాత్ర (Role)</TableHead>
                <TableHead className="font-bold">ప్రాంతం (Location)</TableHead>
                <TableHead className="font-bold">స్థితి (Status)</TableHead>
                <TableHead className="font-bold text-right pr-6">చర్యలు</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length > 0 ? (
                filtered.map((user) => (
                  <TableRow key={user.id} className="hover:bg-muted/10 transition-colors">
                    <TableCell className="pl-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold">{user.name}</span>
                        <span className="text-xs text-muted-foreground">{user.phone}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">{user.role}</Badge>
                    </TableCell>
                    <TableCell>
                      {user.location ? (
                        <div className="flex items-center gap-1 text-xs">
                          <MapPin className="w-3 h-3 text-primary" />
                          {user.location.mandal}, {user.location.district}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">Global</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="secondary" 
                        className={cn(
                          "font-normal",
                          user.status === 'approved' ? "bg-emerald-50 text-emerald-700" :
                          user.status === 'pending' ? "bg-amber-50 text-amber-700" :
                          "bg-rose-50 text-rose-700"
                        )}
                      >
                        {user.status.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <div className="flex justify-end gap-2">
                        {user.status === 'pending' && (
                          <>
                            <Button 
                              variant="outline" 
                              size="icon" 
                              className="h-8 w-8 text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                              onClick={() => handleStatusChange(user.id, 'approved')}
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="icon" 
                              className="h-8 w-8 text-destructive border-destructive/20 hover:bg-destructive/10"
                              onClick={() => handleStatusChange(user.id, 'rejected')}
                            >
                              <XCircle className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-48 text-center text-muted-foreground">
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
