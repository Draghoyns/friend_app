import type { Tag } from '@/types'

interface Props {
  tag:      Tag
  active?:  boolean
  count?:   number
  onClick?: () => void
}

export default function TagChip({ tag, active = true, count, onClick }: Props) {
  const style = active
    ? { backgroundColor: `${tag.color}22`, color: tag.color, borderColor: `${tag.color}66` }
    : { borderColor: '#334155', color: '#94a3b8' }
  const className = 'inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] font-medium shrink-0'
  if (!onClick) return <span className={className} style={style}>{tag.name}{count !== undefined && <span className="opacity-60">{count}</span>}</span>
  return (
    <button type="button" onClick={onClick} className={`${className} transition-colors`} style={style}>
      {tag.name}{count !== undefined && <span className="opacity-60">{count}</span>}
    </button>
  )
}
