export default function Logo({ size = 'md', dark = false }) {
  const scales = { sm: 0.75, md: 1, lg: 1.3 }
  const s = scales[size] || 1

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 * s }}>
      {/* Mark — logo1.svg */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        {!dark && (
          <div style={{
            position: 'absolute', inset: -4,
            borderRadius: 14 * s,
            background: 'radial-gradient(circle, rgba(37,99,235,0.22) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />
        )}
        <img
          src="/logo1.svg"
          alt="Valorix"
          style={{
            width: 36 * s,
            height: 36 * s,
            borderRadius: 8 * s,
            display: 'block',
            boxShadow: dark ? 'none' : `0 4px 16px rgba(37,99,235,0.3)`,
            opacity: dark ? 0.85 : 1,
          }}
        />
      </div>

      {/* Wordmark */}
      <div style={{ display: 'flex', alignItems: 'baseline' }}>
        <span style={{
          fontWeight: 800,
          fontSize: 18 * s,
          color: dark ? 'rgba(255,255,255,0.9)' : '#1a1a2e',
          letterSpacing: -0.8,
          lineHeight: 1,
        }}>
          valorix
        </span>
        <span style={{
          fontWeight: 900,
          fontSize: 11 * s,
          background: dark
            ? 'linear-gradient(135deg, #00cfff, #7b5ea7)'
            : 'linear-gradient(135deg, #00cfff, #7b5ea7)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          letterSpacing: 0.5,
          marginLeft: 2 * s,
          lineHeight: 1,
          alignSelf: 'flex-start',
          marginTop: 2 * s,
        }}>
          AI
        </span>
      </div>
    </div>
  )
}
