import { redirect } from "next/navigation";

import { StudentShell } from "@/components/student/StudentShell";
import { getValidatedStudent } from "@/lib/auth/helpers";
import { connectDB } from "@/lib/db/connect";
import { User } from "@/models/User";

export default async function StudentPaymentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user: session, error } = await getValidatedStudent();

  if (!session || error) {
    redirect("/login?reauth=1");
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
