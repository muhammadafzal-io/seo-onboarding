interface BarSlice {
  device: string
  sessions: number
}

interface BarChartProps {
  data: BarSlice[]
}

export default function BarChart({ data }: BarChartProps) {
  // Handle empty or missing data
  if (!data || data.length === 0) {
    return (
      <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--t3)', fontSize: 13 }}>
        No data
      </div>
    )
  }

  // Find max value to calculate percentages (fallback to 1 to avoid division by zero)
  const maxSessions = Math.max(...data.map(d => d.sessions)) || 1

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {data.map((item, i) => {
        // Calculate percentage relative to the highest value in the set
        const pct = (item.sessions / maxSessions) * 100
        
        return (
          <div key={i}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {/* Device Label */}
              <div style={{ 
                fontSize: 11, 
                color: 'var(--t2)', 
                fontFamily: 'var(--mono)', 
                width: 75, 
                textTransform: 'capitalize',
                flexShrink: 0 
              }}>
                {item.device}
              </div>

              {/* Bar Track */}
              <div style={{ 
                flex: 1, 
                height: 8, 
                background: '#2a2a2a', 
                borderRadius: 4, 
                overflow: 'hidden',
                position: 'relative'
              }}>
                {/* Active Bar Fill */}
                <div style={{ 
                  height: '100%', 
                  width: `${Math.min(pct, 100)}%`, 
                  background: 'var(--acc, #10a37f)', 
                  borderRadius: 4, 
                  transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: '0 0 8px rgba(16, 163, 127, 0.2)'
                }} />
              </div>

              {/* Value Label */}
              <div style={{ 
                fontSize: 11, 
                color: 'var(--t1)', 
                fontFamily: 'var(--mono)', 
                width: 45, 
                textAlign: 'right',
                flexShrink: 0 
              }}>
                {item.sessions.toLocaleString()}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}