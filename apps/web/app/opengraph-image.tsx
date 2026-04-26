import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'ResumeForge — Free Resume Builder Online';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OGImage() {
  return new ImageResponse(
    // fonts option intentionally omitted — avoids Windows local-font path bug in @vercel/og
    // All text uses system sans-serif which ImageResponse renders without local font files
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #0f2744 100%)',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background decorative circles */}
        <div
          style={{
            position: 'absolute',
            top: '-120px',
            right: '-120px',
            width: '500px',
            height: '500px',
            borderRadius: '50%',
            background: 'rgba(59,130,246,0.08)',
            display: 'flex',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-80px',
            left: '-80px',
            width: '350px',
            height: '350px',
            borderRadius: '50%',
            background: 'rgba(239,68,68,0.06)',
            display: 'flex',
          }}
        />

        {/* Logo + brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '32px' }}>
          {/* Logo icon */}
          <div
            style={{
              width: '72px',
              height: '72px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #1d4ed8, #2563eb)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 32px rgba(37,99,235,0.4)',
              position: 'relative',
            }}
          >
            {/* Document shape */}
            <svg width="40" height="48" viewBox="0 0 40 48" fill="none">
              <rect x="2" y="2" width="30" height="38" rx="3" fill="white" fillOpacity="0.15" stroke="white" strokeWidth="2"/>
              <rect x="2" y="2" width="30" height="38" rx="3" fill="white" fillOpacity="0.05"/>
              <line x1="8" y1="14" x2="26" y2="14" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
              <line x1="8" y1="20" x2="26" y2="20" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
              <line x1="8" y1="26" x2="20" y2="26" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
              {/* Red star — path used instead of <text> because @vercel/og does not support SVG <text> nodes */}
              <circle cx="32" cy="38" r="8" fill="#ef4444"/>
              <path d="M32,33.5 L33.06,36.54 L36.28,36.61 L33.71,38.56 L34.65,41.64 L32,39.8 L29.35,41.64 L30.29,38.56 L27.72,36.61 L30.94,36.54 Z" fill="white"/>
            </svg>
          </div>

          {/* Brand name */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0px' }}>
              <span style={{ fontSize: '52px', fontWeight: '800', color: '#ffffff', letterSpacing: '-1px' }}>Resume</span>
              <span style={{ fontSize: '52px', fontWeight: '800', color: '#ef4444', letterSpacing: '-1px' }}>Forge</span>
            </div>
          </div>
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: '28px',
            fontWeight: '500',
            color: '#94a3b8',
            textAlign: 'center',
            marginBottom: '40px',
            letterSpacing: '0.01em',
          }}
        >
          Free Resume Builder Online
        </div>

        {/* Feature pills */}
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
          {['28+ Templates', 'AI-Powered', 'PDF Export', '100% Free'].map((label) => (
            <div
              key={label}
              style={{
                padding: '10px 24px',
                borderRadius: '999px',
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.12)',
                color: '#e2e8f0',
                fontSize: '18px',
                fontWeight: '500',
                display: 'flex',
              }}
            >
              {label}
            </div>
          ))}
        </div>

        {/* Bottom URL */}
        <div
          style={{
            position: 'absolute',
            bottom: '32px',
            color: '#475569',
            fontSize: '16px',
            letterSpacing: '0.05em',
          }}
        >
          resumeforge-web.onrender.com
        </div>
      </div>
    ),
    { ...size },
  );
}
