"use client";

import { usePathname } from "next/navigation";
import { FaChartPie, FaHome } from "react-icons/fa";
import { SidebarLink } from "./SidebarLink";
import Image from "next/image";

type SidebarProps = {
  onNavigate?: () => void;
};

const navigationItems = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: FaChartPie,
  },
  {
    href: "/orders",
    label: "Página Inicial",
    icon: FaHome,
  },
];

export function Sidebar({ onNavigate }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-72 flex-col border-r border-slate-200 bg-white shadow-sm">
      <div className="flex h-20 items-center gap-3 border-b border-slate-200 px-5">
        <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full border border-slate-200 shadow-sm">
          <Image src="/images/orion.png" alt="Logo Sistema Orion" fill className="object-cover" priority/>
        </div>

        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-950">
            Sistema Orion
          </p>
          <p className="truncate text-xs text-slate-500">
            Gestão de pedidos
          </p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3 py-4" aria-label="Principal">
        {navigationItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <SidebarLink
              key={item.href}
              href={item.href}
              icon={item.icon}
              isActive={isActive}
              label={item.label}
              onNavigate={onNavigate}
            />
          );
        })}
      </nav>
    </aside>
  );
}
