"use client";

import { CheckCircle2, CircleAlert, X } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useState,
} from "react";
import { createPortal } from "react-dom";

type ToastType = "success" | "error";

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  success: (message: string) => void;
  error: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);
let nextToastId = 0;

export function getErrorMessage(error: unknown, fallback = "Có lỗi xảy ra") {
  return error instanceof Error && error.message ? error.message : fallback;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const show = useCallback((message: string, type: ToastType) => {
    const id = ++nextToastId;
    setToasts((current) => [...current, { id, message, type }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 4500);
  }, []);

  const value: ToastContextValue = {
    success: useCallback((message) => show(message, "success"), [show]),
    error: useCallback((message) => show(message, "error"), [show]),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      {typeof document !== "undefined" &&
        createPortal(
          <div
            aria-live="polite"
            className="pointer-events-none fixed inset-x-4 bottom-4 z-[9999] flex flex-col items-end gap-2 sm:left-auto sm:w-96"
          >
            {toasts.map((toast) => (
              <div
                key={toast.id}
                role={toast.type === "error" ? "alert" : "status"}
                className={`pointer-events-auto flex w-full animate-[toast-in_180ms_ease-out] items-start gap-3 rounded-xl border bg-white px-4 py-3 shadow-2xl ${
                  toast.type === "success"
                    ? "border-emerald-200"
                    : "border-red-200"
                }`}
              >
                {toast.type === "success" ? (
                  <CheckCircle2
                    size={18}
                    className="mt-0.5 shrink-0 text-emerald-600"
                  />
                ) : (
                  <CircleAlert
                    size={18}
                    className="mt-0.5 shrink-0 text-red-600"
                  />
                )}
                <p className="min-w-0 flex-1 text-sm font-medium text-[#1F2937]">
                  {toast.message}
                </p>
                <button
                  type="button"
                  onClick={() => dismiss(toast.id)}
                  aria-label="Đóng thông báo"
                  className="shrink-0 rounded-md p-0.5 text-[#9CA3AF] hover:bg-[#F3F4F6] hover:text-[#1F2937]"
                >
                  <X size={15} />
                </button>
              </div>
            ))}
          </div>,
          document.body,
        )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within ToastProvider");
  return context;
}
