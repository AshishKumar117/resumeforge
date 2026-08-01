"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, KeyRound, Loader2, Trash2, UserCircle2 } from "lucide-react";
import { changePasswordAction, deleteAccountAction, updateProfileAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

interface SettingsUser {
  name: string;
  email: string;
  emailVerified: boolean;
  targetRole: string | null;
  industry: string | null;
  plan: string;
  hasPassword: boolean;
}

export function SettingsForm({ user }: { user: SettingsUser }) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <UserCircle2 className="h-4 w-4 text-muted-foreground" /> Profile
          </CardTitle>
          <CardDescription>Used to pre-fill new resumes.</CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm user={user} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <KeyRound className="h-4 w-4 text-muted-foreground" /> Password
          </CardTitle>
          <CardDescription>{user.hasPassword ? "Change your password." : "Set a password for this account."}</CardDescription>
        </CardHeader>
        <CardContent>{user.hasPassword ? <PasswordForm /> : <SetPasswordNote />}</CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Plan</CardTitle>
          <CardDescription>Your current subscription.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Badge variant={user.plan === "PRO" ? "success" : "secondary"}>{user.plan === "PRO" ? "Pro" : "Free"}</Badge>
              {user.plan === "PRO" && (
                <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                  <Check className="h-3 w-3" /> All features unlocked
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {user.plan === "PRO"
                ? "You're on the Pro plan. Manage billing from the billing page."
                : "Free plan: 3 resumes, 10 AI credits/day, 3 ATS scans/day."}
            </p>
          </div>
          <Button asChild variant={user.plan === "PRO" ? "outline" : "default"}>
            <Link href="/billing">{user.plan === "PRO" ? "Manage billing" : "Upgrade to Pro"}</Link>
          </Button>
        </CardContent>
      </Card>

      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base text-destructive">
            <Trash2 className="h-4 w-4" /> Danger zone
          </CardTitle>
          <CardDescription>Permanently delete your account and all data.</CardDescription>
        </CardHeader>
        <CardContent>
          <DeleteAccount />
        </CardContent>
      </Card>
    </div>
  );
}

function ProfileForm({ user }: { user: SettingsUser }) {
  const [name, setName] = useState(user.name);
  const [targetRole, setTargetRole] = useState(user.targetRole ?? "");
  const [industry, setIndustry] = useState(user.industry ?? "");
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    await updateProfileAction({ name, targetRole, industry });
    setBusy(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <form onSubmit={(e) => void submit(e)} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-xs">Name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Email</Label>
          <Input value={user.email} disabled />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Target role</Label>
          <Input value={targetRole} onChange={(e) => setTargetRole(e.target.value)} placeholder="Senior Frontend Engineer" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Industry</Label>
          <Input value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="Software" />
        </div>
      </div>
      <Button type="submit" disabled={busy}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <Check className="h-4 w-4" /> : null}
        {saved ? "Saved" : "Save profile"}
      </Button>
    </form>
  );
}

function PasswordForm() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await changePasswordAction({ currentPassword: current, newPassword: next });
    if (res?.error) {
      setError(res.error);
      setBusy(false);
      return;
    }
    setCurrent("");
    setNext("");
    setBusy(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <form onSubmit={(e) => void submit(e)} className="space-y-4">
      <div className="space-y-1.5">
        <Label className="text-xs">Current password</Label>
        <Input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">New password</Label>
        <Input type="password" value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" placeholder="8+ characters, letters and numbers" />
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
      <Button type="submit" disabled={busy || !current || !next}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <Check className="h-4 w-4" /> : null}
        {saved ? "Updated" : "Update password"}
      </Button>
    </form>
  );
}

function SetPasswordNote() {
  return (
    <p className="text-sm text-muted-foreground">
      This account uses social login. You can still log in with your social provider.{" "}
      <span className="font-medium text-foreground">We don&apos;t yet support adding a password to social accounts.</span>
    </p>
  );
}

function DeleteAccount() {
  const [busy, setBusy] = useState(false);
  return (
    <Button
      variant="destructive"
      disabled={busy}
      onClick={() => {
        if (!confirm("This permanently deletes your account, resumes, and data. Continue?")) return;
        setBusy(true);
        void deleteAccountAction();
      }}
    >
      {busy && <Loader2 className="h-4 w-4 animate-spin" />}
      Delete account
    </Button>
  );
}
