"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { LoginModal } from "@/components/ui/LoginModal";
import { useEffect, useRef, useState } from "react";
import { Menu, X, Feather, Plus, UserRound, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

export function Navbar() {
  const { user, loading, signOut } = useAuth();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocumentClick(e: MouseEvent) {
      if (!profileMenuRef.current?.contains(e.target as Node)) {
        setProfileMenuOpen(false);
      }
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setProfileMenuOpen(false);
    }

    document.addEventListener("mousedown", onDocumentClick);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("mousedown", onDocumentClick);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  const navLinks = [
    { href: "/events", label: "Tìm Vãng Lai" },
    ...(user ? [{ href: "/dashboard", label: "Của Tôi" }] : []),
  ];

  return (
    <>
      <header className="sticky top-0 z-40 h-16 border-b border-[#DDE7F6] bg-white/90 backdrop-blur-xl">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-linear-to-r from-[#0052CC] via-[#23A7FF] to-[#7C3AED]" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 h-full flex items-center gap-4">
          <Link
            href="/"
            className="group flex items-center gap-2.5 font-bold text-xl text-[#0052CC]"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#E8F3FF] text-[#0052CC] shadow-sm transition-transform group-hover:-rotate-6 group-hover:scale-105">
              <Feather size={21} />
            </span>
            <span className="tracking-normal">Vala</span>
          </Link>

          <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 rounded-2xl bg-[#F6F9FE] p-1 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-xl px-4 py-2 text-sm font-semibold transition-all",
                  pathname.startsWith(link.href)
                    ? "bg-white text-[#0052CC] shadow-sm"
                    : "text-[#64748B] hover:bg-white/70 hover:text-[#1F2937]",
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto hidden md:flex items-center gap-3">
            {loading ? null : user ? (
              <>
                <Link href="/events/create">
                  <Button
                    size="sm"
                    className="h-10 rounded-2xl px-4 shadow-md shadow-[#0052CC]/20"
                  >
                    <Plus size={16} /> Tạo Vãng Lai
                  </Button>
                </Link>
                <div className="relative" ref={profileMenuRef}>
                  <button
                    onClick={() => setProfileMenuOpen((v) => !v)}
                    aria-haspopup="menu"
                    aria-expanded={profileMenuOpen}
                    className="flex items-center gap-2 rounded-2xl border border-transparent p-1 pr-3 transition-all hover:border-[#D8E2F0] hover:bg-[#F8FAFC]"
                  >
                    {user.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={user.avatar_url}
                        alt={user.display_name}
                        className="h-9 w-9 rounded-full object-cover ring-2 ring-[#E8F3FF]"
                      />
                    ) : (
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-linear-to-br from-[#0052CC] to-[#A855F7] text-sm font-semibold text-white shadow-sm">
                        {user.display_name[0]?.toUpperCase()}
                      </div>
                    )}
                    <span className="text-sm font-medium text-[#1F2937]">
                      {user.display_name}
                    </span>
                  </button>
                  <div
                    className={cn(
                      "absolute right-0 top-full mt-2 w-48 overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white p-1 shadow-xl transition-all",
                      profileMenuOpen
                        ? "translate-y-0 opacity-100 pointer-events-auto"
                        : "-translate-y-1 opacity-0 pointer-events-none",
                    )}
                  >
                    <Link
                      href="/profile/me"
                      onClick={() => setProfileMenuOpen(false)}
                      className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-[#1F2937] hover:bg-[#F3F4F6]"
                    >
                      <UserRound size={14} />
                      Hồ Sơ
                    </Link>
                    <button
                      onClick={() => {
                        setProfileMenuOpen(false);
                        signOut();
                      }}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium text-[#EF4444] hover:bg-[#FEF2F2]"
                    >
                      <LogOut size={14} />
                      Đăng Xuất
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <Button onClick={() => setLoginOpen(true)}>Đăng Nhập</Button>
            )}
          </div>

          <button
            className="ml-auto rounded-xl border border-[#E5E7EB] p-2 text-[#1F2937] md:hidden"
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {mobileOpen && (
          <div className="md:hidden bg-white/95 border-b border-[#E5E7EB] px-4 py-4 flex flex-col gap-3 shadow-lg">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "rounded-xl px-3 py-2 text-sm font-semibold",
                  pathname.startsWith(link.href)
                    ? "bg-[#E8F3FF] text-[#0052CC]"
                    : "text-[#1F2937] hover:bg-[#F3F4F6]",
                )}
              >
                {link.label}
              </Link>
            ))}
            {user ? (
              <>
                <Link
                  href="/events/create"
                  onClick={() => setMobileOpen(false)}
                >
                  <Button className="w-full">+ Tạo Vãng Lai</Button>
                </Link>
                <Link href="/profile/me" onClick={() => setMobileOpen(false)}>
                  <Button variant="secondary" className="w-full">
                    Hồ Sơ
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  onClick={signOut}
                  className="w-full text-[#EF4444] hover:bg-red-50"
                >
                  Đăng Xuất
                </Button>
              </>
            ) : (
              <Button
                onClick={() => {
                  setMobileOpen(false);
                  setLoginOpen(true);
                }}
                className="w-full"
              >
                Đăng Nhập
              </Button>
            )}
          </div>
        )}
      </header>

      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
    </>
  );
}
