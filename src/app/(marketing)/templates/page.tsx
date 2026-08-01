import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TemplateGallery } from "@/components/marketing/template-gallery";

export const metadata: Metadata = {
  title: "Templates — ResumeForge",
  description: "Four ATS-safe resume templates, all verified to parse cleanly in real applicant tracking systems.",
};

export default function TemplatesPage() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-4xl font-bold tracking-tight">Resume templates</h1>
        <p className="mt-3 text-muted-foreground">
          Every template is designed to pass real ATS parsers while still looking polished to human reviewers.
        </p>
      </div>
      <div className="mt-12">
        <TemplateGallery />
      </div>
      <div className="mt-16 text-center">
        <Button asChild size="lg">
          <Link href="/signup">
            Build my resume
            <ArrowRight />
          </Link>
        </Button>
      </div>
    </section>
  );
}
