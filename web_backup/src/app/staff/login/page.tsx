
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Newspaper, ShieldCheck, Loader2, Mail, LockKeyhole, ArrowLeft, Phone, Chrome, ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useFirestore, useUser, useAuth, useDoc, useMemoFirebase } from "@/firebase";
import { 
  signInWithEmailAndPassword, 
  GoogleAuthProvider, 
  signInWithPopup,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult
} from "firebase/auth";
import { doc } from "firebase/firestore";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function StaffLoginPage() {
  const firestore = useFirestore();
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const [method, setMethod] = useState<'email' | 'phone' | 'google'>('email');
  const [step, setStep] = useState<'auth' | 'otp'>('auth');
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  
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
    if (!isUserLoading && !isProfileLoading) {
      if (!user) return;

      // CRITICAL: Master Admin check by email
      if (user.email === 'admin@telugunewspulse.com') {
        router.push('/admin');
        return;
      }

      if (dbProfile) {
        if (dbProfile.role === 'admin' || dbProfile.role === 'editor') {
          router.push('/admin');
        } else if (dbProfile.role === 'reporter') {
          router.push('/reporter');
        } else {
          router.push('/profile');
        }
      }
    }
  }, [dbProfile, isUserLoading, isProfileLoading, router, user]);

  useEffect(() => {
    if (typeof window !== 'undefined' && auth && !isUserLoading && !window.recaptchaVerifier) {
      const container = document.getElementById('recaptcha-container');
      if (container) {
        try {
          window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
            'size': 'invisible',
            'callback': () => {}
          });
        } catch (error) {
          console.error("Recaptcha initialization failed:", error);
        }
      }
    }
  }, [auth, isUserLoading]);

  const handleGoogleLogin = async () => {
    if (!firestore || !auth) return;
    setIsLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      toast({ title: "Google Authentication Successful" });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleNext = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!firestore || !auth || isUserLoading) return;

    setIsLoading(true);
    try {
      if (step === 'auth') {
        if (method === 'phone') {
          if (!phone || phone.length < 10) {
            toast({ variant: "destructive", title: "Error", description: "Please enter 10 digits." });
            setIsLoading(false);
            return;
          }
          if (!window.recaptchaVerifier) {
            toast({ variant: "destructive", title: "Error", description: "System not ready." });
            setIsLoading(false);
            return;
          }
          const formattedPhone = `+91${phone}`;
          const result = await signInWithPhoneNumber(auth, formattedPhone, window.recaptchaVerifier);
          setConfirmationResult(result);
          setStep('otp');
          toast({ title: "OTP Sent", description: "Please check your phone." });
        } else if (method === 'email') {
          await signInWithEmailAndPassword(auth, email, password);
          toast({ title: "Staff Authentication Successful" });
        }
      } else if (step === 'otp') {
        if (!confirmationResult || !otp) return;
        await confirmationResult.confirm(otp);
        toast({ title: "Authentication Successful" });
      }
    } catch (error: any) {
      toast({ 
        variant: "destructive", 
        title: "Access Denied", 
        description: error.message || "Invalid credentials or insufficient permissions." 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = handleNext;

  if (isUserLoading || (user && !user.isAnonymous && isProfileLoading)) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="w-12 h-12 text-primary animate-spin" /></div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4 relative overflow-hidden">
      <div id="recaptcha-container"></div>
      
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
          <CardHeader className="text-center relative pb-8 border-b border-white/5 bg-white/5">
            {step !== 'auth' && (
              <button 
                className="absolute left-6 top-6 p-2 text-white/60 hover:text-white bg-white/5 rounded-full transition-colors"
                onClick={() => setStep('auth')}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
            <div className="mx-auto w-16 h-16 bg-primary rounded-2xl shadow-xl flex items-center justify-center mb-4 mt-4">
              <ShieldCheck className="w-10 h-10 text-white" />
            </div>
            <CardTitle className="text-2xl font-black text-white tracking-tight">Staff Portal</CardTitle>
            <CardDescription className="text-white/60">Reporter & Editorial Authentication</CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6 pt-8">
            {step === 'auth' && (
              <div className="space-y-4">
                <div className="flex gap-2 p-1 bg-white/5 rounded-2xl mb-2">
                  <Button 
                    variant={method === 'email' ? 'default' : 'ghost'} 
                    className={cn("flex-1 h-10 text-xs font-bold rounded-xl transition-all", method === 'email' ? "bg-primary text-white" : "text-white/60 hover:text-white")}
                    onClick={() => setMethod('email')}
                  >
                    Email
                  </Button>
                  <Button 
                    variant={method === 'phone' ? 'default' : 'ghost'} 
                    className={cn("flex-1 h-10 text-xs font-bold rounded-xl transition-all", method === 'phone' ? "bg-primary text-white" : "text-white/60 hover:text-white")}
                    onClick={() => setMethod('phone')}
                  >
                    Phone
                  </Button>
                  <Button 
                    variant={method === 'google' ? 'default' : 'ghost'} 
                    className={cn("flex-1 h-10 text-xs font-bold rounded-xl transition-all", method === 'google' ? "bg-primary text-white" : "text-white/60 hover:text-white")} 
                    onClick={() => setMethod('google')}
                  >
                    Google
                  </Button>
                </div>

                {method === 'email' && (
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
                )}

                {method === 'phone' && (
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-white/80 text-xs font-bold uppercase tracking-widest ml-1">Phone Number</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-3 text-white/40 font-bold">+91</span>
                        <Input 
                          className="pl-12 h-12 bg-white/5 border-white/10 text-white placeholder:text-white/20 rounded-xl focus:ring-primary/50 focus:border-primary"
                          placeholder="10 Digits"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                          required
                        />
                      </div>
                    </div>
                    <Button 
                      type="submit"
                      className="w-full h-14 text-lg font-bold rounded-2xl mt-4 bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/20"
                      disabled={isLoading}
                    >
                      {isLoading ? <Loader2 className="animate-spin mr-2" /> : "Send OTP"}
                    </Button>
                  </form>
                )}

                {method === 'google' && (
                  <div className="py-4">
                    <Button 
                      variant="outline"
                      className="w-full h-14 font-bold gap-3 text-base rounded-2xl bg-white/5 border-white/10 text-white hover:bg-white/10 transition-all shadow-xl"
                      onClick={handleGoogleLogin}
                      disabled={isLoading}
                    >
                      {isLoading ? <Loader2 className="animate-spin" /> : <Chrome className="w-6 h-6 text-primary" />}
                      Continue with Google
                    </Button>
                  </div>
                )}
              </div>
            )}

            {step === 'otp' && (
              <div className="space-y-6 text-center py-4">
                <div className="space-y-2">
                  <Label className="text-white/80 text-xs font-bold uppercase tracking-widest">Verification Code (6 Digits)</Label>
                  <Input 
                    className="text-center text-3xl h-16 tracking-[0.5em] font-black bg-white/5 border-white/10 text-white rounded-2xl focus:ring-primary/50" 
                    maxLength={6} 
                    value={otp} 
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} 
                    autoFocus
                  />
                </div>
                <Button 
                  className="w-full h-14 text-lg font-bold rounded-2xl bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/20"
                  onClick={(e) => handleNext(e as any)}
                  disabled={isLoading}
                >
                  {isLoading ? <Loader2 className="animate-spin mr-2" /> : "Verify Identity"}
                </Button>
                <p className="text-white/40 text-[10px] uppercase font-bold">
                  Didn't receive code? <button className="text-primary hover:underline ml-1">Resend</button>
                </p>
              </div>
            )}

            <div className="text-center pt-2">
              <Link href="/login?role=reporter" className="text-xs text-primary font-bold hover:underline transition-all">
                New Reporter? Register Your Profile Here
              </Link>
            </div>

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
