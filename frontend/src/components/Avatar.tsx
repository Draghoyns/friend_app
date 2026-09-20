import { initials } from '@/lib/scoring'

interface Props {
  name:  string
  size?: number
  /** Ring color — used to separate stacked avatars from the card behind them. */
  ring?: string
}

/** Initials on the accent color. Orbit keeps no photos. */
export default function Avatar({ name, size = 40, ring }: Props) {
  return (
    <div
      className="rounded-full shrink-0 flex items-center justify-center font-semibold text-slate-950 select-none"
      style={{
        width: size, height: size,
        ...(ring ? { boxShadow: `0 0 0 2px ${ring}` } : {}),
        backgroundColor: 'var(--accent)',
        fontSize: size * 0.38,
      }}
    >
      {initials(name) || '?'}
    </div>
  )
}
