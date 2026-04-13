'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '../../src/store/auth.store';
import { deleteResume, fetchMyResumes } from '../../src/lib/api';
import { ResumeCard } from '../../components/ResumeCard';

export default function DashboardPage() {
  const { isAuthenticated, loadFromStorage } = useAuthStore();
  const [resumes, setResumes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadFromStorage(); }, [loadFromStorage]);

  useEffect(() => {
    if (!isAuthenticated) { setLoading(false); return; }
    fetchMyResumes()
      .then((data) => setResumes(data ?? []))
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this resume? This cannot be undone.')) return;
    try {
      await deleteResume(id);
      setResumes((prev) => prev.filter((r) => r._id !== id));
    } catch {
      alert('Could not delete resume. Please try again.');
    }
  };

  if (!isAuthenticated) {
    return (
      <main className="dashboard-page">
        <section className="dashboard-unauthenticated">
          <h1 className="dashboard-unauthenticated__title">Dashboard</h1>
          <p className="dashboard-unauthenticated__subtitle">
            Please log in to view your saved resumes.
          </p>
          <Link href="/login?returnUrl=/dashboard" className="dashboard-new-btn" style={{ marginTop: '1.5rem' }}>
            Log in
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="dashboard-page">
      <section className="dashboard-section">

        <div className="dashboard-header">
          <div>
            <p className="dashboard-header__eyebrow">Dashboard</p>
            <h1 className="dashboard-header__title">Your saved resumes</h1>
            <p className="dashboard-header__subtitle">
              Manage resumes and download PDFs whenever you need them.
            </p>
          </div>
          <Link href="/templates" className="dashboard-new-btn">+ New Resume</Link>
        </div>

        {loading ? (
          <div className="dashboard-loading">
            <svg className="spin-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
            <span className="dashboard-loading__text">Loading resumes…</span>
          </div>
        ) : resumes.length === 0 ? (
          <div className="dashboard-empty">
            <div className="dashboard-empty__icon-wrap">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14,2 14,8 20,8" />
              </svg>
            </div>
            <p className="dashboard-empty__title">No resumes yet</p>
            <p className="dashboard-empty__desc">Start with a template and build your first resume.</p>
            <Link href="/templates" className="dashboard-empty__link">Browse templates</Link>
          </div>
        ) : (
          <div className="dashboard-grid">
            {resumes.map((resume) => (
              <ResumeCard key={resume._id} resume={resume} onDelete={handleDelete} />
            ))}
          </div>
        )}

      </section>
    </main>
  );
}
