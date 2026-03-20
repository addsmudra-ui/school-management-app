
"use client";

import { 
  LayoutDashboard, 
  PlusCircle, 
  CheckSquare, 
  MapPin, 
  Users, 
  Bell, 
  LogOut,
  Newspaper,
  KeyRound,
  Palette,
  Megaphone
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useState, useMemo } from "react";
import { AdminService } from "@/lib/storage";
import { useToast } from "@/hooks/use-toast";
import { useFirestore, useDoc, useMemoFirebase, useAuth, useUser } from "@/firebase";
import { doc } from "firebase/firestore";
import Image from "next/image";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from "@/components/ui/sidebar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const navItems = [
  { name: "Dashboard", icon: LayoutDashboard, href: "/admin", label: "డాష్‌బోర్డ్" },
  { name: "New Post", icon: PlusCircle, href: "/admin/new-post", label: "కొత్త వార్త" },
  { name: "Approvals", icon: CheckSquare, href: "/admin/approvals", label: "ఆమోదాలు" },
  { name: "Ads", icon: Megaphone, href: "/admin/ads", label: "ప్రకటనలు" },
  { name: "Locations", icon: MapPin, href: "/admin/locations", label: "ప్రాంతాలు" },
  { name: "Users", icon: Users, href: "/admin/users", label: "వినియోగదారులు" },
  { name: "Notifications", icon: Bell, href: "/admin/notifications", label: "నోటిఫికేషన్లు" },
  { name: "Branding", icon: Palette, href: "/admin/branding", label: "బ్రాండింగ్" },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const firestore = useFirestore();
  const auth = useAuth();
  const { user } = useUser();
  const { toast } = useToast();
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [newPass, setNewPass] = useState("");

  const brandingRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'config', 'admin');
  }, [firestore]);

  const userRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user?.uid]);

  const { data: branding } = useDoc(brandingRef);
  const { data: profile } = useDoc(userRef);

  const handleLogout = async () => {
    try {
      await auth.signOut();
      localStorage.removeItem('mandalPulse_role');
      localStorage.removeItem('mandalPulse_userName');
      localStorage.removeItem('mandalPulse_userPhone');
      localStorage.removeItem('mandalPulse_userStatus');
      localStorage.removeItem('mandalPulse_userPhoto');
      window.location.href = '/login';
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const handleChangePassword = () => {
    if (!firestore) return;
    if (newPass.length < 4) {
      toast({ variant: "destructive", title: "Error", description: "Password must be at least 4 characters." });
      return;
    }
    AdminService.setPassword(firestore, newPass);
    setIsPasswordModalOpen(false);
    setNewPass("");
    toast({ title: "Success", description: "Admin password updated successfully." });
  };

  const filteredNavItems = useMemo(() => {
    if (!profile) return [];
    if (profile.role === 'admin') return navItems;
    
    // Editors only see content moderation tools
    const editorAllowed = ["Dashboard", "New Post", "Approvals", "Ads", "Locations"];
    return navItems.filter(item => editorAllowed.includes(item.name));
  }, [profile]);

  return (
    <>
      <Sidebar className="border-r border-muted bg-white">
        <SidebarHeader className="p-6">
          <Link href="/" className="flex items-center gap-3 text-primary font-bold">
            <div className="bg-primary p-2 rounded-xl text-white relative w-10 h-10 flex items-center justify-center">
              {branding?.appLogo ? (
                <Image src={branding.appLogo} alt="Logo" fill className="object-contain p-1" />
              ) : (
                <Newspaper className="w-6 h-6" />
              )}
            </div>
            <span className="text-xl font-headline tracking-tight">{branding?.appName || 'News Pulse'}</span>
          </Link>
        </SidebarHeader>
        
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel className="px-6 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-2">
              నిర్వహణ (Management)
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="px-3">
                {filteredNavItems.map((item) => (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton asChild isActive={pathname === item.href}>
                      <Link 
                        href={item.href}
                        className={cn(
                          "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                          pathname === item.href 
                            ? "bg-primary text-white shadow-lg shadow-primary/20" 
                            : "text-muted-foreground hover:bg-primary/5 hover:text-primary"
                        )}
                      >
                        <item.icon className={cn("w-5 h-5", pathname === item.href ? "text-white" : "text-muted-foreground group-hover:text-primary")} />
                        <div className="flex flex-col">
                          <span className="text-sm font-bold leading-none">{item.name}</span>
                          <span className="text-[10px] opacity-70 leading-tight mt-1">{item.label}</span>
                        </div>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {profile?.role === 'admin' && (
            <SidebarGroup className="mt-4">
              <SidebarGroupLabel className="px-6 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-2">
                సెట్టింగ్స్
              </SidebarGroupLabel>
              <SidebarGroupContent className="px-3">
                <button 
                  onClick={() => setIsPasswordModalOpen(true)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground hover:bg-rose-50 hover:text-rose-600 transition-all font-bold group"
                >
                  <KeyRound className="w-5 h-5 group-hover:text-rose-600" />
                  <div className="flex flex-col text-left">
                    <span className="text-sm">Password</span>
                    <span className="text-[10px] opacity-70">పాస్‌వర్డ్ మార్చు</span>
                  </div>
                </button>
              </SidebarGroupContent>
            </SidebarGroup>
          )}
        </SidebarContent>

        <SidebarFooter className="p-6 mt-auto">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-destructive hover:bg-destructive/5 transition-colors font-bold"
          >
            <LogOut className="w-5 h-5" />
            <div className="flex flex-col text-left">
              <span className="text-sm">Logout</span>
              <span className="text-[10px] opacity-70">లాగ్ అవుట్</span>
            </div>
          </button>
        </SidebarFooter>
      </Sidebar>

      <Dialog open={isPasswordModalOpen} onOpenChange={setIsPasswordModalOpen}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle>పాస్‌వర్డ్ మార్చండి</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-muted-foreground">కొత్త పాస్‌వర్డ్</label>
              <Input 
                type="password" 
                value={newPass} 
                onChange={(e) => setNewPass(e.target.value)} 
                placeholder="New Admin Password"
                className="h-11"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPasswordModalOpen(false)}>రద్దు</Button>
            <Button onClick={handleChangePassword}>నవీకరించు</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
