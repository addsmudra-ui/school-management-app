"use client";

import { useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Clock, Eye } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";

const INITIAL_PENDING = [
  { id: "p1", title: "Heavy Rains Predicted for Warangal District", author: "Rahul K.", mandal: "Hanamkonda", date: "2 mins ago" },
  { id: "p2", title: "New Health Center Opening in Kukatpally", author: "Sneha V.", mandal: "Kukatpally", date: "15 mins ago" },
  { id: "p3", title: "District Level Sports Meet Announced", author: "Prasad G.", mandal: "Inavole", date: "1 hour ago" },
];

export default function AdminPage() {
  const [pending, setPending] = useState(INITIAL_PENDING);
  const { toast } = useToast();

  const handleAction = (id: string, action: 'approve' | 'reject') => {
    setPending(prev => prev.filter(item => item.id !== id));
    toast({
      title: action === 'approve' ? "Approved" : "Rejected",
      description: `Post has been ${action}d successfully.`,
      variant: action === 'approve' ? "default" : "destructive"
    });
  };

  return (
    <main className="min-h-screen bg-background pt-20 pb-24 md:pb-8">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold font-headline text-foreground">Moderation Dashboard</h1>
          <div className="flex gap-4">
            <Card className="p-4 bg-white border-none shadow-sm flex items-center gap-3">
              <Clock className="text-amber-500 w-5 h-5" />
              <div>
                <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Pending</p>
                <p className="text-xl font-bold">{pending.length}</p>
              </div>
            </Card>
            <Card className="p-4 bg-white border-none shadow-sm flex items-center gap-3">
              <CheckCircle2 className="text-emerald-500 w-5 h-5" />
              <div>
                <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Approved Today</p>
                <p className="text-xl font-bold">24</p>
              </div>
            </Card>
          </div>
        </div>

        <Card className="border-none shadow-lg overflow-hidden">
          <CardHeader className="bg-white border-b border-muted">
            <CardTitle className="text-xl">Pending Submissions</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="font-bold">News Headline</TableHead>
                  <TableHead className="font-bold">Reporter</TableHead>
                  <TableHead className="font-bold">Mandal</TableHead>
                  <TableHead className="font-bold">Submitted</TableHead>
                  <TableHead className="font-bold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pending.length > 0 ? (
                  pending.map((post) => (
                    <TableRow key={post.id} className="hover:bg-muted/20 transition-colors">
                      <TableCell className="font-medium max-w-xs truncate">{post.title}</TableCell>
                      <TableCell>{post.author}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="font-normal">{post.mandal}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">{post.date}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="icon" className="h-8 w-8 text-primary">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className="h-8 w-8 text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                            onClick={() => handleAction(post.id, 'approve')}
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className="h-8 w-8 text-destructive border-destructive/20 hover:bg-destructive/10"
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
                    <TableCell colSpan={5} className="h-40 text-center text-muted-foreground">
                      No pending reviews. Good job!
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
