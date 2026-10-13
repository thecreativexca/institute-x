import { Suspense } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail } from "lucide-react";
import { LoginForm } from "./LoginForm";

export default function LoginPage() {
  return (
    <Card className="auth-card">
      <CardHeader className="items-center px-3 pb-3 pt-5 text-center sm:px-8 sm:pb-4 sm:pt-8">
        <div className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-100 text-accent-800">
          <Mail className="h-6 w-6" aria-hidden="true" />
        </div>
        <CardTitle as="h1">Student Login</CardTitle>
        <CardDescription>
          Access your courses, track progress, and manage your account.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-3 pb-5 sm:px-8 sm:pb-8">
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </CardContent>
    </Card>
  );
}
