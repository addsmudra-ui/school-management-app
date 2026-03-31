'use client';

import React, { Suspense } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Loader2 } from "lucide-react";

// 1. ప్రైవసీ పాలసీ కంటెంట్‌ను విడిగా రాయండి
function PrivacyContent() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto p-6 pt-24">
        <h1 className="text-3xl font-bold mb-6">ప్రైవసీ పాలసీ (Privacy Policy)</h1>
        {/* ఇక్కడ మీ ప్రైవసీ పాలసీ మేటర్ మొత్తం ఉంచండి */}
        <p className="text-gray-700 leading-relaxed">
          మా అప్లికేషన్ వాడుతున్నందుకు ధన్యవాదాలు. మీ డేటా భద్రత మాకు ముఖ్యం...
        </p>
      </div>
    </div>
  );
}

// 2. మెయిన్ ఎక్స్‌పోర్ట్ ఫంక్షన్‌లో Suspense వాడండి
export default function PrivacyPage() {
  return (
    <>
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="animate-spin text-primary" />
        </div>
      }>
        <Navbar />
        <PrivacyContent />
        <Footer />
      </Suspense>
    </>
  );
}