import { initials } from '@/lib/scoring'

interface Props {
  name:   string
  photo?: string
  size?:  number
  /** Ring color — used to show freshness at a glance. */
  ring?:  string
}

export default function Avatar({ name, photo, size = 40, ring }: Props) {
  const style = { width: size, height: size, ...(ring ? { boxShadow: `0 0 0 2px ${ring}` } : {}) }
  if (photo) {
    return <img src={photo} alt="" className="rounded-full object-cover shrink-0" style={style} />
  }
  return (
    <div
      className="rounded-full shrink-0 flex items-center justify-center font-semibold text-slate-950 select-none"
      style={{ ...style, backgroundColor: 'var(--accent)', fontSize: size * 0.38 }}
    >
      {initials(name) || '?'}
    </div>
  )
}
