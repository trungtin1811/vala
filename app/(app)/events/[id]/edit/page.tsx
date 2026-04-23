"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { useEvent } from "@/hooks/useEvents";
import { useAuth } from "@/context/AuthContext";
import { EventForm, type EventFormValues } from "@/components/shared/EventForm";
import { supabase } from "@/lib/supabase";
import { computeEndDate } from "@/lib/eventTime";

export default function EditEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { user } = useAuth();
  const router = useRouter();
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
    latitude: event.latitude,
    longitude: event.longitude,
    event_date: event.event_date,
    event_time: event.event_time,
    event_end_time: event.event_end_time ?? "",
    skill_levels: event.skill_requirements?.map((r) => r.skill_level) ?? [],
    total_slots: event.skill_requirements?.[0]?.slots_needed ?? 4,
    price_enabled: event.price_min != null || event.price_max != null,
    price_min: event.price_min,
    price_max: event.price_max,
    split_evenly: event.split_evenly,
  };

  async function handleSubmit(values: EventFormValues) {
    setSubmitting(true);
    setError(null);
    try {
      const { error: eventError } = await supabase
        .from("events")
        .update({
          title: values.title,
          description: values.description || null,
          location: values.location,
          latitude: values.latitude,
          longitude: values.longitude,
          event_date: values.event_date,
          event_time: values.event_time,
          event_end_time: values.event_end_time || null,
          event_end_date: computeEndDate(
            values.event_date,
            values.event_time,
            values.event_end_time,
          ),
          price_min: values.price_enabled ? (values.price_min ?? null) : null,
          price_max: values.price_enabled ? (values.price_max ?? null) : null,
          split_evenly: values.price_enabled ? values.split_evenly : false,
        })
        .eq("id", id);

      if (eventError) throw eventError;

      await supabase
        .from("event_skill_requirements")
        .delete()
        .eq("event_id", id);

      const requirements = values.skill_levels.map((level) => ({
        event_id: id,
        skill_level: level,
        slots_needed: values.total_slots,
        slots_booked: 0,
      }));
      const { error: reqError } = await supabase
        .from("event_skill_requirements")
        .insert(requirements);
      if (reqError) throw reqError;

      router.push(`/events/${id}`);
    } catch (e: any) {
      setError(e.message ?? "Có lỗi xảy ra");
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
