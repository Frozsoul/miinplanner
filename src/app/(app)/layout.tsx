
"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Logo } from "@/components/common/logo";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { navItems } from "@/components/layout/nav-items";
import { User, Settings, LogOut, Loader2, PanelLeft } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useEffect } from 'react';
import { AppDataProvider } from '@/contexts/app-data-context';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, logout } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null; // Don't render anything if not logged in (redirect will handle it)
  }

  const handleLogout = async () => {
    await logout();
  };

  return (
    <AppDataProvider>
      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-background"> {/* ADDED w-full HERE */}
          <Sidebar
            variant="sidebar" 
            collapsible="icon" 
            className="border-r" 
          >
            <SidebarHeader className="p-4 flex items-center justify-center data-[state=collapsed]:justify-center group-data-[collapsible=icon]:py-3.5 h-14">
               <Logo className="h-7 group-data-[collapsible=icon]:h-6 transition-all duration-300" />
            </SidebarHeader>
            <SidebarContent>
              <SidebarMenu>
                {navItems.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === item.href || (pathname.startsWith(item.href) && item.href !== "/dashboard" && item.href !== "/")}
                      tooltip={item.label}
                      className="justify-start" 
                    >
                      <Link href={item.href}>
                        <item.icon className="h-5 w-5" />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarContent>
          </Sidebar>

          <SidebarInset> 
            <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background/95 px-4 sm:px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <div className="md:hidden">
                 <SidebarTrigger asChild>
                    <Button size="icon" variant="outline" className="h-8 w-8">
                        <PanelLeft className="h-4 w-4" />
                        <span className="sr-only">Toggle Menu</span>
                    </Button>
                 </SidebarTrigger>
              </div>
              
              <div className="hidden md:block">
                <SidebarTrigger asChild>
                    <Button size="icon" variant="outline" className="h-8 w-8">
                        <PanelLeft className="h-4 w-4" />
                        <span className="sr-only">Toggle Menu</span>
                    </Button>
                 </SidebarTrigger>
              </div>

              <div className="ml-auto flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback><User className="h-5 w-5" /></AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user.displayName || "User"}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user.email || "No email"}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="#"> 
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Settings</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </header>
            <main className="flex-1 w-full overflow-auto">
              {children}
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </AppDataProvider>
  );
}
