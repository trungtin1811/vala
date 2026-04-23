import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string) {
  return new Date(date).toLocaleDateString('vi-VN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })
}

export function formatTime(time: string) {
  const [h, m] = time.split(':')
  return `${h}:${m}`
}

export function formatDateTime(date: string, time: string) {
  return `${formatDate(date)} lúc ${formatTime(time)}`
}
