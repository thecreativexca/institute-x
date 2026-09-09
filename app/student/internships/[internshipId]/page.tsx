import { notFound } from "next/navigation";
import { requireStudent } from "@/lib/auth/helpers";
import { getStudentInternshipDetail } from "@/lib/internships/service";
import { StudentInternshipDetail } from "./StudentInternshipDetail";
export default async function Page({
  params,
}: PageProps<"/student/internships/[internshipId]">) {
  const { user } = await requireStudent(),
    { internshipId } = await params;
  let data;
  try {
    data = await getStudentInternshipDetail(internshipId, user!.id);
  } catch {
    notFound();
  }
  if (!data) notFound();
  return <StudentInternshipDetail data={data} />;
}
