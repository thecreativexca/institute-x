import { Suspense } from "react";

import { ShieldCheck } from "lucide-react";
import { OfficeAuthShell } from "@/components/office/office-auth-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { OfficeLoginForm } from "./OfficeLoginForm";

export default function OfficeLoginPage() {
  return (
    <OfficeAuthShell>
      <Card className="office-auth-card rounded-3xl">
        <CardHeader className="items-center px-6 pb-4 pt-8 text-center sm:px-8">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-100 text-accent-800">
            <ShieldCheck className="h-6 w-6" aria-hidden="true" />
          </span>
          <CardTitle as="h1" className="mt-3">Office Portal Login</CardTitle>
          <CardDescription>
            Secure access for administrators, office staff, content managers, and faculty.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-6 pb-8 sm:px-8">
          <Suspense fallback={null}>
            <OfficeLoginForm />
          </Suspense>
        </CardContent>
      </Card>
    </OfficeAuthShell>
  );
}