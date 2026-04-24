"use client";

import { DEFAULT_CENTER, DEFAULT_ZOOM } from "@/lib/mapIcons";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";
import {
  MapContainer,
  Marker,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";

function AutoLocate() {
  const map = useMap();
  const done = useRef(false);
  useEffect(() => {
    if (done.current) return;
    done.current = true;
    navigator.geolocation?.getCurrentPosition(
      (pos) =>
        map.setView([pos.coords.latitude, pos.coords.longitude], 15, {
          duration: 0.8,
        }),
      () => {},
      { timeout: 5000 },
    );
  }, [map]);
  return null;
}

const pinIcon = L.icon({
  iconUrl:
    "data:image/svg+xml;base64," +
    btoa(
      `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="36" viewBox="0 0 28 36"><path d="M14 0C6.27 0 0 6.27 0 14c0 9.63 14 22 14 22s14-12.37 14-22C28 6.27 21.73 0 14 0z" fill="#0052CC"/><circle cx="14" cy="14" r="5" fill="white"/></svg>`,
    ),
  iconSize: [28, 36],
  iconAnchor: [14, 36],
});

function ClickHandler({
  onMapClick,
}: {
  onMapClick: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function FlyTo({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  const prev = useRef<string>("");
  useEffect(() => {
    const key = `${lat},${lng}`;
    if (key !== prev.current) {
      prev.current = key;
      map.setView([lat, lng], 16, { duration: 0.6 });
    }
  }, [lat, lng, map]);
  return null;
}

interface MapPickerLeafletProps {
  pin: { lat: number; lng: number } | null;
  onMapClick: (lat: number, lng: number) => void;
  onPinDrag?: (lat: number, lng: number) => void;
  initialLat?: number | null;
  initialLng?: number | null;
  flyToPin?: boolean;
}

export default function MapPickerLeaflet({
  pin,
  onMapClick,
  onPinDrag,
  initialLat,
  initialLng,
  flyToPin,
}: MapPickerLeafletProps) {
  const center: [number, number] =
    initialLat && initialLng ? [initialLat, initialLng] : DEFAULT_CENTER;

  return (
    <MapContainer
      center={center}
      zoom={DEFAULT_ZOOM}
      style={{ height: "100%", width: "100%" }}
      zoomControl
    >
      <TileLayer
        attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ClickHandler onMapClick={onMapClick} />
      {!initialLat && !initialLng && <AutoLocate />}
      {pin && flyToPin && <FlyTo lat={pin.lat} lng={pin.lng} />}
      {pin && (
        <Marker
          position={[pin.lat, pin.lng]}
          icon={pinIcon}
          draggable={!!onPinDrag}
          eventHandlers={
            onPinDrag
              ? {
                  dragend(e) {
                    const { lat, lng } = (e.target as L.Marker).getLatLng();
                    onPinDrag(lat, lng);
                  },
                }
              : {}
          }
        />
      )}
    </MapContainer>
  );
}
