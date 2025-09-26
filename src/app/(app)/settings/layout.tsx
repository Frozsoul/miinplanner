
"use client";

import { PageHeader } from "@/components/PageHeader";
import { Settings, CreditCard, ListTodo, Palette } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const settingsNav = [
  { name: "Plan & Billing", href: "/settings/billing", icon: CreditCard },
  { name: "Workflow", href: "/settings/workflow", icon: ListTodo },
  { name: "Appearance", href: "/settings/appearance", icon: Palette },
];

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="px-4 sm:px-6 md:py-6 space-y-6">
      <PageHeader
        title="Settings"
        description="Manage your account and application preferences."
        icon={Settings}
      />
      <div className="max-w-6xl mx-auto lg:grid lg:grid-cols-12 lg:gap-10">
        <aside className="lg:col-span-3 pb-6">
          <nav className="space-y-1">
            {settingsNav.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "group flex items-center px-3 py-2 text-sm font-medium rounded-md",
                  pathname === item.href
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                )}
              >
                <item.icon
                  className={cn(
                    "mr-3 h-5 w-5 flex-shrink-0",
                     pathname === item.href ? "text-accent-foreground" : "text-muted-foreground group-hover:text-foreground"
                  )}
                />
                <span className="truncate">{item.name}</span>
              </Link>
            ))}
          </nav>
        </aside>
        <div className="lg:col-span-9">{children}</div>
      </div>
    </div>
  );
}
