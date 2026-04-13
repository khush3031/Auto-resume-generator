'use client';

import Link from 'next/link';

type ResumeCardProps = {
  resume: {
    _id: string;
    templateId: string;
    templateName: string;
    title?: string;
    updatedAt: string;
  };
  onDelete?: (id: string) => void;
};

export function ResumeCard({ resume, onDelete }: ResumeCardProps) {
  return (
    <article className="resume-card">

      {/* Thumbnail */}
      <div className="resume-card__thumb">
        <span className="resume-card__badge">{resume.templateName}</span>
        <div className="resume-card__placeholder">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" aria-hidden="true">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14,2 14,8 20,8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10,9 9,9 8,9" />
          </svg>
          <p className="resume-card__placeholder-label">{resume.title || 'My Resume'}</p>
        </div>
      </div>

      {/* Card body */}
      <div className="resume-card__body">
        <div className="resume-card__info">
          <h3 className="resume-card__title">{resume.title || 'My Resume'}</h3>
          <p className="resume-card__date">
            Updated {new Date(resume.updatedAt).toLocaleDateString()}
          </p>
        </div>

        <div className="resume-card__actions">
          <Link href={`/builder/${resume.templateId}?resumeId=${resume._id}`} className="resume-card__action">
            Edit
          </Link>
          <Link href={`/preview/${resume._id}`} className="resume-card__action">
            Preview
          </Link>
          <button
            onClick={() => onDelete?.(resume._id)}
            aria-label="Delete resume"
            className="resume-card__action resume-card__action--danger"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="resume-card__delete-icon" aria-hidden="true">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14H6L5 6" />
              <path d="M10 11v6M14 11v6M9 6V4h6v2" />
            </svg>
            <span className="resume-card__delete-text">Delete</span>
          </button>
        </div>
      </div>
    </article>
  );
}
