"use client";

import "@/app/map.css";
import "leaflet/dist/leaflet.css";
import Link from "next/link";
import { ExternalLink, MapPinned } from "lucide-react";
import { useEffect } from "react";
import { MapContainer, TileLayer, CircleMarker, useMap } from "react-leaflet";

interface CourtLocationWidgetProps {
  location: string;
  courtAddress?: string | null;
  latitude: number | null;
  longitude: number | null;
}

function EnsureMapResized() {
  const map = useMap();

  useEffect(() => {
    const rafId = requestAnimationFrame(() => {
      map.invalidateSize();
    });
    const timeoutId = globalThis.setTimeout(() => {
      map.invalidateSize();
    }, 180);

    return () => {
      cancelAnimationFrame(rafId);
      globalThis.clearTimeout(timeoutId);
    };
  }, [map]);

  return null;
}

export default function CourtLocationWidget({
  location,
  courtAddress,
  latitude,
  longitude,
}: Readonly<CourtLocationWidgetProps>) {
  const hasCoordinates =
    typeof latitude === "number" && typeof longitude === "number";
  const coords = hasCoordinates
    ? ([latitude, longitude] as [number, number])
    : null;

  const mapHref = hasCoordinates
    ? `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;

  return (
    <div>


      <div className="px-4 py-3">
        <p className="text-xs text-[#6B7280]">Tên sân</p>
        <p className="text-sm font-medium text-[#1F2937] mt-0.5">{location}</p>
        <p className="text-xs text-[#6B7280] mt-2">Địa chỉ</p>
        <Link
          href={mapHref}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-sm mt-0.5 text-[#0052CC] hover:underline"
        >
          {courtAddress?.trim() ? <>{courtAddress} <ExternalLink size={12} /></> : "Chưa có địa chỉ chi tiết"}

        </Link>
      </div>

      {coords ? (
        <div className="h-52 border-t border-[#F3F4F6] p-4">
          <MapContainer
            center={coords}
            zoom={16}
            style={{ height: "100%", width: "100%" }}
            zoomControl={false}
            scrollWheelZoom={false}
            dragging={true}
          >
            <TileLayer
              attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <EnsureMapResized />
            <CircleMarker
              center={coords}
              radius={8}
              pathOptions={{
                color: "#0052CC",
                fillColor: "#0052CC",
                fillOpacity: 0.8,
                weight: 2,
              }}
            />
          </MapContainer>
        </div>
      ) : (
        <div className="h-28 border-t border-[#F3F4F6] bg-[#F9FAFB] flex items-center justify-center px-4 text-center">
          <p className="text-xs text-[#6B7280]">
            Chưa có tọa độ chính xác cho sân này. Bạn vẫn có thể bấm "Chỉ đường"
            để mở bản đồ.
          </p>
        </div>
      )}
    </div>
  );
}
