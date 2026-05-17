"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { MobileSidebar } from "./MobileSidebar";
import { Sidebar } from "./Sidebar";

type DashboardShellProps = {
  children: React.ReactNode;
};

export function DashboardShell({ children }: DashboardShellProps) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const pathname = usePathname();

  const hideSidebar = pathname === "/dashboard";

  return (
    <div
      className={`min-h-screen ${
        hideSidebar ? "bg-zinc-950" : "bg-slate-50 lg:pl-72"
      }`}
    >
      {!hideSidebar && (
        <>
          <div className="fixed inset-y-0 left-0 z-40 hidden lg:block">
            <Sidebar />
          </div>

          <MobileSidebar
            isOpen={isMobileSidebarOpen}
            onClose={() => setIsMobileSidebarOpen(false)}
            onOpen={() => setIsMobileSidebarOpen(true)}
          />
        </>
      )}

      <main className={hideSidebar ? "min-w-0" : "min-w-0 pt-16 lg:pt-0"}>
        {children}
      </main>
    </div>
  );
}