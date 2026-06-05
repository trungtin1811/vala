"use client";

import { use } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { useEvent } from "@/hooks/useEvents";
import { EventManagePanel } from "@/components/shared/EventManagePanel";

export default function ManageEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: event } = useEvent(id);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <Link
        href={`/events/${id}`}
        className="inline-flex items-center gap-1 text-sm text-[#6B7280] hover:text-[#0052CC] mb-6 transition-colors"
      >
        <ChevronLeft size={16} /> Chi tiết vãng lai
      </Link>

      <h1 className="text-xl font-bold text-[#1F2937] mb-6">
        Quản Lý{event?.title ? `: ${event.title}` : " Vãng Lai"}
      </h1>

      <EventManagePanel eventId={id} />
    </div>
  );
}
