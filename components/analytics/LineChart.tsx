interface LineChartProps {
  data: Array<{ date: string; sessions: number }>
}

export default function LineChart({ data }: LineChartProps) {
  // Handle empty state
  if (!data || data.length === 0) {
    return (
      <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--t3)', fontSize: 13 }}>
        No data
      </div>
    )
  }

  // Configuration
  const width = 400
  const height = 200
  const padding = 20 // Reduced padding for better space usage
  const strokeWidth = 2

  // Find max Y and avoid division by zero
  const maxY = Math.max(...data.map(d => d.sessions), 1)
  
  // Calculate Points
  const points = data.map((d, i) => {
    // Avoid division by zero if there is only one data point
    const xDivider = data.length > 1 ? data.length - 1 : 1
    const x = padding + (i / xDivider) * (width - padding * 2)
    const y = height - padding - (d.sessions / maxY) * (height - padding * 2)
    return [x, y]
  })

  // ✅ FIXED: Corrected template literal syntax
  const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0]},${p[1]}`).join(' ')
  
  // Create Area Data (for the gradient fill under the line)
  const areaData = `${pathData} L ${points[points.length - 1][0]},${height - padding} L ${points[0][0]},${height - padding} Z`

  return (
    <div style={{ position: 'relative', width: '100%', height }}>
      <svg 
        viewBox={`0 0 ${width} ${height}`} 
        preserveAspectRatio="none"
        style={{ width: '100%', height: '100%', overflow: 'visible' }}
      >
        <defs>
          <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10a37f" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#10a37f" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Horizontal Grid Lines */}
        {[0, 0.25, 0.5, 0.75, 1].map(frac => {
          const y = padding + frac * (height - padding * 2)
          return (
            <line 
              key={frac} 
              x1={padding} 
              y1={y} 
              x2={width - padding} 
              y2={y} 
              stroke="var(--border2)" 
              strokeWidth={1} 
              strokeDasharray="4 4"
            />
          )
        })}
        
        {/* Area Fill */}
        <path d={areaData} fill="url(#lineGradient)" />

        {/* Main Line */}
        <path 
          d={pathData} 
          fill="none" 
          stroke="#10a37f" 
          strokeWidth={strokeWidth} 
          strokeLinecap="round" 
          strokeLinejoin="round" 
        />

        {/* Endpoint Dot */}
        <circle 
          cx={points[points.length - 1][0]} 
          cy={points[points.length - 1][1]} 
          r={3} 
          fill="#10a37f" 
          stroke="var(--card)" 
          strokeWidth={2}
        />
        
        {/* X-Axis line */}
        <line 
          x1={padding} 
          y1={height - padding} 
          x2={width - padding} 
          y2={height - padding} 
          stroke="var(--border)" 
          strokeWidth={1} 
        />
      </svg>
      
      {/* Labels */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        marginTop: 8, 
        padding: `0 ${padding}px`,
        fontSize: 10, 
        color: 'var(--t3)', 
        fontFamily: 'var(--mono)',
        textTransform: 'uppercase'
      }}>
        <span>{data[0].date}</span>
        <span>{data[data.length - 1].date}</span>
      </div>
    </div>
  )
}