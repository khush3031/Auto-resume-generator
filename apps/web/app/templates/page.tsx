import { TemplateCard } from '../../components/TemplateCard';
import type { TemplateMeta } from '@resumeforge/templates';

export const metadata = {
  title: 'Free Resume Templates | ResumeForge',
  description: 'Browse free resume templates online with ResumeForge. Choose a professional layout and start building your resume instantly.',
  openGraph: {
    title: 'Free Resume Templates | ResumeForge',
    description: 'Browse free resume templates online with ResumeForge. Choose a professional layout and start building your resume instantly.'
  }
};

async function loadTemplates() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/templates`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(3000)
    });
    if (!res.ok) return [] as TemplateMeta[];
    const json = await res.json();
    return json.data as TemplateMeta[];
  } catch {
    return [] as TemplateMeta[];
  }
}

export default async function TemplatesPage() {
  const templates = await loadTemplates();

  const seen = new Set<string>();
  const styles = templates
    .map((t) => t.style)
    .filter((s) => {
      const key = s.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

  return (
    <div className="templates-page">

      {/* Page header — full width */}
      <div className="templates-header">
        <div className="templates-header__inner">
          <div className="templates-header__grid">
            <div>
              <p className="templates-header__eyebrow">Resume Templates</p>
              <h1 className="templates-header__title">
                Choose the right resume design
                <br /> for your next role.
              </h1>
            </div>
            <div>
              <p className="templates-header__desc">
                Filter by style, preview strong layouts, and start building with live editing.
              </p>
            </div>
          </div>
          <div className="templates-accent" />
        </div>
      </div>

      {/* Filter + grid — full width */}
      <div className="templates-body">
        <div className="templates-body__inner">

          {styles.length > 0 && (
            <div className="filter-tabs">
              <div className="filter-tabs__inner">
                {styles.map((style) => (
                  <span key={style} className="filter-tab">{style}</span>
                ))}
              </div>
            </div>
          )}

          {templates.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state__icon-wrap">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14,2 14,8 20,8" />
                </svg>
              </div>
              <p className="empty-state__title">Templates unavailable</p>
              <p className="empty-state__desc">Make sure the API server is running, then refresh.</p>
            </div>
          ) : (
            <div className="template-grid">
              {templates.map((template) => (
                <TemplateCard key={template.id} template={template} />
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
