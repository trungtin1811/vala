"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { EventForm, type EventFormValues } from "@/components/shared/EventForm";
import { apiFetch } from "@/lib/api";
import { useState } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { getErrorMessage, useToast } from "@/context/ToastContext";

export default function CreateEventPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (loading) return null;

  if (!user) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <p className="text-[#6B7280] mb-4">
          Bạn cần đăng nhập để tạo vãng lai.
        </p>
        <Link href="/">
          <Button>Đăng Nhập</Button>
        </Link>
      </div>
    );
  }

  async function handleSubmit(values: EventFormValues) {
    setSubmitting(true);
    setError(null);
    try {
      const { firstEventId, count } = await apiFetch<{
        firstEventId: string | null;
        count: number;
      }>("/api/events", {
        method: "POST",
        body: JSON.stringify(values),
      });

      toast.success(
        count > 1 ? `Đã tạo ${count} vãng lai.` : "Tạo vãng lai thành công.",
      );
      router.push(count > 1 ? "/dashboard" : `/events/${firstEventId}`);
    } catch (error) {
      const message = getErrorMessage(error, "Không thể tạo vãng lai.");
      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <Link
        href="/events"
        className="inline-flex items-center gap-1 text-sm text-[#6B7280] hover:text-[#0052CC] mb-6 transition-colors"
      >
        <ChevronLeft size={16} /> Quay lại
      </Link>
      <h1 className="text-2xl font-bold text-[#1F2937] mb-6">Tạo Vãng Lai</h1>
      {error && (
        <p className="mb-4 text-sm text-[#EF4444] bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          {error}
        </p>
      )}
      <EventForm
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
        loading={submitting}
      />
    </div>
  );
}
