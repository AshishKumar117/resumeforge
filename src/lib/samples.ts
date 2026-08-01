import type { ResumeData } from "@/lib/types/resume";

/** Sample resume used in the marketing hero / template gallery demos. */
export const SAMPLE_RESUME: ResumeData = {
  personal: {
    fullName: "Aarav Sharma",
    jobTitle: "Senior Frontend Engineer",
    email: "aarav.sharma@email.com",
    phone: "+1 (415) 555-0132",
    location: "San Francisco, CA",
    website: "aaravsharma.dev",
    linkedin: "linkedin.com/in/aaravsharma",
    github: "github.com/aaravsharma",
  },
  sections: [
    {
      id: "sec_summary",
      type: "summary",
      title: "Summary",
      visible: true,
      items: [
        {
          id: "itm_sum",
          description:
            "Frontend engineer with 7 years of experience building accessible, high-performance web applications with React and TypeScript. Led migrations and design systems at three companies, reducing bundle size by 40% and lifting Core Web Vitals to the green zone.",
        },
      ],
    },
    {
      id: "sec_exp",
      type: "experience",
      title: "Experience",
      visible: true,
      items: [
        {
          id: "itm_exp1",
          heading: "Nimbus Analytics",
          subheading: "Senior Frontend Engineer",
          date: "Mar 2021 – Present",
          location: "San Francisco, CA",
          bullets: [
            "Led a 6-person team shipping a real-time analytics dashboard used by 120k monthly active users.",
            "Cut initial bundle size by 42% via code-splitting and tree-shaking, lifting LCP from 3.1s to 1.6s.",
            "Introduced a TypeScript-first design system now shared across 4 product teams.",
          ],
        },
        {
          id: "itm_exp2",
          heading: "Quillboard",
          subheading: "Frontend Engineer",
          date: "Jun 2018 – Feb 2021",
          location: "Remote",
          bullets: [
            "Built a collaborative document editor with offline-first sync and optimistic UI updates.",
            "Drove test coverage from 18% to 87% with Vitest and Playwright e2e suites.",
          ],
        },
      ],
    },
    {
      id: "sec_edu",
      type: "education",
      title: "Education",
      visible: true,
      items: [
        {
          id: "itm_edu",
          heading: "University of California, Berkeley",
          subheading: "B.S. Computer Science",
          date: "2014 – 2018",
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
          skills: ["React", "TypeScript", "Next.js", "Node.js", "GraphQL", "Tailwind CSS", "Playwright", "AWS", "Performance Optimization"],
        },
      ],
    },
    {
      id: "sec_proj",
      type: "projects",
      title: "Projects",
      visible: true,
      items: [
        {
          id: "itm_proj",
          heading: "Open-source: react-kit",
          subheading: "Creator & maintainer",
          date: "2020 – Present",
          description: "Headless React component library with 2.4k GitHub stars and 31 contributors.",
        },
      ],
    },
  ],
};

export const SAMPLE_JOB_DESCRIPTION = `We are looking for a Senior Frontend Engineer with deep React and TypeScript experience to join our platform team. You will own performance-critical surfaces, improve Core Web Vitals, mentor engineers, and collaborate with design to ship accessible, responsive UI. Experience with Next.js, GraphQL, testing, and cloud deployment is a plus.`;

export const SAMPLE_ATS_KEYWORDS = ["React", "TypeScript", "Next.js", "Performance", "Core Web Vitals", "GraphQL", "Testing"];
