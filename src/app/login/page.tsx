
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Newspaper, ChevronLeft, ShieldCheck, User as UserIcon, Loader2, Mail, Phone, Chrome } from "lucide-react";
import { useRouter } from "next/navigation";
import { STATES, LOCATIONS_BY_STATE } from "@/lib/mock-data";
import { UserService, AdminService } from "@/lib/storage";
import { useToast } from "@/hooks/use-toast";
import { useFirestore, useUser, useAuth } from "@/firebase";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "firebase/auth";

export default function LoginPage() {
  const firestore = useFirestore();
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const [method, setMethod] = useState<'phone' | 'email' | 'google'>('phone');
  const [step, setStep] = useState<'auth' | 'otp' | 'details'>('auth');
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<'user' | 'reporter' | 'admin' | 'editor'>("user");
  const [state, setState] = useState("");
  const [district, setDistrict] = useState("");
  const [mandal, setMandal] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const router = useRouter();
  const { toast } = useToast();

  const handleGoogleLogin = async () => {
    if (!firestore || !auth) return;
    setIsLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const googleUser = result.user;
      
      const existing = await UserService.getById(firestore, googleUser.uid);
      if (existing) {
        syncLocalStorage(existing);
        const targetPath = (existing.role === 'admin' || existing.role === 'editor') ? '/admin' : existing.role === 'reporter' ? '/reporter' : '/';
        router.push(targetPath);
      } else {
        setName(googleUser.displayName || "");
        setEmail(googleUser.email || "");
        setStep('details');
      }
    } catch (error: any) {
      console.error("Google login error:", error);
      toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleNext = async () => {
    if (!firestore || !auth || isUserLoading) {
      toast({ variant: "destructive", title: "Wait", description: "Firebase is initializing..." });
      return;
    }

    setIsLoading(true);
    try {
      if (step === 'auth') {
        if (method === 'phone') {
          if (!phone || phone.length < 10) {
            toast({ variant: "destructive", title: "Error", description: "Please enter a valid 10-digit phone number." });
            setIsLoading(false);
            return;
          }
          
          const existing = await UserService.getByPhone(firestore, phone);
          if (existing) {
            syncLocalStorage(existing);
            if (existing.role === 'admin' || existing.role === 'editor') {
              setRole(existing.role);
              setName(existing.name);
              setStep('details'); 
            } else {
              router.push(existing.role === 'reporter' ? '/reporter' : '/');
              return;
            }
          } else {
            setStep('otp');
          }
        } else if (method === 'email') {
          if (!email || !password) {
            toast({ variant: "destructive", title: "Error", description: "Email and password are required." });
            setIsLoading(false);
            return;
          }

          try {
            await signInWithEmailAndPassword(auth, email, password);
            const existing = await UserService.getByEmail(firestore, email);
            if (existing) {
              syncLocalStorage(existing);
              if (existing.role === 'admin' || existing.role === 'editor') {
                setRole(existing.role);
                setName(existing.name);
                setStep('details'); 
              } else {
                const targetPath = existing.role === 'reporter' ? '/reporter' : '/';
                router.push(targetPath);
              }
            } else {
              setStep('details');
            }
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
        setStep('details');
      }
      else {
        // Details Step
        if (role === 'admin' || role === 'editor') {
          const correctPassword = await AdminService.getPassword(firestore);
          if (password !== correctPassword) {
            toast({ variant: "destructive", title: "Authentication Failed", description: "Invalid password." });
            setIsLoading(false);
            return;
          }
        }

        let currentUser = user;
        if (method === 'email' && !user) {
          const userCredential = await createUserWithEmailAndPassword(auth, email, password);
          currentUser = userCredential.user;
        }

        if (!currentUser?.uid) {
          throw new Error("Authentication session failed. Please reload.");
        }

        const newUser: any = {
          id: currentUser.uid,
          name,
          role,
          status: role === 'reporter' ? 'pending' : 'approved',
        };

        if (phone) newUser.phone = phone;
        if (email || currentUser.email) newUser.email = email || currentUser.email;

        if (role !== 'admin' && role !== 'editor' && state && district && mandal) {
          newUser.location = { state, district, mandal };
        }

        await UserService.create(firestore, newUser);
        syncLocalStorage(newUser);
        
        toast({ title: "Welcome", description: "Profile setup complete." });
        const targetPath = (role === 'admin' || role === 'editor') ? '/admin' : role === 'reporter' ? '/reporter' : '/';
        router.push(targetPath);
      }
    } catch (error: any) {
      console.error("Login detail error:", error);
      toast({ 
        variant: "destructive", 
        title: "Login Error", 
        description: error.message || "Something went wrong." 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const syncLocalStorage = (profile: any) => {
    localStorage.setItem('mandalPulse_role', profile.role);
    localStorage.setItem('mandalPulse_userName', profile.name);
    if (profile.phone) localStorage.setItem('mandalPulse_userPhone', profile.phone);
    localStorage.setItem('mandalPulse_userStatus', profile.status);
    
    if (profile.location) {
      localStorage.setItem('mandalPulse_state', profile.location.state);
      localStorage.setItem('mandalPulse_district', profile.location.district);
      localStorage.setItem('mandalPulse_mandal', profile.location.mandal);
    }
    if (profile.photo) {
      localStorage.setItem('mandalPulse_userPhoto', profile.photo);
    }
    
    window.dispatchEvent(new Event('mandalPulse_authChanged'));
  };

  const isDetailsValid = () => {
    if (!name) return false;
    if (role === 'admin' || role === 'editor') return password.length >= 4;
    return !!(state && district && mandal);
  };

  if (isUserLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
      </div>
    );
  }

  const isAdminOrEditor = role === 'admin' || role === 'editor';

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-2xl border-none rounded-3xl overflow-hidden">
        <CardHeader className="text-center relative bg-primary/5 pb-8">
          {step !== 'auth' && (
            <button 
              className="absolute left-4 top-4 p-2 rounded-full hover:bg-white transition-colors"
              onClick={() => setStep('auth')}
              disabled={isLoading}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          <div className="mx-auto w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-4 mt-4">
            < Newspaper className="w-10 h-10 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold font-headline">MandalPulse</CardTitle>
          <CardDescription>మీ ప్రాంతీయ వార్తలు (Local News)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-8">
          {step === 'auth' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex gap-2 p-1 bg-muted rounded-xl mb-4">
                <Button 
                  variant={method === 'phone' ? 'default' : 'ghost'} 
                  className="flex-1 rounded-lg text-xs"
                  onClick={() => setMethod('phone')}
                >
                  <Phone className="w-3 h-3 mr-1" /> Phone
                </Button>
                <Button 
                  variant={method === 'email' ? 'default' : 'ghost'} 
                  className="flex-1 rounded-lg text-xs"
                  onClick={() => setMethod('email')}
                >
                  <Mail className="w-3 h-3 mr-1" /> Email
                </Button>
                <Button 
                  variant={method === 'google' ? 'default' : 'ghost'} 
                  className="flex-1 rounded-lg text-xs"
                  onClick={() => setMethod('google')}
                >
                  <Chrome className="w-3 h-3 mr-1" /> Google
                </Button>
              </div>

              {method === 'phone' && (
                <div className="space-y-2">
                  <Label htmlFor="phone">ఫోన్ నంబర్ (Phone Number)</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-muted-foreground">+91</span>
                    <Input 
                      id="phone" 
                      className="pl-12 h-12 rounded-xl" 
                      placeholder="10 అంకెల నంబర్" 
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    />
                  </div>
                  <Button className="w-full h-12 text-lg rounded-xl shadow-lg shadow-primary/20 mt-4" onClick={handleNext} disabled={isLoading}>
                    {isLoading ? <Loader2 className="animate-spin" /> : "ప్రవేశించండి"}
                  </Button>
                </div>
              )}

              {method === 'email' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">ఈమెయిల్ (Email Address)</Label>
                    <Input 
                      id="email" 
                      type="email"
                      className="h-12 rounded-xl" 
                      placeholder="example@mail.com" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">పాస్‌వర్డ్ (Password)</Label>
                    <Input 
                      id="password" 
                      type="password"
                      className="h-12 rounded-xl" 
                      placeholder="Your Password" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                  <Button className="w-full h-12 text-lg rounded-xl shadow-lg shadow-primary/20" onClick={handleNext} disabled={isLoading}>
                    {isLoading ? <Loader2 className="animate-spin" /> : "ప్రవేశించండి"}
                  </Button>
                </div>
              )}

              {method === 'google' && (
                <div className="space-y-4 text-center">
                  <p className="text-sm text-muted-foreground">Google తో సులభంగా లాగిన్ అవ్వండి.</p>
                  <Button 
                    variant="outline" 
                    className="w-full h-14 rounded-xl border-muted-foreground/20 hover:bg-muted font-bold gap-3"
                    onClick={handleGoogleLogin}
                    disabled={isLoading}
                  >
                    {isLoading ? <Loader2 className="animate-spin" /> : <Chrome className="w-6 h-6 text-primary" />}
                    Sign in with Google
                  </Button>
                </div>
              )}
            </div>
          )}

          {step === 'otp' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="space-y-4 text-center">
                <Label className="text-muted-foreground uppercase text-[10px] font-bold tracking-widest">OTP ని నమోదు చేయండి</Label>
                <div className="flex justify-between gap-2">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <Input key={i} className="text-center text-xl font-bold h-12 w-full rounded-xl" maxLength={1} defaultValue="0" />
                  ))}
                </div>
              </div>
              <Button className="w-full h-12 text-lg rounded-xl shadow-lg shadow-primary/20" onClick={handleNext} disabled={isLoading}>
                {isLoading ? <Loader2 className="animate-spin" /> : "ధృవీకరించండి"}
              </Button>
            </div>
          )}

          {step === 'details' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300 overflow-y-auto max-h-[60vh] px-1">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>మీ పేరు (Your Name)</Label>
                  <Input placeholder="పూర్తి పేరు" className="h-11 rounded-xl" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>నేను ఒక... (I am a...)</Label>
                  <Select onValueChange={(v: any) => setRole(v)} value={role}>
                    <SelectTrigger className="h-11 rounded-xl" disabled={isAdminOrEditor}>
                      <div className="flex items-center gap-2">
                        {isAdminOrEditor ? <ShieldCheck className="w-4 h-4 text-rose-500" /> : <UserIcon className="w-4 h-4 text-primary" />}
                        <SelectValue />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">సాధారణ పాఠకుడు (Reader)</SelectItem>
                      <SelectItem value="reporter">స్థానిక రిపోర్టర్ (Reporter)</SelectItem>
                      {/* Only show Admin/Editor if they were identified during step one */}
                      {isAdminOrEditor && (
                        <>
                          <SelectItem value="admin">నిర్వాహకుడు (Admin)</SelectItem>
                          <SelectItem value="editor">ఎడిటర్ (Editor)</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                
                {isAdminOrEditor && (
                  <div className="space-y-2 animate-in zoom-in-95 duration-200">
                    <Label className="text-rose-600 font-bold">పాస్‌వర్డ్ (Password)</Label>
                    <Input 
                      type="password" 
                      placeholder="Enter Admin Password" 
                      value={password} 
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-11 rounded-xl border-rose-200 focus:ring-rose-500"
                    />
                    <p className="text-[10px] text-muted-foreground italic">Default password is admin123</p>
                  </div>
                )}

                {!isAdminOrEditor && (
                  <>
                    <div className="space-y-2">
                      <Label>రాష్ట్రం (State)</Label>
                      <Select onValueChange={(val) => { setState(val); setDistrict(""); setMandal(""); }} value={state}>
                        <SelectTrigger className="h-11 rounded-xl">
                          <SelectValue placeholder="రాష్ట్రం ఎంచుకోండి" />
                        </SelectTrigger>
                        <SelectContent>
                          {STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>జిల్లా (District)</Label>
                        <Select onValueChange={(val) => { setDistrict(val); setMandal(""); }} value={district} disabled={!state}>
                          <SelectTrigger className="h-11 rounded-xl">
                            <SelectValue placeholder="జిల్లా" />
                          </SelectTrigger>
                          <SelectContent>
                            {state && Object.keys(LOCATIONS_BY_STATE[state]).map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>మండలం (Mandal)</Label>
                        <Select onValueChange={setMandal} value={mandal} disabled={!district}>
                          <SelectTrigger className="h-11 rounded-xl">
                            <SelectValue placeholder="మండలం" />
                          </SelectTrigger>
                          <SelectContent>
                            {district && LOCATIONS_BY_STATE[state][district].map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </>
                )}
              </div>
              <Button className="w-full h-12 text-lg mt-4 rounded-xl shadow-lg shadow-primary/20" onClick={handleNext} disabled={!isDetailsValid() || isLoading}>
                {isLoading ? <Loader2 className="animate-spin" /> : "ప్రారంభించండి"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
