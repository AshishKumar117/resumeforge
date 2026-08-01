"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { PersonalInfo } from "@/lib/types/resume";

const FIELDS: Array<{ key: keyof PersonalInfo; label: string; placeholder: string; type?: string }> = [
  { key: "fullName", label: "Full name", placeholder: "Jane Doe" },
  { key: "jobTitle", label: "Job title", placeholder: "Senior Product Designer" },
  { key: "email", label: "Email", placeholder: "jane@email.com", type: "email" },
  { key: "phone", label: "Phone", placeholder: "+1 (555) 000-0000" },
  { key: "location", label: "Location", placeholder: "Austin, TX" },
  { key: "website", label: "Website", placeholder: "janedoe.dev" },
  { key: "linkedin", label: "LinkedIn", placeholder: "linkedin.com/in/janedoe" },
  { key: "github", label: "GitHub", placeholder: "github.com/janedoe" },
];

export function PersonalEditor({
  personal,
  onChange,
}: {
  personal: PersonalInfo;
  onChange: (patch: Partial<PersonalInfo>) => void;
}) {
  return (
    <div className="rounded-xl border bg-background">
      <div className="border-b px-4 py-3">
        <h3 className="text-sm font-semibold">Contact & identity</h3>
        <p className="text-xs text-muted-foreground">Shown at the top of your resume.</p>
      </div>
      <div className="grid gap-4 p-4 sm:grid-cols-2">
        {FIELDS.map((f) => (
          <div key={f.key} className="space-y-1.5">
            <Label htmlFor={`personal-${f.key}`} className="text-xs font-medium">
              {f.label}
            </Label>
            <Input
              id={`personal-${f.key}`}
              type={f.type ?? "text"}
              value={personal[f.key] ?? ""}
              placeholder={f.placeholder}
              onChange={(e) => onChange({ [f.key]: e.target.value } as Partial<PersonalInfo>)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
