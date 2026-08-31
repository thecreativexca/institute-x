"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { Spinner } from "@/components/ui/loading";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function StudentQuizStartPage() {
  const router = useRouter();
  const params = useParams<{ quizId: string }>();
  const quizId = params.quizId as string;
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/student/quizzes/${quizId}/start`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setError(data.error || "Unable to start the test.");
          return;
        }
        router.replace(data.redirect);
        router.refresh();
      } catch {
        if (cancelled) return;
        setError("Unable to start the test. Please try again.");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [quizId, router]);

  return (
    <Container className="py-10">
      <Card className="mx-auto max-w-lg">
        <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
          {error ? (
            <>
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
              <Button asChild variant="outline">
                <Link href={`/student/quizzes/${quizId}`}>
                  Back to Test
                </Link>
              </Button>
            </>
          ) : (
            <>
              <Spinner />
              <p className="text-sm text-slate-600">
                Starting your test… This may take a moment.
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </Container>
  );
}
