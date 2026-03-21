
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Newspaper, ShieldCheck, Loader2, Mail, LockKeyhole, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useFirestore, useUser, useAuth, useDoc, useMemoFirebase } from "@/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc } from "firebase/firestore";
import Link from "next/link";

export default function StaffLoginPage() {
  const firestore = useFirestore();
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const router = useRouter();
  const { toast } = useToast();

  // Real-time Profile for redirection
  const profileRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid || user.isAnonymous) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user?.uid, user?.isAnonymous]);
  const { data: dbProfile, isLoading: isProfileLoading } = useDoc(profileRef);

  // Automatic redirection if already logged in as staff
  useEffect(() => {
    if (!isUserLoading && !isProfileLoading && dbProfile) {
      if (dbProfile.role === 'admin' || dbProfile.role === 'editor') {
        router.push('/admin');
      } else if (dbProfile.role === 'reporter') {
        router.push('/reporter');
      } else {
        router.push('/profile');
      }
    }
  }, [dbProfile, isUserLoading, isProfileLoading, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth || !email || !password) return;

    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast({ title: "Staff Authentication Successful" });
      // Redirection is handled by the useEffect above
    } catch (error: any) {
      toast({ 
        variant: "destructive", 
        title: "Access Denied", 
        description: "Invalid credentials or insufficient permissions." 
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isUserLoading || (user && !user.isAnonymous && isProfileLoading)) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="w-12 h-12 text-primary animate-spin" /></div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-blue-500 rounded-full blur-[120px] animate-pulse" />
      </div>

      <div className="w-full max-w-md z-10 space-y-6">
        <Link href="/login" className="text-white/50 hover:text-white flex items-center gap-2 text-sm transition-colors mb-4 w-fit">
          <ArrowLeft className="w-4 h-4" />
          Back to Public Login
        </Link>

        <Card className="shadow-2xl border-white/10 rounded-[2rem] overflow-hidden bg-white/10 backdrop-blur-xl border">
          <CardHeader className="text-center pb-8 border-b border-white/5 bg-white/5">
            <div className="mx-auto w-16 h-16 bg-primary rounded-2xl shadow-xl flex items-center justify-center mb-4 mt-4">
              <ShieldCheck className="w-10 h-10 text-white" />
            </div>
            <CardTitle className="text-2xl font-black text-white tracking-tight">Staff Portal</CardTitle>
            <CardDescription className="text-white/60">Management & Editorial Access Only</CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6 pt-8">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-white/80 text-xs font-bold uppercase tracking-widest ml-1">Staff Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-5 h-5 text-white/40" />
                  <Input 
                    type="email"
                    placeholder="name@newspulse.app" 
                    className="pl-10 h-12 bg-white/5 border-white/10 text-white placeholder:text-white/20 rounded-xl focus:ring-primary/50 focus:border-primary"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-white/80 text-xs font-bold uppercase tracking-widest ml-1">Access Key</Label>
                <div className="relative">
                  <LockKeyhole className="absolute left-3 top-3 w-5 h-5 text-white/40" />
                  <Input 
                    type="password"
                    placeholder="••••••••" 
                    className="pl-10 h-12 bg-white/5 border-white/10 text-white placeholder:text-white/20 rounded-xl focus:ring-primary/50 focus:border-primary"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <Button 
                type="submit"
                className="w-full h-14 text-lg font-bold rounded-2xl mt-4 bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/20"
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="animate-spin mr-2" /> : "Authenticate Access"}
              </Button>
            </form>

            <div className="text-center">
              <p className="text-[10px] text-white/40 uppercase font-bold tracking-tighter">
                Unauthorized access attempts are logged and reported.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
