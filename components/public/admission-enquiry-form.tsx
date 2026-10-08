import { RequestForm } from "@/components/public/request-form";

interface AdmissionEnquiryFormProps {
  courses: Array<{ name: string; slug: string }>;
}

export function AdmissionEnquiryForm({ courses }: AdmissionEnquiryFormProps) {
  return <RequestForm type="contact" courses={courses} />;
}
