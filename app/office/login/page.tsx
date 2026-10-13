import { Suspense } from "react";

import { ShieldCheck } from "lucide-react";
import { OfficeAuthShell } from "@/components/office/office-auth-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { OfficeLoginForm } from "./OfficeLoginForm";

export default function OfficeLoginPage() {
  return (
    <OfficeAuthShell>
      <Card className="office-auth-card rounded-3xl">
        <CardHeader className="items-center px-3 pb-3 pt-5 text-center sm:px-8 sm:pb-4 sm:pt-8">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-100 text-accent-800">
            <ShieldCheck className="h-6 w-6" aria-hidden="true" />
          </span>
          <CardTitle as="h1" className="mt-3">Office Portal Login</CardTitle>
          <CardDescription>
            Secure access for administrators, office staff, content managers, and faculty.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-3 pb-5 sm:px-8 sm:pb-8">
          <Suspense fallback={null}>
            <OfficeLoginForm />
          </Suspense>
        </CardContent>
      </Card>
    </OfficeAuthShell>
  );
}
