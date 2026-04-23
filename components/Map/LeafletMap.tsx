"use client";

import "@/app/map.css";
import { haversineDistance } from "@/lib/distance";
import {
  DEFAULT_CENTER,
  DEFAULT_ZOOM,
  SKILL_MARKER_COLORS,
  createBadmintonIcon,
  createUserLocationIcon,
} from "@/lib/mapIcons";
import type { Event } from "@/types";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect } from "react";
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
}

function FlyToSelected({
  eventId,
  events,
}: {
  eventId?: string | null;
  events: Event[];
}) {
  const map = useMap();
  useEffect(() => {
    if (!eventId) return;
    const ev = events.find((e) => e.id === eventId);
    if (ev && Number.isFinite(ev.latitude) && Number.isFinite(ev.longitude)) {
      map.flyTo([ev.latitude!, ev.longitude!], 15, { duration: 0.8 });
    }
  }, [eventId, events, map]);
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
      // map.flyTo([lat, lng], 14, { duration: 1 });
    });
  }, [location, map]);
  return null;
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

  return (
    <MapContainer
      center={center}
      zoom={DEFAULT_ZOOM}
      style={{ height: "100%", width: "100%", borderRadius: "16px" }}
      zoomControl={true}
    >
      <TileLayer
        attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <BoundsTracker onMove={onMapMoved} />
      <FlyToSelected eventId={selectedEventId} events={events} />
      <FlyToUser location={validUserLocation} />

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

      <MarkerClusterGroup maxClusterRadius={60} chunkedLoading>
        {events
          .filter((e) => e.latitude != null && e.longitude != null)
          .map((event) => {
            const primaryLevel = event.skill_requirements?.[0]?.skill_level;
            const color = primaryLevel
              ? SKILL_MARKER_COLORS[primaryLevel]
              : "#0052CC";
            const totalSlots =
              event.skill_requirements?.reduce(
                (s, r) => s + r.slots_needed,
                0,
              ) ?? 0;
            const filledSlots =
              event.skill_requirements?.reduce(
                (s, r) => s + r.slots_booked,
                0,
              ) ?? 0;
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
