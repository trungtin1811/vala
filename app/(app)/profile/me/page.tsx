'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { SkillLevelBadge } from '@/components/shared/SkillLevelBadge'
import { SKILL_LEVELS, SKILL_LEVEL_LABELS, type SkillLevel } from '@/types'
import { useQueryClient } from '@tanstack/react-query'

export default function MyProfilePage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const qc = useQueryClient()
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [form, setForm] = useState({ display_name: '', phone: '', bio: '', skill_level: '' })

  useEffect(() => {
    if (user) {
      setForm({
        display_name: user.display_name ?? '',
        phone: user.phone ?? '',
        bio: user.bio ?? '',
        skill_level: user.skill_level ?? '',
      })
    }
  }, [user])

  if (loading) return null
  if (!user) { router.push('/'); return null }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await supabase.from('users').update({
      display_name: form.display_name,
      phone: form.phone || null,
      bio: form.bio || null,
      skill_level: (form.skill_level as SkillLevel) || null,
    }).eq('id', user!.id)
    qc.invalidateQueries({ queryKey: ['user', user!.id] })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-bold text-[#1F2937] mb-6">Hồ Sơ Của Tôi</h1>

      <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 mb-6 flex items-center gap-4">
        {user.avatar_url ? (
          <img src={user.avatar_url} alt={user.display_name} className="w-16 h-16 rounded-full object-cover" />
        ) : (
          <div className="w-16 h-16 rounded-full bg-[#E8F3FF] flex items-center justify-center text-[#0052CC] font-bold text-xl">
            {user.display_name[0]?.toUpperCase()}
          </div>
        )}
        <div>
          <p className="font-semibold text-[#1F2937]">{user.display_name}</p>
          <p className="text-sm text-[#6B7280]">{user.email}</p>
          {user.skill_level && <div className="mt-1"><SkillLevelBadge level={user.skill_level} /></div>}
        </div>
      </div>

      <form onSubmit={handleSave} className="bg-white border border-[#E5E7EB] rounded-2xl p-6 flex flex-col gap-5">
        <Input
          label="Tên hiển thị *"
          id="display_name"
          value={form.display_name}
          onChange={e => setForm(f => ({ ...f, display_name: e.target.value }))}
          required
        />
        <Input
          label="Số điện thoại"
          id="phone"
          type="tel"
          placeholder="VD: 0901234567"
          value={form.phone}
          onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
        />
        <Select
          label="Trình độ cầu lông"
          id="skill_level"
          value={form.skill_level}
          onChange={e => setForm(f => ({ ...f, skill_level: e.target.value }))}
        >
          <option value="">Chưa chọn</option>
          {SKILL_LEVELS.map(l => <option key={l} value={l}>{SKILL_LEVEL_LABELS[l]}</option>)}
        </Select>
        <Textarea
          label="Giới thiệu bản thân"
          id="bio"
          rows={3}
          placeholder="Chia sẻ đôi điều về bạn..."
          value={form.bio}
          onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
        />

        <div className="flex items-center gap-3">
          <Button type="submit" loading={saving}>Lưu Thay Đổi</Button>
          {saved && <span className="text-sm text-emerald-600 font-medium">✓ Đã lưu!</span>}
        </div>
      </form>
    </div>
  )
}
