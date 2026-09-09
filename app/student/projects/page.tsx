import type { Metadata } from "next";
import { requireStudent } from "@/lib/auth/helpers";
import { listStudentProjects } from "@/lib/internships/service";
import { StudentProjectsClient } from "./StudentProjectsClient";

export const metadata: Metadata = {
  title: "Projects",
  robots: { index: false, follow: false },
};

export default async function Page() {
  const { user } = await requireStudent();
  return <StudentProjectsClient rows={await listStudentProjects(user!.id)} />;
}
