import type { Metadata } from "next";
import { requireStudent } from "@/lib/auth/helpers";
import { listStudentInternships } from "@/lib/internships/service";
import { StudentInternshipsClient } from "./StudentInternshipsClient";
export async function generateMetadata(): Promise<Metadata> {
  return { title: "Internships", robots: { index: false, follow: false } };
}

export default async function Page() {
  const { user } = await requireStudent();
  return (
    <StudentInternshipsClient rows={await listStudentInternships(user!.id)} />
  );
}
