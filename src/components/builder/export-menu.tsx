"use client";

import { useState } from "react";
import { Download, Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ExportMenuProps {
  resumeId: string;
  title: string;
  data: unknown;
  accentColor: string;
  font: string;
  allowedFormats: string[];
}

export function ExportMenu({ resumeId, title, data, accentColor, font, allowedFormats }: ExportMenuProps) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");

  async function download(format: "pdf" | "docx" | "txt") {
    if (busy) return;
    setBusy(format);
    setError(null);
    try {
      const res = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeId, data, accentColor, font, title, format }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? "Export failed");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${title || "resume"}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Export failed");
    } finally {
      setBusy(null);
    }
  }

  async function sendEmail() {
    if (!email.trim()) return;
    if (busy) return;
    setBusy("email");
    setError(null);
    try {
      const res = await fetch("/api/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: email.trim(), resumeId, data, accentColor, font, title }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error ?? "Email failed");
      setEmail("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Email failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" disabled={busy !== null}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel>Download as</DropdownMenuLabel>
        {allowedFormats.includes("pdf") && (
          <MenuItem
            label="PDF — ATS-safe"
            detail="Best for applications"
            onClick={() => void download("pdf")}
            disabled={busy !== null}
          />
        )}
        {allowedFormats.includes("docx") && (
          <MenuItem
            label="DOCX — Word document"
            detail="Editable in MS Word / Google Docs"
            onClick={() => void download("docx")}
            disabled={busy !== null}
          />
        )}
        {allowedFormats.includes("txt") && (
          <MenuItem
            label="TXT — plain text"
            detail="For copy-paste into forms"
            onClick={() => void download("txt")}
            disabled={busy !== null}
          />
        )}

        {allowedFormats.includes("email") && (
          <>
            <DropdownMenuSeparator />
            <div className="space-y-2 p-2">
              <Label className="text-xs">Email me the PDF</Label>
              <div className="flex gap-2">
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@email.com"
                  className="h-8 flex-1 text-sm"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => void sendEmail()}
                  disabled={busy !== null || !email.trim()}
                >
                  {busy === "email" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Mail className="h-3.5 w-3.5" />}
                  Send
                </Button>
              </div>
            </div>
          </>
        )}

        {!allowedFormats.includes("docx") && (
          <p className="px-3 pb-2 text-[11px] text-muted-foreground">
            DOCX, TXT & email export are Pro features.
          </p>
        )}
        {error && <p className="px-3 pb-2 text-[11px] text-destructive">{error}</p>}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function MenuItem({
  label,
  detail,
  onClick,
  disabled,
}: {
  label: string;
  detail: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex w-full items-center justify-between gap-2 rounded-md px-2 py-2 text-left text-sm transition-colors hover:bg-accent disabled:pointer-events-none disabled:opacity-50"
    >
      <span>
        <span className="block font-medium">{label}</span>
        <span className="block text-xs text-muted-foreground">{detail}</span>
      </span>
    </button>
  );
}
