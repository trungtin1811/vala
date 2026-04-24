"use client";

import dynamic from "next/dynamic";
import { useState, useMemo, useCallback } from "react";
import { Navbar } from "@/components/shared/Navbar";
import { SidebarSection } from "@/components/Home/SidebarSection";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { SkillLevelBadge } from "@/components/shared/SkillLevelBadge";
import { useEvents } from "@/hooks/useEvents";
import { useBook, useMyBookings } from "@/hooks/useBookings";
import { useUserLocation } from "@/hooks/useUserLocation";
import { useAuth } from "@/context/AuthContext";
import { haversineDistance } from "@/lib/distance";
import { Locate, ChevronUp, ChevronDown } from "lucide-react";
import type { Event, FilterState } from "@/types";

const LeafletMap = dynamic(() => import("@/components/Map/LeafletMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-[#E8F3FF] rounded-2xl flex items-center justify-center animate-pulse">
      <div className="text-center">
        <div className="text-4xl mb-3">🗺️</div>
        <p className="text-sm text-[#6B7280]">Đang tải bản đồ...</p>
      </div>
    </div>
  ),
});

const DEFAULT_FILTERS: FilterState = {
  searchQuery: "",
  sortBy: "date",
};

export default function HomePage() {
  const { user } = useAuth();
  const { location: userLocation, requestLocation } = useUserLocation();
  const { data: allEvents = [], isLoading } = useEvents({ status: "active" });
  const { data: myBookings } = useMyBookings(user?.id);
  const bookMutation = useBook();

  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [bookingEvent, setBookingEvent] = useState<Event | null>(null);
  const [selectedSkillLevel, setSelectedSkillLevel] = useState<string | null>(
    null,
  );
  const [mobileListOpen, setMobileListOpen] = useState(false);

  // Precompute distances
  const distances = useMemo<Record<string, number>>(() => {
    if (!userLocation) return {};
    return Object.fromEntries(
      allEvents
        .filter((e) => e.latitude != null && e.longitude != null)
        .map((e) => [
          e.id,
          haversineDistance(
            userLocation.lat,
            userLocation.lng,
            e.latitude!,
            e.longitude!,
          ),
        ]),
    );
  }, [allEvents, userLocation]);

  // Filter + sort
  const filteredEvents = useMemo(() => {
    let evs = allEvents;

    if (filters.searchQuery) {
      const q = filters.searchQuery.toLowerCase();
      evs = evs.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.location.toLowerCase().includes(q),
      );
    }
    if (filters.skillLevel) {
      evs = evs.filter((e) =>
        e.skill_requirements?.some((r) => r.skill_level === filters.skillLevel),
      );
    }
    if (filters.dateStart) {
      evs = evs.filter((e) => e.event_date >= filters.dateStart!);
    }
    if (filters.dateEnd) {
      evs = evs.filter((e) => e.event_date <= filters.dateEnd!);
    }
    if (filters.maxDistance !== undefined && userLocation) {
      evs = evs.filter((e) => {
        const d = distances[e.id];
        return d !== undefined && d <= filters.maxDistance!;
      });
    }

    return [...evs].sort((a, b) => {
      if (filters.sortBy === "distance") {
        return (distances[a.id] ?? Infinity) - (distances[b.id] ?? Infinity);
      }
      if (filters.sortBy === "slots") {
        const aSlots = a.total_slots - a.booked_slots;
        const bSlots = b.total_slots - b.booked_slots;
        return bSlots - aSlots;
      }
      return (
        a.event_date.localeCompare(b.event_date) ||
        a.event_time.localeCompare(b.event_time)
      );
    });
  }, [allEvents, filters, distances, userLocation]);

  const handleEventSelect = useCallback((eventId: string) => {
    setSelectedEventId((prev) => (prev === eventId ? null : eventId));
    setMobileListOpen(false);
  }, []);

  const handleBookEvent = useCallback(
    (eventId: string) => {
      const ev = allEvents.find((e) => e.id === eventId);
      if (!ev) return;
      setBookingEvent(ev);
      setSelectedSkillLevel(null);
    },
    [allEvents],
  );

  const hasBooked = bookingEvent
    ? myBookings?.some((b) => b.event_id === bookingEvent.id)
    : false;
  const myBookingForEvent = bookingEvent
    ? myBookings?.find((b) => b.event_id === bookingEvent.id)
    : undefined;
  const pendingApproval = myBookingForEvent?.approval_status === "pending";
  const availableSlots = bookingEvent
    ? bookingEvent.total_slots - bookingEvent.booked_slots
    : 0;
  const availableRequirements = bookingEvent?.skill_requirements ?? [];

  async function confirmBooking() {
    if (!user || !bookingEvent || !selectedSkillLevel) return;
    await bookMutation.mutateAsync({
      eventId: bookingEvent.id,
      memberId: user.id,
      skillLevel: selectedSkillLevel as any,
    });
    setBookingEvent(null);
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Navbar />

      {/* Main layout */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* ── Desktop: Map (70%) + Sidebar (30%) ── */}
        <div className="hidden md:flex flex-1 overflow-hidden">
          {/* Map */}
          <div className="flex-[7] p-3 pr-1.5 relative">
            <div className="w-full h-full rounded-2xl overflow-hidden shadow-md">
              <LeafletMap
                events={filteredEvents}
                selectedEventId={selectedEventId}
                userLocation={userLocation}
                onMarkerClick={handleEventSelect}
                onBookEvent={user ? handleBookEvent : undefined}
              />
            </div>
            {/* Center on user button */}
            <button
              onClick={requestLocation}
              title="Định vị tôi"
              className="absolute bottom-6 right-4 z-[400] bg-white border border-[#E5E7EB] rounded-xl p-2.5 shadow-md hover:bg-[#E8F3FF] hover:border-[#0052CC] transition-all"
            >
              <Locate
                size={18}
                className={userLocation ? "text-[#0052CC]" : "text-[#6B7280]"}
              />
            </button>
          </div>

          {/* Sidebar */}
          <div className="flex-[3] p-3 pl-1.5">
            <div className="h-full border border-[#E5E7EB] rounded-2xl overflow-hidden shadow-sm">
              <SidebarSection
                events={allEvents}
                filteredEvents={filteredEvents}
                filters={filters}
                onFilterChange={setFilters}
                selectedEventId={selectedEventId}
                onEventSelect={handleEventSelect}
                userLocation={userLocation}
                distances={distances}
                isLoading={isLoading}
                onLocate={requestLocation}
                hasLocation={!!userLocation}
              />
            </div>
          </div>
        </div>

        {/* ── Mobile: Fullscreen map + bottom sheet ── */}
        <div className="flex md:hidden flex-1 flex-col overflow-hidden relative">
          {/* Map fills screen */}
          <div className="absolute inset-0">
            <LeafletMap
              events={filteredEvents}
              selectedEventId={selectedEventId}
              userLocation={userLocation}
              onMarkerClick={handleEventSelect}
              onBookEvent={user ? handleBookEvent : undefined}
            />
          </div>

          {/* Locate button */}
          <button
            onClick={requestLocation}
            className="absolute top-3 right-3 z-[400] bg-white border border-[#E5E7EB] rounded-xl p-2.5 shadow-md"
          >
            <Locate
              size={18}
              className={userLocation ? "text-[#0052CC]" : "text-[#6B7280]"}
            />
          </button>

          {/* Bottom sheet toggle */}
          <button
            onClick={() => setMobileListOpen((v) => !v)}
            className="absolute bottom-0 left-0 right-0 z-[500] bg-white border-t border-[#E5E7EB] px-4 py-3 flex items-center justify-between shadow-lg"
          >
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-[#1F2937]">
                {filteredEvents.length} Vãng Lai
              </span>
              {isLoading && (
                <span className="text-xs text-[#9CA3AF]">Đang tải...</span>
              )}
            </div>
            {mobileListOpen ? (
              <ChevronDown size={18} className="text-[#6B7280]" />
            ) : (
              <ChevronUp size={18} className="text-[#6B7280]" />
            )}
          </button>

          {/* Bottom sheet panel */}
          {mobileListOpen && (
            <div
              className="absolute bottom-12 left-0 right-0 z-[490] bg-white border-t border-[#E5E7EB] shadow-2xl"
              style={{ maxHeight: "65vh", overflowY: "auto" }}
            >
              <SidebarSection
                events={allEvents}
                filteredEvents={filteredEvents}
                filters={filters}
                onFilterChange={setFilters}
                selectedEventId={selectedEventId}
                onEventSelect={handleEventSelect}
                userLocation={userLocation}
                distances={distances}
                isLoading={isLoading}
                onLocate={requestLocation}
                hasLocation={!!userLocation}
              />
            </div>
          )}
        </div>
      </div>

      {/* Booking Modal */}
      <Modal
        open={!!bookingEvent}
        onClose={() => setBookingEvent(null)}
        title="Đặt Chỗ Vãng Lai"
      >
        {bookingEvent && (
          <div className="flex flex-col gap-4">
            <p className="text-sm font-medium text-[#1F2937]">
              {bookingEvent.title}
            </p>
            {hasBooked ? (
              <div className="bg-[#E8F3FF] border border-[#0052CC]/20 rounded-xl p-4 text-center">
                <p className="text-sm font-semibold text-[#0052CC]">
                  {pendingApproval
                    ? "⌛ Yêu cầu tham gia đang chờ host duyệt"
                    : "✓ Bạn đã được duyệt tham gia vãng lai này"}
                </p>
                {!pendingApproval && bookingEvent.host?.phone && (
                  <p className="text-sm text-[#0052CC] mt-1">
                    Liên hệ host: <strong>{bookingEvent.host.phone}</strong>
                  </p>
                )}
              </div>
            ) : availableSlots <= 0 ? (
              <p className="text-sm text-[#6B7280]">Hết chỗ rồi!</p>
            ) : !user ? (
              <p className="text-sm text-[#6B7280]">
                Vui lòng đăng nhập để đặt chỗ.
              </p>
            ) : (
              <>
                <p className="text-sm text-[#6B7280]">Chọn trình độ của bạn:</p>
                <div className="flex flex-col gap-2">
                  {availableRequirements.map((req) => (
                    <button
                      key={req.id}
                      onClick={() => setSelectedSkillLevel(req.skill_level)}
                      className={`flex items-center justify-between p-3 rounded-xl border-2 transition-all ${
                        selectedSkillLevel === req.skill_level
                          ? "border-[#0052CC] bg-[#E8F3FF]"
                          : "border-[#E5E7EB] hover:border-[#0052CC]/40"
                      }`}
                    >
                      <SkillLevelBadge level={req.skill_level} />
                    </button>
                  ))}
                </div>
                <p className="text-sm text-[#6B7280] text-center">
                  Còn {availableSlots} chỗ
                </p>
                <Button
                  className="w-full"
                  onClick={confirmBooking}
                  loading={bookMutation.isPending}
                  disabled={!selectedSkillLevel}
                >
                  Xác Nhận Đặt Chỗ
                </Button>
                {bookMutation.isError && (
                  <p className="text-xs text-[#EF4444] text-center">
                    Có lỗi xảy ra, vui lòng thử lại.
                  </p>
                )}
              </>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
