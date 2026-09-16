"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
  const mounted = useRef(false);

  const start = useCallback(async () => {
    if (started.current) return;
    started.current = true;
    try {
      const res = await fetch(`/api/student/quizzes/${quizId}/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json().catch(() => null);
      if (!mounted.current) return;
      if (!res.ok || !data?.redirect) {
        setError(data?.error || "Unable to start the test. Please try again.");
        started.current = false;
        return;
      }
      router.replace(data.redirect);
    } catch {
      if (!mounted.current) return;
      setError("Unable to start the test. Please try again.");
      started.current = false;
    }
  }, [quizId, router]);

  useEffect(() => {
    mounted.current = true;
    queueMicrotask(() => void start());
    return () => {
      mounted.current = false;
    };
  }, [start]);

  return (
    <Container className="py-10">
      <Card className="mx-auto max-w-lg">
        <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
          {error ? (
            <>
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
              <div className="flex flex-wrap justify-center gap-3">
                <Button onClick={() => { setError(null); void start(); }}>Retry</Button>
                <Button asChild variant="outline">
                  <Link href={`/student/quizzes/${quizId}`}>Back to Test</Link>
                </Button>
              </div>
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
