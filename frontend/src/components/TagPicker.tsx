import { useState } from 'react'
import { Plus } from 'lucide-react'
import type { Tag } from '@/types'
import { useStore } from '@/store/useStore'
import TagChip from './TagChip'

interface Props {
  selected: string[]
  onToggle: (tagId: string) => void
  /** Which free-form vocabulary to pick from. */
  kind?:    'circle' | 'hangout'
}

const COPY = {
  circle:  { empty: 'No circles yet — create one below.', placeholder: 'climbing, work, school…' },
  hangout: { empty: 'No kinds yet — create one below.',   placeholder: 'dinner, coffee, walk…'   },
}

/** Toggle existing labels, or type a new one. Both vocabularies stay free-form. */
export default function TagPicker({ selected, onToggle, kind = 'circle' }: Props) {
  const { tags, kinds, createTag, createKind } = useStore()
  const [draft, setDraft] = useState('')

  const options = kind === 'circle' ? tags : kinds
  const create  = kind === 'circle' ? createTag : createKind
  const copy    = COPY[kind]

  function add() {
    const created: Tag | null = create(draft)
    if (!created) return
    if (!selected.includes(created.id)) onToggle(created.id)
    setDraft('')
  }

  return (
    <div>
      <div className="flex flex-wrap gap-1.5 mb-1.5">
        {options.map(t => (
          <TagChip key={t.id} tag={t} active={selected.includes(t.id)} onClick={() => onToggle(t.id)} />
        ))}
        {!options.length && <span className="text-[11px] text-slate-500">{copy.empty}</span>}
      </div>
      <div className="flex items-center gap-1.5">
        <input
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add() } }}
          placeholder={copy.placeholder}
          className="input !py-1 !text-xs"
        />
        <button type="button" onClick={add} disabled={!draft.trim()} className="btn-ghost !p-1.5 disabled:opacity-40">
          <Plus size={15} />
        </button>
      </div>
    </div>
  )
}
