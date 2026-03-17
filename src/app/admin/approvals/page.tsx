
'use client';

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Clock, Edit3, Eye, EyeOff, Trash2, Newspaper } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { ReporterRole, NewsPost } from "@/lib/mock-data";
import { NewsService } from "@/lib/storage";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, where, orderBy, limit } from "firebase/firestore";
import { cn } from "@/lib/utils";

export default function ApprovalsPage() {
  const firestore = useFirestore();
  const { toast } = useToast();

  const [editingPost, setEditingPost] = useState<any>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  // Queries
  const pendingQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'pending_news_posts'),
      where('status', '==', 'pending')
    );
  }, [firestore]);

  const liveQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'approved_news_posts'),
      orderBy('timestamp', 'desc'),
      limit(100)
    );
  }, [firestore]);

  const { data: pendingNews, isLoading: isPendingLoading } = useCollection(pendingQuery);
  const { data: liveNews, isLoading: isLiveLoading } = useCollection(liveQuery);

  const handleAction = (id: string, action: 'approve' | 'reject', postData: any) => {
    if (action === 'approve') {
      NewsService.approve(firestore!, id, postData);
      toast({ title: "Approved", description: "వార్తలు ఆమోదించబడ్డాయి." });
    } else {
      if (!rejectionReason) {
        toast({ variant: "destructive", title: "Error", description: "దయచేసి తిరస్కరణకు కారణం రాయండి." });
        return;
      }
      NewsService.reject(firestore!, id, rejectionReason);
      setRejectionReason("");
      toast({ variant: "destructive", title: "Rejected", description: "వార్తలు తిరస్కరించబడ్డాయి." });
    }
    setIsEditDialogOpen(false);
  };

  const toggleVisibility = (post: NewsPost) => {
    if (!firestore) return;
    NewsService.toggleVisibility(firestore, post.id, post.visibility || 'live');
    toast({ title: "Visibility Updated" });
  };

  const deleteNews = (id: string) => {
    if (!firestore || !confirm("ఈ వార్తను శాశ్వతంగా తొలగించాలనుకుంటున్నారా?")) return;
    NewsService.deleteApproved(firestore, id);
    toast({ title: "Deleted", variant: "destructive" });
  };

  const openEditDialog = (post: any) => {
    setEditingPost({ ...post });
    setRejectionReason("");
    setIsEditDialogOpen(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold font-headline tracking-tight">వార్తల నిర్వహణ (News Desk)</h1>
        <p className="text-muted-foreground mt-1">రిపోర్టర్ల వార్తలను సమీక్షించండి మరియు లైవ్ కంటెంట్‌ను నిర్వహించండి.</p>
      </div>

      <Tabs defaultValue="pending" className="space-y-6">
        <TabsList className="bg-white p-1 rounded-2xl shadow-sm border">
          <TabsTrigger value="pending" className="rounded-xl px-8">
            <Clock className="w-4 h-4 mr-2" />
            పెండింగ్ ({pendingNews?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="live" className="rounded-xl px-8">
            <Newspaper className="w-4 h-4 mr-2" />
            లైవ్ వార్తలు ({liveNews?.length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <Card className="border-none shadow-xl overflow-hidden rounded-2xl">
            <CardHeader className="bg-white border-b py-6">
              <CardTitle className="text-xl font-bold">రివ్యూ క్యూ (Review Queue)</CardTitle>
              <CardDescription>రిపోర్టర్లు పంపిన కొత్త వార్తలను ఇక్కడ చూడవచ్చు.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead className="py-4 pl-6">ముఖ్యాంశం (Headline)</TableHead>
                    <TableHead>రిపోర్టర్</TableHead>
                    <TableHead>ప్రాంతం</TableHead>
                    <TableHead className="text-right pr-6">చర్యలు</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingNews && pendingNews.length > 0 ? (
                    pendingNews.map((post) => (
                      <TableRow key={post.id}>
                        <TableCell className="font-medium max-w-xs truncate pl-6">{post.title}</TableCell>
                        <TableCell className="font-bold">{post.author_name}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="bg-primary/5 text-primary">
                            {post.location.mandal}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right pr-6">
                          <Button variant="outline" size="sm" onClick={() => openEditDialog(post)} className="rounded-lg">
                            Review & Action
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="h-48 text-center text-muted-foreground">
                        {isPendingLoading ? "Loading..." : "పెండింగ్ వార్తలు ఏవీ లేవు."}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="live">
          <Card className="border-none shadow-xl overflow-hidden rounded-2xl">
            <CardHeader className="bg-white border-b py-6">
              <CardTitle className="text-xl font-bold">ప్రచురించబడిన వార్తలు</CardTitle>
              <CardDescription>యాప్‌లో కనిపిస్తున్న వార్తలను ఇక్కడ నిర్వహించండి.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead className="py-4 pl-6">ముఖ్యాంశం</TableHead>
                    <TableHead>స్థితి</TableHead>
                    <TableHead>Engagement</TableHead>
                    <TableHead className="text-right pr-6">చర్యలు</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {liveNews && liveNews.length > 0 ? (
                    liveNews.map((post) => (
                      <TableRow key={post.id}>
                        <TableCell className="font-medium max-w-xs truncate pl-6">{post.title}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={post.visibility === 'hidden' ? "secondary" : "default"}
                            className={cn(post.visibility === 'hidden' ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700")}
                          >
                            {post.visibility === 'hidden' ? 'Hidden' : 'Live'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs font-bold text-muted-foreground">
                          {post.likes} Likes • {post.commentsCount} Comments
                        </TableCell>
                        <TableCell className="text-right pr-6">
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="outline" 
                              size="icon" 
                              onClick={() => toggleVisibility(post)}
                              title={post.visibility === 'hidden' ? "Make Live" : "Hide News"}
                            >
                              {post.visibility === 'hidden' ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                            </Button>
                            <Button 
                              variant="destructive" 
                              size="icon" 
                              onClick={() => deleteNews(post.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="h-48 text-center text-muted-foreground">
                        {isLiveLoading ? "Loading..." : "లైవ్ వార్తలు ఏవీ లేవు."}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">వార్తను సమీక్షించండి</DialogTitle>
          </DialogHeader>
          
          {editingPost && (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Rank & Rating</Label>
                  <Input value={`${editingPost.author_role} (${editingPost.author_stars} Stars)`} disabled className="bg-muted" />
                </div>
                <div className="space-y-2">
                  <Label>Reporter ID</Label>
                  <Input value={editingPost.author_id} disabled className="bg-muted" />
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

              <div className="pt-4 border-t space-y-4">
                <Label className="text-destructive font-bold uppercase text-[10px] tracking-widest">తిరస్కరణ కారణం (Only if rejecting)</Label>
                <Textarea 
                  placeholder="వార్తను ఎందుకు తిరస్కరిస్తున్నారో ఇక్కడ రాయండి... (రిపోర్టర్‌కు కనిపిస్తుంది)" 
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="bg-rose-50/50 border-rose-100"
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-3">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>రద్దు</Button>
            <Button 
              variant="destructive" 
              className="px-8" 
              onClick={() => handleAction(editingPost.id, 'reject', editingPost)}
            >
              తిరస్కరించు (Reject)
            </Button>
            <Button 
              className="bg-emerald-600 hover:bg-emerald-700 px-8" 
              onClick={() => handleAction(editingPost.id, 'approve', editingPost)}
            >
              ఆమోదించు (Approve)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
