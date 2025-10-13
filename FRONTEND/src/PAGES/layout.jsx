import React from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";

export default function Layout({ children }) {
  return (
    <SidebarProvider>
      <div className="flex h-screen w-screen overflow-hidden">
        {/* Sidebar on the left */}
        <AppSidebar />

        {/* Main content */}
        <main className="flex-1 relative flex flex-col">
          {/* Sidebar toggle — top-left */}
          <div className="absolute top-4 left-4 z-10">
            <SidebarTrigger />
          </div>

          {/* Page content */}
          <div className="flex-1 flex items-center justify-center">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
