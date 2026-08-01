import prisma from "@/lib/db/client";
import { hashPassword } from "@/lib/auth/password";
import { slugify } from "@/lib/utils";

const SAMPLE_RESUME = {
  personal: {
    fullName: "Alex Morgan",
    jobTitle: "Senior Product Manager",
    email: "alex@resumeforge.app",
    phone: "(555) 123-4567",
    location: "San Francisco, CA",
    website: "alexmorgan.dev",
    linkedin: "linkedin.com/in/alexmorgan",
    github: "",
  },
  sections: [
    {
      id: "sec_summary",
      type: "summary",
      title: "Summary",
      visible: true,
      items: [
        {
          id: "itm_summary",
          description:
            "Product leader with 8+ years shipping B2B SaaS at scale. Expert in roadmap strategy, cross-functional execution, and data-driven growth.",
        },
      ],
    },
    {
      id: "sec_experience",
      type: "experience",
      title: "Experience",
      visible: true,
      items: [
        {
          id: "itm_exp1",
          heading: "Acme Corp",
          subheading: "Senior Product Manager",
          date: "Mar 2021 – Present",
          location: "Remote",
          bullets: [
            "Led a 6-person team to ship AI-assisted workflows, growing ARR by 34% in two quarters.",
            "Drove 0→1 on a new analytics product used by 2,000+ enterprise accounts.",
            "Reduced time-to-value by 40% through onboarding redesign and self-serve activation.",
          ],
        },
        {
          id: "itm_exp2",
          heading: "Globex Inc.",
          subheading: "Product Manager",
          date: "Jun 2018 – Feb 2021",
          location: "New York, NY",
          bullets: [
            "Owned roadmap for a payments platform processing $500M+/year.",
            "Partnered with engineering and design to cut churn 18% via retention experiments.",
            "Introduced quarterly OKR planning adopted company-wide.",
          ],
        },
      ],
    },
    {
      id: "sec_education",
      type: "education",
      title: "Education",
      visible: true,
      items: [
        {
          id: "itm_edu1",
          heading: "University of California, Berkeley",
          subheading: "B.S. Computer Science",
          date: "2014 – 2018",
          location: "",
          description: "",
        },
      ],
    },
    {
      id: "sec_skills",
      type: "skills",
      title: "Skills",
      visible: true,
      items: [
        {
          id: "itm_skills",
          skills: [
            "Product Strategy",
            "Roadmapping",
            "A/B Testing",
            "SQL",
            "Python",
            "Figma",
            "Agile / Scrum",
            "Data Analysis",
            "Stakeholder Management",
            "GTM Strategy",
          ],
        },
      ],
    },
    {
      id: "sec_projects",
      type: "projects",
      title: "Projects",
      visible: true,
      items: [
        {
          id: "itm_proj1",
          heading: "ResumeForge",
          subheading: "Founder / Builder",
          date: "2025 – Present",
          description: "AI-powered resume builder with ATS scoring, live exports, and share analytics.",
          bullets: [],
        },
      ],
    },
    {
      id: "sec_certifications",
      type: "certifications",
      title: "Certifications",
      visible: false,
      items: [
        {
          id: "itm_cert1",
          heading: "Pragmatic Institute",
          subheading: "PMC Level III",
          date: "2022",
        },
      ],
    },
  ],
};

async function main() {
  const demoPassword = "demo1234";

  // Idempotent demo user.
  const demoUser = await prisma.user.upsert({
    where: { email: "demo@resumeforge.app" },
    update: {},
    create: {
      name: "Alex Morgan",
      email: "demo@resumeforge.app",
      emailVerified: new Date(),
      passwordHash: await hashPassword(demoPassword),
      targetRole: "Senior Product Manager",
      industry: "SaaS",
      experienceLevel: "SENIOR",
      plan: "PRO",
    },
  });

  // Demo resume (create only if the user has none).
  const existing = await prisma.resume.findFirst({ where: { userId: demoUser.id } });
  let resumeId = existing?.id ?? null;
  if (!resumeId) {
    const resume = await prisma.resume.create({
      data: {
        userId: demoUser.id,
        title: "Senior Product Manager",
        slug: `demo-${Math.random().toString(36).slice(2, 8)}`,
        template: "modern",
        accentColor: "#2563eb",
        font: "Inter",
        data: SAMPLE_RESUME,
        targetRole: "Senior Product Manager",
        status: "COMPLETE",
      },
    });
    resumeId = resume.id;
    await prisma.resumeVersion.create({
      data: { resumeId: resume.id, version: 1, data: SAMPLE_RESUME },
    });
  }

  // Sample job applications.
  const apps = [
    { company: "Stripe", role: "Senior Product Manager, Billing", status: "APPLIED", location: "Remote" },
    { company: "Linear", role: "Product Lead, Growth", status: "INTERVIEW", location: "Remote" },
    { company: "Notion", role: "Senior Product Manager, AI", status: "APPLIED", location: "San Francisco, CA" },
  ];
  for (const app of apps) {
    const exists = await prisma.jobApplication.findFirst({
      where: { userId: demoUser.id, company: app.company, role: app.role },
    });
    if (!exists) {
      await prisma.jobApplication.create({
        data: { userId: demoUser.id, resumeId, ...app },
      });
    }
  }

  // Sample cover letter.
  const hasCoverLetter = await prisma.coverLetter.findFirst({ where: { userId: demoUser.id } });
  if (!hasCoverLetter) {
    await prisma.coverLetter.create({
      data: {
        userId: demoUser.id,
        resumeId,
        title: "Stripe — Senior Product Manager",
        targetCompany: "Stripe",
        targetRole: "Senior Product Manager, Billing",
        content: `Dear Hiring Manager,\n\nI've spent the last four years shipping payments and billing products at scale, and I'm excited about the opportunity to bring that experience to Stripe...\n\nBest regards,\nAlex Morgan`,
      },
    });
  }

  // Share link for the demo resume.
  const share = await prisma.shareLink.findUnique({ where: { resumeId } });
  if (!share) {
    await prisma.shareLink.create({
      data: { resumeId, slug: slugify("alex-morgan-resume") },
    });
  }

  console.log(`Seed complete.\n  Demo login: demo@resumeforge.app / ${demoPassword}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
