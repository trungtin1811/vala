'use client'

import { useForm, Controller } from 'react-hook-form'
import { NumericFormat } from 'react-number-format'
import { Button } from '@/components/ui/Button'
import { RichTextEditor } from '@/components/ui/RichTextEditor'
import { CourtPicker } from '@/components/shared/CourtPicker'
import { DatePicker } from '@/components/ui/DatePicker'
import { TimePicker } from '@/components/ui/TimePicker'
import { SKILL_LEVEL_LABELS, type SkillLevel } from '@/types'
import { AlertCircle, Clock, Repeat2, Info, Users, Wallet, CalendarDays } from 'lucide-react'
import { Toggle } from '@/components/ui/Toggle'
import { Input } from '@/components/ui/Input'

export interface EventFormValues {
  title: string
  description: string
  location: string
  latitude: number | null
  longitude: number | null
  event_date: string
  event_time: string
  event_end_time: string
  total_slots: number
  skill_levels: SkillLevel[]
  repeat_enabled: boolean
  repeat_days: number[]
  repeat_until: string
  price_enabled: boolean
  price_min: number | null
  price_max: number | null
  split_evenly: boolean
}

interface EventFormProps {
  defaultValues?: Partial<EventFormValues>
  onSubmit: (values: EventFormValues) => Promise<void>
  onCancel?: () => void
  submitLabel?: string
  loading?: boolean
  hideRepeat?: boolean
}

function computeEndInfo(date: string, startTime: string, endTime: string) {
  if (!date || !startTime || !endTime) return null
  const [sh, sm] = startTime.split(':').map(Number)
  const [eh, em] = endTime.split(':').map(Number)
  const startMins = sh * 60 + sm
  let endMins = eh * 60 + em
  const isNextDay = endMins <= startMins
  if (isNextDay) endMins += 24 * 60
  const durationMins = endMins - startMins
  const isValid = durationMins > 0 && durationMins <= 12 * 60

  const endDate = new Date(`${date}T00:00:00`)
  if (isNextDay) endDate.setDate(endDate.getDate() + 1)
  const endDateStr = endDate.toISOString().slice(0, 10)

  const hrs = Math.floor(durationMins / 60)
  const mins = durationMins % 60
  const label = hrs > 0 ? `${hrs}h${mins > 0 ? mins + 'm' : ''}` : `${mins}m`

  return { endDateStr, durationMins, isNextDay, isValid, label }
}

function formatDisplayDate(dateStr: string) {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' })
}

const LEVEL_GROUPS = [
  { label: 'Mới chơi',      levels: ['yeu_minus', 'yeu', 'yeu_plus'] as SkillLevel[] },
  { label: 'Trung bình yếu',levels: ['tby_minus', 'tby', 'tby_plus'] as SkillLevel[] },
  { label: 'Trung bình',    levels: ['tb_minus',  'tb',  'tb_plus']  as SkillLevel[] },
  { label: 'Trung bình khá',levels: ['kha_minus', 'kha', 'kha_plus'] as SkillLevel[] },
  { label: 'Khá / Pro',     levels: ['gioi_minus','gioi','gioi_plus'] as SkillLevel[] },
]

const WEEKDAYS = [
  { value: 1, label: 'T2' },
  { value: 2, label: 'T3' },
  { value: 3, label: 'T4' },
  { value: 4, label: 'T5' },
  { value: 5, label: 'T6' },
  { value: 6, label: 'T7' },
  { value: 0, label: 'CN' },
]

export function EventForm({ defaultValues, onSubmit, onCancel, submitLabel = 'Đăng bài tuyển slot', loading, hideRepeat }: EventFormProps) {
  const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm<EventFormValues>({
    defaultValues: {
      title: '',
      description: '',
      location: '',
      latitude: null,
      longitude: null,
      event_date: '',
      event_time: '',
      event_end_time: '',
      total_slots: 4,
      skill_levels: [],
      repeat_enabled: false,
      repeat_days: [],
      repeat_until: '',
      price_enabled: false,
      price_min: null,
      price_max: null,
      split_evenly: false,
      ...defaultValues,
    },
  })

  const eventDate     = watch('event_date')
  const startTime     = watch('event_time')
  const endTime       = watch('event_end_time')
  const lat           = watch('latitude')
  const location      = watch('location')
  const longitude     = watch('longitude')
  const skillLevels   = watch('skill_levels')
  const repeatEnabled = watch('repeat_enabled')
  const repeatDays    = watch('repeat_days')
  const repeatUntil   = watch('repeat_until')
  const priceEnabled  = watch('price_enabled')
  const priceMin      = watch('price_min')
  const priceMax      = watch('price_max')
  const splitEvenly   = watch('split_evenly')
  const totalSlots    = watch('total_slots')

  const endInfo = computeEndInfo(eventDate, startTime, endTime)
  const isEndTimeInvalid = endInfo !== null && !endInfo.isValid

  function handleStartTimeChange(val: string) {
    setValue('event_time', val)
    if (!endTime) {
      const [h, m] = val.split(':').map(Number)
      const newH = (h + 2) % 24
      setValue('event_end_time', `${String(newH).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
    }
  }

  function toggleGroup(levels: SkillLevel[]) {
    const current = skillLevels ?? []
    const allSelected = levels.every(l => current.includes(l))
    if (allSelected) {
      setValue('skill_levels', current.filter(l => !levels.includes(l)))
    } else {
      const merged = [...current]
      levels.forEach(l => { if (!merged.includes(l)) merged.push(l) })
      setValue('skill_levels', merged)
    }
  }

  function toggleRepeatDay(day: number) {
    const current = repeatDays ?? []
    setValue('repeat_days', current.includes(day)
      ? current.filter(d => d !== day)
      : [...current, day]
    )
  }

  function countRepeatDates(): number {
    if (!repeatEnabled || !eventDate || repeatDays.length === 0 || !repeatUntil) return 1
    let count = 0
    const start = new Date(eventDate + 'T00:00:00')
    const end   = new Date(repeatUntil + 'T00:00:00')
    if (end < start) return 1
    const cur = new Date(start)
    while (cur <= end) {
      if (repeatDays.includes(cur.getDay())) count++
      cur.setDate(cur.getDate() + 1)
    }
    return Math.max(count, 1)
  }

  const repeatCount = countRepeatDates()

  const cardClass = 'bg-white border border-[#E5E7EB] rounded-2xl p-5 flex flex-col gap-4'
  const cardHeadClass = 'flex items-center gap-2 text-[#0052CC] font-semibold text-sm'

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5 pb-24 sm:pb-28">
      <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-5 items-start">

        {/* ── LEFT ── */}
        <div className="flex flex-col gap-5 lg:sticky lg:top-20">

          {/* Thông tin cơ bản */}
          <div className={cardClass}>
            <p className={cardHeadClass}><Info size={16} /> Thông tin cơ bản</p>

            <Input
              label="Tên buổi giao lưu"
              id="title"
              placeholder="VD: Giao lưu cầu lông tối Thứ 4"
              error={errors.title?.message}
              {...register('title', { required: 'Vui lòng nhập tên' })}
            />

            <Controller
              control={control}
              name="location"
              rules={{ required: 'Vui lòng chọn địa điểm' }}
              render={() => (
                <CourtPicker
                  value={location}
                  latitude={lat}
                  longitude={longitude}
                  onChange={vals => {
                    setValue('location', vals.location)
                    setValue('latitude', vals.latitude)
                    setValue('longitude', vals.longitude)
                  }}
                  error={errors.location?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="description"
              render={({ field }) => (
                <RichTextEditor
                  label="Mô tả chi tiết"
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Quy định, level yêu cầu, ghi chú thêm…"
                  minHeight={280}
                />
              )}
            />
          </div>
        </div>

        {/* ── RIGHT ── */}
        <div className="flex flex-col gap-5">

          {/* Thời gian */}
          <div className={cardClass}>
            <p className={cardHeadClass}><CalendarDays size={16} /> Thời gian</p>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-[#6B7280]">Ngày diễn ra</label>
              <Controller
                control={control}
                name="event_date"
                rules={{ required: true }}
                render={({ field }) => (
                  <DatePicker id="event_date" value={field.value} onChange={field.onChange} />
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Controller
                control={control}
                name="event_time"
                rules={{ required: true }}
                render={({ field }) => (
                  <TimePicker
                    label="Bắt đầu"
                    id="event_time"
                    value={field.value}
                    selectedDate={eventDate}
                    onChange={val => handleStartTimeChange(val)}
                  />
                )}
              />
              <Controller
                control={control}
                name="event_end_time"
                render={({ field }) => (
                  <TimePicker
                    label="Kết thúc"
                    id="event_end_time"
                    value={field.value}
                    onChange={field.onChange}
                    error={isEndTimeInvalid ? ' ' : undefined}
                  />
                )}
              />
            </div>

            {endInfo && startTime && endTime && (
              <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium ${
                endInfo.isValid
                  ? endInfo.isNextDay
                    ? 'bg-amber-50 border border-amber-200 text-amber-700'
                    : 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                  : 'bg-red-50 border border-red-200 text-red-600'
              }`}>
                {endInfo.isValid ? (
                  <>
                    <Clock size={12} />
                    <span>
                      Thời lượng: <strong>{endInfo.label}</strong>
                      {endInfo.isNextDay && eventDate && (
                        <span className="ml-1">• Kết thúc ngày hôm sau ({formatDisplayDate(endInfo.endDateStr)})</span>
                      )}
                    </span>
                  </>
                ) : (
                  <>
                    <AlertCircle size={12} />
                    <span>{endInfo.durationMins > 12 * 60 ? 'Tối đa 12 tiếng' : 'Giờ kết thúc không hợp lệ'}</span>
                  </>
                )}
              </div>
            )}

            {(errors.event_date || errors.event_time) && (
              <p className="text-xs text-[#EF4444]">Vui lòng chọn ngày và giờ bắt đầu</p>
            )}

            {/* Lặp lại */}
            {!hideRepeat && (
              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={() => setValue('repeat_enabled', !repeatEnabled)}
                  className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border text-sm font-medium transition-colors ${
                    repeatEnabled
                      ? 'bg-[#EFF6FF] border-[#0052CC] text-[#0052CC]'
                      : 'bg-[#F9FAFB] border-[#E5E7EB] text-[#6B7280] hover:border-[#9CA3AF]'
                  }`}
                >
                  <Repeat2 size={16} />
                  Lặp lại hàng tuần
                  <span className="ml-auto"><Toggle checked={repeatEnabled} onChange={v => setValue('repeat_enabled', v)} /></span>
                </button>

                {repeatEnabled && (
                  <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl p-4 flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                      <p className="text-xs font-medium text-[#6B7280] uppercase tracking-wide">Các thứ lặp lại</p>
                      <div className="flex gap-2">
                        {WEEKDAYS.map(({ value, label }) => {
                          const active = (repeatDays ?? []).includes(value)
                          return (
                            <button
                              key={value}
                              type="button"
                              onClick={() => toggleRepeatDay(value)}
                              className={`w-10 h-10 rounded-xl text-xs font-semibold border transition-colors ${
                                active
                                  ? 'bg-[#0052CC] border-[#0052CC] text-white'
                                  : 'bg-white border-[#D1D5DB] text-[#4B5563] hover:border-[#0052CC] hover:text-[#0052CC]'
                              }`}
                            >
                              {label}
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    <Controller
                      control={control}
                      name="repeat_until"
                      render={({ field }) => (
                        <DatePicker
                          label="Lặp đến ngày"
                          value={field.value}
                          onChange={field.onChange}
                          disablePast
                        />
                      )}
                    />

                    {repeatDays.length > 0 && repeatUntil && (
                      <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-700 font-medium">
                        <Repeat2 size={12} />
                        Sẽ tạo <strong>{repeatCount}</strong> buổi
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Tuyển quân */}
          <div className={cardClass}>
            <p className={cardHeadClass}><Users size={16} /> Tuyển quân</p>

            {/* Slot stepper */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-[#6B7280]">Số lượng slot cần tuyển</label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setValue('total_slots', Math.max(1, totalSlots - 1))}
                  className="w-10 h-10 rounded-xl border border-[#E5E7EB] bg-white text-[#374151] text-lg font-semibold hover:border-[#0052CC] hover:text-[#0052CC] transition-colors"
                >
                  -
                </button>
                <span className="w-12 text-center text-lg font-bold text-[#1F2937]">{totalSlots}</span>
                <button
                  type="button"
                  onClick={() => setValue('total_slots', Math.min(100, totalSlots + 1))}
                  className="w-10 h-10 rounded-xl border border-[#E5E7EB] bg-white text-[#374151] text-lg font-semibold hover:border-[#0052CC] hover:text-[#0052CC] transition-colors"
                >
                  +
                </button>
                <span className="text-sm text-[#9CA3AF]">Người</span>
              </div>
            </div>

            {/* Skill level groups */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium text-[#6B7280]">Trình độ yêu cầu</label>
              <div className="flex flex-wrap gap-2">
                {LEVEL_GROUPS.map(group => {
                  const allSelected = group.levels.every(l => (skillLevels ?? []).includes(l))
                  const someSelected = group.levels.some(l => (skillLevels ?? []).includes(l))
                  return (
                    <button
                      key={group.label}
                      type="button"
                      onClick={() => toggleGroup(group.levels)}
                      className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                        allSelected
                          ? 'bg-[#0052CC] border-[#0052CC] text-white'
                          : someSelected
                            ? 'bg-[#EFF6FF] border-[#0052CC] text-[#0052CC]'
                            : 'bg-white border-[#D1D5DB] text-[#4B5563] hover:border-[#0052CC] hover:text-[#0052CC]'
                      }`}
                    >
                      {group.label}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Chi phí */}
          <div className={cardClass}>
            <p className={cardHeadClass}><Wallet size={16} /> Chi phí</p>

            {/* Toggle */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#374151]">Có thu phí tham gia</span>
              <Toggle checked={priceEnabled} onChange={v => setValue('price_enabled', v)} />
            </div>

            {priceEnabled && (
              <>
                {/* Price range inputs */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-[#6B7280]">Giá dự kiến (VNĐ/người)</label>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="relative">
                      <NumericFormat
                        thousandSeparator="."
                        decimalSeparator=","
                        allowNegative={false}
                        placeholder="0"
                        disabled={splitEvenly}
                        value={priceMin ?? ''}
                        onValueChange={v => setValue('price_min', v.floatValue ?? null)}
                        className={`w-full text-sm border rounded-xl px-3 py-2.5 pr-12 focus:outline-none focus:border-[#0052CC] focus:ring-2 focus:ring-[#0052CC]/20 transition-colors ${
                          splitEvenly ? 'bg-[#F3F4F6] border-[#E5E7EB] text-[#9CA3AF] cursor-not-allowed' : 'bg-white border-[#E5E7EB]'
                        }`}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#9CA3AF]">MIN</span>
                    </div>
                    <div className="relative">
                      <NumericFormat
                        thousandSeparator="."
                        decimalSeparator=","
                        allowNegative={false}
                        placeholder="0"
                        disabled={splitEvenly}
                        value={priceMax ?? ''}
                        onValueChange={v => setValue('price_max', v.floatValue ?? null)}
                        className={`w-full text-sm border rounded-xl px-3 py-2.5 pr-12 focus:outline-none focus:border-[#0052CC] focus:ring-2 focus:ring-[#0052CC]/20 transition-colors ${
                          splitEvenly ? 'bg-[#F3F4F6] border-[#E5E7EB] text-[#9CA3AF] cursor-not-allowed' : 'bg-white border-[#E5E7EB]'
                        }`}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#9CA3AF]">MAX</span>
                    </div>
                  </div>
                </div>

                {/* Split evenly */}
                <label className={`flex items-start gap-3 p-3 rounded-xl border transition-colors cursor-pointer ${
                  splitEvenly ? 'border-[#0052CC] bg-[#EFF6FF]' : 'border-[#E5E7EB] bg-[#F9FAFB] hover:border-[#0052CC]'
                }`}>
                  <input
                    type="checkbox"
                    className="mt-0.5 w-4 h-4 accent-[#0052CC] flex-shrink-0"
                    checked={splitEvenly}
                    onChange={e => setValue('split_evenly', e.target.checked)}
                  />
                  <div>
                    <p className={`text-sm font-medium ${splitEvenly ? 'text-[#0052CC]' : 'text-[#374151]'}`}>Chia đều chi phí sân</p>
                    <p className="text-xs text-[#9CA3AF] mt-0.5">Giá sẽ tự động tính dựa trên tổng tiền sân và số người</p>
                  </div>
                </label>

                {splitEvenly && (priceMin != null || priceMax != null) && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 font-medium">
                    <Wallet size={12} />
                    <span>
                      Mỗi người:{' '}
                      {priceMin != null && priceMax != null && priceMin !== priceMax
                        ? <><strong>{priceMin.toLocaleString('vi-VN')}</strong> – <strong>{priceMax.toLocaleString('vi-VN')}</strong> VNĐ</>
                        : <><strong>{(priceMax ?? priceMin ?? 0).toLocaleString('vi-VN')}</strong> VNĐ</>
                      }
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#E5E7EB] px-4 py-3 flex gap-3">
        {onCancel && (
          <Button type="button" variant="secondary" size="lg" className="flex-1" onClick={onCancel}>
            Hủy bỏ
          </Button>
        )}
        <Button type="submit" size="lg" className={onCancel ? 'flex-1' : 'w-full'} loading={loading}>
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}
