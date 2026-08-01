import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — ResumeForge",
  description: "How ResumeForge collects, uses, and protects your data.",
};

export default function PrivacyPage() {
  return (
    <article className="prose prose-zinc dark:prose-invert mx-auto max-w-3xl px-4 py-16">
      <h1>Privacy Policy</h1>
      <p>Last updated: {new Date().toISOString().slice(0, 10)}</p>
      <h2>What we collect</h2>
      <p>
        We collect the minimum data needed to run the service: your account details (email, name), the resumes,
        cover letters, and job-tracking data you create, and basic analytics about how you use the product.
      </p>
      <h2>How we use it</h2>
      <p>
        Your data is used to provide the service — storing and rendering your documents, running AI features, and
        processing payments. We never sell your personal data.
      </p>
      <h2>AI features</h2>
      <p>
        When you use AI rewriting or scoring, the relevant text is sent to our AI provider strictly to produce the
        response you requested. It is not used to train models and is not retained after processing.
      </p>
      <h2>Sharing</h2>
      <p>
        Your resumes are private to your account. Shareable links are opt-in, revocable, and never indexed by search
        engines. Anyone with the link can view your resume only while it is enabled.
      </p>
      <h2>Data retention & deletion</h2>
      <p>
        You can export or delete your data at any time. Deleting your account permanently removes your documents and
        personal information, except where we are legally required to retain records.
      </p>
      <h2>Contact</h2>
      <p>Questions about this policy? Email privacy@resumeforge.app.</p>
    </article>
  );
}
