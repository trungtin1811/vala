"use client";

import "@/app/map.css";
import { EventStatusBadge } from "@/components/shared/EventStatusBadge";
import { SkillLevelBadge } from "@/components/shared/SkillLevelBadge";
import { haversineDistance } from "@/lib/distance";
import { formatTimeRange } from "@/lib/eventTime";
import {
  DEFAULT_CENTER,
  DEFAULT_ZOOM,
  SKILL_MARKER_COLORS,
  createBadmintonIcon,
  createUserLocationIcon,
} from "@/lib/mapIcons";
import { formatDate } from "@/lib/utils";
import type { Event } from "@/types";
import { Banknote, Clock, MapPin, Users, Locate } from "lucide-react";
import Link from "next/link";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useRef, useState } from "react";
import {
  Circle,
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import { MapPopupContent } from "./MapPopup";

interface LeafletMapProps {
  events: Event[];
  selectedEventId?: string | null;
  userLocation?: { lat: number; lng: number } | null;
  onMarkerClick: (eventId: string) => void;
  onMapMoved?: (bounds: {
    swLat: number;
    swLng: number;
    neLat: number;
    neLng: number;
  }) => void;
  onBookEvent?: (eventId: string) => void;
  onLocateRequest?: () => void;
}

type ClusterPopupState = {
  lat: number;
  lng: number;
  events: Event[];
} | null;

type ClusterMarker = L.Marker & {
  options: {
    eventId?: string;
  };
};

type ClusterLayer = {
  getAllChildMarkers: () => ClusterMarker[];
  getLatLng: () => L.LatLng;
};

type ClusterClickEvent = {
  layer: ClusterLayer;
  originalEvent?: {
    preventDefault?: () => void;
    stopPropagation?: () => void;
  };
};

function formatPrice(event: Event) {
  const min = event.price_min;
  const max = event.price_max;

  if (min == null && max == null) return null;

  const formatCurrency = (value: number) => `${value.toLocaleString("vi-VN")}đ`;

  if (min != null && max != null && min !== max) {
    return `${formatCurrency(min)} - ${formatCurrency(max)}`;
  }

  return formatCurrency(min ?? max ?? 0);
}

function ClusterPopupContent({ events }: { events: Event[] }) {
  return (
    <div className="w-[min(92vw,22rem)] max-h-[70vh] overflow-hidden rounded-2xl">
      <div className="bg-linear-to-r from-primary to-[#0066FF] px-4 py-3.5">
        <h3 className="text-white font-semibold text-base leading-tight">
          Các bài tuyển trong cụm này
        </h3>
        <p className="text-white/75 text-xs mt-1.5">
          {events.length} bài tuyển gần nhau
        </p>
      </div>
      <div className="max-h-[calc(70vh-5rem)] overflow-y-auto px-3 py-3 flex flex-col gap-2.5 bg-white">
        {events.map((event) => {
          const available = event.total_slots - event.booked_slots;
          const price = formatPrice(event);
          const skillRequirements = event.skill_requirements ?? [];

          return (
            <Link
              key={event.id}
              href={`/events/${event.id}`}
              className="block w-full rounded-xl border border-border bg-white px-3 py-3.5 hover:border-primary/30 hover:bg-[#F9FAFB] transition-colors"
            >
              <div className="flex items-start justify-between gap-2.5">
                <div className="min-w-0 flex-1">
                  <div className="mb-1.5">
                    <EventStatusBadge status={event.status} />
                  </div>
                  <p className="text-sm font-semibold leading-snug text-text-primary line-clamp-2">
                    {event.title}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-primary/10 px-2 py-1 text-[11px] font-semibold text-primary">
                  {available > 0 ? `${available} chỗ` : "Hết chỗ"}
                </span>
              </div>

              <div className="mt-2.5 flex flex-col gap-1.5 text-[11px] leading-snug text-text-secondary">
                <div className="flex items-center gap-1.5">
                  <Clock size={12} className="shrink-0 text-primary" />
                  <span className="line-clamp-1">
                    {formatDate(event.event_date)} •{" "}
                    {formatTimeRange(
                      event.event_time,
                      event.event_end_time ?? null,
                      event.event_date,
                      event.event_end_date ?? null,
                    )}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin size={12} className="shrink-0 text-primary" />
                  <span className="line-clamp-1">
                    {event.court_address || event.location}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Users size={12} className="shrink-0 text-primary" />
                  <span>
                    {event.booked_slots}/{event.total_slots} người đã đặt
                  </span>
                </div>
                {price && (
                  <div className="flex items-center gap-1.5">
                    <Banknote size={12} className="shrink-0 text-primary" />
                    <span>
                      {price}
                      {event.split_evenly ? " • chia đều" : ""}
                    </span>
                  </div>
                )}
              </div>

              {skillRequirements.length > 0 && (
                <div className="mt-2.5 flex flex-wrap gap-1">
                  {skillRequirements.slice(0, 3).map((requirement) => (
                    <SkillLevelBadge
                      key={requirement.id}
                      level={requirement.skill_level}
                      className="px-1.5 py-0.5 text-[10px]"
                    />
                  ))}
                  {skillRequirements.length > 3 && (
                    <span className="self-center text-[10px] font-medium text-[#6B7280]">
                      +{skillRequirements.length - 3}
                    </span>
                  )}
                </div>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function FlyToSelected({
  eventId,
  events,
  markersRef,
}: {
  eventId?: string | null;
  events: Event[];
  markersRef: React.MutableRefObject<Record<string, L.Marker | null>>;
}) {
  const map = useMap();

  useEffect(() => {
    if (!eventId) return;
    const ev = events.find((e) => e.id === eventId);
    if (ev && Number.isFinite(ev.latitude) && Number.isFinite(ev.longitude)) {
      const marker = markersRef.current[eventId];
      if (!marker) return;
      map.setView([ev.latitude!, ev.longitude!], 16, { duration: 0.8 });
      setTimeout(() => {
        try {
          marker.openPopup();
        } catch {
          marker.fire("click");
        }
      }, 500);
    }
  }, [eventId, events, map, markersRef]);
  return null;
}

function FlyToUser({
  location,
}: {
  location?: { lat: number; lng: number } | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    if (!location) return;
    const lat = Number(location.lat);
    const lng = Number(location.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

    map.whenReady(() => {
      map.setView([lat, lng], 14, { duration: 0.8 });
    });
  }, [location, map]);
  return null;
}

function LocateButton({
  location,
  onLocateRequest,
}: {
  location?: { lat: number; lng: number } | null;
  onLocateRequest?: () => void;
}) {
  const map = useMap();

  return (
    <div className="absolute right-3 top-3 z-[500]">
      <button
        onClick={() => {
          if (location) {
            map.flyTo(
              [location.lat, location.lng],
              Math.max(map.getZoom(), 15),
              {
                duration: 0.8,
              },
            );
            return;
          }

          onLocateRequest?.();
        }}
        title={location ? "Về vị trí hiện tại" : "Lấy vị trí hiện tại"}
        className="bg-white border border-border rounded-xl p-2.5 shadow-md hover:bg-primary-light hover:border-primary/30 transition-colors"
      >
        <Locate
          size={18}
          className={location ? "text-primary" : "text-text-secondary"}
        />
      </button>
    </div>
  );
}

function BoundsTracker({
  onMove,
}: {
  onMove?: (b: {
    swLat: number;
    swLng: number;
    neLat: number;
    neLng: number;
  }) => void;
}) {
  useMapEvents({
    moveend(e) {
      if (!onMove) return;
      const b = e.target.getBounds();
      onMove({
        swLat: b.getSouth(),
        swLng: b.getWest(),
        neLat: b.getNorth(),
        neLng: b.getEast(),
      });
    },
  });
  return null;
}

export default function LeafletMap({
  events,
  selectedEventId,
  userLocation,
  onMarkerClick,
  onMapMoved,
  onBookEvent,
  onLocateRequest,
}: LeafletMapProps) {
  const validUserLocation =
    userLocation &&
    Number.isFinite(userLocation.lat) &&
    Number.isFinite(userLocation.lng)
      ? userLocation
      : null;
  const center: [number, number] = validUserLocation
    ? [validUserLocation.lat, validUserLocation.lng]
    : DEFAULT_CENTER;

  const userIcon = L.icon({
    iconUrl: createUserLocationIcon(),
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });

  const markersRef = useRef<Record<string, L.Marker | null>>({});
  const [clusterPopup, setClusterPopup] = useState<ClusterPopupState>(null);

  function handleClusterClick(cluster: ClusterLayer) {
    const childEvents = cluster
      .getAllChildMarkers()
      .map((marker: ClusterMarker) => {
        const eventId = marker.options.eventId;
        return events.find((event) => event.id === eventId);
      })
      .filter((event: Event | undefined): event is Event => !!event);

    if (childEvents.length === 0) return;

    const latLng = cluster.getLatLng();
    setClusterPopup({
      lat: latLng.lat,
      lng: latLng.lng,
      events: childEvents,
    });
  }

  return (
    <MapContainer
      center={center}
      zoom={DEFAULT_ZOOM}
      style={{ height: "100%", width: "100%", borderRadius: "16px" }}
      zoomControl={true}
    >
      <LocateButton
        location={validUserLocation}
        onLocateRequest={onLocateRequest}
      />
      <TileLayer
        attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <BoundsTracker onMove={onMapMoved} />
      <FlyToSelected
        eventId={selectedEventId}
        events={events}
        markersRef={markersRef}
      />
      <FlyToUser location={validUserLocation} />

      {clusterPopup && (
        <Popup
          position={[clusterPopup.lat, clusterPopup.lng]}
          closeButton={true}
          autoPan={true}
          minWidth={280}
          maxWidth={320}
          eventHandlers={{ remove: () => setClusterPopup(null) }}
        >
          <ClusterPopupContent events={clusterPopup.events} />
        </Popup>
      )}

      {validUserLocation && (
        <>
          <Circle
            center={[validUserLocation.lat, validUserLocation.lng]}
            radius={200}
            pathOptions={{
              color: "#0052CC",
              fillColor: "#0052CC",
              fillOpacity: 0.1,
              weight: 1,
            }}
          />
          <Marker
            position={[validUserLocation.lat, validUserLocation.lng]}
            icon={userIcon}
          />
        </>
      )}

      <MarkerClusterGroup
        maxClusterRadius={50}
        chunkedLoading
        showCoverageOnHover={false}
        spiderfyOnMaxZoom={false}
        zoomToBoundsOnClick={false}
        spiderfyDistanceMultiplier={1.8}
        removeOutsideVisibleBounds
        eventHandlers={{
          clusterclick: (event: ClusterClickEvent) => {
            event.originalEvent?.preventDefault?.();
            event.originalEvent?.stopPropagation?.();
            handleClusterClick(event.layer);
          },
        }}
        iconCreateFunction={(cluster: { getChildCount: () => number }) => {
          const count = cluster.getChildCount();
          const size = count < 10 ? 38 : count < 100 ? 44 : 52;
          return L.divIcon({
            html: `<div class="vala-cluster"><span>${count}</span></div>`,
            className: "vala-cluster-icon",
            iconSize: L.point(size, size),
          });
        }}
      >
        {events
          .filter((e) => e.latitude != null && e.longitude != null)
          .map((event) => {
            const primaryLevel = event.skill_requirements?.[0]?.skill_level;
            const color = primaryLevel
              ? SKILL_MARKER_COLORS[primaryLevel]
              : "#0052CC";
            const totalSlots = event.total_slots;
            const filledSlots = event.booked_slots;
            const available = totalSlots - filledSlots;

            const icon = L.icon({
              iconUrl: createBadmintonIcon(color, available),
              iconSize: [36, 44],
              iconAnchor: [18, 44],
              popupAnchor: [0, -46],
            });

            const distanceKm =
              userLocation && event.latitude && event.longitude
                ? haversineDistance(
                    userLocation.lat,
                    userLocation.lng,
                    event.latitude,
                    event.longitude,
                  )
                : undefined;

            return (
              <Marker
                key={event.id}
                position={[event.latitude!, event.longitude!]}
                icon={icon}
                eventHandlers={{ click: () => onMarkerClick(event.id) }}
                ref={(ref) => {
                  if (ref) {
                    (ref as ClusterMarker).options.eventId = event.id;
                    markersRef.current[event.id] = ref as unknown as L.Marker;
                  } else {
                    delete markersRef.current[event.id];
                  }
                }}
              >
                <Popup minWidth={240} maxWidth={240}>
                  <MapPopupContent
                    event={event}
                    distanceKm={distanceKm}
                    onBook={
                      onBookEvent ? () => onBookEvent(event.id) : undefined
                    }
                  />
                </Popup>
              </Marker>
            );
          })}
      </MarkerClusterGroup>
    </MapContainer>
  );
}
