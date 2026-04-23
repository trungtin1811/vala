'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { MapPin, Plus, ChevronDown, Loader2, Check } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { useCourts, useCreateCourt } from '@/hooks/useCourts'
import { geocodeAddress, reverseGeocode } from '@/lib/geocoding'
import type { Court } from '@/types'

const MapPickerLeaflet = dynamic(() => import('@/components/Map/MapPickerLeaflet'), { ssr: false })

interface CourtPickerProps {
  value: string
  latitude: number | null
  longitude: number | null
  onChange: (values: { location: string; latitude: number | null; longitude: number | null }) => void
  error?: string
}

interface Province { code: number; name: string }
interface District { code: number; name: string }
interface Ward    { code: number; name: string }

interface AddressFields {
  name: string
  street: string
  wardCode: number | null
  wardName: string
  districtCode: number | null
  districtName: string
  provinceCode: number | null
  provinceName: string
}

function buildAddress(f: AddressFields) {
  return [f.street, f.wardName, f.districtName, f.provinceName].filter(Boolean).join(', ')
}

const BASE = 'https://provinces.open-api.vn/api'

function SelectField({ label, placeholder, value, onChange, options, loading, disabled }: {
  label: string
  placeholder: string
  value: number | null
  onChange: (code: number, name: string) => void
  options: { code: number; name: string }[]
  loading?: boolean
  disabled?: boolean
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-[#1F2937]">{label}</label>
      <div className="relative">
        <select
          value={value ?? ''}
          disabled={disabled || loading}
          onChange={e => {
            const opt = options.find(o => o.code === Number(e.target.value))
            if (opt) onChange(opt.code, opt.name)
          }}
          className="w-full appearance-none px-3 py-2.5 pr-8 border border-[#E5E7EB] rounded-xl text-sm bg-white focus:outline-none focus:border-[#0052CC] focus:ring-2 focus:ring-[#0052CC]/20 disabled:bg-[#F3F4F6] disabled:text-[#9CA3AF] disabled:cursor-not-allowed"
        >
          <option value="">{loading ? 'Đang tải…' : placeholder}</option>
          {options.map(o => (
            <option key={o.code} value={o.code}>{o.name}</option>
          ))}
        </select>
        <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9CA3AF]">
          {loading ? <Loader2 size={13} className="animate-spin" /> : <ChevronDown size={13} />}
        </span>
      </div>
    </div>
  )
}

export function CourtPicker({ value, latitude, longitude, onChange, error }: CourtPickerProps) {
  const { data: courts = [], isLoading } = useCourts()
  const createCourt = useCreateCourt()

  const [open, setOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)

  const [fields, setFields] = useState<AddressFields>({
    name: '', street: '',
    wardCode: null, wardName: '',
    districtCode: null, districtName: '',
    provinceCode: null, provinceName: '',
  })
  const [pin, setPin] = useState<{ lat: number; lng: number } | null>(null)
  const [geocoding, setGeocoding] = useState(false)
  const [createError, setCreateError] = useState('')

  // Province / District / Ward data
  const [provinces, setProvinces] = useState<Province[]>([])
  const [districts, setDistricts] = useState<District[]>([])
  const [wards, setWards]         = useState<Ward[]>([])
  const [loadingProvinces, setLoadingProvinces] = useState(false)
  const [loadingDistricts, setLoadingDistricts] = useState(false)
  const [loadingWards, setLoadingWards]         = useState(false)

  useEffect(() => {
    if (!createOpen || provinces.length > 0) return
    setLoadingProvinces(true)
    fetch(`${BASE}/p/`)
      .then(r => r.json())
      .then(data => setProvinces(data))
      .finally(() => setLoadingProvinces(false))
  }, [createOpen, provinces.length])

  async function handleProvinceChange(code: number, name: string) {
    const next: AddressFields = { ...fields, provinceCode: code, provinceName: name, districtCode: null, districtName: '', wardCode: null, wardName: '' }
    setFields(next)
    setDistricts([])
    setWards([])
    setLoadingDistricts(true)
    const data = await fetch(`${BASE}/p/${code}?depth=2`).then(r => r.json())
    setDistricts(data.districts ?? [])
    setLoadingDistricts(false)
    triggerGeocode(next)
  }

  async function handleDistrictChange(code: number, name: string) {
    const next: AddressFields = { ...fields, districtCode: code, districtName: name, wardCode: null, wardName: '' }
    setFields(next)
    setWards([])
    setLoadingWards(true)
    const data = await fetch(`${BASE}/d/${code}?depth=2`).then(r => r.json())
    setWards(data.wards ?? [])
    setLoadingWards(false)
    triggerGeocode(next)
  }

  function handleWardChange(code: number, name: string) {
    const next = { ...fields, wardCode: code, wardName: name }
    setFields(next)
    triggerGeocode(next)
  }

  const geocodeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  function triggerGeocode(f: AddressFields) {
    if (geocodeTimer.current) clearTimeout(geocodeTimer.current)
    const addr = buildAddress(f)
    if (addr.length < 5) return
    geocodeTimer.current = setTimeout(async () => {
      setGeocoding(true)
      const result = await geocodeAddress(addr)
      if (result) setPin({ lat: result.lat, lng: result.lng })
      setGeocoding(false)
    }, 700)
  }

  useEffect(() => {
    if (!open) return
    function onOutside(e: MouseEvent) {
      if (!dropdownRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onOutside)
    return () => document.removeEventListener('mousedown', onOutside)
  }, [open])

  function resetCreate() {
    setFields({ name: '', street: '', wardCode: null, wardName: '', districtCode: null, districtName: '', provinceCode: null, provinceName: '' })
    setDistricts([])
    setWards([])
    setPin(null)
    setCreateError('')
  }

  function selectCourt(court: Court) {
    onChange({ location: court.name, latitude: court.latitude, longitude: court.longitude })
    setOpen(false)
  }

  function openCreate() {
    setOpen(false)
    resetCreate()
    setCreateOpen(true)
  }

  function handleStreetChange(val: string) {
    const next = { ...fields, street: val }
    setFields(next)
    triggerGeocode(next)
  }

  const handlePinDrag = useCallback(async (lat: number, lng: number) => {
    setPin({ lat, lng })
    const addr = await reverseGeocode(lat, lng)
    if (addr) setFields(prev => ({ ...prev, street: addr }))
  }, [])

  const handleMapClick = useCallback(async (lat: number, lng: number) => {
    setPin({ lat, lng })
    const addr = await reverseGeocode(lat, lng)
    if (addr) setFields(prev => ({ ...prev, street: addr }))
  }, [])

  async function handleCreate() {
    if (!fields.name.trim()) { setCreateError('Vui lòng nhập tên sân'); return }
    setCreateError('')
    const address = buildAddress(fields)
    try {
      const court = await createCourt.mutateAsync({
        name: fields.name.trim(),
        address: address || null,
        latitude: pin?.lat ?? null,
        longitude: pin?.lng ?? null,
      })
      onChange({ location: court.name, latitude: court.latitude, longitude: court.longitude })
      setCreateOpen(false)
    } catch (e: any) {
      setCreateError(e.message ?? 'Có lỗi xảy ra')
    }
  }

  return (
    <>
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-[#1F2937]">Địa điểm *</label>

        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setOpen(v => !v)}
            className={`w-full px-3 py-2.5 pr-9 border rounded-xl text-sm text-left flex items-center gap-2 bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-[#0052CC]/20 ${
              error ? 'border-[#EF4444]' : open ? 'border-[#0052CC]' : 'border-[#E5E7EB]'
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
            <ChevronDown size={14} className={`absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] transition-transform ${open ? 'rotate-180' : ''}`} />
          </button>

          {open && (
            <div className="absolute z-30 mt-1 w-full bg-white border border-[#E5E7EB] rounded-xl shadow-lg overflow-hidden">
              {isLoading ? (
                <div className="flex items-center gap-2 px-4 py-3 text-sm text-[#6B7280]">
                  <Loader2 size={14} className="animate-spin" /> Đang tải…
                </div>
              ) : courts.length === 0 ? (
                <p className="px-4 py-3 text-sm text-[#9CA3AF]">Chưa có sân nào. Tạo mới bên dưới.</p>
              ) : (
                <ul className="max-h-52 overflow-y-auto">
                  {courts.map(court => (
                    <li key={court.id}>
                      <button
                        type="button"
                        onClick={() => selectCourt(court)}
                        className="w-full text-left px-4 py-3 text-sm hover:bg-[#F3F4F6] flex items-center gap-3 transition-colors"
                      >
                        <MapPin size={13} className="shrink-0 text-[#6B7280]" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-[#1F2937] truncate">{court.name}</p>
                          {court.address && <p className="text-xs text-[#9CA3AF] truncate">{court.address}</p>}
                        </div>
                        {value === court.name && <Check size={13} className="shrink-0 text-[#0052CC]" />}
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
              <label className="text-sm font-medium text-[#1F2937]">Tên sân *</label>
              <input
                type="text"
                value={fields.name}
                onChange={e => setFields(prev => ({ ...prev, name: e.target.value }))}
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
              onChange={handleProvinceChange}
            />

            {/* District */}
            <SelectField
              label="Quận / Huyện"
              placeholder={fields.provinceCode ? 'Chọn quận / huyện' : 'Chọn tỉnh trước'}
              value={fields.districtCode}
              options={districts}
              loading={loadingDistricts}
              disabled={!fields.provinceCode}
              onChange={handleDistrictChange}
            />

            {/* Ward */}
            <SelectField
              label="Phường / Xã"
              placeholder={fields.districtCode ? 'Chọn phường / xã' : 'Chọn quận trước'}
              value={fields.wardCode}
              options={wards}
              loading={loadingWards}
              disabled={!fields.districtCode}
              onChange={handleWardChange}
            />

            {/* Street */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[#1F2937]">Số nhà / Đường</label>
              <input
                type="text"
                value={fields.street}
                onChange={e => handleStreetChange(e.target.value)}
                placeholder="VD: 123 Nguyễn Trãi"
                className="w-full px-3 py-2.5 border border-[#E5E7EB] rounded-xl text-sm focus:outline-none focus:border-[#0052CC] focus:ring-2 focus:ring-[#0052CC]/20"
              />
            </div>

            {createError && <p className="text-xs text-[#EF4444]">{createError}</p>}

            <div className="flex gap-3 justify-end mt-auto pt-2">
              <Button type="button" variant="ghost" onClick={() => setCreateOpen(false)}>Huỷ</Button>
              <Button type="button" onClick={handleCreate} loading={createCourt.isPending}>
                Lưu sân
              </Button>
            </div>
          </div>

          {/* Right — map */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-[#1F2937]">Vị trí trên bản đồ</label>
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
            <p className="text-xs text-[#9CA3AF]">Nhập địa chỉ để tự định vị, hoặc nhấn / kéo ghim để chỉnh.</p>
          </div>
        </div>
      </Modal>
    </>
  )
}
