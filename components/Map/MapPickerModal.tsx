'use client'

import { useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { reverseGeocode } from '@/lib/geocoding'
import { MapPin, Loader2 } from 'lucide-react'

const MapPicker = dynamic(() => import('./MapPickerLeaflet'), { ssr: false })

interface MapPickerModalProps {
  open: boolean
  onClose: () => void
  onConfirm: (result: { lat: number; lng: number; address: string }) => void
  initialLat?: number | null
  initialLng?: number | null
}

export function MapPickerModal({ open, onClose, onConfirm, initialLat, initialLng }: MapPickerModalProps) {
  const [pin, setPin] = useState<{ lat: number; lng: number } | null>(
    initialLat && initialLng ? { lat: initialLat, lng: initialLng } : null
  )
  const [address, setAddress] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const handleMapClick = useCallback(async (lat: number, lng: number) => {
    setPin({ lat, lng })
    setLoading(true)
    const addr = await reverseGeocode(lat, lng)
    setAddress(addr ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`)
    setLoading(false)
  }, [])

  function handleConfirm() {
    if (!pin) return
    onConfirm({ lat: pin.lat, lng: pin.lng, address })
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Chọn vị trí trên bản đồ" className="max-w-2xl">
      <div className="flex flex-col gap-4">
        <p className="text-sm text-[#6B7280]">Nhấn vào bản đồ để đặt ghim vị trí sân.</p>

        <div className="h-80 rounded-xl overflow-hidden border border-[#E5E7EB]">
          {open && (
            <MapPicker
              pin={pin}
              onMapClick={handleMapClick}
              initialLat={initialLat}
              initialLng={initialLng}
            />
          )}
        </div>

        {pin && (
          <div className="flex items-start gap-2 px-3 py-2.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl text-sm">
            {loading ? (
              <Loader2 size={14} className="mt-0.5 shrink-0 animate-spin text-[#9CA3AF]" />
            ) : (
              <MapPin size={14} className="mt-0.5 shrink-0 text-[#0052CC]" />
            )}
            <span className="text-[#4B5563]">{loading ? 'Đang xác định địa chỉ…' : address}</span>
          </div>
        )}

        <div className="flex gap-3 justify-end">
          <Button type="button" variant="ghost" onClick={onClose}>Huỷ</Button>
          <Button type="button" onClick={handleConfirm} disabled={!pin || loading}>
            Xác nhận vị trí
          </Button>
        </div>
      </div>
    </Modal>
  )
}
