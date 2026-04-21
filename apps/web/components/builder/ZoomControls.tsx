'use client';

interface Props {
  zoom:     number;
  onChange: (zoom: number) => void;
  min?:     number;
  max?:     number;
  step?:    number;
}

export function ZoomControls({
  zoom,
  onChange,
  min  = 0.25,
  max  = 2.0,
  step = 0.25,
}: Props) {
  const pct        = Math.round(zoom * 100);
  const canZoomIn  = zoom < max;
  const canZoomOut = zoom > min;

  const zoomIn  = () => onChange(Math.min(max,  Math.round((zoom + step) * 100) / 100));
  const zoomOut = () => onChange(Math.max(min,  Math.round((zoom - step) * 100) / 100));
  const reset   = () => onChange(0.75);

  const btnBase: React.CSSProperties = {
    width:          28,
    height:         28,
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    border:         '1px solid var(--color-border)',
    borderRadius:   6,
    fontSize:       16,
    fontWeight:     500,
    lineHeight:     1,
    cursor:         'pointer',
    transition:     'background 0.15s, border-color 0.15s',
    flexShrink:     0,
    userSelect:     'none' as const,
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, userSelect: 'none' }}>
      {/* Zoom out */}
      <button
        type="button"
        onClick={zoomOut}
        disabled={!canZoomOut}
        title="Zoom out (Ctrl −)"
        style={{
          ...btnBase,
          background: canZoomOut ? 'var(--color-white)' : 'var(--color-bg-muted)',
          color:      canZoomOut ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
          cursor:     canZoomOut ? 'pointer' : 'not-allowed',
        }}
        onMouseEnter={(e) => {
          if (canZoomOut) (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--color-brand)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--color-border)';
        }}
      >
        −
      </button>

      {/* Percentage — click to reset */}
      <button
        type="button"
        onClick={reset}
        title="Reset zoom to 100% (Ctrl 0)"
        style={{
          minWidth:   48,
          height:     28,
          padding:    '0 6px',
          border:     '1px solid var(--color-border)',
          borderRadius: 6,
          background: zoom === 0.75 ? 'var(--color-bg-muted)' : 'var(--color-brand-light)',
          color:      zoom === 0.75 ? 'var(--color-text-secondary)' : 'var(--color-brand)',
          cursor:     'pointer',
          fontSize:   '0.72rem',
          fontWeight: 600,
          fontFamily: 'monospace',
          textAlign:  'center',
          transition: 'all 0.15s',
          flexShrink: 0,
          userSelect: 'none',
        }}
      >
        {pct}%
      </button>

      {/* Zoom in */}
      <button
        type="button"
        onClick={zoomIn}
        disabled={!canZoomIn}
        title="Zoom in (Ctrl =)"
        style={{
          ...btnBase,
          background: canZoomIn ? 'var(--color-white)' : 'var(--color-bg-muted)',
          color:      canZoomIn ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
          cursor:     canZoomIn ? 'pointer' : 'not-allowed',
        }}
        onMouseEnter={(e) => {
          if (canZoomIn) (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--color-brand)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--color-border)';
        }}
      >
        +
      </button>
    </div>
  );
}
