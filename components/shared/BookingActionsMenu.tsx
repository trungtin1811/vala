"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  CheckCircle2,
  MoreHorizontal,
  Trash2,
  Wallet,
  XCircle,
} from "lucide-react";
import type { Booking } from "@/types";

interface BookingActionsMenuProps {
  booking: Booking;
  onApprove?: () => Promise<unknown>;
  onReject?: () => Promise<unknown>;
  onTogglePaid?: () => Promise<unknown>;
  onRemove?: () => Promise<unknown>;
  disabled?: boolean;
}

export function BookingActionsMenu({
  booking,
  onApprove,
  onReject,
  onTogglePaid,
  onRemove,
  disabled,
}: BookingActionsMenuProps) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuWidth = 224;

  useEffect(() => {
    if (!open) return;

    function updatePosition() {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (!rect) return;

      const gutter = 12;
      const nextLeft = Math.min(
        Math.max(gutter, rect.right - menuWidth),
        window.innerWidth - menuWidth - gutter,
      );

      setPosition({
        top: rect.bottom + 6,
        left: nextLeft,
      });
    }

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (
        buttonRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return;
      }

      setOpen(false);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  async function run(action?: () => Promise<unknown>) {
    if (!action) return;
    try {
      await action();
      setOpen(false);
    } catch {
      // Mutation errors are reported by the global toast.
    }
  }

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((value) => !value)}
        disabled={disabled}
        aria-label="Mở menu thao tác thành viên"
        className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-transparent text-[#64748B] transition-colors hover:border-[#D8E2F0] hover:bg-white hover:text-[#0052CC] disabled:cursor-not-allowed disabled:opacity-50"
      >
        <MoreHorizontal size={18} />
      </button>

      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={menuRef}
            className="fixed z-[1400] w-56 overflow-hidden rounded-xl border border-[#E5E7EB] bg-white p-1 shadow-xl"
            style={{ top: position.top, left: position.left }}
          >
            {booking.approval_status === "pending" && onApprove && (
              <MenuItem
                icon={<CheckCircle2 size={15} />}
                label="Duyệt thành viên"
                onClick={() => void run(onApprove)}
                className="text-emerald-700"
              />
            )}
            {booking.approval_status === "pending" && onReject && (
              <MenuItem
                icon={<XCircle size={15} />}
                label="Từ chối đăng ký"
                onClick={() => void run(onReject)}
                className="text-amber-700"
              />
            )}
            {booking.approval_status === "approved" && onTogglePaid && (
              <MenuItem
                icon={<Wallet size={15} />}
                label={
                  booking.is_paid
                    ? "Bỏ đánh dấu đã thu tiền"
                    : "Đánh dấu đã thu tiền"
                }
                onClick={() => void run(onTogglePaid)}
                className="text-[#0052CC]"
              />
            )}
            {onRemove && (
              <>
                <div className="my-1 h-px bg-[#F1F5F9]" />
                <MenuItem
                  icon={<Trash2 size={15} />}
                  label="Xoá khỏi danh sách"
                  onClick={() => void run(onRemove)}
                  className="text-red-600"
                />
              </>
            )}
          </div>,
          document.body,
        )}
    </>
  );
}

function MenuItem({
  icon,
  label,
  onClick,
  className,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors hover:bg-[#F8FAFC] ${className ?? "text-[#1F2937]"}`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
