"use client";

import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface CheckoutCourse {
  _id: string;
  name: string;
  slug: string;
  shortDescription?: string;
  level: string;
  durationWeeks?: number;
  thumbnailUrl?: string;
  price?: number;
  currency: string;
}

export function CheckoutClient({ course, student }: { course: CheckoutCourse; student: { name: string; email: string; phone?: string } }) {
  const amount = new Intl.NumberFormat("en-IN", { style: "currency", currency: course.currency || "INR", maximumFractionDigits: 2 }).format(course.price ?? 0);
  return <main className="min-h-screen bg-slate-50 px-4 py-12"><div className="mx-auto max-w-4xl space-y-6">
    <nav className="text-sm text-slate-500"><Link href={`/courses/${course.slug}`} className="hover:text-slate-800">← Back to course</Link></nav>
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-6"><Card className="p-6"><div className="flex flex-col gap-4 sm:flex-row">{course.thumbnailUrl ? <Image src={course.thumbnailUrl} alt="" width={192} height={128} className="h-32 w-48 rounded-lg object-cover" /> : null}<div><p className="text-xs font-semibold uppercase tracking-wide text-primary-600">Admission information</p><h1 className="mt-1 text-2xl font-bold text-slate-900">{course.name}</h1><p className="mt-2 text-sm leading-6 text-slate-600">{course.shortDescription}</p><p className="mt-3 text-sm text-slate-500">{course.durationWeeks ? `${course.durationWeeks} weeks · ` : ""}{course.level.replaceAll("_", " ")}</p></div></div></Card>
      <Card className="p-6"><h2 className="font-semibold text-slate-900">Student information</h2><dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2"><div><dt className="text-slate-500">Name</dt><dd className="font-medium">{student.name}</dd></div><div><dt className="text-slate-500">Email</dt><dd className="font-medium">{student.email}</dd></div>{student.phone ? <div><dt className="text-slate-500">Phone</dt><dd className="font-medium">{student.phone}</dd></div> : null}</dl></Card></div>
      <Card className="h-fit p-6 lg:sticky lg:top-24"><p className="text-sm text-slate-500">Course fee</p><p className="mt-1 text-3xl font-bold text-slate-900">{amount}</p><div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950"><strong className="block">Payment is handled by the institute office.</strong>Please contact the institute to complete admission. After payment is received, an administrator will record and verify it in your account.</div><Button asChild className="mt-5 w-full"><Link href="/contact">Contact institute</Link></Button><Button asChild variant="outline" className="mt-3 w-full"><Link href="/student/payments">View fee status</Link></Button></Card>
    </div>
  </div></main>;
}
