"use client";

import { MapPin } from "lucide-react";

export default function AdminLocations() {
  return (
    <div className="max-w-4xl mx-auto py-12 text-center space-y-4">
      <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
        <MapPin className="w-8 h-8 text-primary" />
      </div>
      <h2 className="text-2xl font-bold">Location Management</h2>
      <p className="text-muted-foreground">Manage Mandals and Districts. Coming soon.</p>
    </div>
  );
}
