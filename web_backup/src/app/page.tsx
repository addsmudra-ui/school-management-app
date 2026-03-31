'use client';

import React, { Suspense } from "react";
import { Loader2 } from "lucide-react";
// మీరు క్రియేట్ చేసిన కొత్త ఫైల్స్ ఇక్కడ ఇంపోర్ట్ అవుతాయి
import { Navbar } from "@/components/layout/Navbar";
import { NewsFeedContent } from "@/components/news/NewsFeedContent";

export default function Home() {
  return (
    <main className="fixed inset-0 bg-background overflow-hidden select-none">
      {/* ముఖ్య గమనిక: Navbar మరియు NewsFeedContent రెండింటినీ 
        Suspense లోపల పెట్టడం వల్ల 'useSearchParams' ఎర్రర్ రాదు.
      */}
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-screen bg-background">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
          <p className="ml-2">లోడ్ అవుతోంది...</p>
        </div>
      }>
        <Navbar />
        <NewsFeedContent />
      </Suspense>
    </main>
  );
}