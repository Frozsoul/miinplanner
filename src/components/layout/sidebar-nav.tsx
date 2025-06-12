"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ListChecks,
  CalendarDays,
  Bell,
  BotMessageSquare,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";


const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/tasks", icon: ListChecks, label: "Task Manager" },
  { href: "/calendar", icon: CalendarDays, label: "Content Calendar" },
  { href: "/reminders", icon: Bell, label: "Reminders" },
  { href: "/chatbot", icon: BotMessageSquare, label: "AI Chatbot" },
];

export function SidebarNav() {
  const pathname = usePathname();
  const { state: sidebarState } = useSidebar();

  return (
    <SidebarMenu>
      {navItems.map((item) => (
        <SidebarMenuItem key={item.href}>
          <Link href={item.href} legacyBehavior passHref>
            <SidebarMenuButton
              isActive={pathname === item.href || (pathname.startsWith(item.href) && item.href !== "/dashboard" )}
              tooltip={item.label}
              className="justify-start"
            >
              <item.icon className="h-5 w-5" />
              {sidebarState === "expanded" && <span>{item.label}</span>}
            </SidebarMenuButton>
          </Link>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}

export function SidebarUser() {
  const { state: sidebarState } = useSidebar();
  return (
    <div className="mt-auto">
       <Link href="#" legacyBehavior passHref>
        <SidebarMenuButton tooltip="Settings" className="justify-start">
          <Settings className="h-5 w-5" />
          {sidebarState === "expanded" && <span>Settings</span>}
        </SidebarMenuButton>
      </Link>
    </div>
  )
}
