"use client";

import { FaBars, FaTimes } from "react-icons/fa";
import { Sidebar } from "./Sidebar";

type MobileSidebarProps = {
  isOpen: boolean;
  onClose: () => void;
  onOpen: () => void;
};

export function MobileSidebar({ isOpen, onClose, onOpen }: MobileSidebarProps) {
  return (
    <>
      <header className="fixed inset-x-0 top-0 z-40 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 shadow-sm backdrop-blur lg:hidden">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-slate-950" aria-hidden="true" />
          <span className="text-sm font-semibold text-slate-950">
            Sistema Orion
          </span>
        </div>

        <button
          type="button"
          onClick={onOpen}
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm outline-none transition-all duration-200 hover:bg-slate-50 hover:text-slate-950 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          aria-label="Abrir menu"
          aria-expanded={isOpen}
        >
          <FaBars className="h-4 w-4" aria-hidden="true" />
        </button>
      </header>

      <div
        className={[
          "fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm transition-opacity duration-300 lg:hidden",
          isOpen ? "opacity-100" : "pointer-events-none opacity-0",
        ].join(" ")}
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        className={[
          "fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-300 ease-out lg:hidden",
          isOpen ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        <div className="relative h-full">
          <Sidebar onNavigate={onClose} />
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-5 inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 outline-none transition-all duration-200 hover:bg-slate-100 hover:text-slate-950 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            aria-label="Fechar menu"
          >
            <FaTimes className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </>
  );
}
