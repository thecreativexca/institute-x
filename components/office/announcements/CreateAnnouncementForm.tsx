"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, AlertCircle, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface CourseOption {
  id: string;
  name: string;
}

interface CreateAnnouncementFormProps {
  courseOptions: CourseOption[];
}

export function CreateAnnouncementForm({ courseOptions }: CreateAnnouncementFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedAudience, setSelectedAudience] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    body: "",
    isActive: true,
    sendEmail: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (name: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleAudienceChange = (value: string) => {
    setSelectedAudience(value);
    setSelectedCourse("");
    if (errors.courseId) {
      setErrors((prev) => ({ ...prev, courseId: "" }));
    }
  };

  const handleCourseChange = (value: string) => {
    setSelectedCourse(value);
    if (errors.courseId) {
      setErrors((prev) => ({ ...prev, courseId: "" }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.title.trim()) newErrors.title = "Title is required";
    if (!formData.body.trim()) newErrors.body = "Body is required";
    if (!selectedAudience) newErrors.audience = "Audience is required";
    if (selectedAudience === "students" && !selectedCourse) {
      newErrors.courseId = "Course is required for course-specific announcements";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const body = new FormData();
      body.set("action", "create");
      body.set("title", formData.title.trim());
      body.set("body", formData.body.trim());
      body.set("audience", selectedAudience);
      if (selectedCourse) body.set("courseId", selectedCourse);
      body.set("isActive", formData.isActive.toString());
      body.set("sendEmail", formData.sendEmail.toString());

      const res = await fetch("/api/office/announcements", {
        method: "POST",
        body,
      });

      const data = await res.json();
      if (res.ok && data.success) {
        router.push(`/office/announcements/${data.announcementId}`);
        router.refresh();
      } else {
        setErrors({ form: data.error || "Failed to create announcement" });
      }
    } catch (error) {
      setErrors({ form: "An unexpected error occurred" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      {errors.form && (
        <div className="rounded-md bg-red-50 border border-red-200 p-4">
          <div className="flex items-center gap-2 text-red-800">
            <AlertCircle className="h-5 w-5" aria-hidden="true" />
            <span>{errors.form}</span>
          </div>
        </div>
      )}

      <div>
        <Label htmlFor="audience" className="required">
          Audience
        </Label>
        <Select
          value={selectedAudience}
          onValueChange={handleAudienceChange}
          className={cn("mt-1 w-full", errors.audience && "border-red-500 focus:border-red-500 focus:ring-red-500")}
        >
          <SelectTrigger id="audience">
            <SelectValue placeholder="Select audience" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Students</SelectItem>
            <SelectItem value="students">Course Students</SelectItem>
          </SelectContent>
        </Select>
        {errors.audience && <p className="mt-1 text-sm text-red-600">{errors.audience}</p>}
      </div>

      {selectedAudience === "students" && (
        <div>
          <Label htmlFor="courseId" className="required">
            Course
          </Label>
          <Select
            value={selectedCourse}
            onValueChange={handleCourseChange}
            className={cn("mt-1 w-full", errors.courseId && "border-red-500 focus:border-red-500 focus:ring-red-500")}
          >
            <SelectTrigger id="courseId">
              <SelectValue placeholder="Select a course" />
            </SelectTrigger>
            <SelectContent>
              {courseOptions.map((course) => (
                <SelectItem key={course.id} value={course.id}>
                  {course.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.courseId && <p className="mt-1 text-sm text-red-600">{errors.courseId}</p>}
        </div>
      )}

      <div>
        <Label htmlFor="title" className="required">
          Title
        </Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => handleInputChange("title", e.target.value)}
          placeholder="e.g., Mid-term Exam Schedule Updated"
          className={cn(errors.title && "border-red-500 focus:border-red-500 focus:ring-red-500")}
          maxLength={200}
        />
        {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
      </div>

      <div>
        <Label htmlFor="body" className="required">
          Body
        </Label>
        <Textarea
          id="body"
          value={formData.body}
          onChange={(e) => handleInputChange("body", e.target.value)}
          placeholder="Write your announcement content here..."
          rows={8}
          className={cn(errors.body && "border-red-500 focus:border-red-500 focus:ring-red-500")}
        />
        {errors.body && <p className="mt-1 text-sm text-red-600">{errors.body}</p>}
      </div>

      <div className="flex items-center gap-3">
        <Checkbox
          id="isActive"
          checked={formData.isActive}
          onCheckedChange={(checked) => handleInputChange("isActive", checked)}
        />
        <Label htmlFor="isActive" className="cursor-pointer text-sm text-slate-700">
          Publish immediately (visible to audience)
        </Label>
      </div>

      <div className="flex items-center gap-3">
        <Checkbox
          id="sendEmail"
          checked={formData.sendEmail}
          onCheckedChange={(checked) => handleInputChange("sendEmail", checked)}
          disabled={!formData.isActive}
        />
        <Label htmlFor="sendEmail" className={cn("cursor-pointer text-sm text-slate-700", !formData.isActive && "text-slate-400")}>
          Send email notification to recipients
        </Label>
      </div>

      {!formData.isActive && formData.sendEmail && (
        <div className="flex items-start gap-2 text-amber-800 bg-amber-50 p-3 rounded-lg">
          <AlertTriangle className="h-5 w-5 mt-0.5 shrink-0" aria-hidden="true" />
          <span className="text-sm">
            Emails will only be sent when the announcement is published.
          </span>
        </div>
      )}

      <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
        <Button type="button" variant="outline" asChild>
          <Link href="/office/announcements">Cancel</Link>
        </Button>
        <Button type="submit" disabled={isSubmitting} className="gap-2">
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Creating...
            </>
          ) : (
            <>
              Create Announcement
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
