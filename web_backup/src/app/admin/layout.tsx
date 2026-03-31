
"use client";

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { Footer } from "@/components/layout/Footer";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { Loader2 } from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  
  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user?.uid]);

  const { data: profile, isLoading: isProfileLoading } = useDoc(userDocRef);

  const isAdminEmail = user?.email === 'admin@telugunewspulse.com';

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  useEffect(() => {
    // Wait for user to be definitely known
    if (!isUserLoading) {
      if (!user) return;

      // Master Admin is ALWAYS authorized by email alone
      if (isAdminEmail) return;

      // For others, we wait for profile to confirm 'editor' role
      if (!isProfileLoading) {
        const isAuthorized = profile && profile.role === 'editor';
        if (!isAuthorized) {
          router.push('/');
        }
      }
    }
  }, [profile, isProfileLoading, router, isAdminEmail, isUserLoading, user]);

  // Loading state: Only show loader for Master Admin if user object itself is loading.
  // For others, wait for profile loading too.
  if (isUserLoading || (isProfileLoading && !isAdminEmail)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  // Final authorization check for rendering
  const canRender = user && (isAdminEmail || (profile && profile.role === 'editor'));

  if (!canRender) {
    return null;
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-slate-50/50 overflow-hidden">
        <AdminSidebar />
        <SidebarInset className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-8 pt-20 md:pt-8">
            <div className="max-w-6xl mx-auto">
              {children}
            </div>
            <Footer />
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
