"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { LoginModal } from "@/components/ui/LoginModal";
import { useEffect, useRef, useState } from "react";
import { Menu, X, Feather } from "lucide-react";
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
      <header className="sticky top-0 z-40 bg-white border-b border-[#E5E7EB] h-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-full flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 font-bold text-xl text-[#0052CC]"
          >
            <Feather size={22} />
            Vala
          </Link>

          <nav className="hidden md:flex items-center gap-6 mx-auto">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "text-sm font-medium transition-colors",
                  pathname.startsWith(link.href)
                    ? "text-[#0052CC]"
                    : "text-[#6B7280] hover:text-[#1F2937]",
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            {loading ? null : user ? (
              <>
                <Link href="/events/create">
                  <Button size="sm">+ Tạo Vãng Lai</Button>
                </Link>
                <div className="relative" ref={profileMenuRef}>
                  <button
                    onClick={() => setProfileMenuOpen((v) => !v)}
                    aria-haspopup="menu"
                    aria-expanded={profileMenuOpen}
                    className="flex items-center gap-2 rounded-full hover:bg-[#F3F4F6] p-1 pr-3 transition-colors"
                  >
                    {user.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt={user.display_name}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-[#E8F3FF] flex items-center justify-center text-[#0052CC] font-semibold text-sm">
                        {user.display_name[0]?.toUpperCase()}
                      </div>
                    )}
                    <span className="text-sm font-medium text-[#1F2937]">
                      {user.display_name}
                    </span>
                  </button>
                  <div
                    className={cn(
                      "absolute right-0 top-full mt-1 w-44 bg-white border border-[#E5E7EB] rounded-xl shadow-lg py-1 transition-opacity",
                      profileMenuOpen
                        ? "opacity-100 pointer-events-auto"
                        : "opacity-0 pointer-events-none",
                    )}
                  >
                    <Link
                      href="/profile/me"
                      onClick={() => setProfileMenuOpen(false)}
                      className="block px-4 py-2 text-sm text-[#1F2937] hover:bg-[#F3F4F6]"
                    >
                      Hồ Sơ
                    </Link>
                    <button
                      onClick={() => {
                        setProfileMenuOpen(false);
                        signOut();
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-[#EF4444] hover:bg-[#FEF2F2]"
                    >
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
            className="md:hidden p-2"
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {mobileOpen && (
          <div className="md:hidden bg-white border-b border-[#E5E7EB] px-4 py-4 flex flex-col gap-3">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="text-sm font-medium text-[#1F2937] py-2"
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
