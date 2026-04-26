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

      {/* Template grid — client-side with retry for Render cold starts */}
      <div className="templates-body">
        <div className="templates-body__inner">
          <TemplatesGrid />
        </div>
      </div>

    </div>
  );
}
