"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bell, Send, History, Target, Trash2, Smartphone } from "lucide-react";
import { NotificationService, SentNotification, LocationService } from "@/lib/storage";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { useFirestore, useCollection, useDoc, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, limit, doc } from "firebase/firestore";

export default function AdminNotifications() {
  const firestore = useFirestore();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [target, setTarget] = useState("All Users");
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();

  // Real-time notification history
  const historyQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'notifications'), orderBy('timestamp', 'desc'), limit(50));
  }, [firestore]);

  const { data: history } = useCollection<SentNotification>(historyQuery);

  // Real-time locations for target audience
  const locDocRef = useMemoFirebase(() => firestore ? doc(firestore, 'metadata', 'locations') : null, [firestore]);
  const { data: locationsDoc } = useDoc(locDocRef);
  const districts = locationsDoc ? Object.keys(locationsDoc["Telangana"] || {}) : [];

  const handleSend = () => {
    if (!firestore || !title || !body) return;
    setIsSending(true);

    NotificationService.send(firestore, { title, body, target });
    
    setTimeout(() => {
      setTitle("");
      setBody("");
      setIsSending(false);
      toast({
        title: "నోటిఫికేషన్ పంపబడింది",
        description: "వినియోగదారులందరికీ అలర్ట్ విజయవంతంగా చేరింది."
      });
    }, 500);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
      <div>
        <h1 className="text-3xl font-bold font-headline tracking-tight">FCM నోటిఫికేషన్లు</h1>
        <p className="text-muted-foreground mt-1">లైవ్ బ్రేకింగ్ న్యూస్ అలర్ట్‌లు మరియు నోటిఫికేషన్లను నిర్వహించండి.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Compose Section */}
        <Card className="border-none shadow-xl rounded-2xl h-fit">
          <CardHeader className="bg-primary/5 rounded-t-2xl border-b border-primary/10">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Send className="w-5 h-5 text-primary" />
              అలర్ట్ పంపండి (Send Alert)
            </CardTitle>
            <CardDescription>బ్రేకింగ్ న్యూస్ లేదా ముఖ్యమైన సమాచారాన్ని అలర్ట్ రూపంలో పంపండి.</CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">లక్షిత ప్రేక్షకులు (Target Audience)</Label>
              <Select value={target} onValueChange={setTarget}>
                <SelectTrigger className="h-11">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-primary" />
                    <SelectValue />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All Users">వినియోగదారులందరికీ (All Users)</SelectItem>
                  {districts.map(d => (
                    <SelectItem key={d} value={d}>{d} జిల్లా</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">ముఖ్యాంశం (Title)</Label>
              <Input 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                placeholder="బ్రేకింగ్ న్యూస్ హెడ్ లైన్..."
                className="h-12 font-bold"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">సందేశం (Message Body)</Label>
              <Textarea 
                value={body} 
                onChange={(e) => setBody(e.target.value)} 
                placeholder="పూర్తి వివరాలు క్లుప్తంగా రాయండి..."
                className="min-h-[120px] leading-relaxed"
              />
            </div>

            <div className="p-4 bg-muted/30 rounded-xl border border-muted">
              <div className="flex gap-4">
                <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center shrink-0">
                  <Smartphone className="w-5 h-5 text-primary" />
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-primary uppercase">ప్రివ్యూ (Mobile Preview)</p>
                  <p className="text-sm font-bold truncate max-w-[200px]">{title || "హెడ్ లైన్ ఇక్కడ కనిపిస్తుంది"}</p>
                  <p className="text-xs text-muted-foreground line-clamp-2">{body || "వార్త వివరాలు ఇక్కడ కనిపిస్తాయి..."}</p>
                </div>
              </div>
            </div>

            <Button 
              className="w-full h-14 text-lg font-bold shadow-lg shadow-primary/20" 
              onClick={handleSend}
              disabled={!title || !body || isSending}
            >
              {isSending ? "పంపుతోంది..." : "నోటిఫికేషన్ పంపండి (Push Now)"}
            </Button>
          </CardContent>
        </Card>

        {/* History Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <History className="w-5 h-5 text-muted-foreground" />
              గత నోటిఫికేషన్లు (History)
            </h2>
            <Badge variant="secondary" className="rounded-full">{history?.length || 0}</Badge>
          </div>

          <div className="space-y-4">
            {history && history.length > 0 ? (
              history.map((notif) => (
                <Card key={notif.id} className="border-none shadow-md rounded-2xl overflow-hidden hover:shadow-lg transition-all group">
                  <CardContent className="p-5">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-tighter border-primary/20 text-primary">
                          {notif.target}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">
                          {notif.timestamp?.toDate ? format(notif.timestamp.toDate(), 'MMM d, h:mm a') : 'Just now'}
                        </span>
                      </div>
                      <button className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <h3 className="font-bold text-sm mb-1">{notif.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                      {notif.body}
                    </p>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-muted">
                <Bell className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
                <p className="text-muted-foreground italic">నోటిఫికేషన్ చరిత్ర ఏదీ లేదు.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}