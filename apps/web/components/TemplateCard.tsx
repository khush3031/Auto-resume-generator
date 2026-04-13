import Link from 'next/link';
import renderTemplate from '../common/common';

export function TemplateCard({ template }: any) {
  return (
    <div className="template-card">

      {/* Thumbnail — portrait 3:4 ratio */}
      <div className="template-card__thumbnail">
        <div className="template-card__preview-wrap">
          <div
            className="template-card__preview"
            dangerouslySetInnerHTML={{ __html: renderTemplate(template.htmlContent) }}
          />
        </div>
        <div className="template-card__badge-wrap">
          <span className="template-card__badge">{template.style}</span>
        </div>
      </div>

      {/* Card body */}
      <div className="template-card__body">
        <p className="template-card__style">{template.style}</p>
        <h3 className="template-card__name">{template.name}</h3>
        <Link href={`/builder/${template.id}`} className="template-card__cta">
          Use Template →
        </Link>
      </div>
    </div>
  );
}
