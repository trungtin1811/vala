import type { SkillLevel } from '@/types'

export const SKILL_MARKER_COLORS: Record<SkillLevel, string> = {
  yeu_minus: '#F87171',
  yeu: '#F87171',
  yeu_plus: '#FB923C',
  tby_minus: '#FB923C',
  tby: '#FACC15',
  tby_plus: '#FACC15',
  tb_minus: '#4ADE80',
  tb: '#4ADE80',
  tb_plus: '#22C55E',
  kha_minus: '#60A5FA',
  kha: '#0052CC',
  kha_plus: '#0052CC',
  gioi_minus: '#4F46E5',
  gioi: '#1E3A8A',
  gioi_plus: '#1E3A8A',
}

export const DEFAULT_CENTER: [number, number] = [21.0278, 105.8342] // Hanoi
export const DEFAULT_ZOOM = 13

export function createBadmintonIcon(color: string, slotsAvailable: number) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="44" viewBox="0 0 36 44">
      <filter id="shadow">
        <feDropShadow dx="0" dy="2" stdDeviation="2" flood-opacity="0.25"/>
      </filter>
      <path d="M18 0C8.06 0 0 8.06 0 18c0 13.5 18 26 18 26S36 31.5 36 18C36 8.06 27.94 0 18 0z"
        fill="${color}" filter="url(#shadow)"/>
      <circle cx="18" cy="18" r="11" fill="white" opacity="0.92"/>
      <text x="18" y="22" text-anchor="middle" font-size="11" font-weight="700"
        font-family="Inter,system-ui,sans-serif" fill="${color}">${slotsAvailable}</text>
    </svg>
  `
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
}

export function createUserLocationIcon() {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20">
      <circle cx="10" cy="10" r="8" fill="#0052CC" opacity="0.2"/>
      <circle cx="10" cy="10" r="5" fill="#0052CC"/>
      <circle cx="10" cy="10" r="2.5" fill="white"/>
    </svg>
  `
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
}
