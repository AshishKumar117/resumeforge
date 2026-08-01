import Link from "next/link";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { verifyEmailAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ResendVerificationButton } from "./resend-button";

async function VerifyContent({ token }: { token?: string }) {
  if (!token) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
          <AlertCircle className="h-10 w-10 text-amber-500" />
          <h1 className="text-lg font-semibold">Missing verification token</h1>
          <p className="text-sm text-muted-foreground">Open the link from your verification email to continue.</p>
        </CardContent>
      </Card>
    );
  }

  const result = await verifyEmailAction(token);

  if (result?.error) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
          <AlertCircle className="h-10 w-10 text-rose-500" />
          <h1 className="text-lg font-semibold">Link invalid or expired</h1>
          <p className="text-sm text-muted-foreground">{result.error}</p>
          <ResendVerificationButton />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
        <CheckCircle2 className="h-10 w-10 text-emerald-500" />
        <h1 className="text-lg font-semibold">Email verified!</h1>
        <p className="text-sm text-muted-foreground">Your account is now fully activated.</p>
        <Button asChild className="mt-2">
          <Link href="/dashboard">Go to dashboard</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  return <VerifyContent token={token} />;
}
