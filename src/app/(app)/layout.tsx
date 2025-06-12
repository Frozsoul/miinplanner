
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

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider defaultOpen>
      {/* 
        The Sidebar component is the 'peer' for Tailwind's peer-[] variants.
        Its data-state will be 'expanded' or 'collapsed'.
      */}
      <Sidebar collapsible="offcanvas" className="group peer"> {/* Desktop: off-canvas, Mobile: off-canvas (sheet) */}
        <SidebarHeader className={cn(
          "p-4 border-b border-sidebar-border",
          "peer-data-[state=collapsed]:hidden" // Hide header content when sidebar is collapsed
        )}>
          <div className={cn(
            "flex items-center justify-between"
          )}>
            <Logo className="peer-data-[state=collapsed]:hidden" />
            {/* This internal trigger is to CLOSE an expanded sidebar */}
            {/* Visible only when its parent SidebarHeader is visible (i.e., sidebar expanded) */}
            <SidebarTrigger
              className={cn(
                "flex" 
              )}
            />
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
              - Mobile: Always visible.
              - Desktop: Visible ONLY if the sidebar (peer) is collapsed. Hidden if sidebar is expanded.
            */}
            <SidebarTrigger asChild
              className={cn(
                "flex", // Default: visible (applies to mobile)
                "peer-data-[state=expanded]:md:hidden",   // On desktop, hide if sidebar is expanded
                "peer-data-[state=collapsed]:md:flex"    // On desktop, show if sidebar is collapsed
              )}
            >
              <Button size="icon" variant="outline">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-panel-left-open"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 3v18M15 3v18"/></svg>
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
