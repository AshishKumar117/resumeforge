import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service — ResumeForge",
  description: "The terms that govern your use of ResumeForge.",
};

export default function TermsPage() {
  return (
    <article className="prose prose-zinc dark:prose-invert mx-auto max-w-3xl px-4 py-16">
      <h1>Terms of Service</h1>
      <p>Last updated: {new Date().toISOString().slice(0, 10)}</p>
      <h2>1. Acceptance</h2>
      <p>
        By creating an account or using ResumeForge, you agree to these terms. If you do not agree, do not use the
        service.
      </p>
      <h2>2. Your content</h2>
      <p>
        You retain all rights to the resumes and documents you create. You are responsible for the accuracy and
        lawfulness of the content you upload. You grant us the limited rights needed to store, render, and process
        your content to provide the service.
      </p>
      <h2>3. Acceptable use</h2>
      <p>
        You agree not to misuse the service, attempt to gain unauthorized access, abuse AI features, or interfere
        with the operation of the platform.
      </p>
      <h2>4. AI output</h2>
      <p>
        AI-generated suggestions are provided as assistance and are your responsibility to review before use.
        ResumeForge makes no guarantee about hiring outcomes.
      </p>
      <h2>5. Payments & subscriptions</h2>
      <p>
        Pro subscriptions are billed in advance on a monthly or annual basis and renew automatically until cancelled.
        You can cancel anytime from your billing page; access continues until the end of the paid period.
      </p>
      <h2>6. Termination</h2>
      <p>You can delete your account at any time. We may suspend or terminate accounts that violate these terms.</p>
      <h2>7. Disclaimer & liability</h2>
      <p>
        The service is provided &quot;as is&quot; without warranties of any kind. To the maximum extent permitted by
        law, ResumeForge is not liable for indirect, incidental, or consequential damages.
      </p>
    </article>
  );
}
