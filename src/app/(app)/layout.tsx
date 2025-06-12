
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarTrigger,
  SidebarInset,
} from "@/components/ui/sidebar";
import { SidebarNav, SidebarUser } from "@/components/layout/sidebar-nav";
import { Logo } from "@/components/common/logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PanelLeftOpen, X } from "lucide-react";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider defaultOpen>
      <Sidebar collapsible="offcanvas" className="group peer">
        <SidebarHeader className={cn(
          "p-4 border-b border-sidebar-border",
          "peer-data-[state=collapsed]:hidden"
        )}>
          <div className={cn(
            "flex items-center justify-between"
          )}>
            <Logo className="peer-data-[state=collapsed]:hidden" />
            {/* Internal trigger to CLOSE an expanded sidebar */}
            <SidebarTrigger asChild
              className={cn(
                "flex" // Visible when SidebarHeader is visible (i.e. sidebar expanded)
              )}
            >
              <Button variant="ghost" size="icon"><X className="h-5 w-5"/></Button>
            </SidebarTrigger>
          </div>
        </SidebarHeader>
        <SidebarContent className="p-2 peer-data-[state=collapsed]:hidden">
          <SidebarNav />
        </SidebarContent>
        <SidebarFooter className="p-2 border-t border-sidebar-border peer-data-[state=collapsed]:hidden">
          <SidebarUser />
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        {/* This header contains the primary trigger */}
        <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 py-4">
            {/* 
              This trigger toggles the off-canvas sidebar.
              Always visible on all screen sizes.
            */}
            <SidebarTrigger asChild
              className={cn(
                "flex" 
              )}
            >
              <Button size="icon" variant="outline">
                <PanelLeftOpen className="h-5 w-5" />
              </Button>
            </SidebarTrigger>
             <div className="flex items-center gap-2 ml-auto md:hidden"> {/* Mobile-only Logo */}
               <Logo />
            </div>
        </header>
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
