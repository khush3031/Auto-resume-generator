'use client';

import { useRef, useEffect, useState, useCallback } from 'react';

const RESUME_W = 794;
const RESUME_H = 1123;
const PREVIEW_CSP_META = `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data: blob: https:; style-src 'unsafe-inline' https://fonts.googleapis.com; font-src data: https://fonts.gstatic.com; script-src 'none'; connect-src 'none'; object-src 'none'; frame-src 'none'; base-uri 'none'; form-action 'none'">`;

interface Props {
  html:       string;
  zoomLevel?: number;
}

export function ResumePreviewer({ html, zoomLevel = 1 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef    = useRef<HTMLIFrameElement>(null);
  const [autoScale, setAutoScale]   = useState(1);
  const [contentH,  setContentH]    = useState(RESUME_H);

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

  // Reset height when HTML changes so we re-measure after load
  useEffect(() => {
    setContentH(RESUME_H);
  }, [html]);

  const handleLoad = useCallback(() => {
    try {
      const doc = iframeRef.current?.contentDocument;
      if (!doc) return;
      const h = Math.max(
        doc.documentElement.scrollHeight,
        doc.body?.scrollHeight ?? 0,
        RESUME_H,
      );
      setContentH(h);
    } catch {
      // cross-origin fallback — keep RESUME_H
    }
  }, []);

  const finalScale = autoScale * zoomLevel;
  const scaledH    = contentH * finalScale;

  const PREVIEW_CSS = `<style id="rf-preview-base">
*,*::before,*::after{box-sizing:border-box;}
p,div,span,li,td,h1,h2,h3,h4,a{
  word-break:break-word !important;
  overflow-wrap:break-word !important;
  max-width:100% !important;
}
img{max-width:100% !important;height:auto !important;}
</style>`;

  const safeHtml = (() => {
    if (!html) return `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<style>body{margin:0;background:#fff;display:flex;
align-items:center;justify-content:center;height:auto;
font-family:sans-serif;color:#bbb;font-size:13px;
text-align:center;padding:40px;box-sizing:border-box;}</style>
</head><body>Fill in the form to see your resume preview</body>
</html>`;
    let h = html;
    h = h.includes('<head>')
      ? h
      : h.replace(/<html([^>]*)>/i, '<html$1><head></head>');
    h = h.includes('<meta charset')
      ? h
      : h.replace('<head>', '<head><meta charset="UTF-8">');
    h = h.includes('http-equiv="Content-Security-Policy"')
      ? h
      : h.replace('<head>', `<head>${PREVIEW_CSP_META}`);
    h = h.includes('</head>')
      ? h.replace('</head>', PREVIEW_CSS + '</head>')
      : PREVIEW_CSS + h;
    return h;
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
          ref={iframeRef}
          srcDoc={safeHtml}
          title="Resume Preview"
          sandbox="allow-same-origin"
          referrerPolicy="no-referrer"
          onLoad={handleLoad}
          style={{
            width:      RESUME_W,
            height:     contentH,
            border:     'none',
            display:    'block',
            background: 'white',
          }}
        />
      </div>
    </div>
  );
}
