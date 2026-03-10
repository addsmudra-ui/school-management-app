"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, ShieldCheck, TrendingUp, Users, Newspaper, Bell, Database, Activity, ToggleLeft, ToggleRight } from "lucide-react";
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent 
} from "@/components/ui/chart";
import { Bar, BarChart, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";
import { useFirestore, useCollection, useDoc, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, limit, doc } from "firebase/firestore";
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

  // Real-time config for system status
  const configRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'config', 'admin');
  }, [firestore]);
  const { data: config } = useDoc(configRef);

  const pendingQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'pending_news_posts'), limit(100));
  }, [firestore]);

  const approvedQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'approved_news_posts'), orderBy('timestamp', 'desc'), limit(10));
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
        title: "సిస్టమ్ సిద్ధం చేయబడింది",
        description: "డెమో వార్తలు మరియు ప్రాంతాల డేటా (Locations) విజయవంతంగా చేర్చబడ్డాయి."
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

  const toggleStatus = () => {
    if (!firestore) return;
    const current = config?.systemStatus || 'online';
    const next = current === 'online' ? 'maintenance' : 'online';
    AdminService.updateSystemStatus(firestore, next);
    toast({ 
      title: "Zone Status Changed", 
      description: `App is now ${next.toUpperCase()}.` 
    });
  };

  const systemStatus = config?.systemStatus || 'online';

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
            className="rounded-xl border-primary/20 text-primary hover:bg-primary/5 h-11 px-6 shadow-sm"
            onClick={handleSeedData}
            disabled={isSeeding}
          >
            <Database className={cn("w-4 h-4 mr-2", isSeeding && "animate-spin")} />
            {isSeeding ? "Seeding..." : "Seed App Data"}
          </Button>
          
          <button 
            onClick={toggleStatus}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-2xl shadow-sm border transition-all h-11",
              systemStatus === 'online' ? "bg-emerald-50 border-emerald-100 text-emerald-700" : "bg-rose-50 border-rose-100 text-rose-700"
            )}
          >
            <div className={cn("w-2.5 h-2.5 rounded-full", systemStatus === 'online' ? "bg-emerald-500 animate-pulse" : "bg-rose-500")} />
            <span className="text-xs font-bold uppercase tracking-widest">
              సిస్టమ్ {systemStatus === 'online' ? 'ఆన్‌లైన్' : 'మెయింటెనెన్స్'}
            </span>
            {systemStatus === 'online' ? <ToggleRight className="w-5 h-5 ml-1" /> : <ToggleLeft className="w-5 h-5 ml-1" />}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard 
          title="మొత్తం ఆమోదాలు" 
          value={recentApprovals?.length || 0} 
          icon={Newspaper} 
          color="text-primary" 
          bgColor="bg-primary/10"
          desc="Recently live posts"
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
          icon={Activity} 
          color="text-rose-500" 
          bgColor="bg-rose-500/10"
          desc="Platform wide reach"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-none shadow-xl rounded-2xl overflow-hidden bg-white">
          <CardHeader className="bg-white pb-2 border-b border-slate-50">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  వార్తల ట్రెండ్ (Weekly Posts)
                </CardTitle>
                <CardDescription>వారపు వార్తా ప్రచురణల విశ్లేషణ</CardDescription>
              </div>
              <Badge variant="secondary" className="bg-primary/5 text-primary font-bold">LIVE</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-6 h-[350px]">
            <ChartContainer config={{ posts: { label: "Posts", color: "hsl(var(--primary))" } }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    fontSize={12}
                    tickMargin={8}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    fontSize={12}
                    tickMargin={8}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar 
                    dataKey="posts" 
                    fill="var(--color-posts)" 
                    radius={[6, 6, 0, 0]} 
                    barSize={40}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl rounded-2xl bg-white overflow-hidden">
          <CardHeader className="border-b border-slate-50">
            <CardTitle className="text-lg font-bold">ఇటీవలి ఆమోదాలు</CardTitle>
            <CardDescription>చివరిగా లైవ్ చేసిన 10 వార్తలు</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-50">
              {recentApprovals && recentApprovals.length > 0 ? (
                recentApprovals.map((post) => (
                  <div key={post.id} className="flex items-center gap-4 p-4 hover:bg-slate-50/80 transition-colors">
                    <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold truncate text-slate-900">{post.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-tight">{post.author_name}</span>
                        <div className="w-1 h-1 bg-slate-300 rounded-full" />
                        <span className="text-[10px] text-primary font-bold uppercase tracking-tight">{post.location.mandal}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-24 text-center space-y-3 opacity-40">
                  <Database className="w-12 h-12 text-slate-300" />
                  <p className="text-sm italic">ఇంకా ఆమోదాలు ఏవీ లేవు.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatsCard({ title, value, icon: Icon, color, bgColor, desc }: any) {
  return (
    <Card className="border-none shadow-xl rounded-2xl overflow-hidden group hover:shadow-2xl transition-all duration-300 bg-white">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={cn("p-3 rounded-2xl transition-transform group-hover:scale-110 duration-300", bgColor)}>
            <Icon className={cn("w-6 h-6", color)} />
          </div>
          <Badge variant="secondary" className="bg-slate-50 text-slate-500 border-none font-bold text-[10px]">REAL-TIME</Badge>
        </div>
        <div>
          <p className="text-sm text-muted-foreground font-bold uppercase tracking-wider">{title}</p>
          <div className="flex items-baseline gap-2 mt-1">
            <h3 className="text-3xl font-bold tracking-tight">{value}</h3>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 font-medium italic">{desc}</p>
        </div>
      </CardContent>
    </Card>
  );
}
