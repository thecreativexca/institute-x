import type { Metadata } from "next";
import { Megaphone } from "lucide-react";
import { redirect } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { getValidatedStudent } from "@/lib/auth/helpers";
import { listStudentAnnouncements } from "@/lib/student/portal";

export const metadata: Metadata = { title: "Announcements", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function StudentAnnouncementsPage() {
  const { user, error } = await getValidatedStudent();
  if (!user || error) redirect("/login");
  const announcements = await listStudentAnnouncements(user.id);
  return <div className="space-y-6"><header className="student-page-header"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-600">Stay informed</p><h1 className="mt-1.5 text-2xl font-bold text-slate-900 sm:text-3xl">Announcements</h1><p className="mt-1 text-sm text-slate-600">Institute and course updates relevant to your enrollments.</p></header>
    {announcements.length ? <div className="space-y-4">{announcements.map((item) => <Card key={item.id}><CardContent className="p-5 sm:p-6"><div className="flex flex-wrap items-center justify-between gap-2"><div className="flex items-center gap-2">{item.courseName ? <Badge variant="primary">{item.courseName}</Badge> : <Badge variant="success">Institute</Badge>}<time className="text-xs text-slate-500">{new Date(item.publishedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</time></div></div><h2 className="mt-3 text-lg font-semibold text-slate-900">{item.title}</h2><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{item.body}</p></CardContent></Card>)}</div> : <EmptyState icon={<Megaphone className="h-10 w-10" />} title="No announcements" description="New institute and course updates will appear here." />}
  </div>;
}
