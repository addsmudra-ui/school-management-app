
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
  Megaphone,
  UserRoundPen,
  UserRoundCog
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
  { name: "Reporters", icon: UserRoundPen, href: "/admin/reporters", label: "రిపోర్టర్లు" },
  { name: "Editors", icon: UserRoundCog, href: "/admin/editors", label: "ఎడిటర్లు" },
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

  const isAdminEmail = user?.email === 'admin@telugunewspulse.com';

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
      localStorage.removeItem('teluguNewsPulse_role');
      localStorage.removeItem('teluguNewsPulse_userName');
      localStorage.removeItem('teluguNewsPulse_userPhone');
      localStorage.removeItem('teluguNewsPulse_userStatus');
      localStorage.removeItem('teluguNewsPulse_userPhoto');
      window.location.href = '/login';
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const handleChangePassword = () => {
    if (!firestore) return;
    if (newPass.length < 4) {
      toast({ variant: "destructive", title: "Error", description: "Min 4 characters." });
      return;
    }
    AdminService.setPassword(firestore, newPass);
    setIsPasswordModalOpen(false);
    setNewPass("");
    toast({ title: "Updated" });
  };

  const filteredNavItems = useMemo(() => {
    if (isAdminEmail) return navItems;
    if (!profile) return [];
    
    // Non-admins (Editors) only see a subset of tools
    const editorAllowed = ["Dashboard", "New Post", "Approvals"];
    return navItems.filter(item => editorAllowed.includes(item.name));
  }, [profile, isAdminEmail]);

  return (
    <>
      <Sidebar className="border-r border-muted bg-white">
        <SidebarHeader className="p-4">
          <Link href="/" className="flex items-center gap-2 text-primary font-bold">
            <div className="bg-primary p-1.5 rounded-lg text-white relative w-8 h-8 flex items-center justify-center">
              {branding?.appLogo ? (
                <Image src={branding.appLogo} alt="Logo" fill className="object-contain p-0.5" />
              ) : (
                <Newspaper className="w-5 h-5" />
              )}
            </div>
            <span className="text-lg font-headline tracking-tight leading-tight">{branding?.appName || 'Telugu News Pulse'}</span>
          </Link>
        </SidebarHeader>
        
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel className="px-4 text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-1">
              Management
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="px-2">
                {filteredNavItems.map((item) => (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton asChild isActive={pathname === item.href}>
                      <Link 
                        href={item.href}
                        className={cn(
                          "flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all duration-200 group",
                          pathname === item.href 
                            ? "bg-primary text-white shadow-md shadow-primary/20" 
                            : "text-muted-foreground hover:bg-primary/5 hover:text-primary"
                        )}
                      >
                        <item.icon className={cn("w-4 h-4", pathname === item.href ? "text-white" : "text-muted-foreground group-hover:text-primary")} />
                        <div className="flex flex-col">
                          <span className="text-xs font-bold leading-none">{item.name}</span>
                          <span className="text-[9px] opacity-70 leading-tight mt-0.5">{item.label}</span>
                        </div>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {isAdminEmail && (
            <SidebarGroup className="mt-2">
              <SidebarGroupLabel className="px-4 text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-1">
                Settings
              </SidebarGroupLabel>
              <SidebarGroupContent className="px-2">
                <button 
                  onClick={() => setIsPasswordModalOpen(true)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-muted-foreground hover:bg-rose-50 hover:text-rose-600 transition-all font-bold group"
                >
                  <KeyRound className="w-4 h-4 group-hover:text-rose-600" />
                  <div className="flex flex-col text-left">
                    <span className="text-xs">Password</span>
                    <span className="text-[9px] opacity-70">పాస్‌వర్డ్</span>
                  </div>
                </button>
              </SidebarGroupContent>
            </SidebarGroup>
          )}
        </SidebarContent>

        <SidebarFooter className="p-4 mt-auto">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-destructive hover:bg-destructive/5 transition-colors font-bold"
          >
            <LogOut className="w-4 h-4" />
            <div className="flex flex-col text-left">
              <span className="text-xs">Logout</span>
              <span className="text-[9px] opacity-70">లాగ్ అవుట్</span>
            </div>
          </button>
        </SidebarFooter>
      </Sidebar>

      <Dialog open={isPasswordModalOpen} onOpenChange={setIsPasswordModalOpen}>
        <DialogContent className="max-sm rounded-xl">
          <DialogHeader><DialogTitle className="text-base">పాస్‌వర్డ్ మార్చండి</DialogTitle></DialogHeader>
          <div className="py-2 space-y-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">కొత్త పాస్‌వర్డ్</label>
              <Input type="password" value={newPass} onChange={(e) => setNewPass(e.target.value)} placeholder="Password" className="h-9 text-sm" />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" className="h-9 text-xs" onClick={() => setIsPasswordModalOpen(false)}>రద్దు</Button>
            <Button size="sm" className="h-9 text-xs" onClick={handleChangePassword}>నవీకరించు</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
