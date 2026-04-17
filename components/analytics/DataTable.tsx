interface DataTableProps {
  data: Array<Record<string, string | number>>
  columns: string[]
}

export default function DataTable({ data, columns }: DataTableProps) {
  if (!data || data.length === 0) {
    return <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--t3)', fontSize: 13 }}>No data</div>
  }

  // Helper to determine if a column should be left-aligned
  const isLeftAligned = (col: string) => 
    ['page', 'keyword', 'country', 'landingPagePath', 'device'].includes(col.toLowerCase());

  return (
    <div style={{ maxHeight: 300, overflowY: 'auto' }}>
      {/* Fix for hover effect since inline styles don't support pseudo-selectors */}
      <style>{`
        .table-row { transition: background 0.1s; }
        .table-row:hover { background: rgba(255,255,255,0.03); }
      `}</style>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border2)' }}>
            {columns.map(col => (
              <th key={col} style={{ 
                padding: '12px 0 8px 0', 
                textAlign: isLeftAligned(col) ? 'left' : 'right', 
                fontSize: 11, 
                color: 'var(--t3)', 
                fontFamily: 'var(--mono)', 
                fontWeight: 500, 
                textTransform: 'capitalize'
              }}>
                {col.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} className="table-row" style={{ borderBottom: '1px solid var(--border2)' }}>
              {columns.map(col => {
                const rawValue = row[col];
                // ✅ FIXED: Convert to string safely to handle .slice()
                const stringValue = String(rawValue ?? '');
                const isLongText = col === 'page' || col === 'keyword';

                return (
                  <td key={col} style={{ 
                    padding: '10px 0', 
                    textAlign: isLeftAligned(col) ? 'left' : 'right',
                    fontSize: 12, 
                    color: isLongText ? 'var(--t1)' : 'var(--t2)',
                    fontFamily: isLongText ? 'var(--sans)' : 'var(--mono)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {col === 'page' && stringValue.length > 40 
                      ? `${stringValue.slice(0, 40)}...` 
                      : rawValue?.toLocaleString() /* Formats numbers with commas */}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}