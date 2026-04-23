'use client'

import { useState, useEffect } from 'react'

interface UserLocation {
  lat: number
  lng: number
}

export function useUserLocation() {
  const [location, setLocation] = useState<UserLocation | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  function requestLocation() {
    if (!('geolocation' in navigator)) {
      setError('Trình duyệt không hỗ trợ định vị')
      return
    }
    setLoading(true)
    navigator.geolocation.getCurrentPosition(
      pos => {
        const lat = Number(pos.coords.latitude)
        const lng = Number(pos.coords.longitude)
        if (Number.isFinite(lat) && Number.isFinite(lng)) {
          setLocation({ lat, lng })
        }
        setLoading(false)
      },
      err => {
        setError(err.message)
        setLoading(false)
      },
      { timeout: 10_000 }
    )
  }

  useEffect(() => {
    requestLocation()
  }, [])

  return { location, error, loading, requestLocation }
}
