"use client";

import { 
  LayoutDashboard, 
  PlusCircle, 
  CheckSquare, 
  MapPin, 
  Users, 
  Bell, 
  LogOut,
  Newspaper
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
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

const navItems = [
  { name: "Dashboard", icon: LayoutDashboard, href: "/admin", label: "డాష్‌బోర్డ్" },
  { name: "New Post", icon: PlusCircle, href: "/admin/new-post", label: "కొత్త వార్త" },
  { name: "Approvals", icon: CheckSquare, href: "/admin/approvals", label: "ఆమోదాలు" },
  { name: "Locations", icon: MapPin, href: "/admin/locations", label: "ప్రాంతాలు" },
  { name: "Users", icon: Users, href: "/admin/users", label: "వినియోగదారులు" },
  { name: "Notifications", icon: Bell, href: "/admin/notifications", label: "నోటిఫికేషన్లు" },
];

export function AdminSidebar() {
  const pathname = usePathname();

  const handleLogout = () => {
    localStorage.removeItem('mandalPulse_role');
    localStorage.removeItem('mandalPulse_userName');
    window.location.href = '/login';
  };

  return (
    <Sidebar className="border-r border-muted bg-white">
      <SidebarHeader className="p-6">
        <Link href="/" className="flex items-center gap-3 text-primary font-bold">
          <div className="bg-primary p-2 rounded-xl text-white">
            <Newspaper className="w-6 h-6" />
          </div>
          <span className="text-xl font-headline tracking-tight">MandalPulse</span>
        </Link>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="px-6 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-2">
            నిర్వహణ (Management)
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="px-3">
              {navItems.map((item) => (
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
  );
}
