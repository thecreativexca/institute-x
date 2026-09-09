import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/helpers";
import { connectDB } from "@/lib/db/connect";
import { Internship } from "@/models/Internship";
import { Course } from "@/models/Course";
import { OfficeShell } from "@/components/office/OfficeShell";
import { AdminInternshipsClient } from "./AdminInternshipsClient";
import { serialize } from "@/lib/internships/service";
export const metadata: Metadata = {
  title: "Internships | Office",
  robots: { index: false, follow: false },
};
export default async function Page() {
  const { user } = await requireAdmin();
  await connectDB();
  const [rows, courses] = await Promise.all([
    Internship.find()
      .populate("eligibleCourses", "name")
      .sort({ updatedAt: -1 })
      .lean(),
    Course.find({ status: { $ne: "archived" } })
      .select("name")
      .sort({ name: 1 })
      .lean(),
  ]);
  return (
    <OfficeShell session={user!}>
      <AdminInternshipsClient
        initial={rows.map(serialize)}
        courses={courses.map(serialize)}
      />
    </OfficeShell>
  );
}
