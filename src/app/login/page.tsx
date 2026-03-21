
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
  const [role, setRole] = useState<'user' | 'reporter' | 'admin' | 'editor'>("user");
  const [staffCode, setStaffCode] = useState("");
  const [state, setState] = useState("");
  const [district, setDistrict] = useState("");
  const [mandal, setMandal] = useState("");
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

  // Redirection Logic: Redirect existing users automatically
  useEffect(() => {
    if (!isUserLoading && !isProfileLoading && user && !user.isAnonymous && dbProfile) {
      if (dbProfile.role === 'admin' || dbProfile.role === 'editor') {
        router.push('/admin');
      } else if (dbProfile.role === 'reporter') {
        router.push('/reporter');
      } else {
        router.push('/profile');
      }
    } else if (!isUserLoading && !isProfileLoading && user && !user.isAnonymous && dbProfile === null) {
      setStep('details');
    }
  }, [user, isUserLoading, isProfileLoading, dbProfile, router]);

  // Dynamic locations from Firestore
  const locRef = useMemoFirebase(() => firestore ? doc(firestore, 'metadata', 'locations') : null, [firestore]);
  const { data: locationsDoc } = useDoc(locRef);
  
  const availableLocations = useMemo(() => {
    if (!locationsDoc) return MOCK_LOCATIONS;
    const { id, ...statesOnly } = locationsDoc as any;
    return statesOnly;
  }, [locationsDoc]);

  const availableStates = Object.keys(availableLocations).length > 0 ? Object.keys(availableLocations) : MOCK_STATES;

  // Initialize Recaptcha
  useEffect(() => {
    if (typeof window !== 'undefined' && auth && !window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        'size': 'invisible',
        'callback': () => {}
      });
    }
  }, [auth]);

  const handleGoogleLogin = async () => {
    if (!firestore || !auth) return;
    setIsLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const googleUser = result.user;
      
      const existing = await UserService.getById(firestore, googleUser.uid);
      if (existing) {
        const targetPath = (existing.role === 'admin' || existing.role === 'editor') ? '/admin' : existing.role === 'reporter' ? '/reporter' : '/profile';
        router.push(targetPath);
      } else {
        setName(googleUser.displayName || "");
        setEmail(googleUser.email || "");
        setStep('details');
      }
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
            toast({ variant: "destructive", title: "Error", description: "Please enter a valid 10-digit phone number." });
            setIsLoading(false);
            return;
          }
          const formattedPhone = `+91${phone}`;
          const result = await signInWithPhoneNumber(auth, formattedPhone, window.recaptchaVerifier);
          setConfirmationResult(result);
          setStep('otp');
          toast({ title: "OTP Sent" });
        } else if (method === 'email') {
          try {
            await signInWithEmailAndPassword(auth, email, password);
          } catch (error: any) {
            if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
              setStep('details');
            } else {
              throw error;
            }
          }
        }
      }
      else if (step === 'otp') {
        if (!confirmationResult || !otp) return;
        await confirmationResult.confirm(otp);
      }
      else {
        // Details Step
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
          status: (role === 'reporter' && staffCode !== 'NP2025') ? 'pending' : 'approved',
        };

        if (phone) newUser.phone = `+91${phone}`;
        if (email || currentUser.email) newUser.email = email || currentUser.email;
        if (state && district && mandal) newUser.location = { state, district, mandal };

        await UserService.create(firestore, newUser);
        toast({ title: "Welcome" });
        
        const targetPath = (role === 'admin' || role === 'editor') ? '/admin' : role === 'reporter' ? '/reporter' : '/profile';
        router.push(targetPath);
      }
    } catch (error: any) {
      if (error.code === 'auth/too-many-requests') {
        toast({ variant: "destructive", title: "Too Many Requests", description: "చాలా సార్లు ప్రయత్నించారు. దయచేసి కాసేపు ఆగి మళ్ళీ ప్రయత్నించండి." });
      } else {
        toast({ variant: "destructive", title: "Error", description: error.message });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const isStaff = staffCode === "NP2025";

  if (isUserLoading || (user && !user.isAnonymous && isProfileLoading)) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-12 h-12 text-primary animate-spin" /></div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      <div id="recaptcha-container"></div>
      
      <Card className="w-full max-w-md shadow-2xl border-none rounded-3xl overflow-hidden z-10 bg-white/95 backdrop-blur-sm">
        <CardHeader className="text-center relative bg-primary/5 pb-8">
          {step !== 'auth' && <button className="absolute left-4 top-4 p-2" onClick={() => setStep('auth')}><ChevronLeft className="w-5 h-5" /></button>}
          <div className="mx-auto w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-4 mt-4">
            <Newspaper className="w-10 h-10 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Telugu News Pulse</CardTitle>
          <CardDescription>మీ ప్రాంతీయ వార్తలు (Local News)</CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6 pt-8">
          {step === 'auth' && (
            <div className="space-y-4">
              <div className="flex gap-2 p-1 bg-muted rounded-xl mb-4">
                <Button variant={method === 'phone' ? 'default' : 'ghost'} className="flex-1 text-xs" onClick={() => setMethod('phone')}><Phone className="w-3 h-3 mr-1" /> Phone</Button>
                <Button variant={method === 'email' ? 'default' : 'ghost'} className="flex-1 text-xs" onClick={() => setMethod('email')}><Mail className="w-3 h-3 mr-1" /> Email</Button>
                <Button variant={method === 'google' ? 'default' : 'ghost'} className="flex-1 text-xs" onClick={() => setMethod('google')}><Chrome className="w-3 h-3 mr-1" /> Google</Button>
              </div>

              {method === 'phone' && (
                <div className="space-y-2">
                  <Label>ఫోన్ నంబర్</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-muted-foreground">+91</span>
                    <Input className="pl-12 h-12" placeholder="10 అంకెల నంబర్" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} />
                  </div>
                  <Button className="w-full h-12 text-lg mt-4" onClick={handleNext} disabled={isLoading}>{isLoading ? <Loader2 className="animate-spin" /> : "ప్రవేశించండి"}</Button>
                </div>
              )}

              {method === 'email' && (
                <div className="space-y-4">
                  <Input placeholder="ఈమెయిల్" value={email} onChange={(e) => setEmail(e.target.value)} />
                  <Input type="password" placeholder="పాస్‌వర్డ్" value={password} onChange={(e) => setPassword(e.target.value)} />
                  <Button className="w-full h-12" onClick={handleNext} disabled={isLoading}>ప్రవేశించండి</Button>
                </div>
              )}

              {method === 'google' && <Button variant="outline" className="w-full h-14 font-bold gap-3" onClick={handleGoogleLogin} disabled={isLoading}><Chrome className="w-6 h-6 text-primary" /> Sign in with Google</Button>}
            </div>
          )}

          {step === 'otp' && (
            <div className="space-y-4 text-center">
              <Label className="text-xs font-bold text-muted-foreground">OTP (6 Digits)</Label>
              <Input className="text-center text-2xl h-14 tracking-[0.5em] font-black" maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} />
              <Button className="w-full h-12" onClick={handleNext} disabled={isLoading}>ధృవీకరించండి</Button>
            </div>
          )}

          {step === 'details' && (
            <div className="space-y-4 max-h-[60vh] overflow-y-auto px-1">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>మీ పేరు (Name)</Label>
                  <Input placeholder="పూర్తి పేరు" className="h-11" value={name} onChange={(e) => setName(e.target.value)} />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">Staff Code <LockKeyhole className="w-3 h-3 text-muted-foreground" /></Label>
                  <Input 
                    placeholder="Optional (Only for Admin/Editor)" 
                    className="h-11 bg-slate-50" 
                    value={staffCode} 
                    onChange={(e) => setStaffCode(e.target.value)} 
                  />
                </div>

                <div className="space-y-2">
                  <Label>నేను ఒక...</Label>
                  <Select onValueChange={(v: any) => setRole(v)} value={role}>
                    <SelectTrigger className="h-11">
                      <div className="flex items-center gap-2"><UserIcon className="w-4 h-4 text-primary" /><SelectValue /></div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">పాఠకుడు (Reader)</SelectItem>
                      <SelectItem value="reporter">రిపోర్టర్ (Reporter)</SelectItem>
                      {isStaff && <SelectItem value="admin">అడ్మిన్ (Admin)</SelectItem>}
                      {isStaff && <SelectItem value="editor">ఎడిటర్ (Editor)</SelectItem>}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>రాష్ట్రం</Label>
                  <Select onValueChange={(val) => { setState(val); setDistrict(""); setMandal(""); }} value={state}>
                    <SelectTrigger className="h-11"><SelectValue placeholder="రాష్ట్రం ఎంచుకోండి" /></SelectTrigger>
                    <SelectContent>{availableStates.sort().map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>జిల్లా</Label>
                    <Select onValueChange={(val) => { setDistrict(val); setMandal(""); }} value={district} disabled={!state}>
                      <SelectTrigger className="h-11"><SelectValue placeholder="జిల్లా" /></SelectTrigger>
                      <SelectContent>{state && availableLocations[state] && Object.keys(availableLocations[state]).sort().map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>మండలం</Label>
                    <Select onValueChange={setMandal} value={mandal} disabled={!district}>
                      <SelectTrigger className="h-11"><SelectValue placeholder="మండలం" /></SelectTrigger>
                      <SelectContent>{district && availableLocations[state]?.[district]?.map((m: string) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <Button className="w-full h-12 text-lg mt-4" onClick={handleNext} disabled={!name || isLoading}>ప్రారంభించండి</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
