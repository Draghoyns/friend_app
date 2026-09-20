import { useRef, useState } from 'react'
import {
  Bell, BellOff, Check, Download, Eye, EyeOff, Gauge, Moon, Plus, Sun, Trash2, Upload, X,
} from 'lucide-react'
import { useStore } from '@/store/useStore'
import { humanDuration } from '@/lib/dates'
import { useNotificationPermission, cancelWeeklyNudge, scheduleWeeklyNudge } from '@/hooks/useLocalNotifications'

import { PALETTE } from '@/lib/scoring'

const ACCENTS = PALETTE.slice(0, 6)
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function Sidebar() {
  const s = useStore()
  const { granted, loading, request, isNative } = useNotificationPermission()
  const fileRef = useRef<HTMLInputElement>(null)
  const [editingTag, setEditingTag]   = useState<string | null>(null)
  const [newTagName, setNewTagName]   = useState('')
  const [editingKind, setEditingKind] = useState<string | null>(null)
  const [newKindName, setNewKindName] = useState('')
  const [message, setMessage] = useState('')

  async function toggleNotifications() {
    if (s.notificationsEnabled) {
      s.setNotificationsEnabled(false)
      await cancelWeeklyNudge()
      return
    }
    if (!granted && isNative) {
      const ok = await request()
      if (!ok) { setMessage('Notification permission denied.'); return }
    }
    s.setNotificationsEnabled(true)
    await scheduleWeeklyNudge(s.notificationWeekday, s.notificationHour, s.notificationMinute, s.friends, s.tiers)
  }

  function exportJson() {
    const blob = new Blob([s.exportData()], { type: 'application/json' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url
    a.download = `orbit-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  function importJson(file: File) {
    file.text()
      .then(text => { s.importData(text); setMessage('Backup imported.') })
      .catch(e => setMessage(`Import failed: ${e.message}`))
  }

  return (
    <div className="fixed inset-0 z-50 flex" onClick={() => s.setSidebarOpen(false)}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <aside
        className="relative w-80 max-w-[85vw] h-full bg-slate-900 border-r border-slate-800 overflow-y-auto p-4 space-y-5"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Settings</h2>
          <button onClick={() => s.setSidebarOpen(false)} className="btn-ghost !p-1.5"><X size={18} /></button>
        </div>

        {/* ── Friendship levels ─────────────────────────────────────────── */}
        <section>
          <h3 className="text-[11px] uppercase tracking-wider text-slate-500 mb-2">Friendship levels</h3>
          <div className="space-y-1">
            {s.tiers.map(t => (
              <div key={t.id} className="flex items-center gap-2 px-2 py-1">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: t.color }} />
                <span className="text-sm flex-1 truncate">{t.name}</span>
                <span className="text-[11px] text-slate-500">{humanDuration(t.intervalDays)}</span>
                <span className="text-[11px] text-slate-600 w-5 text-right">
                  {s.friends.filter(f => f.tierId === t.id).length}
                </span>
              </div>
            ))}
          </div>
          <button
            onClick={() => { s.setActiveTab('levels'); s.setSidebarOpen(false) }}
            className="btn-ghost w-full justify-center mt-2"
          >
            <Gauge size={15} /> Edit levels &amp; rhythm
          </button>
        </section>

        {/* ── Circles ───────────────────────────────────────────────────── */}
        <section>
          <h3 className="text-[11px] uppercase tracking-wider text-slate-500 mb-2">Circles</h3>
          <div className="space-y-1.5">
            {s.tags.map(t => {
              const count = s.friends.filter(f => f.tagIds.includes(t.id)).length
              return editingTag === t.id ? (
                <div key={t.id} className="bg-slate-800 rounded-lg p-2 space-y-2">
                  <input
                    value={t.name}
                    onChange={e => s.updateTag(t.id, { name: e.target.value })}
                    className="input !py-1 !text-xs"
                  />
                  <div className="flex items-center gap-1.5">
                    {PALETTE.map(c => (
                      <button
                        key={c}
                        onClick={() => s.updateTag(t.id, { color: c })}
                        className="w-5 h-5 rounded-full border border-slate-600"
                        style={{ backgroundColor: c }}
                      />
                    ))}
                    <button onClick={() => setEditingTag(null)} className="btn-ghost !p-1 ml-auto">
                      <Check size={14} />
                    </button>
                  </div>
                  <button
                    onClick={() => { s.deleteTag(t.id); setEditingTag(null) }}
                    className="text-[11px] text-rose-400 flex items-center gap-1"
                  >
                    <Trash2 size={11} /> Delete circle (removed from {count} friends)
                  </button>
                </div>
              ) : (
                <button
                  key={t.id}
                  onClick={() => setEditingTag(t.id)}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-800 transition-colors text-left"
                >
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: t.color }} />
                  <span className="text-sm flex-1 truncate">{t.name}</span>
                  <span className="text-[11px] text-slate-600 w-5 text-right">{count}</span>
                </button>
              )
            })}
            {!s.tags.length && (
              <p className="text-[11px] text-slate-500 px-2">
                Group friends by context — work, climbing, school.
              </p>
            )}
          </div>
          <div className="flex items-center gap-1.5 mt-2">
            <input
              value={newTagName}
              onChange={e => setNewTagName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { s.createTag(newTagName); setNewTagName('') } }}
              placeholder="New circle"
              className="input !py-1 !text-xs"
            />
            <button
              onClick={() => { s.createTag(newTagName); setNewTagName('') }}
              className="btn-ghost !p-1.5"
            >
              <Plus size={15} />
            </button>
          </div>
        </section>

        {/* ── Kinds of hangout ──────────────────────────────────────────── */}
        <section>
          <h3 className="text-[11px] uppercase tracking-wider text-slate-500 mb-2">Kinds of hangout</h3>
          <div className="space-y-1.5">
            {s.kinds.map(k => {
              const count = s.friends.reduce(
                (n, f) => n + f.meetups.filter(m => m.kindIds?.includes(k.id)).length, 0,
              )
              return editingKind === k.id ? (
                <div key={k.id} className="bg-slate-800 rounded-lg p-2 space-y-2">
                  <input
                    value={k.name}
                    onChange={e => s.updateKind(k.id, { name: e.target.value })}
                    className="input !py-1 !text-xs"
                  />
                  <div className="flex items-center gap-1.5">
                    {PALETTE.map(c => (
                      <button
                        key={c}
                        onClick={() => s.updateKind(k.id, { color: c })}
                        className="w-5 h-5 rounded-full border border-slate-600"
                        style={{ backgroundColor: c }}
                      />
                    ))}
                    <button onClick={() => setEditingKind(null)} className="btn-ghost !p-1 ml-auto">
                      <Check size={14} />
                    </button>
                  </div>
                  <button
                    onClick={() => { s.deleteKind(k.id); setEditingKind(null) }}
                    className="text-[11px] text-rose-400 flex items-center gap-1"
                  >
                    <Trash2 size={11} /> Delete kind (removed from {count} meetups)
                  </button>
                </div>
              ) : (
                <button
                  key={k.id}
                  onClick={() => setEditingKind(k.id)}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-800 transition-colors text-left"
                >
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: k.color }} />
                  <span className="text-sm flex-1 truncate">{k.name}</span>
                  <span className="text-[11px] text-slate-600 w-5 text-right">{count}</span>
                </button>
              )
            })}
            {!s.kinds.length && (
              <p className="text-[11px] text-slate-500 px-2">
                What the hangout actually was — dinner, coffee, a walk, a call.
              </p>
            )}
          </div>
          <div className="flex items-center gap-1.5 mt-2">
            <input
              value={newKindName}
              onChange={e => setNewKindName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { s.createKind(newKindName); setNewKindName('') } }}
              placeholder="New kind"
              className="input !py-1 !text-xs"
            />
            <button
              onClick={() => { s.createKind(newKindName); setNewKindName('') }}
              className="btn-ghost !p-1.5"
            >
              <Plus size={15} />
            </button>
          </div>
        </section>

        {/* ── Reminder ──────────────────────────────────────────────────── */}
        <section>
          <h3 className="text-[11px] uppercase tracking-wider text-slate-500 mb-2">Weekly nudge</h3>
          <button
            onClick={toggleNotifications}
            disabled={loading}
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            {s.notificationsEnabled ? <Bell size={15} style={{ color: 'var(--accent)' }} /> : <BellOff size={15} className="text-slate-500" />}
            <span className="text-sm flex-1 text-left">{s.notificationsEnabled ? 'On' : 'Off'}</span>
          </button>
          {s.notificationsEnabled && (
            <div className="mt-2 space-y-2">
              <div className="flex flex-wrap gap-1">
                {WEEKDAYS.map((d, i) => (
                  <button
                    key={d}
                    onClick={() => {
                      s.setNotificationWeekday(i)
                      scheduleWeeklyNudge(i, s.notificationHour, s.notificationMinute, s.friends, s.tiers)
                    }}
                    className={`px-1.5 py-0.5 rounded text-[11px] border transition-colors ${
                      s.notificationWeekday === i ? 'text-slate-100 border-slate-400' : 'text-slate-500 border-slate-700'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
              <input
                type="time"
                value={`${String(s.notificationHour).padStart(2, '0')}:${String(s.notificationMinute).padStart(2, '0')}`}
                onChange={e => {
                  const [h, m] = e.target.value.split(':').map(Number)
                  s.setNotificationTime(h, m)
                  scheduleWeeklyNudge(s.notificationWeekday, h, m, s.friends, s.tiers)
                }}
                className="input !py-1 !text-xs"
              />
              {!isNative && <p className="text-[11px] text-slate-500">Notifications only fire on the phone build.</p>}
            </div>
          )}
        </section>

        {/* ── Appearance ────────────────────────────────────────────────── */}
        <section>
          <h3 className="text-[11px] uppercase tracking-wider text-slate-500 mb-2">Appearance</h3>
          <div className="flex items-center gap-1.5 mb-2">
            <button
              onClick={() => s.setTheme('dark')}
              className={`btn-ghost flex-1 justify-center ${s.theme === 'dark' ? 'bg-slate-800 !text-slate-100' : ''}`}
            >
              <Moon size={15} /> Dark
            </button>
            <button
              onClick={() => s.setTheme('light')}
              className={`btn-ghost flex-1 justify-center ${s.theme === 'light' ? 'bg-slate-800 !text-slate-100' : ''}`}
            >
              <Sun size={15} /> Light
            </button>
          </div>
          <div className="flex items-center gap-2">
            {ACCENTS.map(c => (
              <button
                key={c}
                onClick={() => s.setAccentColor(c)}
                className={`w-6 h-6 rounded-full transition-transform ${s.accentColor === c ? 'scale-110 ring-2 ring-slate-300' : ''}`}
                style={{ backgroundColor: c }}
              />
            ))}
            <input
              type="color" value={s.accentColor} onChange={e => s.setAccentColor(e.target.value)}
              className="w-6 h-6 rounded-full bg-transparent border-0 cursor-pointer"
              title="Custom color"
            />
          </div>
        </section>

        {/* ── Data ──────────────────────────────────────────────────────── */}
        <section>
          <h3 className="text-[11px] uppercase tracking-wider text-slate-500 mb-2">Data</h3>
          <button
            onClick={() => s.setShowPaused(!s.showPaused)}
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-800 transition-colors text-sm"
          >
            {s.showPaused ? <Eye size={15} /> : <EyeOff size={15} className="text-slate-500" />}
            <span className="flex-1 text-left">Show paused friends</span>
          </button>
          <div className="flex items-center gap-1.5 mt-2">
            <button onClick={exportJson} className="btn-ghost flex-1 justify-center"><Download size={15} /> Export</button>
            <button onClick={() => fileRef.current?.click()} className="btn-ghost flex-1 justify-center"><Upload size={15} /> Import</button>
            <input
              ref={fileRef} type="file" accept="application/json" className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) importJson(f); e.target.value = '' }}
            />
          </div>
          {message && <p className="text-[11px] text-slate-400 mt-2">{message}</p>}
        </section>

        <p className="text-[10px] text-slate-600 pt-2">
          Orbit keeps everything on this device. No account, no server.
        </p>
      </aside>
    </div>
  )
}
