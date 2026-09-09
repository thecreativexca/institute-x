import type { Metadata } from "next";
import Link from "next/link";
import { CalendarClock, MapPin, UserRound } from "lucide-react";
import { redirect } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { getValidatedStudent } from "@/lib/auth/helpers";
import { listStudentSessions } from "@/lib/student/portal";

export const metadata: Metadata = { title: "Sessions", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function StudentSessionsPage() {
  const { user, error } = await getValidatedStudent();
  if (!user || error) redirect("/login?reauth=1");
  const sessions = await listStudentSessions(user.id);
  const today = new Date(new Date().toDateString());
  const upcoming = sessions.filter((session) => new Date(session.date) >= today && session.status === "scheduled");
  const upcomingIds = new Set(upcoming.map((session) => session.id));
  const history = sessions.filter((session) => !upcomingIds.has(session.id));

  return (
    <div className="space-y-6">
      <header className="student-page-header">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-600">Class calendar</p>
        <h1 className="mt-1.5 text-2xl font-bold text-slate-900 sm:text-3xl">Sessions</h1>
        <p className="mt-1 text-sm text-slate-600">Upcoming venue classes and your session history.</p>
      </header>
      {!sessions.length ? (
        <EmptyState icon={<CalendarClock className="h-10 w-10" />} title="No sessions scheduled" description="Sessions for your enrolled courses will appear here." />
      ) : (
        <><SessionGroup title="Upcoming" sessions={upcoming} empty="No upcoming sessions." /><SessionGroup title="History" sessions={history} empty="No previous sessions." /></>
      )}
    </div>
  );
}

function SessionGroup({ title, sessions, empty }: { title: string; sessions: Awaited<ReturnType<typeof listStudentSessions>>; empty: string }) {
  return (
    <section>
      <h2 className="mb-3 text-lg font-semibold text-slate-900">{title}</h2>
      {sessions.length ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {sessions.map((session) => (
            <Card key={session.id}><CardContent className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-primary-700">{session.course.id ? <Link href={`/student/courses/${session.course.id}`}>{session.course.name}</Link> : session.course.name}</p>
                  <h3 className="mt-1 text-lg font-semibold text-slate-900">{session.title}</h3>
                </div>
                <Badge variant={session.status === "scheduled" ? "primary" : session.status === "completed" ? "success" : "danger"}>{session.status}</Badge>
              </div>
              <dl className="mt-4 space-y-2 text-sm text-slate-600">
                <div className="flex gap-2"><CalendarClock className="mt-0.5 h-4 w-4 text-primary-600" /><span>{new Date(session.date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}{session.startTime ? ` · ${session.startTime}${session.endTime ? `–${session.endTime}` : ""}` : ""}</span></div>
                <div className="flex gap-2"><MapPin className="mt-0.5 h-4 w-4 text-primary-600" /><span>{session.venue}{session.address ? `, ${session.address}` : ""}</span></div>
                {session.instructorName ? <div className="flex gap-2"><UserRound className="mt-0.5 h-4 w-4 text-primary-600" /><span>{session.instructorName}</span></div> : null}
              </dl>
              {session.notes ? <p className="mt-4 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">{session.notes}</p> : null}
            </CardContent></Card>
          ))}
        </div>
      ) : <p className="rounded-xl border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-500">{empty}</p>}
    </section>
  );
}
