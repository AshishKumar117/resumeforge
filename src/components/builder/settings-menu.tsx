"use client";

import { Palette } from "lucide-react";
import { TEMPLATES, FONTS, ACCENT_COLORS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface ResumeSettings {
  template: string;
  accentColor: string;
  font: string;
}

export function SettingsMenu({
  settings,
  onChange,
  lockedTemplates,
}: {
  settings: ResumeSettings;
  onChange: (patch: Partial<ResumeSettings>) => void;
  lockedTemplates: string[];
}) {
  const allowed = TEMPLATES.filter((t) => !lockedTemplates.includes(t.id));

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Palette className="h-4 w-4" />
          Style
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel>Template</DropdownMenuLabel>
        <div className="grid grid-cols-2 gap-1 p-1">
          {allowed.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => onChange({ template: t.id })}
              className={cn(
                "flex flex-col gap-1 rounded-lg border px-2 py-2 text-left text-xs font-medium transition-colors",
                settings.template === t.id
                  ? "border-primary/50 bg-primary/5"
                  : "border-border hover:bg-accent",
              )}
            >
              <span className="flex h-8 items-center gap-1 rounded-sm border border-gray-200 bg-white px-1.5 dark:border-gray-700">
                <span className="h-2.5 w-1.5 rounded-sm bg-gray-400" />
                <span className="space-y-0.5">
                  <span className="block h-0.5 w-6 rounded bg-gray-300" />
                  <span className="block h-0.5 w-4 rounded bg-gray-300" />
                </span>
              </span>
              {t.name}
            </button>
          ))}
        </div>
        {lockedTemplates.length > 0 && (
          <p className="px-3 pb-2 text-[11px] text-muted-foreground">
            Some templates are Pro-only. Upgrade to unlock all four.
          </p>
        )}

        <DropdownMenuSeparator />
        <DropdownMenuLabel>Font</DropdownMenuLabel>
        <div className="grid grid-cols-2 gap-1 p-1">
          {FONTS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => onChange({ font: f.value })}
              className={cn(
                "rounded-lg border px-2 py-1.5 text-xs transition-colors",
                settings.font === f.value ? "border-primary/50 bg-primary/5 font-semibold" : "border-border hover:bg-accent",
              )}
              style={{ fontFamily: f.serif ? "Georgia, serif" : "Inter, sans-serif" }}
            >
              {f.label}
            </button>
          ))}
        </div>

        <DropdownMenuSeparator />
        <DropdownMenuLabel>Accent color</DropdownMenuLabel>
        <div className="flex flex-wrap gap-2 p-2">
          {ACCENT_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => onChange({ accentColor: c })}
              className={cn(
                "h-6 w-6 rounded-full ring-offset-2 ring-offset-background transition-shadow",
                settings.accentColor === c && "ring-2 ring-foreground",
              )}
              style={{ backgroundColor: c }}
              aria-label={`Accent ${c}`}
            />
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
