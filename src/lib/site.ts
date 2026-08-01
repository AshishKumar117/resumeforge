export const siteConfig = {
  name: "ResumeForge",
  description:
    "AI-powered ATS resume builder. Score your resume against real job descriptions, rewrite bullets with AI, and export ATS-ready PDFs in minutes.",
  url: process.env.APP_URL ?? "https://resumeforge.app",
  ogImage: "/og.png",
  links: {
    twitter: "https://twitter.com/resumeforge",
    github: "https://github.com/resumeforge/resumeforge",
  },
};

export function absoluteUrl(path: string): string {
  return `${siteConfig.url}${path.startsWith("/") ? path : `/${path}`}`;
}
