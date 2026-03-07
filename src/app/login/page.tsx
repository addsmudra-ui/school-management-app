"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Newspaper, ShieldCheck, UserCircle, Phone } from "lucide-react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [step, setStep] = useState<'phone' | 'otp' | 'details'>('phone');
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("user");
  const router = useRouter();

  const handleNext = () => {
    if (step === 'phone') setStep('otp');
    else if (step === 'otp') setStep('details');
    else {
      localStorage.setItem('mandalPulse_role', role);
      router.push(role === 'admin' ? '/admin' : role === 'reporter' ? '/reporter' : '/');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-2xl border-none">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
            <Newspaper className="w-10 h-10 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold font-headline">MandalPulse</CardTitle>
          <CardDescription>Hyperlocal News at Your Fingertips</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {step === 'phone' && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-muted-foreground">+91</span>
                  <Input 
                    id="phone" 
                    className="pl-12" 
                    placeholder="Enter 10 digit number" 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </div>
              <Button className="w-full h-12 text-lg" onClick={handleNext}>Send OTP</Button>
            </div>
          )}

          {step === 'otp' && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="space-y-2 text-center">
                <Label>Enter 6-digit OTP sent to {phone}</Label>
                <div className="flex justify-between gap-2">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <Input key={i} className="text-center text-xl font-bold w-full" maxLength={1} />
                  ))}
                </div>
              </div>
              <Button className="w-full h-12 text-lg" onClick={handleNext}>Verify OTP</Button>
              <p className="text-center text-sm text-muted-foreground">Didn't receive code? <span className="text-primary font-bold cursor-pointer">Resend</span></p>
            </div>
          )}

          {step === 'details' && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>I am a...</Label>
                  <Select onValueChange={setRole} value={role}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">Regular Reader</SelectItem>
                      <SelectItem value="reporter">Local Reporter</SelectItem>
                      <SelectItem value="admin">Admin / Editor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Primary Location</Label>
                  <Input placeholder="Enter your Mandal" />
                </div>
              </div>
              <Button className="w-full h-12 text-lg" onClick={handleNext}>Get Started</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
