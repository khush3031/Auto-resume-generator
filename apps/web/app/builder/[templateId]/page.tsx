import { BuilderShell } from '../../../components/BuilderShell';
import { templates } from '@resumeforge/templates';
import { notFound } from 'next/navigation';

type PageProps = {
  params: { templateId: string };
};

export async function generateStaticParams() {
  return templates.map((template) => ({ templateId: template.id }));
}

export async function generateMetadata({ params }: PageProps) {
  const template = templates.find((item) => item.id === params.templateId);
  if (!template) return {};
  return {
    title: `${template.name} Builder — ResumeForge`,
    description: `Build and preview your resume using the ${template.name} template.`,
    openGraph: {
      title: `${template.name} Builder — ResumeForge`,
      description: `Build and preview your resume using the ${template.name} template.`
    }
  };
}

async function loadTemplate(templateId: string) {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/templates/${templateId}`,
      { cache: 'no-store', signal: AbortSignal.timeout(4000) }
    );
    if (!res.ok) return null;
    return (await res.json()) as {
      success: boolean;
      data: { htmlContent: string; id: string; name: string; style: string };
    };
  } catch {
    return null;
  }
}

/**
 * Builder page — on desktop the BuilderShell renders a full-viewport split
 * panel (form left, live preview right). On mobile/tablet it renders a tab
 * switcher (Edit | Preview) with a fixed bottom download bar.
 *
 * The page itself is intentionally minimal; all layout logic lives in
 * BuilderShell so it can respond to breakpoints at the component level.
 */
export default async function BuilderPage({ params }: PageProps) {
  const response = await loadTemplate(params.templateId);
  if (!response?.success) notFound();

  return (
    /*
      CRITICAL: w-full flex-1 flex flex-col — no max-w, no mx-auto, no px.
      The builder manages its own full-viewport layout internally.
    */
    <div className="builder-page">
      <BuilderShell template={response.data} />
    </div>
  );
}
