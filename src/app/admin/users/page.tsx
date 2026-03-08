"use client";

import { Users } from "lucide-react";

export default function AdminUsers() {
  return (
    <div className="max-w-4xl mx-auto py-12 text-center space-y-4">
      <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
        <Users className="w-8 h-8 text-primary" />
      </div>
      <h2 className="text-2xl font-bold">Role Management</h2>
      <p className="text-muted-foreground">Manage roles for users and reporters. Coming soon.</p>
    </div>
  );
}
