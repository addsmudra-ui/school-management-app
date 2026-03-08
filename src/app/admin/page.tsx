"use client";

import { useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Clock, Eye, ShieldCheck } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { MOCK_NEWS, NewsPost } from "@/lib/mock-data";

export default function AdminPage() {
  const [news, setNews] = useState<NewsPost[]>(MOCK_NEWS);
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
                      <TableCell>{post.author_name}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="font-normal bg-primary/5 text-primary border-primary/10">
                          {post.location.mandal}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{post.unique_code}</TableCell>
                      <TableCell className="text-right pr-6">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="icon" className="h-9 w-9 text-primary border-primary/20 hover:bg-primary/5">
                            <Eye className="w-4 h-4" />
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
    </main>
  );
}
