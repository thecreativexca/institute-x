import { notFound } from "next/navigation";
import { requireStudent } from "@/lib/auth/helpers";
import { getStudentProjectDetail } from "@/lib/internships/service";
import { StudentProjectDetail } from "./StudentProjectDetail";
export default async function Page({
  params,
}: PageProps<"/student/projects/[projectId]">) {
  const { user } = await requireStudent(),
    { projectId } = await params;
  let row;
  try {
    row = await getStudentProjectDetail(projectId, user!.id);
  } catch {
    notFound();
  }
  if (!row) notFound();
  return <StudentProjectDetail project={row} />;
}
