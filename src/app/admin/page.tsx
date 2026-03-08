"use client";

import { useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Clock, Eye, ShieldCheck, Star, Edit3, Trash2, Save, User as UserIcon } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { MOCK_NEWS, NewsPost, ReporterRole } from "@/lib/mock-data";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export default function AdminPage() {
  const [news, setNews] = useState<NewsPost[]>(MOCK_NEWS);
  const [editingPost, setEditingPost] = useState<NewsPost | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { toast } = useToast();

  const handleAction = (id: string, action: 'approve' | 'reject') => {
    setNews(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, status: action === 'approve' ? 'approved' : 'rejected' };
      }
      return item;
    }));

    toast({
      title: action === 'approve' ? "Approved (Success)" : "Rejected",
      description: `వార్తలు విజయవంతంగా ${action === 'approve' ? 'ఆమోదించబడ్డాయి' : 'తిరస్కరించబడ్డాయి'}.`,
      variant: action === 'approve' ? "default" : "destructive"
    });
  };

  const openEditDialog = (post: NewsPost) => {
    setEditingPost({ ...post });
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = () => {
    if (!editingPost) return;
    setNews(prev => prev.map(n => n.id === editingPost.id ? editingPost : n));
    setIsEditDialogOpen(false);
    toast({
      title: "వార్త సేవ్ చేయబడింది",
      description: "మార్పులు విజయవంతంగా అప్‌డేట్ చేయబడ్డాయి.",
    });
  };

  const handleApproveFromEdit = () => {
    if (!editingPost) return;
    const updatedPost = { ...editingPost, status: 'approved' as const };
    setNews(prev => prev.map(n => n.id === updatedPost.id ? updatedPost : n));
    setIsEditDialogOpen(false);
    toast({
      title: "Approved (Success)",
      description: "వార్త ఆమోదించబడింది మరియు ప్రచురించబడింది.",
    });
  };

  const pending = news.filter(n => n.status === 'pending');
  const approved = news.filter(n => n.status === 'approved');

  return (
    <main className="min-h-screen bg-background pt-20 pb-24 md:pb-8">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-primary p-2 rounded-xl text-white shadow-lg shadow-primary/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h1 className="text-3xl font-bold font-headline text-foreground tracking-tight">నిర్వాహక డాష్‌బోర్డ్</h1>
          </div>
          <div className="flex gap-4">
            <Card className="p-4 bg-white border-none shadow-sm flex items-center gap-3 min-w-[140px]">
              <Clock className="text-amber-500 w-5 h-5" />
              <div>
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Pending</p>
                <p className="text-xl font-bold">{pending.length}</p>
              </div>
            </Card>
            <Card className="p-4 bg-white border-none shadow-sm flex items-center gap-3 min-w-[140px]">
              <CheckCircle2 className="text-emerald-500 w-5 h-5" />
              <div>
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Approved Today</p>
                <p className="text-xl font-bold">{approved.length}</p>
              </div>
            </Card>
          </div>
        </div>

        <Card className="border-none shadow-xl overflow-hidden rounded-2xl">
          <CardHeader className="bg-white border-b border-muted py-6">
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-500" />
              పెండింగ్ వార్తలు
            </CardTitle>
            <CardDescription>రిపోర్టర్లు పంపిన వార్తలను సమీక్షించండి మరియు ఆమోదించండి.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="font-bold py-4">ముఖ్యాంశం (Headline)</TableHead>
                  <TableHead className="font-bold">రిపోర్టర్</TableHead>
                  <TableHead className="font-bold">ప్రాంతం (Location)</TableHead>
                  <TableHead className="font-bold">ID / కోడ్</TableHead>
                  <TableHead className="font-bold text-right pr-6">చర్యలు (Actions)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pending.length > 0 ? (
                  pending.map((post) => (
                    <TableRow key={post.id} className="hover:bg-muted/10 transition-colors">
                      <TableCell className="font-medium max-w-xs truncate pl-6">{post.title}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-bold">{post.author_name}</span>
                          <span className="text-[10px] text-muted-foreground">{post.author_id}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="font-normal bg-primary/5 text-primary border-primary/10">
                          {post.location.mandal}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{post.unique_code}</TableCell>
                      <TableCell className="text-right pr-6">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className="h-9 w-9 text-primary border-primary/20 hover:bg-primary/5"
                            onClick={() => openEditDialog(post)}
                          >
                            <Edit3 className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className="h-9 w-9 text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                            onClick={() => handleAction(post.id, 'approve')}
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className="h-9 w-9 text-destructive border-destructive/20 hover:bg-destructive/10"
                            onClick={() => handleAction(post.id, 'reject')}
                          >
                            <XCircle className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-48 text-center text-muted-foreground">
                      <div className="flex flex-col items-center gap-2">
                        <CheckCircle2 className="w-10 h-10 text-emerald-200" />
                        <p>ప్రస్తుతానికి పెండింగ్ వార్తలు ఏవీ లేవు.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Edit & Approve Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <Edit3 className="w-6 h-6 text-primary" />
              వార్తను సమీక్షించండి
            </DialogTitle>
            <DialogDescription>రిపోర్టర్ పంపిన వివరాలను ఇక్కడ మార్చవచ్చు మరియు ర్యాంకింగ్ ఇవ్వవచ్చు.</DialogDescription>
          </DialogHeader>
          
          {editingPost && (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">రిపోర్టర్ ర్యాంక్ (Rank)</Label>
                  <Select 
                    value={editingPost.author_role || "Reporter"} 
                    onValueChange={(val: ReporterRole) => setEditingPost({...editingPost, author_role: val})}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="ర్యాంక్ ఎంచుకోండి" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Reporter">Reporter</SelectItem>
                      <SelectItem value="Sr. Reporter">Sr. Reporter</SelectItem>
                      <SelectItem value="Desk Incharge">Desk Incharge</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">స్టార్ రేటింగ్ (Rating)</Label>
                  <Select 
                    value={String(editingPost.author_stars || 1)} 
                    onValueChange={(val) => setEditingPost({...editingPost, author_stars: parseInt(val)})}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="స్టార్స్ ఎంచుకోండి" />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5].map(s => (
                        <SelectItem key={s} value={String(s)}>
                          <div className="flex items-center gap-1">
                            {s} Stars <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">ముఖ్యాంశం (Headline)</Label>
                <Input 
                  value={editingPost.title} 
                  onChange={(e) => setEditingPost({...editingPost, title: e.target.value})}
                  className="font-bold text-lg h-12"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">వార్త వివరాలు (Content)</Label>
                <Textarea 
                  value={editingPost.content} 
                  onChange={(e) => setEditingPost({...editingPost, content: e.target.value})}
                  className="min-h-[200px] leading-relaxed"
                />
              </div>

              <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-xl border border-muted">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <UserIcon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-bold">{editingPost.author_name} ({editingPost.author_id})</p>
                  <p className="text-xs text-muted-foreground">{editingPost.location.mandal}, {editingPost.location.district}</p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setIsEditDialogOpen(false)}>
              రద్దు చేయి
            </Button>
            <Button variant="secondary" className="flex-1 gap-2" onClick={handleSaveEdit}>
              <Save className="w-4 h-4" />
              కేవలం సేవ్ చేయి
            </Button>
            <Button className="flex-1 gap-2 bg-emerald-600 hover:bg-emerald-700" onClick={handleApproveFromEdit}>
              <CheckCircle2 className="w-4 h-4" />
              ఆమోదించు (Approve)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
