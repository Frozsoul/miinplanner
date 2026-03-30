"use client";

import {
  LayoutDashboard,
  ListChecks,
  CalendarDays,
  Lightbulb,
  Library,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface NavItem {
    href: string;
    icon: LucideIcon;
    label: string;
}

const allNavItems: NavItem[] = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/tasks", icon: ListChecks, label: "Task Manager" },
  { href: "/teamwork", icon: Users, label: "Teamwork" },
  { href: "/calendar", icon: CalendarDays, label: "Calendar" },
  { href: "/library", icon: Library, label: "Library" },
  { href: "/insights", icon: Lightbulb, label: "AI Insights" },
];

export const useNavItems = () => {
    return allNavItems;
}
