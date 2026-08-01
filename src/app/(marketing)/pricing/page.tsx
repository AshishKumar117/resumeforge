import type { Metadata } from "next";
import { Pricing } from "@/components/marketing/pricing";
import { Faq } from "@/components/marketing/faq";

export const metadata: Metadata = {
  title: "Pricing — ResumeForge",
  description: "Simple, transparent pricing. Start free, upgrade when you're serious about landing interviews.",
};

export default function PricingPage() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-4xl font-bold tracking-tight">Pricing</h1>
        <p className="mt-3 text-muted-foreground">
          Start free with three resumes. Upgrade to Pro for unlimited resumes, AI credits, and advanced exports.
        </p>
      </div>
      <div className="mt-12">
        <Pricing />
      </div>
      <div className="mx-auto mt-20 max-w-2xl text-center">
        <h2 className="text-2xl font-bold tracking-tight">Questions?</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Need a team or enterprise plan?{" "}
          <a href="mailto:hello@resumeforge.app" className="font-medium text-primary hover:underline">
            Talk to us
          </a>
          .
        </p>
      </div>
      <div className="mt-16">
        <Faq />
      </div>
    </section>
  );
}
