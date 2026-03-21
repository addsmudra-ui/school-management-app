"use client";

import React, { Suspense } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import Link from "next/link";

function NotFoundContent() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-4xl font-black text-primary mb-2">404</h1>
        <h2 className="text-xl font-bold mb-4">పేజీ దొరకలేదు</h2>
        <Link href="/">
          <Button className="rounded-2xl font-bold shadow-lg">హోమ్ పేజీకి వెళ్ళండి</Button>
        </Link>
      </main>
      <Footer />
    </div>
  );
}

export default function NotFound() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <NotFoundContent />
    </Suspense>
  );
}