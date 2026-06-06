"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { useEvent } from "@/hooks/useEvents";
import { useAuth } from "@/context/AuthContext";
import { EventForm, type EventFormValues } from "@/components/shared/EventForm";
import { apiFetch } from "@/lib/api";
import { getErrorMessage, useToast } from "@/context/ToastContext";

export default function EditEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { user } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const { data: event, isLoading } = useEvent(id);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (isLoading) return null;
  if (!event || event.host_id !== user?.id) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center text-[#6B7280]">
        Không có quyền truy cập.
      </div>
    );
  }

  const defaultValues: Partial<EventFormValues> = {
    title: event.title,
    description: event.description ?? "",
    location: event.location,
    court_id: event.court_id,
    court_address: event.court_address ?? "",
    latitude: event.latitude,
    longitude: event.longitude,
    event_date: event.event_date,
    event_time: event.event_time,
    event_end_time: event.event_end_time ?? "",
    skill_levels: event.skill_requirements?.map((r) => r.skill_level) ?? [],
    total_slots: event.total_slots ?? 4,
    price_enabled: event.price_min != null || event.price_max != null,
    price_min: event.price_min,
    price_max: event.price_max,
    split_evenly: event.split_evenly,
  };

  async function handleSubmit(values: EventFormValues) {
    setSubmitting(true);
    setError(null);
    try {
      await apiFetch(`/api/events/${id}`, {
        method: "PATCH",
        body: JSON.stringify(values),
      });
      toast.success("Đã lưu thay đổi.");
      router.push(`/events/${id}`);
    } catch (error) {
      const message = getErrorMessage(error, "Không thể lưu thay đổi.");
      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <Link
        href={`/events/${id}`}
        className="inline-flex items-center gap-1 text-sm text-[#6B7280] hover:text-[#0052CC] mb-6 transition-colors"
      >
        <ChevronLeft size={16} /> Quay lại
      </Link>
      <h1 className="text-2xl font-bold text-[#1F2937] mb-6">
        Chỉnh Sửa Vãng Lai
      </h1>
      {error && (
        <p className="mb-4 text-sm text-[#EF4444] bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          {error}
        </p>
      )}
      <EventForm
        defaultValues={defaultValues}
        onSubmit={handleSubmit}
        onCancel={() => router.push(`/events/${id}`)}
        submitLabel="Lưu thay đổi"
        loading={submitting}
        hideRepeat
      />
    </div>
  );
}
