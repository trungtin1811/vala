"use client";

import { useEffect, useRef } from "react";
import { X, Feather } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface LoginModalProps {
  open: boolean;
  onClose: () => void;
}

function GoogleIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z"
        fill="#34A853"
      />
      <path
        d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z"
        fill="#EA4335"
      />
    </svg>
  );
}

export function LoginModal({ open, onClose }: LoginModalProps) {
  const { signInWithGoogle } = useAuth();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-1100 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <div
        ref={ref}
        className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden"
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-[#9CA3AF] hover:text-[#1F2937] hover:bg-[#F3F4F6] transition-colors"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div className="px-8 pt-10 pb-6 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#EFF6FF] mb-4">
            <Feather size={28} className="text-[#0052CC]" />
          </div>
          <h2 className="text-xl font-bold text-[#1F2937]">
            Đăng nhập vào Vala
          </h2>
          <p className="text-sm text-[#6B7280] mt-1.5">
            Chọn phương thức đăng nhập
          </p>
        </div>

        {/* Methods */}
        <div className="px-8 pb-8 flex flex-col gap-3">
          {/* Google */}
          <button
            onClick={() => {
              signInWithGoogle();
              onClose();
            }}
            className="w-full flex items-center gap-3 px-4 py-3 border border-[#E5E7EB] rounded-2xl text-sm font-medium text-[#1F2937] bg-white hover:bg-[#F9FAFB] hover:border-[#D1D5DB] active:scale-[0.98] transition-all"
          >
            <GoogleIcon />
            <span className="flex-1 text-center">Tiếp tục với Google</span>
          </button>

          {/* Placeholder — email (future) */}
          <button
            disabled
            className="w-full flex items-center gap-3 px-4 py-3 border border-dashed border-[#E5E7EB] rounded-2xl text-sm text-[#D1D5DB] cursor-not-allowed"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect width="20" height="16" x="2" y="4" rx="2" />
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
            </svg>
            <span className="flex-1 text-center">
              Email / Mật khẩu (sắp có)
            </span>
          </button>

          {/* Placeholder — phone (future) */}
          <button
            disabled
            className="w-full flex items-center gap-3 px-4 py-3 border border-dashed border-[#E5E7EB] rounded-2xl text-sm text-[#D1D5DB] cursor-not-allowed"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.62 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
            <span className="flex-1 text-center">Số điện thoại (sắp có)</span>
          </button>

          <p className="text-center text-xs text-[#9CA3AF] mt-2">
            Bằng cách đăng nhập, bạn đồng ý với{" "}
            <span className="text-[#0052CC]">Điều khoản sử dụng</span> của Vala.
          </p>
        </div>
      </div>
    </div>
  );
}
