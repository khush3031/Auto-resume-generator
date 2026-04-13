'use client';

import Link from 'next/link';
import { useRegistration } from './useRegistration';

export function DownloadGuard({ resumeId }: { resumeId: string }) {
  const { isRegistered } = useRegistration();

  if (!isRegistered) {
    return (
      <div className="space-y-4 rounded-3xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
        <p className="font-semibold">Register to download your resume.</p>
        <p className="text-sm text-amber-700">Explore templates and build resumes freely, but downloading a PDF requires a quick registration.</p>
        <Link href="/register" className="inline-flex rounded-full bg-amber-600 px-6 py-3 text-white hover:bg-amber-500">
          Register now
        </Link>
      </div>
    );
  }

  return (
    <a
      href={`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000'}/resumes/${resumeId}/export`}
      className="inline-flex rounded-full bg-brand-800 px-6 py-3 text-white hover:bg-brand-600"
    >
      Download PDF
    </a>
  );
}
