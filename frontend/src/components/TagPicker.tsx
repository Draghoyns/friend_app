import { useState } from 'react'
import { Plus } from 'lucide-react'
import type { Tag } from '@/types'
import { useStore } from '@/store/useStore'
import TagChip from './TagChip'

interface Props {
  selected: string[]
  onToggle: (tagId: string) => void
}

/** Toggle existing circles, or type a new one. */
export default function TagPicker({ selected, onToggle }: Props) {
  const { tags, createTag } = useStore()
  const [draft, setDraft] = useState('')

  function add() {
    const tag: Tag | null = createTag(draft)
    if (!tag) return
    if (!selected.includes(tag.id)) onToggle(tag.id)
    setDraft('')
  }

  return (
    <div>
      <div className="flex flex-wrap gap-1.5 mb-1.5">
        {tags.map(t => (
          <TagChip key={t.id} tag={t} active={selected.includes(t.id)} onClick={() => onToggle(t.id)} />
        ))}
        {!tags.length && <span className="text-[11px] text-slate-500">No circles yet — create one below.</span>}
      </div>
      <div className="flex items-center gap-1.5">
        <input
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add() } }}
          placeholder="climbing, work, school…"
          className="input !py-1 !text-xs"
        />
        <button type="button" onClick={add} disabled={!draft.trim()} className="btn-ghost !p-1.5 disabled:opacity-40">
          <Plus size={15} />
        </button>
      </div>
    </div>
  )
}
