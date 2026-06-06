export interface GeoResult {
  lat: number
  lng: number
  display_name: string
  address: Record<string, string>
}

export async function geocodeAddress(query: string): Promise<GeoResult | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&countrycodes=vn&addressdetails=1`
    const res = await fetch(url, { headers: { 'Accept-Language': 'vi', 'User-Agent': 'Vala-Badminton-App/1.0' } })
    const data = await res.json()
    if (!data.length) return null
    return {
      lat: parseFloat(data[0].lat),
      lng: parseFloat(data[0].lon),
      display_name: data[0].display_name,
      address: data[0].address ?? {},
    }
  } catch {
    return null
  }
}

export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
    const res = await fetch(url, { headers: { 'Accept-Language': 'vi', 'User-Agent': 'Vala-Badminton-App/1.0' } })
    const data = await res.json()
    return data.display_name ?? null
  } catch {
    return null
  }
}
