"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Newspaper, ChevronLeft, ShieldCheck, User as UserIcon, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { STATES, LOCATIONS_BY_STATE, UserProfile, DEFAULT_ADMIN_PHONE } from "@/lib/mock-data";
import { UserService, AdminService } from "@/lib/storage";
import { useToast } from "@/hooks/use-toast";
import { useFirestore, useUser } from "@/firebase";

export default function LoginPage() {
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const [step, setStep] = useState<'phone' | 'otp' | 'details'>('phone');
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<'user' | 'reporter' | 'admin'>("user");
  const [state, setState] = useState("");
  const [district, setDistrict] = useState("");
  const [mandal, setMandal] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const router = useRouter();
  const { toast } = useToast();

  const handleNext = async () => {
    if (!firestore || isUserLoading) {
      toast({ variant: "destructive", title: "Error", description: "Firebase initializing..." });
      return;
    }

    setIsLoading(true);
    try {
      if (step === 'phone') {
        if (!phone || phone.length < 10) {
          toast({ variant: "destructive", title: "Validation Error", description: "Please enter a valid phone number." });
          return;
        }
        
        const existing = await UserService.getByPhone(firestore, phone);
        if (existing) {
          if (existing.role === 'admin' || phone === DEFAULT_ADMIN_PHONE) {
            setRole('admin');
            setName(existing?.name || "Admin");
            setStep('otp');
          } else {
            localStorage.setItem('mandalPulse_role', existing.role);
            localStorage.setItem('mandalPulse_userName', existing.name);
            localStorage.setItem('mandalPulse_userPhone', existing.phone);
            localStorage.setItem('mandalPulse_userStatus', existing.status);
            
            if (existing.location) {
              localStorage.setItem('mandalPulse_state', existing.location.state);
              localStorage.setItem('mandalPulse_district', existing.location.district);
              localStorage.setItem('mandalPulse_mandal', existing.location.mandal);
            }
            
            window.dispatchEvent(new Event('mandalPulse_authChanged'));
            router.push(existing.role === 'admin' ? '/admin' : existing.role === 'reporter' ? '/reporter' : '/');
            return;
          }
        } else {
          setStep('otp');
        }
      }
      else if (step === 'otp') {
        setStep('details');
      }
      else {
        if (role === 'admin') {
          const correctPassword = await AdminService.getPassword(firestore);
          if (password !== correctPassword) {
            toast({ variant: "destructive", title: "Authentication Failed", description: "Invalid admin password." });
            return;
          }
        }

        if (!user?.uid) {
          throw new Error("Authentication session not found. Please refresh.");
        }

        const newUser: UserProfile = {
          id: user.uid,
          phone,
          name,
          role,
          status: role === 'reporter' ? 'pending' : 'approved',
          location: role !== 'admin' ? { state, district, mandal } : undefined
        };

        await UserService.create(firestore, newUser);

        localStorage.setItem('mandalPulse_role', role);
        localStorage.setItem('mandalPulse_userName', name);
        localStorage.setItem('mandalPulse_userPhone', phone);
        localStorage.setItem('mandalPulse_userStatus', newUser.status);
        
        if (role !== 'admin') {
          localStorage.setItem('mandalPulse_state', state || "");
          localStorage.setItem('mandalPulse_district', district || "");
          localStorage.setItem('mandalPulse_mandal', mandal || "");
        }

        window.dispatchEvent(new Event('mandalPulse_authChanged'));
        toast({ title: "Welcome!", description: "Account setup successful." });
        router.push(role === 'admin' ? '/admin' : role === 'reporter' ? '/reporter' : '/');
      }
    } catch (error: any) {
      console.error("Login Error:", error);
      toast({ 
        variant: "destructive", 
        title: "Login Error", 
        description: error.message || "An unexpected error occurred." 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isDetailsValid = () => {
    if (!name) return false;
    if (role === 'admin') return password.length > 0;
    return state && district && mandal;
  };

  if (isUserLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-2xl border-none">
        <CardHeader className="text-center relative">
          {step !== 'phone' && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute left-4 top-4"
              onClick={() => setStep(step === 'details' ? 'otp' : 'phone')}
              disabled={isLoading}
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
          )}
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
            <Newspaper className="w-10 h-10 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold font-headline">MandalPulse</CardTitle>
          <CardDescription>స్థానిక వార్తలు (Local News)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {step === 'phone' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="space-y-2">
                <Label htmlFor="phone">ఫోన్ నంబర్ (Phone Number)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-muted-foreground">+91</span>
                  <Input 
                    id="phone" 
                    className="pl-12 h-12" 
                    placeholder="10 అంకెల నంబర్" 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  />
                </div>
                {phone === DEFAULT_ADMIN_PHONE && (
                  <p className="text-[10px] text-rose-500 font-bold animate-pulse">Admin ID Recognized</p>
                )}
              </div>
              <Button className="w-full h-12 text-lg" onClick={handleNext} disabled={phone.length < 10 || isLoading}>
                {isLoading ? <Loader2 className="animate-spin" /> : "ప్రవేశించండి"}
              </Button>
            </div>
          )}

          {step === 'otp' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="space-y-2 text-center">
                <Label>OTP ని నమోదు చేయండి (Simulated)</Label>
                <div className="flex justify-between gap-2">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <Input key={i} className="text-center text-xl font-bold h-12 w-full" maxLength={1} defaultValue="0" />
                  ))}
                </div>
              </div>
              <Button className="w-full h-12 text-lg" onClick={handleNext} disabled={isLoading}>
                {isLoading ? <Loader2 className="animate-spin" /> : "ధృవీకరించండి"}
              </Button>
            </div>
          )}

          {step === 'details' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300 overflow-y-auto max-h-[60vh] px-1">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>మీ పేరు (Your Name)</Label>
                  <Input placeholder="పూర్తి పేరు" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>నేను ఒక... (I am a...)</Label>
                  <Select onValueChange={(v: any) => setRole(v)} value={role}>
                    <SelectTrigger className="h-11">
                      <div className="flex items-center gap-2">
                        {role === 'admin' ? <ShieldCheck className="w-4 h-4 text-rose-500" /> : <UserIcon className="w-4 h-4 text-primary" />}
                        <SelectValue />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">సాధారణ పాఠకుడు (Reader)</SelectItem>
                      <SelectItem value="reporter">స్థానిక రిపోర్టర్ (Reporter)</SelectItem>
                      <SelectItem value="admin">అడ్మిన్ / ఎడిటర్ (Admin)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {role === 'admin' && (
                  <div className="space-y-2 animate-in zoom-in-95 duration-200">
                    <Label className="text-rose-600 font-bold">అడ్మిన్ పాస్‌వర్డ్ (Admin Password)</Label>
                    <Input 
                      type="password" 
                      placeholder="Enter Admin Password" 
                      value={password} 
                      onChange={(e) => setPassword(e.target.value)}
                      className="border-rose-200 focus:ring-rose-500"
                    />
                  </div>
                )}

                {role !== 'admin' && (
                  <>
                    <div className="space-y-2">
                      <Label>రాష్ట్రం (State)</Label>
                      <Select onValueChange={(val) => { setState(val); setDistrict(""); setMandal(""); }} value={state}>
                        <SelectTrigger className="h-11">
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
                          <SelectTrigger className="h-11">
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
                          <SelectTrigger className="h-11">
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
              <Button className="w-full h-12 text-lg mt-4" onClick={handleNext} disabled={!isDetailsValid() || isLoading}>
                {isLoading ? <Loader2 className="animate-spin" /> : "ప్రారంభించండి"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
