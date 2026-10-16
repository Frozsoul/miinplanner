
"use client";

import {
  ListChecks,
  Smile,
  Library,
  Users,
  Sparkles,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface NavItem {
    href: string;
    icon: LucideIcon;
    label: string;
}

const allNavItems: NavItem[] = [
  { href: "/tasks", icon: ListChecks, label: "Task Manager" },
  { href: "/companion", icon: Smile, label: "Companion" },
  { href: "/teamwork", icon: Users, label: "Teamwork" },
  { href: "/library", icon: Library, label: "Library" },
  { href: "/planner", icon: Sparkles, label: "Plan with AI" },
];

export const useNavItems = () => {
    return allNavItems;
}
