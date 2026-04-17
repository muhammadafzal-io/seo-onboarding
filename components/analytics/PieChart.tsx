interface PieSlice {
  source: string
  sessions: number
}

interface PieChartProps {
  data: PieSlice[] | any
}
 
export default function PieChart({ data }: PieChartProps) {
  if (!data || data.length === 0) {
    return (
      <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--t3)', fontSize: 13 }}>
        No data
      </div>
    )
  }

  const total = data.reduce((sum, d) => sum + d.sessions, 0)
  const colors = ['#10a37f', '#4ade80', '#a78bfa', '#f59e0b', '#60a5fa']

  // Helper to calculate coordinates for SVG path
  const getCoordinatesForPercent = (percent: number) => {
    const x = Math.cos(2 * Math.PI * percent)
    const y = Math.sin(2 * Math.PI * percent)
    return [x, y]
  }

  let cumulativePercent = 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <svg 
        viewBox="-1 -1 2 2" 
        style={{ width: 120, height: 120, margin: '0 auto', transform: 'rotate(-90deg)', overflow: 'visible' }}
      >
        {data.slice(0, 5).map((slice, i) => {
          const [startX, startY] = getCoordinatesForPercent(cumulativePercent)
          const slicePercent = slice.sessions / total
          cumulativePercent += slicePercent
          const [endX, endY] = getCoordinatesForPercent(cumulativePercent)

          // If the slice is more than 50%, the large-arc-flag must be 1
          const largeArcFlag = slicePercent > 0.5 ? 1 : 0

          // Path: Move to center, Line to start, Arc to end, Close path
          const pathData = [
            `M 0 0`,
            `L ${startX} ${startY}`,
            `A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY}`,
            `L 0 0`,
          ].join(' ')

          return (
            <path
              key={i}
              d={pathData}
              fill={colors[i % colors.length]}
              stroke="#2f2f2f"
              strokeWidth="0.02"
            />
          )
        })}
      </svg>

      {/* Legend */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {data.slice(0, 4).map((d, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: colors[i % colors.length] }} />
              <span style={{ color: 'var(--t2)', fontFamily: 'var(--mono)', textTransform: 'capitalize' }}>
                {d.source.length > 15 ? d.source.slice(0, 15) + '...' : d.source}
              </span>
            </div>
            <span style={{ color: 'var(--t1)', fontFamily: 'var(--mono)', fontWeight: 500 }}>
              {Math.round((d.sessions / total) * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}