import { getValidatedStudent } from "@/lib/auth/helpers";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db/connect";
import { User } from "@/models/User";

import { StudentShell } from "@/components/student/StudentShell";

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user: session, error } = await getValidatedStudent();

  if (!session || error) {
    redirect("/login");
  }

  await connectDB();
  const user = await User.findById(session.id).select("avatarUrl").lean();

  return (
    <StudentShell
      session={{
        id: session.id,
        name: session.name,
        email: session.email,
        role: session.role,
        avatarUrl: user?.avatarUrl,
      }}
    >
      {children}
    </StudentShell>
  );
}