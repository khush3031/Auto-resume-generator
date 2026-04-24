import Link from 'next/link';
import { DownloadButton } from '../../../components/DownloadButton';
import { ResumePreviewer } from '../../../components/ResumePreviewer';
import type { Metadata } from 'next';

type PageProps = {
  params: { resumeId: string };
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/resumes/${params.resumeId}`,
    { cache: 'no-store' }
  );
  if (!res.ok) {
    return {
      title: 'Resume Preview — ResumeForge',
      description: 'Preview your resume and download the generated PDF.'
    };
  }
  const json   = await res.json();
  const resume = json.data;
  return {
    title: `${resume.title || 'Resume Preview'} | ResumeForge`,
    description: 'Preview your resume before downloading your final PDF.',
    robots: 'noindex',
    openGraph: {
      title: `${resume.title || 'Resume Preview'} | ResumeForge`,
      description: 'Preview your resume before downloading your final PDF.'
    }
  };
}

export default async function PreviewPage({ params }: PageProps) {
  const resumeId = params.resumeId;
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/resumes/${resumeId}`,
    { cache: 'no-store' }
  );

  if (!res.ok) {
    return (
      <main className="preview-not-found">
        <p className="preview-not-found__text">Resume not found.</p>
        <Link href="/templates" className="dl-btn" style={{ marginTop: '1.5rem' }}>
          Browse templates
        </Link>
      </main>
    );
  }

  const json   = await res.json();
  const resume = json.data;
  const html: string = resume.renderedHtml ?? '';

  return (
    <main className="preview-page">

      {/* Top bar */}
      <div className="preview-topbar">
        <div className="preview-topbar__inner">
          <Link href={`/builder/${resume.templateId}?resumeId=${resumeId}`} className="preview-back">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
            <span className="preview-back__text">Edit Resume</span>
          </Link>

          <div className="preview-topbar__center">
            <p className="preview-topbar__label">Preview</p>
            <h1 className="preview-topbar__title">{resume.title || 'Your Resume'}</h1>
          </div>

          <div className="preview-topbar__download-md">
            <DownloadButton resumeId={resumeId} />
          </div>
          <div className="preview-topbar__download-sm">
            <DownloadButton resumeId={resumeId} iconOnly />
          </div>
        </div>
      </div>

      {/* Resume display */}
      <div className="preview-content">
        <ResumePreviewer html={html} />
      </div>

      {/* Floating download bar — mobile only */}
      <div className="preview-floatbar">
        <DownloadButton resumeId={resumeId} fullWidth />
      </div>

    </main>
  );
}
