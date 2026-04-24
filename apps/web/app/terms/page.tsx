import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms and Conditions',
  description: 'Read the ResumeForge Terms and Conditions of use.',
};

export default function TermsPage() {
  return (
    <div className="legal-page">
      <div className="legal-container">
        <div className="legal-header">
          <p className="legal-eyebrow">Legal</p>
          <h1 className="legal-title">Terms and Conditions</h1>
          <p className="legal-updated">Last updated: April 24, 2026</p>
        </div>

        <div className="legal-body">
          <section className="legal-section">
            <h2>1. Acceptance of Terms</h2>
            <p>
              By accessing or using ResumeForge ("the Service"), you agree to be bound by these Terms
              and Conditions. If you do not agree with any part of these terms, you may not use the Service.
              These terms apply to all users, including visitors, registered users, and others who access the Service.
            </p>
          </section>

          <section className="legal-section">
            <h2>2. Description of Service</h2>
            <p>
              ResumeForge is a free online resume builder that allows users to create, edit, preview, and
              download professional resumes. The Service provides access to multiple resume templates and
              PDF export functionality. Features may change at any time during the alpha/beta phase.
            </p>
          </section>

          <section className="legal-section">
            <h2>3. User Accounts</h2>
            <p>
              To access certain features (such as saving resumes and downloading PDFs), you must create an
              account by providing your full name, email address, and a password. You are responsible for:
            </p>
            <ul>
              <li>Maintaining the confidentiality of your account credentials.</li>
              <li>All activities that occur under your account.</li>
              <li>Notifying us immediately of any unauthorised use of your account.</li>
              <li>Providing accurate and current information during registration.</li>
            </ul>
            <p>
              We reserve the right to suspend or terminate accounts that violate these Terms.
            </p>
          </section>

          <section className="legal-section">
            <h2>4. User Content</h2>
            <p>
              You retain ownership of all content you submit to ResumeForge, including your personal
              information, resume data, and any documents you create. By using the Service, you grant
              ResumeForge a limited, non-exclusive licence to store and process your content solely for
              the purpose of providing the Service to you.
            </p>
            <p>
              You agree not to submit content that is false, misleading, illegal, or that infringes
              the rights of any third party.
            </p>
          </section>

          <section className="legal-section">
            <h2>5. Acceptable Use</h2>
            <p>You agree not to use the Service to:</p>
            <ul>
              <li>Violate any applicable law or regulation.</li>
              <li>Impersonate any person or entity.</li>
              <li>Attempt to gain unauthorised access to any part of the Service.</li>
              <li>Transmit any malicious code, viruses, or harmful content.</li>
              <li>Scrape, crawl, or systematically extract data from the Service.</li>
              <li>Interfere with or disrupt the integrity or performance of the Service.</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>6. Intellectual Property</h2>
            <p>
              The Service and its original content, features, and functionality are owned by ResumeForge
              and are protected by applicable intellectual property laws. The resume templates provided
              are licensed for personal, non-commercial use within the platform. You may not resell,
              sublicence, or distribute the templates outside of the Service.
            </p>
          </section>

          <section className="legal-section">
            <h2>7. Free Service and Pricing</h2>
            <p>
              ResumeForge is currently free to use during the alpha phase. We reserve the right to
              introduce paid plans, change pricing, or modify free tier limits at any time. Users will
              be notified of material changes to pricing via email or in-app notification.
            </p>
          </section>

          <section className="legal-section">
            <h2>8. Disclaimer of Warranties</h2>
            <p>
              The Service is provided "as is" and "as available" without warranties of any kind, either
              express or implied. ResumeForge does not warrant that the Service will be uninterrupted,
              error-free, or free from harmful components. We do not guarantee employment outcomes from
              resumes created using the Service.
            </p>
          </section>

          <section className="legal-section">
            <h2>9. Limitation of Liability</h2>
            <p>
              To the fullest extent permitted by law, ResumeForge shall not be liable for any indirect,
              incidental, special, or consequential damages arising out of your use of the Service,
              including data loss, loss of revenue, or loss of opportunity.
            </p>
          </section>

          <section className="legal-section">
            <h2>10. Changes to Terms</h2>
            <p>
              We reserve the right to update these Terms at any time. Continued use of the Service
              after changes are posted constitutes your acceptance of the revised Terms. We will
              endeavour to notify you of significant changes via email.
            </p>
          </section>

          <section className="legal-section">
            <h2>11. Governing Law</h2>
            <p>
              These Terms shall be governed by and construed in accordance with applicable laws.
              Any disputes arising under these Terms shall be subject to the exclusive jurisdiction
              of the relevant courts.
            </p>
          </section>

          <section className="legal-section">
            <h2>12. Contact Us</h2>
            <p>
              If you have questions about these Terms, please contact us at{' '}
              <a href="mailto:support@resumeforge.com" className="legal-link">support@resumeforge.com</a>.
            </p>
          </section>
        </div>

        <div className="legal-footer-nav">
          <Link href="/privacy" className="legal-link">Privacy Policy</Link>
          <span className="legal-sep">·</span>
          <Link href="/" className="legal-link">Back to Home</Link>
        </div>
      </div>
    </div>
  );
}
