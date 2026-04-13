'use client';

import { useEffect, useRef, useState } from 'react';

const RESUME_W = 794;
const RESUME_H = 1123;

interface ResumePreviewerProps {
  html: string;
  padding?: number;
}

export function ResumePreviewer({ html, padding = 64 }: ResumePreviewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const calc = () => {
      if (!containerRef.current) return;
      const containerW = containerRef.current.offsetWidth;
      setScale(Math.min(1, Math.max(0.3, (containerW - padding) / RESUME_W)));
    };

    calc();
    const ro = new ResizeObserver(calc);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [padding]);

  const safeHtml = html
    ? (html.includes('<meta charset') ? html
      : html.replace('<head>', '<head><meta charset="UTF-8">'))
    : `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>body{margin:0;background:#fff;}</style></head><body></body></html>`;

  return (
    <div className="resume-previewer" ref={containerRef}>
      <div
        className="resume-previewer__scaler"
        style={{
          width: RESUME_W,
          height: RESUME_H * scale,
          transform: `scale(${scale})`,
        }}
      >
        <iframe
          className="resume-previewer__iframe"
          title="Resume preview"
          srcDoc={safeHtml}
          sandbox="allow-same-origin"
        />
      </div>
    </div>
  );
}
