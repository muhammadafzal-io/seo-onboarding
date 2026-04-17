interface StatsCardProps {
  label: string
  value: string | number
  change?: string
  trendIcon?: string
  color?: string
}

export default function StatsCard({ label, value, change, trendIcon = '▲', color = '#10a37f' }: StatsCardProps) {
  return (
    <div style={{ animationDelay: '0s' } as any} className="kpi">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontSize: 11, color: 'var(--t2)', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {label}
        </span>
        <div style={{ 
          width: 28, height: 28, borderRadius: 7, 
          background: color === '#10a37f' ? '#0d2e26' : color === '#4ade80' ? '#1a2e1a' : '#1a1a2e', 
          color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 
        }}>
          📊
        </div>
      </div>
      <div style={{ fontSize: 30, fontWeight: 600, color: 'var(--t1)', letterSpacing: '-0.04em', lineHeight: 1 }}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </div>
      {change && (
        <div style={{ 
          fontSize: 11, 
          color: trendIcon === '▼' ? '#f87171' : '#10a37f', 
          marginTop: 5, 
          display: 'flex', alignItems: 'center', gap: 4 
        }}>
          {trendIcon} {change}
        </div>
      )}
    </div>
  )
}
