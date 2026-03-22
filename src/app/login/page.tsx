
"use client";

import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Newspaper, ChevronLeft, ShieldCheck, User as UserIcon, Loader2, Mail, Phone, Chrome, LockKeyhole } from "lucide-react";
import { useRouter } from "next/navigation";
import { STATES as MOCK_STATES, LOCATIONS_BY_STATE as MOCK_LOCATIONS } from "@/lib/mock-data";
import { UserService, AdminService } from "@/lib/storage";
import { useToast } from "@/hooks/use-toast";
import { useFirestore, useUser, useAuth, useDoc, useMemoFirebase } from "@/firebase";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  GoogleAuthProvider, 
  signInWithPopup,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult
} from "firebase/auth";
import { doc } from "firebase/firestore";
import Link from "next/link";

declare global {
  interface Window {
    recaptchaVerifier: any;
  }
}

export default function LoginPage() {
  const firestore = useFirestore();
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const [method, setMethod] = useState<'phone' | 'email' | 'google'>('phone');
  const [step, setStep] = useState<'auth' | 'otp' | 'details'>('auth');
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<'user' | 'reporter'>("user");
  const [state, setState] = useState("");
  const [district, setDistrict] = useState("");
  const [mandal, setMandal] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  
  const router = useRouter();
  const { toast } = useToast();

  const profileRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid || user.isAnonymous) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user?.uid, user?.isAnonymous]);
  const { data: dbProfile, isLoading: isProfileLoading } = useDoc(profileRef);

  useEffect(() => {
    const handleRecognition = async () => {
      if (isUserLoading || isProfileLoading || !user || user.isAnonymous) return;

      // CRITICAL: Master Admin check by email always comes first
      const isAdminEmail = user.email === 'admin@telugunewspulse.com';
      if (isAdminEmail) {
        router.push('/admin');
        return;
      }

      if (dbProfile) {
        const targetPath = (dbProfile.role === 'admin' || dbProfile.role === 'editor') ? '/admin' : dbProfile.role === 'reporter' ? '/reporter' : '/profile';
        router.push(targetPath);
      } else {
        setIsLoading(true);
        try {
          const userPhone = user.phoneNumber;
          const userEmail = user.email;
          let provisioned: any = null;

          if (userPhone) {
            provisioned = await UserService.getByPhone(firestore!, userPhone);
          } else if (userEmail) {
            provisioned = await UserService.getByEmail(firestore!, userEmail);
          }

          if (provisioned && provisioned.id.startsWith('MANUAL_')) {
            await UserService.claimProfile(firestore!, user.uid, provisioned);
            const targetPath = (provisioned.role === 'admin' || provisioned.role === 'editor') ? '/admin' : provisioned.role === 'reporter' ? '/reporter' : '/profile';
            router.push(targetPath);
          } else {
            setStep('details');
          }
        } catch (e) {
          setStep('details');
        } finally {
          setIsLoading(false);
        }
      }
    };

    handleRecognition();
  }, [user, isUserLoading, isProfileLoading, dbProfile, router, firestore, toast]);

  const locRef = useMemoFirebase(() => firestore ? doc(firestore, 'metadata', 'locations') : null, [firestore]);
  const { data: locationsDoc } = useDoc(locRef);
  
  const availableLocations = useMemo(() => {
    if (!locationsDoc) return MOCK_LOCATIONS;
    const { id, ...statesOnly } = locationsDoc as any;
    return statesOnly;
  }, [locationsDoc]);

  const availableStates = Object.keys(availableLocations).length > 0 ? Object.keys(availableLocations) : MOCK_STATES;

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
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleNext = async () => {
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
        } else if (method === 'email') {
          try {
            await signInWithEmailAndPassword(auth, email, password);
          } catch (error: any) {
            if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
              setStep('details');
            } else throw error;
          }
        }
      }
      else if (step === 'otp') {
        if (!confirmationResult || !otp) return;
        await confirmationResult.confirm(otp);
      }
      else {
        let currentUser = auth.currentUser;
        if (method === 'email' && !currentUser) {
          const userCredential = await createUserWithEmailAndPassword(auth, email, password);
          currentUser = userCredential.user;
        }
        if (!currentUser?.uid) throw new Error("Session failed.");

        const newUser: any = {
          id: currentUser.uid,
          name,
          role,
          status: role === 'reporter' ? 'pending' : 'approved',
        };
        if (phone) newUser.phone = `+91${phone}`;
        if (email || currentUser.email) newUser.email = email || currentUser.email;
        if (state && district && mandal) newUser.location = { state, district, mandal };

        await UserService.create(firestore, newUser);
        router.push(role === 'reporter' ? '/reporter' : '/profile');
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  if (isUserLoading || (user && !user.isAnonymous && isProfileLoading)) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      <div id="recaptcha-container"></div>
      
      <div className="w-full max-w-sm z-10 space-y-4">
        <Card className="shadow-xl border-none rounded-2xl overflow-hidden bg-white/95 backdrop-blur-sm">
          <CardHeader className="text-center relative bg-primary/5 pb-6">
            {step !== 'auth' && <button className="absolute left-3 top-3 p-1.5" onClick={() => setStep('auth')}><ChevronLeft className="w-4 h-4" /></button>}
            <div className="mx-auto w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center mb-3 mt-2">
              <Newspaper className="w-7 h-7 text-primary" />
            </div>
            <CardTitle className="text-xl font-bold">Telugu News Pulse</CardTitle>
            <CardDescription className="text-xs">మీ ప్రాంతీయ వార్తలు (Local News)</CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4 pt-6">
            {step === 'auth' && (
              <div className="space-y-3">
                <div className="flex gap-1.5 p-1 bg-muted rounded-lg mb-2">
                  <Button variant={method === 'phone' ? 'default' : 'ghost'} className="flex-1 h-8 text-[10px] px-0" onClick={() => setMethod('phone')}>Phone</Button>
                  <Button variant={method === 'email' ? 'default' : 'ghost'} className="flex-1 h-8 text-[10px] px-0" onClick={() => setMethod('email')}>Email</Button>
                  <Button variant={method === 'google' ? 'default' : 'ghost'} className="flex-1 h-8 text-[10px] px-0" onClick={() => setMethod('google')}>Google</Button>
                </div>

                {method === 'phone' && (
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <Label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">ఫోన్ నంబర్</Label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-2 text-[11px] text-muted-foreground">+91</span>
                        <Input className="pl-9 h-9 text-sm" placeholder="10 అంకెలు" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} />
                      </div>
                    </div>
                    <Button className="w-full h-10 text-base" onClick={handleNext} disabled={isLoading}>{isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "ప్రవేశించండి"}</Button>
                  </div>
                )}

                {method === 'email' && (
                  <div className="space-y-2.5">
                    <Input placeholder="ఈమెయిల్" className="h-9 text-sm" value={email} onChange={(e) => setEmail(e.target.value)} />
                    <Input type="password" placeholder="పాస్‌వర్డ్" className="h-9 text-sm" value={password} onChange={(e) => setPassword(e.target.value)} />
                    <Button className="w-full h-10 text-base" onClick={handleNext} disabled={isLoading}>ప్రవేశించండి</Button>
                  </div>
                )}

                {method === 'google' && <Button variant="outline" className="w-full h-11 font-bold gap-2 text-sm" onClick={handleGoogleLogin} disabled={isLoading}><Chrome className="w-5 h-5 text-primary" /> Sign in with Google</Button>}
              </div>
            )}

            {step === 'otp' && (
              <div className="space-y-3 text-center">
                <Label className="text-[10px] font-bold text-muted-foreground uppercase">OTP (6 Digits)</Label>
                <Input className="text-center text-xl h-11 tracking-[0.4em] font-black" maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} />
                <Button className="w-full h-10" onClick={handleNext} disabled={isLoading}>ధృవీకరించండి</Button>
              </div>
            )}

            {step === 'details' && (
              <div className="space-y-3 max-h-[50vh] overflow-y-auto px-0.5">
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">మీ పేరు (Name)</Label>
                    <Input placeholder="పూర్తి పేరు" className="h-9 text-sm" value={name} onChange={(e) => setName(e.target.value)} />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">నేను ఒక...</Label>
                    <Select onValueChange={(v: any) => setRole(v)} value={role}>
                      <SelectTrigger className="h-9 text-sm">
                        <div className="flex items-center gap-2"><UserIcon className="w-3.5 h-3.5 text-primary" /><SelectValue /></div>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">పాఠకుడు (Reader)</SelectItem>
                        <SelectItem value="reporter">రిపోర్టర్ (Reporter)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-1">
                    <Label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">రాష్ట్రం</Label>
                    <Select onValueChange={(val) => { setState(val); setDistrict(""); setMandal(""); }} value={state}>
                      <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="ఎంచుకోండి" /></SelectTrigger>
                      <SelectContent>{availableStates.sort().map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">జిల్లా</Label>
                      <Select onValueChange={(val) => { setDistrict(val); setMandal(""); }} value={district} disabled={!state}>
                        <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="జిల్లా" /></SelectTrigger>
                        <SelectContent>{state && availableLocations[state] && Object.keys(availableLocations[state]).sort().map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">మండలం</Label>
                      <Select onValueChange={setMandal} value={mandal} disabled={!district}>
                        <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="మండలం" /></SelectTrigger>
                        <SelectContent>{district && availableLocations[state]?.[district]?.map((m: string) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                <Button className="w-full h-10 text-base mt-2" onClick={handleNext} disabled={!name || isLoading}>ప్రారంభించండి</Button>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="text-center">
          <Link href="/staff/login">
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary gap-1.5 font-bold uppercase text-[9px] tracking-widest h-7">
              <ShieldCheck className="w-3 h-3" />
              Staff Login Portal
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
