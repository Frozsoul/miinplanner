
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
      {/* On desktop, sidebar collapses to icon rail. Trigger to expand is IN the icon rail's header. */}
      {/* On mobile, sidebar is an off-canvas sheet. Trigger is in the main app header. */}
      <Sidebar collapsible="icon">
        <SidebarHeader className={cn(
          "p-4 border-b border-sidebar-border",
          "peer-data-[state=collapsed]:peer-data-[collapsible=icon]:p-2" // Reduced padding in icon mode
        )}>
          <div className={cn(
            "flex items-center justify-between",
            "peer-data-[state=collapsed]:peer-data-[collapsible=icon]:justify-center" // Center content in icon mode
          )}>
            <Logo className="peer-data-[state=collapsed]:peer-data-[collapsible=icon]:hidden" />
            {/* This trigger is for DESKTOP: 
                - Closes an expanded sidebar.
                - Expands an icon-collapsed sidebar.
                It's located within the sidebar header itself.
            */}
            <SidebarTrigger
              className={cn(
                "hidden",       // Hidden on mobile (main header trigger used for mobile)
                "md:!flex"      // Displayed on desktop (md and up), !important to ensure visibility
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
        {/* This header contains the trigger for MOBILE off-canvas sidebar */}
        <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 py-4">
            <SidebarTrigger asChild
              className={cn(
                "flex",     // Visible on mobile
                "md:hidden"  // Hidden on desktop (desktop uses trigger inside sidebar)
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
