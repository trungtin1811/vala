"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  CheckCircle2,
  LockKeyhole,
  MoreHorizontal,
  RotateCcw,
  XCircle,
} from "lucide-react";
import type { EventStatus } from "@/types";

interface EventStatusActionsMenuProps {
  status: EventStatus;
  onUpdateStatus: (status: EventStatus) => void;
  disabled?: boolean;
}

export function EventStatusActionsMenu({
  status,
  onUpdateStatus,
  disabled,
}: EventStatusActionsMenuProps) {
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
      setPosition({
        top: rect.bottom + 6,
        left: Math.min(
          Math.max(gutter, rect.right - menuWidth),
          window.innerWidth - menuWidth - gutter,
        ),
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

  function update(nextStatus: EventStatus) {
    onUpdateStatus(nextStatus);
    setOpen(false);
  }

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((value) => !value)}
        disabled={disabled}
        className="inline-flex items-center gap-2 rounded-xl border border-[#D8E2F0] bg-white px-3 py-2 text-sm font-semibold text-[#1F2937] transition-colors hover:border-[#9CC2FF] hover:text-[#0052CC] disabled:cursor-not-allowed disabled:opacity-50"
      >
        <MoreHorizontal size={16} />
        Thao tác
      </button>

      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={menuRef}
            className="fixed z-[1400] w-56 overflow-hidden rounded-xl border border-[#E5E7EB] bg-white p-1 shadow-xl"
            style={{ top: position.top, left: position.left }}
          >
            {status === "active" && (
              <MenuItem
                icon={<LockKeyhole size={15} />}
                label="Đóng tuyển"
                onClick={() => update("closed")}
              />
            )}
            {status === "closed" && (
              <MenuItem
                icon={<RotateCcw size={15} />}
                label="Mở lại"
                onClick={() => update("active")}
              />
            )}
            {(status === "active" || status === "closed") && (
              <MenuItem
                icon={<CheckCircle2 size={15} />}
                label="Đánh dấu hoàn thành"
                onClick={() => update("completed")}
                className="text-emerald-700"
              />
            )}
            <div className="my-1 h-px bg-[#F1F5F9]" />
            <MenuItem
              icon={<XCircle size={15} />}
              label="Huỷ vãng lai"
              onClick={() => update("cancelled")}
              className="text-red-600"
            />
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
