import type { Tier } from '@/types'
import { humanDuration } from '@/lib/dates'

export default function TierBadge({ tier, interval }: { tier?: Tier; interval?: number }) {
  if (!tier) return null
  return (
    <span
      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium"
      style={{ backgroundColor: `${tier.color}22`, color: tier.color }}
    >
      {tier.name}
      {interval !== undefined && <span className="opacity-70">· {humanDuration(interval)}</span>}
    </span>
  )
}
