
"use client";

import {
  LayoutDashboard,
  ListChecks,
  CalendarDays,
  BotMessageSquare,
  Lightbulb,
  Shield,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";

interface NavItem {
    href: string;
    icon: LucideIcon;
    label: string;
    isPremium?: boolean;
}

const allNavItems: NavItem[] = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/tasks", icon: ListChecks, label: "Task Manager" },
  { href: "/calendar", icon: CalendarDays, label: "Calendar" },
  { href: "/insights", icon: Lightbulb, label: "AI Insights", isPremium: true },
  { href: "/chatbot", icon: BotMessageSquare, label: "AI Chatbot", isPremium: true },
];

export const useNavItems = () => {
    const { userProfile } = useAuth();
    const isPremium = userProfile?.plan === 'premium';

    const navItems = allNavItems.map(item => {
        if(item.isPremium && !isPremium) {
            return {
                ...item,
                icon: Shield, // Or another icon to indicate premium
            };
        }
        return item;
    });

    return navItems;
}
