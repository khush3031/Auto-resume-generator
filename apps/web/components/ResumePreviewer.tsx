'use client';

import { useRef, useEffect, useState, useCallback } from 'react';

const RESUME_W = 794;
const RESUME_H = 1123;

interface Props {
  html:       string;
  zoomLevel?: number;
}

export function ResumePreviewer({ html, zoomLevel = 1 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [autoScale, setAutoScale] = useState(1);

  const updateAutoScale = useCallback(() => {
    if (!containerRef.current) return;
    const available = containerRef.current.offsetWidth - 32;
    setAutoScale(Math.min(1, available / RESUME_W));
  }, []);

  useEffect(() => {
    updateAutoScale();
    const ro = new ResizeObserver(updateAutoScale);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [updateAutoScale]);

  const finalScale = autoScale * zoomLevel;
  const scaledH    = RESUME_H * finalScale;

  const safeHtml = (() => {
    if (!html) return `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<style>body{margin:0;background:#fff;display:flex;
align-items:center;justify-content:center;height:100vh;
font-family:sans-serif;color:#bbb;font-size:13px;
text-align:center;padding:40px;box-sizing:border-box;}</style>
</head><body>Fill in the form to see your resume preview</body>
</html>`;
    return html.includes('<meta charset')
      ? html
      : html.replace('<head>', '<head><meta charset="UTF-8">');
  })();

  return (
    <div
      ref={containerRef}
      style={{
        width:          '100%',
        display:        'flex',
        justifyContent: 'center',
        alignItems:     'flex-start',
        padding:        '16px 0 32px',
        overflow:       'hidden',
      }}
    >
      <div
        style={{
          width:           RESUME_W,
          height:          scaledH,
          transform:       `scale(${finalScale})`,
          transformOrigin: 'top center',
          flexShrink:      0,
          filter:          'drop-shadow(0 4px 20px rgba(0,0,0,0.15))',
          transition:      'transform 0.2s ease',
        }}
      >
        <iframe
          srcDoc={safeHtml}
          title="Resume Preview"
          sandbox="allow-same-origin"
          style={{
            width:      RESUME_W,
            height:     RESUME_H,
            border:     'none',
            display:    'block',
            background: 'white',
          }}
        />
      </div>
    </div>
  );
}
