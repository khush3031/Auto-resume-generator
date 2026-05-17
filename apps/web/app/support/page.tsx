import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Support | ResumeForge',
  description: 'Get help and support for ResumeForge. Contact us if you have any questions or issues with our resume builder.',
  alternates: { canonical: 'https://resumeforge-web.onrender.com/support' },
};

export default function SupportPage() {
  return (
    <div className="legal-page">
      <div className="legal-container">
        <div className="legal-header">
          <p className="legal-eyebrow">Help & Resources</p>
          <h1 className="legal-title">Support</h1>
          <p className="legal-updated">We're here to help you</p>
        </div>

        <div className="legal-body">
          <section className="legal-section">
            <h2>Contact Us</h2>
            <p>
              If you have any questions, encounter any issues while using ResumeForge, or simply want to provide feedback, please do not hesitate to reach out to us. We value your input and are committed to making your resume building experience as smooth as possible.
            </p>
            <p>
              You can contact our support team directly via email:
            </p>
            <ul>
              <li>
                <strong>Email:</strong> <a href="mailto:khushboomakwana38@gmail.com" className="legal-link">khushboomakwana38@gmail.com</a>
              </li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>Frequently Asked Questions</h2>
            <p>
              Before reaching out, you might want to check if your question is answered below.
            </p>
            
            <div style={{ marginTop: '2rem' }}>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>How do I save my resume as a PDF?</h3>
              <p style={{ marginBottom: '1.5rem' }}>
                Once you have finished editing your resume in the builder, choose PDF, DOC, or DOCX from the export picker and download the file directly from the top bar.
              </p>

              <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Is ResumeForge completely free?</h3>
              <p style={{ marginBottom: '1.5rem' }}>
                Yes, ResumeForge is currently free to use. You can create, edit, and download your resumes without any hidden charges.
              </p>

              <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Are my details secure?</h3>
              <p style={{ marginBottom: '1.5rem' }}>
                We take your privacy seriously. For more details on how we handle your data, please refer to our <Link href="/privacy" className="legal-link">Privacy Policy</Link>.
              </p>
            </div>
          </section>
        </div>

        <div className="legal-footer-nav">
          <Link href="/terms" className="legal-link">Terms & Conditions</Link>
          <span className="legal-sep">·</span>
          <Link href="/privacy" className="legal-link">Privacy Policy</Link>
          <span className="legal-sep">·</span>
          <Link href="/" className="legal-link">Back to Home</Link>
        </div>
      </div>
    </div>
  );
}
