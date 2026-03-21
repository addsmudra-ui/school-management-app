
"use client";

import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Lock, Eye, ArrowLeft, Mail, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-slate-50/50 pb-24 md:pt-20">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 pt-8 space-y-6">
        <Link href="/profile">
          <Button variant="ghost" size="sm" className="gap-2 mb-2 text-xs">
            <ArrowLeft className="w-3 h-3" />
            తిరిగి వెళ్ళండి
          </Button>
        </Link>
        
        <Card className="border-none shadow-xl rounded-3xl overflow-hidden bg-white">
          <CardHeader className="bg-primary/5 border-b border-primary/10 py-6">
            <div className="w-10 h-10 bg-primary/10 rounded-2xl flex items-center justify-center mb-3 mx-auto">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <CardTitle className="text-xl font-bold font-headline text-center">గోప్యతా విధానం (Privacy Policy)</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6 text-slate-700 leading-relaxed text-sm">
            <section className="space-y-2">
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <Eye className="w-4 h-4 text-primary" />
                సమాచార సేకరణ (Data Collection)
              </h2>
              <p className="text-xs md:text-sm">
                Telugu News Pulse యాప్ మీ పేరు, ఫోన్ నంబర్ మరియు ప్రాంతం (మండలం/జిల్లా) వంటి ప్రాథమిక వివరాలను సేకరిస్తుంది. ఈ సమాచారం మీకు సరైన ప్రాంతీయ వార్తలను అందించడానికి మరియు రిపోర్టర్లను ధృవీకరించడానికి ఉపయోగపడుతుంది.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <Lock className="w-4 h-4 text-primary" />
                డేటా భద్రత (Data Security)
              </h2>
              <p className="text-xs md:text-sm">
                మీ వ్యక్తిగత సమాచారం పూర్తిగా భద్రంగా ఉంటుంది. మేము మీ సమాచారాన్ని ఏ మూడవ పక్షం (Third Party) సంస్థలకు విక్రయించము లేదా అద్దెకు ఇవ్వము. మీ డేటా కేవలం అడ్మిన్ ప్యానెల్ ద్వారా మాత్రమే నిర్వహించబడుతుంది.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" />
                అనుమతులు (Permissions)
              </h2>
              <p className="text-xs md:text-sm">
                యాప్ సరిగ్గా పనిచేయడానికి మేము ఈ క్రింది అనుమతులను కోరవచ్చు:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-xs md:text-sm">
                <li>మీకు ముఖ్యమైన వార్తల అలర్ట్‌లను పంపడానికి నోటిఫికేషన్ అనుమతి.</li>
                <li>మీ ప్రాంతంలోని వార్తలను ముందుగా చూపడానికి లొకేషన్ సమాచారం.</li>
                <li>రిపోర్టర్లు వార్తా చిత్రాలను అప్‌లోడ్ చేయడానికి గ్యాలరీ అనుమతి.</li>
              </ul>
            </section>

            <section className="space-y-3 p-5 bg-primary/5 rounded-2xl border border-primary/10">
              <h2 className="text-base font-bold text-primary flex items-center gap-2">
                <Mail className="w-4 h-4" />
                ఫిర్యాదులు మరియు సమాచారం (Complaints)
              </h2>
              <p className="text-xs font-medium">
                మా గోప్యతా విధానం లేదా వార్తల కంటెంట్ గురించి మీకు ఏవైనా ఫిర్యాదులు లేదా సందేహాలు ఉంటే, దయచేసి మా అధికారిక ఈమెయిల్ ద్వారా మమ్మల్ని సంప్రదించండి:
              </p>
              <div className="flex items-center gap-2 pt-1">
                <a 
                  href="mailto:telugunewspulseinfo@gmail.com" 
                  className="text-xs font-normal text-primary hover:underline underline-offset-4"
                >
                  telugunewspulseinfo@gmail.com
                </a>
              </div>
            </section>
            
            <div className="pt-4 border-t text-[9px] text-muted-foreground text-center font-bold uppercase tracking-widest">
              చివరిగా అప్‌డేట్ చేయబడింది: {new Date().toLocaleDateString('te-IN')}
            </div>
          </CardContent>
        </Card>

        <Footer />
      </div>
    </main>
  );
}
