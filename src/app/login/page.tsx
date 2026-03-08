"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Newspaper, ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { STATES, LOCATIONS_BY_STATE } from "@/lib/mock-data";

export default function LoginPage() {
  const [step, setStep] = useState<'phone' | 'otp' | 'details'>('phone');
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("user");
  const [state, setState] = useState("");
  const [district, setDistrict] = useState("");
  const [mandal, setMandal] = useState("");
  const router = useRouter();

  const handleNext = () => {
    if (step === 'phone') {
      if (!phone || phone.length < 10) return;
      setStep('otp');
    }
    else if (step === 'otp') setStep('details');
    else {
      localStorage.setItem('mandalPulse_role', role);
      localStorage.setItem('mandalPulse_userName', name || 'User');
      localStorage.setItem('mandalPulse_state', state);
      localStorage.setItem('mandalPulse_district', district);
      localStorage.setItem('mandalPulse_mandal', mandal);
      window.dispatchEvent(new Event('mandalPulse_authChanged'));
      router.push(role === 'admin' ? '/admin' : role === 'reporter' ? '/reporter' : '/');
    }
  };

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
              </div>
              <Button className="w-full h-12 text-lg" onClick={handleNext} disabled={phone.length < 10}>OTP పంపండి</Button>
            </div>
          )}

          {step === 'otp' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="space-y-2 text-center">
                <Label>OTP ని నమోదు చేయండి</Label>
                <div className="flex justify-between gap-2">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <Input key={i} className="text-center text-xl font-bold h-12 w-full" maxLength={1} />
                  ))}
                </div>
              </div>
              <Button className="w-full h-12 text-lg" onClick={handleNext}>ధృవీకరించండి</Button>
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
                  <Select onValueChange={setRole} value={role}>
                    <SelectTrigger className="h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">సాధారణ పాఠకుడు (Reader)</SelectItem>
                      <SelectItem value="reporter">స్థానిక రిపోర్టర్ (Reporter)</SelectItem>
                      <SelectItem value="admin">అడ్మిన్ / ఎడిటర్ (Admin)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
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
              </div>
              <Button className="w-full h-12 text-lg mt-4" onClick={handleNext} disabled={!name || !state || !district || !mandal}>ప్రారంభించండి</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
