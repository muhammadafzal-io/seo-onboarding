const configs = {
  published:  { bg:'#0d2e26', color:'#10a37f' },
  approved:   { bg:'#1a2e1a', color:'#4ade80' },
  written:    { bg:'#1a1a2e', color:'#a78bfa' },
  processing: { bg:'#2a1f0a', color:'#f59e0b' },
  scouted:    { bg:'#0f1e2e', color:'#60a5fa' },
  researched: { bg:'#2a1f0a', color:'#f59e0b' },
  used:       { bg:'#0d2e26', color:'#10a37f' },
  failed:     { bg:'#2a1515', color:'#f87171' },
  primary:    { bg:'#0d2e26', color:'#10a37f' },
  secondary:  { bg:'#2a2a2a', color:'#6b6b7b' },
  active:     { bg:'#0d2e26', color:'#10a37f' },
  default:    { bg:'#2a2a2a', color:'#8e8ea0' },
}
export default function Badge({ status }: { status: string }) {
  const key = status.toLowerCase() as keyof typeof configs
  const cfg  = configs[key] || configs.default
  return (
    <span style={{
      display:'inline-flex', alignItems:'center',
      padding:'2px 8px', borderRadius:5,
      fontSize:11, fontWeight:500, fontFamily:'var(--mono)',
      background: cfg.bg, color: cfg.color,
    }}>
      {status}
    </span>
  )
}
