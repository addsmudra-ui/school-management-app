"use client";

import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileCheck, AlertCircle, CheckCircle2, ArrowLeft, PenTool } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function GuidelinesPage() {
  return (
    <main className="min-h-screen bg-slate-50/50 pb-24 md:pt-20">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 pt-8 space-y-6">
        <Link href="/profile">
          <Button variant="ghost" size="sm" className="gap-2 mb-2">
            <ArrowLeft className="w-4 h-4" />
            తిరిగి వెళ్ళండి
          </Button>
        </Link>

        <Card className="border-none shadow-xl rounded-3xl overflow-hidden bg-white">
          <CardHeader className="bg-primary/5 border-b border-primary/10 py-8">
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-4 mx-auto">
              <FileCheck className="w-6 h-6 text-primary" />
            </div>
            <CardTitle className="text-3xl font-bold font-headline text-center">వార్త కంటెంట్ నిబంధనలు (Content Guidelines)</CardTitle>
          </CardHeader>
          <CardContent className="p-8 space-y-6 text-slate-700 leading-relaxed">
            <p className="font-bold text-primary italic">
              రిపోర్టర్లు వార్తలను పంపే ముందు ఈ క్రింది నిబంధనలను తప్పనిసరిగా చదవాలి:
            </p>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                నిజాయితీ మరియు ఖచ్చితత్వం
              </h2>
              <p>
                ప్రతి వార్త ఖచ్చితమైన సమాచారంతో ఉండాలి. తప్పుడు వార్తలు లేదా పుకార్లను వ్యాప్తి చేయడం నిషేధించబడింది. వార్త మూలాలను (Sources) సరిచూసుకోవడం రిపోర్టర్ బాధ్యత.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                <PenTool className="w-5 h-5 text-amber-500" />
                అడ్మిన్ తనిఖీ (Admin Review)
              </h2>
              <p>
                మీరు పంపిన ప్రతి వార్తను మా డెస్క్ ఇన్‌చార్జ్ లేదా ఎడిటర్ సమీక్షిస్తారు. వార్త నాణ్యత, భాష మరియు వాస్తవాలను తనిఖీ చేసిన తర్వాతే అది లైవ్ చేయబడుతుంది. అడ్మిన్‌కు ఏ వార్తనైనా తిరస్కరించే లేదా ఎడిట్ చేసే అధికారం ఉంది.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-rose-500" />
                నిషేధించబడిన అంశాలు
              </h2>
              <ul className="list-disc pl-5 space-y-1">
                <li>కుల, మత విద్వేషాలను ప్రేరేపించే వార్తలు.</li>
                <li>అసభ్యకరమైన భాష లేదా చిత్రాలు.</li>
                <li>ఎవరినైనా వ్యక్తిగతంగా కించపరిచే కంటెంట్.</li>
                <li>కాపీరైట్ ఉల్లంఘించే ఇతర వెబ్‌సైట్ల చిత్రాలు.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-foreground">ర్యాంకింగ్ మరియు గుర్తింపు</h2>
              <p>
                మీరు అందించే వార్తల నాణ్యత మరియు వేగం ఆధారంగా మీకు "Sr. Reporter" హోదా మరియు స్టార్ రేటింగ్ ఇవ్వబడుతుంది. ఇది అడ్మిన్ ద్వారా నిర్వహించబడుతుంది.
              </p>
            </section>

            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 text-emerald-800 text-sm">
              <strong>గమనిక:</strong> పైన పేర్కొన్న నిబంధనలను ఉల్లంఘించిన రిపోర్టర్ల అకౌంట్ ఎటువంటి ముందస్తు నోటీసు లేకుండా రద్దు చేయబడుతుంది.
            </div>
          </CardContent>
        </Card>
        
        <Footer />
      </div>
    </main>
  );
}
