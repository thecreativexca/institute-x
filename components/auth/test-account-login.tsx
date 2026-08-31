"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Shield, Briefcase, BookOpen, GraduationCap, AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

/** A single quick-login test account supplied as props by a Server Component. */
export interface TestAccountRoleItem {
  key: string;
  name: string;
  email: string;
  description: string;
  role: string;
}

/** Non-sensitive icon selection keyed by role. */
function roleIcon(key: string) {
  switch (key) {
    case "SUPER_ADMIN":
      return <Shield className="h-5 w-5" />;
    case "OFFICE_STAFF":
      return <Briefcase className="h-5 w-5" />;
    case "CONTENT_MANAGER":
      return <BookOpen className="h-5 w-5" />;
    case "FACULTY":
    case "STUDENT":
    default:
      return <GraduationCap className="h-5 w-5" />;
  }
}

interface TestAccountCardProps {
  name: string;
  email: string;
  description: string;
  role: string;
  icon: React.ReactNode;
  onClick: () => void;
  isLoading: boolean;
  disabled: boolean;
}

function TestAccountCard({ name, email, description, role, icon, onClick, isLoading, disabled }: TestAccountCardProps) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-primary-100 bg-white/90 p-4 transition-colors hover:border-primary-200 hover:bg-primary-50/60">
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary-100 text-primary-700">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="truncate font-medium text-primary-950">{name}</span>
          <span className="whitespace-nowrap rounded-full bg-accent-100 px-2 py-0.5 text-xs font-semibold text-accent-900">
            {role}
          </span>
        </div>
        <p className="truncate text-sm text-primary-700/70">{description}</p>
        <p className="truncate font-mono text-xs text-primary-700/55">{email}</p>
      </div>
      <Button
        onClick={onClick}
        disabled={isLoading || disabled}
        size="sm"
        className="flex-shrink-0"
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          "Quick Login"
        )}
      </Button>
    </div>
  );
}

interface TestAccountLoginProps {
  roles: TestAccountRoleItem[];
  title: string;
  description?: string;
  password?: string;
}

export function TestAccountLogin({ roles, title, description, password }: TestAccountLoginProps) {
  const router = useRouter();
  const [loadingRole, setLoadingRole] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleQuickLogin = async (roleKey: string) => {
    setLoadingRole(roleKey);
    setError(null);

    try {
      const response = await fetch("/api/dev/test-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testRole: roleKey }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Quick login failed");
        return;
      }

      // Redirect to the appropriate page
      router.replace(data.redirect);
      router.refresh();
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoadingRole(null);
    }
  };

  const anyLoading = loadingRole !== null;

  return (
    <Collapsible className="w-full">
      <CollapsibleTrigger className="w-full">
        <Card className="border-accent-200 bg-accent-50/80 shadow-none">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-accent-700" />
              <CardTitle className="text-base font-semibold text-primary-950">{title}</CardTitle>
            </div>
            <CardDescription className="text-xs text-primary-800/70">
              {description || "Development only — these accounts are disabled in production."}
            </CardDescription>
          </CardHeader>
        </Card>
      </CollapsibleTrigger>
      <CollapsibleContent className="w-full">
        <Card className="mt-2 border-accent-200 bg-accent-50/70 shadow-none">
          <CardContent className="pt-4">
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription className="text-sm">{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-3" role="list" aria-label="Test accounts">
              {roles.map((account) => (
                <TestAccountCard
                  key={account.key}
                  name={account.name}
                  email={account.email}
                  description={account.description}
                  role={account.role}
                  icon={roleIcon(account.key)}
                  onClick={() => handleQuickLogin(account.key)}
                  isLoading={loadingRole === account.key}
                  disabled={anyLoading && loadingRole !== account.key}
                />
              ))}
            </div>

            <p className="mt-4 text-center text-xs text-primary-800/70">
              {password ? (
                <>
                  Password for all accounts:{" "}
                  <code className="rounded bg-accent-100 px-1 font-mono text-accent-900">{password}</code>
                </>
              ) : (
                "Use the Quick Login buttons above — no password entry needed."
              )}
            </p>
          </CardContent>
        </Card>
      </CollapsibleContent>
    </Collapsible>
  );
}


