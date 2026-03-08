"use client";

import { Newspaper } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function AdminNewPost() {
  return (
    <div className="max-w-4xl mx-auto py-12 text-center space-y-4">
      <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
        <Newspaper className="w-8 h-8 text-primary" />
      </div>
      <h2 className="text-2xl font-bold">New Post Editor</h2>
      <p className="text-muted-foreground">This section allows admins to post news directly. Coming soon.</p>
    </div>
  );
}
