import { TemplatesGrid } from '../../components/TemplatesGrid';

export const metadata = {
  title: 'Free Resume Templates | ResumeForge',
  description: 'Browse free resume templates online with ResumeForge. Choose a professional layout and start building your resume instantly.',
  openGraph: {
    title: 'Free Resume Templates | ResumeForge',
    description: 'Browse free resume templates online with ResumeForge. Choose a professional layout and start building your resume instantly.'
  }
};

export default function TemplatesPage() {
  return (
    <div className="templates-page">

      {/* Page header */}
      <div className="templates-header">
        <div className="templates-header__inner">
          <div className="templates-header__grid">
            <div>
              <p className="templates-header__eyebrow">Resume Templates</p>
              <h1 className="templates-header__title">
                Browse a deeper template library
                <br /> built for different hiring moments.
              </h1>
            </div>
            <div>
              <p className="templates-header__desc">
                Compare ATS-safe, premium, compact, executive, and creative layouts, then tune typography and spacing live in the builder.
              </p>
            </div>
          </div>
          <div className="templates-accent" />
        </div>
      </div>

      {/* Template grid — client-side with retry for Render cold starts */}
      <div className="templates-body">
        <div className="templates-body__inner">
          <TemplatesGrid />
        </div>
      </div>

    </div>
  );
}
