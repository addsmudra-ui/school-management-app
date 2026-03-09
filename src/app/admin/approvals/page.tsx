'use client';

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Clock, Edit3 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { ReporterRole } from "@/lib/mock-data";
import { NewsService } from "@/lib/storage";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, where } from "firebase/firestore";

export default function ApprovalsPage() {
  const firestore = useFirestore();
  const { toast } = useToast();

  const [editingPost, setEditingPost] = useState<any>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Simplified query: No orderBy to prevent Index Required errors in the prototype
  const pendingQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'pending_news_posts'),
      where('status', '==', 'pending')
    );
  }, [firestore]);

  const { data: pendingNews, isLoading } = useCollection(pendingQuery);

  const handleAction = (id: string, action: 'approve' | 'reject', postData: any) => {
    if (action === 'approve') {
      NewsService.approve(firestore, id, postData);
    } else {
      NewsService.reject(firestore, id);
    }
    toast({
      title: action === 'approve' ? "Approved (Success)" : "Rejected",
      description: `వార్తలు విజయవంతంగా ${action === 'approve' ? 'ఆమోదించబడ్డాయి' : 'తిరస్కరించబడ్డాయి'}.`,
      variant: action === 'approve' ? "default" : "destructive"
    });
  };

  const openEditDialog = (post: any) => {
    setEditingPost({ ...post });
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = () => {
    if (!editingPost) return;
    NewsService.update(firestore, editingPost.id, { ...editingPost });
    setIsEditDialogOpen(false);
    toast({ title: "Saved", description: "Changes updated." });
  };

  const handleApproveFromEdit = () => {
    if (!editingPost) return;
    NewsService.approve(firestore, editingPost.id, { ...editingPost });
    setIsEditDialogOpen(false);
    toast({ title: "Approved", description: "News published successfully." });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold font-headline tracking-tight">ఆమోదాల క్యూ (Approvals)</h1>
        <p className="text-muted-foreground mt-1">రిపోర్టర్ల నుండి వచ్చిన వార్తలను సమీక్షించండి.</p>
      </div>

      <Card className="border-none shadow-xl overflow-hidden rounded-2xl">
        <CardHeader className="bg-white border-b border-muted py-6">
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-500" />
            పెండింగ్ వార్తలు ({pendingNews?.length || 0})
          </CardTitle>
          <CardDescription>రిపోర్టర్లు పంపిన వార్తలను సమీక్షించండి మరియు ఆమోదించండి.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="font-bold py-4 pl-6">ముఖ్యాంశం (Headline)</TableHead>
                <TableHead className="font-bold">రిపోర్టర్</TableHead>
                <TableHead className="font-bold">ప్రాంతం (Location)</TableHead>
                <TableHead className="font-bold">ID / కోడ్</TableHead>
                <TableHead className="font-bold text-right pr-6">చర్యలు</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingNews && pendingNews.length > 0 ? (
                pendingNews.map((post) => (
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
                        <Button variant="outline" size="icon" onClick={() => openEditDialog(post)} className="h-9 w-9">
                          <Edit3 className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="icon" onClick={() => handleAction(post.id, 'approve', post)} className="h-9 w-9 text-emerald-600">
                          <CheckCircle2 className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="icon" onClick={() => handleAction(post.id, 'reject', post)} className="h-9 w-9 text-destructive">
                          <XCircle className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-48 text-center text-muted-foreground">
                    {isLoading ? "Loading news..." : "పెండింగ్ వార్తలు ఏవీ లేవు."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">వార్తను సమీక్షించండి</DialogTitle>
          </DialogHeader>
          
          {editingPost && (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>రిపోర్టర్ ర్యాంక్ (Rank)</Label>
                  <Select 
                    value={editingPost.author_role || "Reporter"} 
                    onValueChange={(val: ReporterRole) => setEditingPost({...editingPost, author_role: val})}
                  >
                    <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Reporter">Reporter</SelectItem>
                      <SelectItem value="Sr. Reporter">Sr. Reporter</SelectItem>
                      <SelectItem value="Desk Incharge">Desk Incharge</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>స్టార్ రేటింగ్ (Rating)</Label>
                  <Select 
                    value={String(editingPost.author_stars || 1)} 
                    onValueChange={(val) => setEditingPost({...editingPost, author_stars: parseInt(val)})}
                  >
                    <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5].map(s => <SelectItem key={s} value={String(s)}>{s} Stars</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>ముఖ్యాంశం (Headline)</Label>
                <Input value={editingPost.title} onChange={(e) => setEditingPost({...editingPost, title: e.target.value})} className="font-bold" />
              </div>

              <div className="space-y-2">
                <Label>వార్త వివరాలు (Content)</Label>
                <Textarea value={editingPost.content} onChange={(e) => setEditingPost({...editingPost, content: e.target.value})} className="min-h-[200px]" />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>రద్దు</Button>
            <Button variant="secondary" onClick={handleSaveEdit}>కేవలం సేవ్ చేయి</Button>
            <Button className="bg-emerald-600" onClick={handleApproveFromEdit}>ఆమోదించు (Approve)</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}