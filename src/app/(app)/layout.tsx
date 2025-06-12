
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
      <Sidebar> {/* Defaults to collapsible="offcanvas" */}
        <SidebarHeader className="p-4 border-b border-sidebar-border">
          <div className="flex items-center justify-between">
            <Logo />
            {/* This trigger is for closing an open sidebar, or expanding an "icon" collapsed sidebar */}
            <SidebarTrigger
              className={cn(
                "hidden", // Base: hidden on mobile
                "md:flex", // Default on desktop: visible
                // Hide on desktop if sidebar is collapsed AND in offcanvas mode (external trigger will handle)
                "peer-data-[state=collapsed]:peer-data-[collapsible=offcanvas]:md:hidden"
              )}
            />
          </div>
        </SidebarHeader>
        <SidebarContent className="p-2">
          <SidebarNav />
        </SidebarContent>
        <SidebarFooter className="p-2 border-t border-sidebar-border">
          <SidebarUser />
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 py-4">
            <SidebarTrigger asChild
              className={cn(
                "flex", // Default: visible (primarily for mobile)
                // Desktop states:
                "peer-data-[state=expanded]:md:hidden", // If sidebar expanded, hide on desktop
                "peer-data-[state=collapsed]:peer-data-[collapsible=icon]:md:hidden", // If sidebar collapsed to icon, hide on desktop
                "peer-data-[state=collapsed]:peer-data-[collapsible=offcanvas]:md:flex" // If sidebar collapsed to offcanvas, show on desktop
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

