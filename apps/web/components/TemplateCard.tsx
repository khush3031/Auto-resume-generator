'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import renderTemplate from '../common/common';

interface Template {
  id: string;
  name: string;
  style: string;
  htmlContent?: string;
  previewHtml?: string;
}

export function TemplateCard({ template }: { template: Template }) {
  const thumbRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.22);

  useEffect(() => {
    const el = thumbRef.current;
    if (!el) return;

    const calc = () => {
      setScale(el.offsetWidth / 794);
    };

    calc();
    const ro = new ResizeObserver(calc);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const previewHtml = template.previewHtml
    || renderTemplate(template.htmlContent || '');

  return (
    <div className="template-card">
      {/* Thumbnail — A4 ratio, clips iframe */}
      <div className="template-card__thumb" ref={thumbRef}>
        {previewHtml ? (
          <iframe
            className="template-card__thumb-iframe"
            srcDoc={previewHtml}
            title={`${template.name} preview`}
            sandbox="allow-same-origin"
            style={{ transform: `scale(${scale})` }}
          />
        ) : (
          <div style={{
            width: '100%', height: '100%', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            color: '#bbb', fontSize: 11, fontWeight: 500,
          }}>
            {template.name}
          </div>
        )}
        <div className="template-card__badge">{template.style}</div>
      </div>

      {/* Body */}
      <div className="template-card__body">
        <p className="template-card__eyebrow">{template.style}</p>
        <h3 className="template-card__name">{template.name}</h3>
        <Link
          href={`/builder/${template.id}`}
          className="btn btn--primary btn--full btn--square"
          style={{ fontSize: '1rem', padding: '8px 12px', minHeight: '36px' }}
        >
          Use Template →
        </Link>
      </div>
    </div>
  );
}
