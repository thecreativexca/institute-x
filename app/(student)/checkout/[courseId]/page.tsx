import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { getValidatedStudent } from "@/lib/auth/helpers";
import { Course } from "@/lib/mongodb/models";
import { connectDB } from "@/lib/db/connect";
import { Types } from "mongoose";
import { CheckoutClient } from "./CheckoutClient";
import { FreeEnrollmentClient } from "./FreeEnrollmentClient";
import { ENROLLMENT_STATUSES } from "@/lib/constants";

interface CheckoutPageProps {
  params: Promise<{ courseId: string }>;
}

export const metadata: Metadata = {
  title: "Checkout",
  description: "Complete your course purchase",
  robots: { index: false, follow: false },
};

interface CheckoutCourse {
  _id: string;
  name: string;
  slug: string;
  shortDescription?: string;
  level: string;
  durationWeeks?: number;
  thumbnailUrl?: string;
  price?: number;
  compareAtPrice?: number;
  currency: string;
  isFree?: boolean;
  isPurchasable?: boolean;
  status: string;
}

export default async function CheckoutPage({ params }: CheckoutPageProps) {
  const { courseId } = await params;

  // Validate student session
  const { user: student, error } = await getValidatedStudent();
  if (!student || error) {
    redirect(`/login?callbackUrl=${encodeURIComponent(`/checkout/${courseId}`)}`);
  }

  await connectDB();

  const courseQuery = Types.ObjectId.isValid(courseId)
    ? { _id: new Types.ObjectId(courseId) }
    : { slug: courseId };

  const course = await Course.findOne(courseQuery)
    .select("name slug shortDescription level durationWeeks thumbnailUrl price compareAtPrice currency isFree isPurchasable status")
    .lean();

  if (!course) {
    notFound();
  }

  // Check course availability
  if (course.status !== "published") {
    notFound();
  }

  if (!course.isPurchasable) {
    notFound();
  }

  // Check if already enrolled
  const { Enrollment } = await import("@/lib/mongodb/models");
  const existingEnrollment = await Enrollment.findOne({
    student: new Types.ObjectId(student.id),
    course: new Types.ObjectId(courseId),
    status: { $in: [ENROLLMENT_STATUSES.ACTIVE, ENROLLMENT_STATUSES.COMPLETED] },
  }).lean();

  if (existingEnrollment) {
    redirect(`/student/courses/${course._id.toString()}`);
  }

  // Handle free courses
  if (course.isFree || (course.price ?? 0) === 0) {
    return (
      <FreeEnrollmentClient
        course={{
          id: course._id.toString(),
          name: course.name,
          slug: course.slug,
          shortDescription: course.shortDescription,
        }}
      />
    );
  }

  // Convert ObjectId to string for client component
  const checkoutCourse: CheckoutCourse = {
    _id: course._id.toString(),
    name: course.name,
    slug: course.slug,
    shortDescription: course.shortDescription,
    level: course.level,
    durationWeeks: course.durationWeeks,
    thumbnailUrl: course.thumbnailUrl,
    price: course.price,
    compareAtPrice: course.compareAtPrice,
    currency: course.currency,
    isFree: course.isFree,
    isPurchasable: course.isPurchasable,
    status: course.status,
  };

  return <CheckoutClient course={checkoutCourse} student={student} />;
}
