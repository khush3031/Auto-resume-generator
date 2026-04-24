import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Read how ResumeForge collects, uses, and protects your personal data.',
};

export default function PrivacyPage() {
  return (
    <div className="legal-page">
      <div className="legal-container">
        <div className="legal-header">
          <p className="legal-eyebrow">Legal</p>
          <h1 className="legal-title">Privacy Policy</h1>
          <p className="legal-updated">Last updated: April 24, 2026</p>
        </div>

        <div className="legal-body">
          <section className="legal-section">
            <h2>1. Introduction</h2>
            <p>
              ResumeForge ("we", "us", "our") is committed to protecting your personal data.
              This Privacy Policy explains what information we collect when you use our Service,
              how we use it, and the rights you have over your data.
            </p>
          </section>

          <section className="legal-section">
            <h2>2. Information We Collect</h2>
            <p>When you create a ResumeForge account, we collect the following personal data:</p>
            <ul>
              <li>
                <strong>Full Name</strong> — used to personalise your account and appear on your resumes.
              </li>
              <li>
                <strong>Email Address</strong> — used for account authentication, notifications, and
                customer support.
              </li>
              <li>
                <strong>Password</strong> — stored exclusively as a one-way bcrypt hash. We never store or have access to your plain-text password.
              </li>
            </ul>
            <p>
              We also collect resume content you enter into the builder (job titles, experience,
              skills, education, etc.) solely for the purpose of generating your resume documents.
            </p>
          </section>

          <section className="legal-section">
            <h2>3. How We Use Your Information</h2>
            <p>We use the information we collect to:</p>
            <ul>
              <li>Create and manage your user account.</li>
              <li>Authenticate your identity when you log in.</li>
              <li>Generate and store your resume drafts.</li>
              <li>Provide PDF export functionality.</li>
              <li>Send you account-related communications (e.g., password resets).</li>
              <li>Improve and maintain the quality of our Service.</li>
            </ul>
            <p>
              We do <strong>not</strong> sell, rent, or share your personal information with
              third parties for marketing purposes.
            </p>
          </section>

          <section className="legal-section">
            <h2>4. Password Security</h2>
            <p>
              Your password is hashed using the bcrypt algorithm before
              being stored in our database. This means:
            </p>
            <ul>
              <li>Your plain-text password is never stored anywhere in our systems.</li>
              <li>Even in the unlikely event of a data breach, your password cannot be reversed from the stored hash.</li>
              <li>Each password hash is unique due to the per-user salt embedded in the bcrypt process.</li>
            </ul>
            <p>
              We strongly recommend using a unique, strong password for your ResumeForge account.
            </p>
          </section>

          <section className="legal-section">
            <h2>5. Data Storage and Security</h2>
            <p>
              We store your data securely using industry-standard cloud infrastructure. Access to your data is restricted to authorised systems only.
              We implement reasonable technical and organisational measures to protect your personal information from unauthorised access, loss, or misuse. However, no system can be completely secure, and we cannot guarantee absolute security.
              You are responsible for maintaining the confidentiality of your account credentials and for using a strong password.
            </p>
            <p>
              While we take reasonable technical measures to protect your data, no system is
              completely immune to risk. We encourage you to use strong passwords and keep your
              login credentials confidential.
            </p>
          </section>

          <section className="legal-section">
            <h2>6. Cookies and Local Storage</h2>
            <p>
              We use basic browser technologies such as cookies and local storage to keep you logged in and to save your progress while using the Service.
              We do not use third-party tracking or advertising cookies.
              You can control or clear cookies and local storage through your browser settings, but doing so may affect how the Service functions.
            </p>
          </section>

          <section className="legal-section">
            <h2>7. Data Retention</h2>
            <p>
              We retain your account data for as long as your account is active. If you delete
              your account (or request deletion by contacting us), we will permanently delete your
              personal data and all associated resume content within 30 days, unless we are
              required to retain it by law.
            </p>
          </section>

          <section className="legal-section">
            <h2>8. Your Rights</h2>
            <p>You have the right to:</p>
            <ul>
              <li><strong>Access</strong> — request a copy of the personal data we hold about you.</li>
              <li><strong>Correction</strong> — request that we correct inaccurate data.</li>
              <li><strong>Deletion</strong> — request that we delete your account and personal data.</li>
              <li><strong>Portability</strong> — request your resume data in a portable format.</li>
              <li><strong>Objection</strong> — object to processing of your personal data in certain circumstances.</li>
            </ul>
            <p>
              To exercise any of these rights, contact us at{' '}
              <a href="mailto:khushboomakwana38@gmail.com" className="legal-link">khushboomakwana38@gmail.com</a>.
            </p>
          </section>

          <section className="legal-section">
            <h2>9. Children's Privacy</h2>
            <p>
              ResumeForge is not intended for users under the age of 16. We do not knowingly collect
              personal data from children. If you believe a child has provided us with personal data,
              please contact us so we can delete it promptly.
            </p>
          </section>

          <section className="legal-section">
            <h2>10. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of material
              changes by posting the new policy on this page and updating the "Last updated" date.
              Continued use of the Service after changes are posted constitutes acceptance of the
              revised policy.
            </p>
          </section>

          <section className="legal-section">
            <h2>11. Contact Us</h2>
            <p>
              If you have any questions or concerns about this Privacy Policy or how we handle your
              data, please contact us at{' '}
              <a href="mailto:khushboomakwana38@gmail.com" className="legal-link">khushboomakwana38@gmail.com</a>.
            </p>
          </section>
        </div>

        <div className="legal-footer-nav">
          <Link href="/terms" className="legal-link">Terms and Conditions</Link>
          <span className="legal-sep">·</span>
          <Link href="/" className="legal-link">Back to Home</Link>
        </div>
      </div>
    </div>
  );
}
