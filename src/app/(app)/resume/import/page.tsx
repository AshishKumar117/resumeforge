"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { FileUp, Loader2, Upload } from "lucide-react";
import { createImportedResumeAction } from "@/actions/resume";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function ImportPage() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const upload = useCallback(
    async (file: File) => {
      if (busy) return;
      setBusy(true);
      setError(null);
      const form = new FormData();
      form.append("file", file);
      try {
        const res = await fetch("/api/import", { method: "POST", body: form });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json.error ?? "Import failed");
        const result = await createImportedResumeAction(json.data);
        if (result?.error) throw new Error(result.error);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Import failed");
        setBusy(false);
      }
    },
    [busy],
  );

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Import an existing resume</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload a PDF or DOCX. We&apos;ll extract the text, structure it into editable sections, and open it in the
          builder. <span className="font-medium text-foreground">Pro feature.</span>
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Upload your file</CardTitle>
          <CardDescription>PDF or DOCX up to 10 MB. Image-based (scanned) files aren&apos;t supported.</CardDescription>
        </CardHeader>
        <CardContent>
          <label
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              const file = e.dataTransfer.files?.[0];
              if (file) void upload(file);
            }}
            className={cn(
              "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-14 text-center transition-colors",
              dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/40 hover:bg-accent/40",
            )}
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              {busy ? <Loader2 className="h-6 w-6 animate-spin" /> : <Upload className="h-6 w-6" />}
            </span>
            <span className="font-medium">{busy ? "Parsing and structuring…" : "Drop your resume here, or click to browse"}</span>
            <span className="text-xs text-muted-foreground">We keep the original formatting out — ATS-safe output only.</span>
            <input
              type="file"
              accept=".pdf,.docx"
              className="hidden"
              disabled={busy}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void upload(file);
                e.target.value = "";
              }}
            />
          </label>
          {error && (
            <p className="mt-3 flex items-center gap-2 text-sm text-destructive">
              <FileUp className="h-4 w-4 shrink-0" />
              {error}
            </p>
          )}
          <div className="mt-6 flex justify-end">
            <Button variant="outline" onClick={() => router.push("/dashboard")}>
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
