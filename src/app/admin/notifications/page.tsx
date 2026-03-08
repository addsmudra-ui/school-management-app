"use client";

import { Bell } from "lucide-react";

export default function AdminNotifications() {
  return (
    <div className="max-w-4xl mx-auto py-12 text-center space-y-4">
      <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
        <Bell className="w-8 h-8 text-primary" />
      </div>
      <h2 className="text-2xl font-bold">FCM Notifications</h2>
      <p className="text-muted-foreground">Send and manage alerts. Coming soon.</p>
    </div>
  );
}
