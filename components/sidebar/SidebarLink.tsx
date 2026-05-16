"use client";

import Link from "next/link";
import type { IconType } from "react-icons";

type SidebarLinkProps = {
  href: string;
  icon: IconType;
  isActive: boolean;
  label: string;
  onNavigate?: () => void;
};

export function SidebarLink({
  href,
  icon: Icon,
  isActive,
  label,
  onNavigate,
}: SidebarLinkProps) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      aria-current={isActive ? "page" : undefined}
      className={[
        "group flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium outline-none transition-all duration-200",
        "focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
        isActive
          ? "bg-blue-500 text-white shadow-sm"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-950",
      ].join(" ")}
    >
      <Icon
        className={[
          "h-4 w-4 shrink-0 transition-colors duration-200",
          isActive ? "text-white" : "text-slate-400 group-hover:text-slate-700",
        ].join(" ")}
        aria-hidden="true"
      />
      <span className="truncate">{label}</span>
    </Link>
  );
}
