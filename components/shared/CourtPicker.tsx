"use client";

import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { useCourts, useCreateCourt } from "@/hooks/useCourts";
import {
  geocodeAddress,
  reverseGeocode,
  type GeoResult,
} from "@/lib/geocoding";
import type { Court } from "@/types";
import { Check, ChevronDown, Loader2, MapPin, Plus } from "lucide-react";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";

const MapPickerLeaflet = dynamic(
  () => import("@/components/Map/MapPickerLeaflet"),
  { ssr: false },
);

interface CourtPickerProps {
  value: string;
  latitude: number | null;
  longitude: number | null;
  onChange: (values: {
    location: string;
    court_id: string | null;
    court_address: string | null;
    latitude: number | null;
    longitude: number | null;
  }) => void;
  error?: string;
}

interface Province {
  code: number;
  name: string;
}
interface Ward {
  code: number;
  name: string;
}

interface AddressFields {
  name: string;
  street: string;
  wardCode: number | null;
  wardName: string;
  provinceCode: number | null;
  provinceName: string;
}

function buildAddress(f: AddressFields) {
  return [f.street, f.wardName, f.provinceName]
    .filter(Boolean)
    .join(", ");
}

const BASE = "https://provinces.open-api.vn/api/v2";

function normalizeAdministrativeName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/đ/g, "d")
    .replace(
      /^(thanh pho|tinh|quan|huyen|thi xa|thi tran|phuong|xa)\s+/,
      "",
    )
    .replace(/\b(city|province|district|ward|town|commune)\b/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function findAdministrativeUnit<T extends { code: number; name: string }>(
  options: T[],
  candidates: string[],
) {
  const normalizedCandidates = candidates
    .map(normalizeAdministrativeName)
    .filter(Boolean);

  return options.find((option) =>
    normalizedCandidates.includes(normalizeAdministrativeName(option.name)),
  );
}

function isString(value: string | undefined): value is string {
  return Boolean(value);
}

function isLegacyDistrict(value: string) {
  return /^(quận|huyện|thị xã|district)\s+/i.test(value);
}

function addressCandidates(result: GeoResult | null, query: string) {
  const address = result?.address ?? {};
  const queryParts = query.split(",").map((part) => part.trim());

  return {
    province: [
      address.state,
      address.city,
      address.province,
      ...queryParts.slice(1),
    ].filter(isString),
    ward: [
      address.suburb,
      address.quarter,
      address.ward,
      address.village,
      address.municipality,
      ...queryParts.slice(1).filter((part) => !isLegacyDistrict(part)),
    ].filter(isString),
  };
}

function streetFromGeocode(result: GeoResult | null, query: string) {
  const address = result?.address ?? {};
  const road =
    address.road ??
    address.pedestrian ??
    address.residential ??
    address.neighbourhood;
  const preciseStreet = [address.house_number, road].filter(Boolean).join(" ");

  return preciseStreet || query.split(",")[0]?.trim() || query;
}

function SelectField({
  label,
  placeholder,
  value,
  onChange,
  options,
  loading,
  disabled,
  searchable,
}: {
  label: string;
  placeholder: string;
  value: number | null;
  onChange: (code: number, name: string) => void;
  options: { code: number; name: string }[];
  loading?: boolean;
  disabled?: boolean;
  searchable?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-[#1F2937]">{label}</label>
      <Select
        value={value ? String(value) : "none"}
        onValueChange={(selectedValue) => {
          if (selectedValue === "none") {
            return;
          }
          const opt = options.find((o) => o.code === Number(selectedValue));
          if (opt) onChange(opt.code, opt.name);
        }}
        options={[
          { value: "none", label: loading ? "Đang tải…" : placeholder },
          ...options.map((o) => ({
            value: String(o.code),
            label: o.name,
          })),
        ]}
        disabled={disabled || loading}
        searchable={searchable}
        searchPlaceholder={`Tìm ${label.toLowerCase()}...`}
      />
    </div>
  );
}

export function CourtPicker({
  value,
  latitude,
  onChange,
  error,
}: CourtPickerProps) {
  const { data: courts = [], isLoading } = useCourts();
  const createCourt = useCreateCourt();

  const [open, setOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  const [fields, setFields] = useState<AddressFields>({
    name: "",
    street: "",
    wardCode: null,
    wardName: "",
    provinceCode: null,
    provinceName: "",
  });
  const [pin, setPin] = useState<{ lat: number; lng: number } | null>(null);
  const [geocoding, setGeocoding] = useState(false);
  const [createError, setCreateError] = useState("");

  // Province / Ward data
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingWards, setLoadingWards] = useState(false);

  useEffect(() => {
    if (!createOpen || provinces.length > 0) return;
    fetch(`${BASE}/p/`)
      .then((r) => r.json())
      .then((data) => setProvinces(data))
      .finally(() => setLoadingProvinces(false));
  }, [createOpen, provinces.length]);

  async function handleProvinceChange(code: number, name: string) {
    const next: AddressFields = {
      ...fields,
      provinceCode: code,
      provinceName: name,
      wardCode: null,
      wardName: "",
    };
    setFields(next);
    setWards([]);
    setLoadingWards(true);
    const data = await fetch(`${BASE}/p/${code}?depth=2`).then((r) => r.json());
    setWards(data.wards ?? []);
    setLoadingWards(false);
    triggerGeocode(next);
  }

  function handleWardChange(code: number, name: string) {
    const next = { ...fields, wardCode: code, wardName: name };
    setFields(next);
    triggerGeocode(next);
  }

  const geocodeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const geocodeRequest = useRef(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  async function mapAdministrativeFields(
    result: GeoResult | null,
    query: string,
    request: number,
  ) {
    const candidates = addressCandidates(result, query);
    let availableProvinces = provinces;
    if (availableProvinces.length === 0) {
      const data = await fetch(`${BASE}/p/`).then((r) => r.json());
      if (request !== geocodeRequest.current) return;
      availableProvinces = data;
      setProvinces(data);
    }

    const province = findAdministrativeUnit(
      availableProvinces,
      candidates.province,
    );
    if (!province) return;

    const provinceData = await fetch(`${BASE}/p/${province.code}?depth=2`).then(
      (r) => r.json(),
    );
    if (request !== geocodeRequest.current) return;
    const availableWards: Ward[] = provinceData.wards ?? [];
    const ward = findAdministrativeUnit(availableWards, candidates.ward);

    setWards(availableWards);
    setFields((prev) => ({
      ...prev,
      street: streetFromGeocode(result, query),
      provinceCode: province.code,
      provinceName: province.name,
      wardCode: ward?.code ?? null,
      wardName: ward?.name ?? "",
    }));
  }

  async function geocodeAndSetPin(query: string) {
    const normalized = query.trim();
    if (normalized.length < 5) return;

    const request = ++geocodeRequest.current;
    setGeocoding(true);
    try {
      const result = await geocodeAddress(normalized);
      if (request !== geocodeRequest.current) return;
      if (result) setPin({ lat: result.lat, lng: result.lng });
      await mapAdministrativeFields(result, normalized, request);
    } catch {
      // Keep the entered address when either external lookup is unavailable.
    } finally {
      if (request === geocodeRequest.current) setGeocoding(false);
    }
  }

  function triggerGeocode(f: AddressFields) {
    if (geocodeTimer.current) clearTimeout(geocodeTimer.current);
    const addr = buildAddress(f);
    if (addr.length < 5) return;
    geocodeTimer.current = setTimeout(async () => {
      await geocodeAndSetPin(addr);
    }, 700);
  }

  useEffect(() => {
    if (!open) return;
    function onOutside(e: MouseEvent) {
      if (!dropdownRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, [open]);

  function resetCreate() {
    setFields({
      name: "",
      street: "",
      wardCode: null,
      wardName: "",
      provinceCode: null,
      provinceName: "",
    });
    setWards([]);
    setPin(null);
    setCreateError("");
  }

  function selectCourt(court: Court) {
    onChange({
      location: court.name,
      court_id: court.id,
      court_address: court.address,
      latitude: court.latitude,
      longitude: court.longitude,
    });
    setOpen(false);
  }

  function openCreate() {
    setOpen(false);
    resetCreate();
    if (provinces.length === 0) setLoadingProvinces(true);
    setCreateOpen(true);
  }

  function handleStreetChange(val: string) {
    const next = { ...fields, street: val };
    setFields(next);
    triggerGeocode(next);
  }

  function handleStreetPaste(event: React.ClipboardEvent<HTMLInputElement>) {
    const pasted = event.clipboardData.getData("text").trim();
    if (!pasted) return;

    event.preventDefault();

    const input = event.currentTarget;
    const start = input.selectionStart ?? input.value.length;
    const end = input.selectionEnd ?? input.value.length;
    const nextStreet =
      input.value.slice(0, start) + pasted + input.value.slice(end);

    setFields((prev) => ({ ...prev, street: nextStreet }));
    void geocodeAndSetPin(nextStreet);
  }

  const handlePinDrag = useCallback(async (lat: number, lng: number) => {
    setPin({ lat, lng });
    const addr = await reverseGeocode(lat, lng);
    if (addr) setFields((prev) => ({ ...prev, street: addr }));
  }, []);

  const handleMapClick = useCallback(async (lat: number, lng: number) => {
    setPin({ lat, lng });
    const addr = await reverseGeocode(lat, lng);
    if (addr) setFields((prev) => ({ ...prev, street: addr }));
  }, []);

  async function handleCreate() {
    if (!fields.name.trim()) {
      setCreateError("Vui lòng nhập tên sân");
      return;
    }
    setCreateError("");
    const address = buildAddress(fields);
    try {
      const court = await createCourt.mutateAsync({
        name: fields.name.trim(),
        address: address || null,
        latitude: pin?.lat ?? null,
        longitude: pin?.lng ?? null,
      });
      onChange({
        location: court.name,
        court_id: court.id,
        court_address: court.address,
        latitude: court.latitude,
        longitude: court.longitude,
      });
      setCreateOpen(false);
    } catch (error) {
      setCreateError(error instanceof Error ? error.message : "Có lỗi xảy ra");
    }
  }

  return (
    <>
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-[#1F2937]">Địa điểm *</label>

        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className={`w-full px-3 py-2.5 pr-9 border rounded-xl text-sm text-left flex items-center gap-2 bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-[#0052CC]/20 ${
              error
                ? "border-[#EF4444]"
                : open
                  ? "border-[#0052CC]"
                  : "border-[#E5E7EB]"
            }`}
          >
            {value ? (
              <>
                <MapPin size={14} className="shrink-0 text-[#0052CC]" />
                <span className="truncate text-[#1F2937]">{value}</span>
              </>
            ) : (
              <span className="text-[#9CA3AF]">Chọn sân hoặc tạo mới…</span>
            )}
            <ChevronDown
              size={14}
              className={`absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] transition-transform ${open ? "rotate-180" : ""}`}
            />
          </button>

          {open && (
            <div className="absolute z-30 mt-1 w-full bg-white border border-[#E5E7EB] rounded-xl shadow-lg overflow-hidden">
              {isLoading ? (
                <div className="flex items-center gap-2 px-4 py-3 text-sm text-[#6B7280]">
                  <Loader2 size={14} className="animate-spin" /> Đang tải…
                </div>
              ) : courts.length === 0 ? (
                <p className="px-4 py-3 text-sm text-[#9CA3AF]">
                  Chưa có sân nào. Tạo mới bên dưới.
                </p>
              ) : (
                <ul className="max-h-52 overflow-y-auto">
                  {courts.map((court) => (
                    <li key={court.id}>
                      <button
                        type="button"
                        onClick={() => selectCourt(court)}
                        className="w-full text-left px-4 py-3 text-sm hover:bg-[#F3F4F6] flex items-center gap-3 transition-colors"
                      >
                        <MapPin size={13} className="shrink-0 text-[#6B7280]" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-[#1F2937] truncate">
                            {court.name}
                          </p>
                          {court.address && (
                            <p className="text-xs text-[#9CA3AF] truncate">
                              {court.address}
                            </p>
                          )}
                        </div>
                        {value === court.name && (
                          <Check
                            size={13}
                            className="shrink-0 text-[#0052CC]"
                          />
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <div className="border-t border-[#E5E7EB]">
                <button
                  type="button"
                  onClick={openCreate}
                  className="w-full text-left px-4 py-3 text-sm text-[#0052CC] hover:bg-[#EFF6FF] flex items-center gap-2 font-medium transition-colors"
                >
                  <Plus size={14} /> Tạo sân mới
                </button>
              </div>
            </div>
          )}
        </div>

        {error && <p className="text-xs text-[#EF4444]">{error}</p>}
        {latitude && !error && (
          <p className="text-xs text-[#9CA3AF]">✓ Đã định vị trên bản đồ</p>
        )}
      </div>

      {/* Create court modal — wide split layout */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Tạo sân mới"
        className="max-w-3xl"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left — form */}
          <div className="flex flex-col gap-4">
            {/* Court name */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[#1F2937]">
                Tên sân *
              </label>
              <input
                type="text"
                value={fields.name}
                onChange={(e) =>
                  setFields((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="VD: Sân cầu lông ABC"
                className="w-full px-3 py-2.5 border border-[#E5E7EB] rounded-xl text-sm focus:outline-none focus:border-[#0052CC] focus:ring-2 focus:ring-[#0052CC]/20"
              />
            </div>

            {/* Province */}
            <SelectField
              label="Tỉnh / Thành phố"
              placeholder="Chọn tỉnh / thành phố"
              value={fields.provinceCode}
              options={provinces}
              loading={loadingProvinces}
              searchable
              onChange={handleProvinceChange}
            />

            {/* Ward */}
            <SelectField
              label="Phường / Xã"
              placeholder={
                fields.provinceCode ? "Chọn phường / xã" : "Chọn tỉnh trước"
              }
              value={fields.wardCode}
              options={wards}
              loading={loadingWards}
              disabled={!fields.provinceCode}
              onChange={handleWardChange}
            />

            {/* Street */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[#1F2937]">
                Số nhà / Đường
              </label>
              <input
                type="text"
                value={fields.street}
                onChange={(e) => handleStreetChange(e.target.value)}
                onPaste={handleStreetPaste}
                placeholder="VD: 123 Nguyễn Trãi"
                className="w-full px-3 py-2.5 border border-[#E5E7EB] rounded-xl text-sm focus:outline-none focus:border-[#0052CC] focus:ring-2 focus:ring-[#0052CC]/20"
              />
            </div>

            {createError && (
              <p className="text-xs text-[#EF4444]">{createError}</p>
            )}

            <div className="flex gap-3 justify-end mt-auto pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setCreateOpen(false)}
              >
                Huỷ
              </Button>
              <Button
                type="button"
                onClick={handleCreate}
                loading={createCourt.isPending}
              >
                Lưu sân
              </Button>
            </div>
          </div>

          {/* Right — map */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-[#1F2937]">
                Vị trí trên bản đồ
              </label>
              {geocoding && (
                <span className="flex items-center gap-1 text-xs text-[#9CA3AF]">
                  <Loader2 size={11} className="animate-spin" /> Đang tìm…
                </span>
              )}
              {pin && !geocoding && (
                <span className="text-xs text-emerald-600">✓ Đã xác định</span>
              )}
            </div>

            <div className="h-80 md:h-full min-h-72 rounded-xl overflow-hidden border border-[#E5E7EB]">
              {createOpen && (
                <MapPickerLeaflet
                  pin={pin}
                  onMapClick={handleMapClick}
                  onPinDrag={handlePinDrag}
                  flyToPin
                />
              )}
            </div>
            <p className="text-xs text-[#9CA3AF]">
              Nhập địa chỉ để tự định vị, hoặc nhấn / kéo ghim để chỉnh.
            </p>
          </div>
        </div>
      </Modal>
    </>
  );
}
