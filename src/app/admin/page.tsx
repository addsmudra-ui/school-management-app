
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, ShieldCheck, TrendingUp, Users, Newspaper, Bell, Database } from "lucide-react";
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent 
} from "@/components/ui/chart";
import { Bar, BarChart, XAxis, YAxis } from "recharts";
import { cn } from "@/lib/utils";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, limit } from "firebase/firestore";
import { AdminService } from "@/lib/storage";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

const chartData = [
  { name: "Mon", posts: 4 },
  { name: "Tue", posts: 7 },
  { name: "Wed", posts: 5 },
  { name: "Thu", posts: 12 },
  { name: "Fri", posts: 8 },
  { name: "Sat", posts: 15 },
  { name: "Sun", posts: 10 },
];

export default function AdminDashboard() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isSeeding, setIsSeeding] = useState(false);

  const pendingQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'pending_news_posts'), limit(100));
  }, [firestore]);

  const approvedQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'approved_news_posts'), orderBy('timestamp', 'desc'), limit(5));
  }, [firestore]);

  const usersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'users'), limit(500));
  }, [firestore]);

  const { data: pendingNews } = useCollection(pendingQuery);
  const { data: recentApprovals } = useCollection(approvedQuery);
  const { data: users } = useCollection(usersQuery);

  const pendingCount = pendingNews?.filter(n => n.status === 'pending').length || 0;
  const reportersCount = users?.filter(u => u.role === 'reporter').length || 0;

  const handleSeedData = async () => {
    if (!firestore) return;
    setIsSeeding(true);
    try {
      await AdminService.seedDemoNews(firestore);
      toast({
        title: "డేటా సిద్ధం చేయబడింది",
        description: "10 డెమో వార్తలు విజయవంతంగా చేర్చబడ్డాయి."
      });
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to seed data."
      });
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline tracking-tight">నిర్వాహక డాష్‌బోర్డ్</h1>
          <p className="text-muted-foreground mt-1">MandalPulse ప్లాట్‌ఫారమ్ గణాంకాలను ఇక్కడ చూడవచ్చు.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            className="rounded-xl border-primary/20 text-primary hover:bg-primary/5"
            onClick={handleSeedData}
            disabled={isSeeding}
          >
            <Database className={cn("w-4 h-4 mr-2", isSeeding && "animate-spin")} />
            {isSeeding ? "Seeding..." : "Seed Demo News"}
          </Button>
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl shadow-sm border border-muted">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-xs font-bold text-muted-foreground uppercase">సిస్టమ్ ఆన్‌లైన్</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard 
          title="మొత్తం ఆమోదాలు" 
          value={recentApprovals?.length || 0} 
          icon={Newspaper} 
          color="text-primary" 
          bgColor="bg-primary/10"
          desc="Recently live"
        />
        <StatsCard 
          title="పెండింగ్ రివ్యూలు" 
          value={pendingCount} 
          icon={Clock} 
          color="text-amber-500" 
          bgColor="bg-amber-500/10"
          desc={pendingCount > 0 ? "Action required" : "All caught up"}
        />
        <StatsCard 
          title="రిపోర్టర్లు" 
          value={reportersCount} 
          icon={Users} 
          color="text-indigo-500" 
          bgColor="bg-indigo-500/10"
          desc="Registered members"
        />
        <StatsCard 
          title="మొత్తం వినియోగదారులు" 
          value={users?.length || 0} 
          icon={Users} 
          color="text-rose-500" 
          bgColor="bg-rose-500/10"
          desc="Platform wide"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-none shadow-xl rounded-2xl overflow-hidden">
          <CardHeader className="bg-white pb-2">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              వార్తల ట్రెండ్ (Weekly Posts)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 h-[300px]">
            <ChartContainer config={{ posts: { label: "Posts", color: "hsl(var(--primary))" } }}>
              <BarChart data={chartData}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="posts" fill="var(--color-posts)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl rounded-2xl">
          <CardHeader>
            <CardTitle className="text-lg font-bold">ఇటీవలి ఆమోదాలు</CardTitle>
            <CardDescription>చివరిగా ఆమోదించబడిన వార్తలు.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentApprovals && recentApprovals.length > 0 ? (
              recentApprovals.map((post) => (
                <div key={post.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-muted/30 transition-colors">
                  <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold truncate">{post.title}</p>
                    <p className="text-[10px] text-muted-foreground uppercase">{post.author_name} • {post.location.mandal}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center py-8 text-muted-foreground italic">ఇంకా ఆమోదాలు ఏవీ లేవు.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatsCard({ title, value, icon: Icon, color, bgColor, desc }: any) {
  return (
    <Card className="border-none shadow-xl rounded-2xl overflow-hidden group hover:shadow-2xl transition-all duration-300">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={cn("p-3 rounded-xl", bgColor)}>
            <Icon className={cn("w-6 h-6", color)} />
          </div>
          <Badge variant="secondary" className="bg-emerald-50 text-emerald-600 border-none">Active</Badge>
        </div>
        <div>
          <p className="text-sm text-muted-foreground font-medium">{title}</p>
          <h3 className="text-3xl font-bold mt-1">{value}</h3>
          <p className="text-[10px] text-muted-foreground mt-2 font-semibold uppercase tracking-wider">{desc}</p>
        </div>
      </CardContent>
    </Card>
  );
}
