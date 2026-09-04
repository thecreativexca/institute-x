"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Calendar, AlertCircle, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface CourseOption {
  id: string;
  name: string;
}

interface ModuleOption {
  id: string;
  title: string;
}

interface LessonOption {
  id: string;
  title: string;
}

interface AssignmentData {
  id: string;
  title: string;
  instructions: string;
  dueAt: string | null;
  maxScore: number;
  isPublished: boolean;
  courseId: string;
  moduleId?: string | null;
  lessonId?: string | null;
  totalSubmissions: number;
  gradedSubmissions: number;
}

interface EditAssignmentFormProps {
  assignment: AssignmentData;
  courseOptions: CourseOption[];
  initialModules: ModuleOption[];
  initialLessons: LessonOption[];
}

/** Render a stored instant (ISO/UTC) as a local <input type="datetime-local"> value. */
function toLocalInputValue(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function EditAssignmentForm({
  assignment,
  courseOptions,
  initialModules,
  initialLessons,
}: EditAssignmentFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modules, setModules] = useState<ModuleOption[]>(initialModules);
  const [lessons, setLessons] = useState<LessonOption[]>(initialLessons);
  const [selectedCourse, setSelectedCourse] = useState(assignment.courseId);
  const [selectedModule, setSelectedModule] = useState(assignment.moduleId || "");
  const [selectedLesson, setSelectedLesson] = useState(assignment.lessonId || "");
  const [formData, setFormData] = useState({
    title: assignment.title,
    instructions: assignment.instructions,
    dueAt: assignment.dueAt ? toLocalInputValue(assignment.dueAt) : "",
    maxScore: assignment.maxScore.toString(),
    isPublished: assignment.isPublished,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const warnings = useMemo(() => {
    const newWarnings: string[] = [];
    if (assignment.totalSubmissions > 0) {
      newWarnings.push(`This assignment has ${assignment.totalSubmissions} submission(s). Changes to deadline or max marks may affect grading.`);
    }
    if (assignment.gradedSubmissions > 0) {
      newWarnings.push(`There are ${assignment.gradedSubmissions} graded submission(s). Reducing max marks below existing scores is not allowed.`);
    }
    return newWarnings;
  }, [assignment.totalSubmissions, assignment.gradedSubmissions]);

  const handleCourseChange = async (courseId: string) => {
    setSelectedCourse(courseId);
    setSelectedModule("");
    setSelectedLesson("");
    setModules([]);
    setLessons([]);
    if (courseId) {
      try {
        const res = await fetch(`/api/office/assignments?action=modules&courseId=${courseId}`);
        const data = await res.json();
        if (data.modules) setModules(data.modules);
      } catch (e) {
        console.error("Failed to load modules:", e);
      }
    }
  };

  const handleModuleChange = async (moduleId: string) => {
    setSelectedModule(moduleId);
    setSelectedLesson("");
    setLessons([]);
    if (moduleId) {
      try {
        const res = await fetch(`/api/office/assignments?action=lessons&moduleId=${moduleId}`);
        const data = await res.json();
        if (data.lessons) setLessons(data.lessons);
      } catch (e) {
        console.error("Failed to load lessons:", e);
      }
    }
  };

  const handleLessonChange = (lessonId: string) => {
    setSelectedLesson(lessonId);
  };

  const handleInputChange = (name: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!selectedCourse) newErrors.courseId = "Course is required";
    if (!formData.title.trim()) newErrors.title = "Title is required";
    if (!formData.instructions.trim()) newErrors.instructions = "Instructions are required";
    if (!formData.maxScore || parseInt(formData.maxScore, 10) < 1) {
      newErrors.maxScore = "Max score must be at least 1";
    }
    if (formData.dueAt) {
      const dueDate = new Date(formData.dueAt);
      if (isNaN(dueDate.getTime())) newErrors.dueAt = "Invalid date format";
    }
    const newMaxScore = parseInt(formData.maxScore, 10);
    if (assignment.gradedSubmissions > 0 && newMaxScore < assignment.maxScore) {
      newErrors.maxScore = `Cannot reduce max score below ${assignment.maxScore} (${assignment.gradedSubmissions} graded submissions exist)`;
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
      body.set("title", formData.title.trim());
      body.set("instructions", formData.instructions.trim());
      // datetime-local holds a naive local time; send the real instant so the
      // server stores the moment the admin picked, regardless of server TZ.
      // An empty value means "clear the deadline" (PATCH treats "" as null).
      body.set("dueAt", formData.dueAt ? new Date(formData.dueAt).toISOString() : "");
      body.set("maxScore", formData.maxScore);
      if (selectedModule) body.set("moduleId", selectedModule);
      if (selectedLesson) body.set("lessonId", selectedLesson);
      body.set("isPublished", formData.isPublished.toString());

      const res = await fetch(`/api/office/assignments/${assignment.id}`, {
        method: "PATCH",
        body,
      });

      const data = await res.json();
      if (res.ok && data.success) {
        router.push(`/office/assignments/${assignment.id}`);
        router.refresh();
      } else {
        setErrors({ form: data.error || "Failed to update assignment" });
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

      {warnings.length > 0 && (
        <div className="rounded-md bg-amber-50 border border-amber-200 p-4">
          <div className="flex items-start gap-2 text-amber-800">
            <AlertTriangle className="h-5 w-5 mt-0.5 shrink-0" aria-hidden="true" />
            <ul className="space-y-1">
              {warnings.map((warning, i) => (
                <li key={i} className="text-sm">{warning}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

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

      {modules.length > 0 && (
        <div>
          <Label htmlFor="moduleId">Module (Optional)</Label>
          <Select
            value={selectedModule}
            onValueChange={handleModuleChange}
            className="mt-1 w-full"
          >
            <SelectTrigger id="moduleId">
              <SelectValue placeholder="Select a module" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">No module</SelectItem>
              {modules.map((module) => (
                <SelectItem key={module.id} value={module.id}>
                  {module.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {lessons.length > 0 && (
        <div>
          <Label htmlFor="lessonId">Lesson (Optional)</Label>
          <Select
            value={selectedLesson}
            onValueChange={handleLessonChange}
            className="mt-1 w-full"
          >
            <SelectTrigger id="lessonId">
              <SelectValue placeholder="Select a lesson" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">No lesson</SelectItem>
              {lessons.map((lesson) => (
                <SelectItem key={lesson.id} value={lesson.id}>
                  {lesson.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
          placeholder="e.g., Chapter 1: Introduction to Programming"
          className={cn(errors.title && "border-red-500 focus:border-red-500 focus:ring-red-500")}
          maxLength={200}
        />
        {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
      </div>

      <div>
        <Label htmlFor="instructions" className="required">
          Instructions
        </Label>
        <Textarea
          id="instructions"
          value={formData.instructions}
          onChange={(e) => handleInputChange("instructions", e.target.value)}
          placeholder="Provide detailed instructions for the assignment..."
          rows={6}
          className={cn(errors.instructions && "border-red-500 focus:border-red-500 focus:ring-red-500")}
        />
        {errors.instructions && <p className="mt-1 text-sm text-red-600">{errors.instructions}</p>}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="dueAt">Deadline (Optional)</Label>
          <div className="relative mt-1">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" aria-hidden="true" />
            <input
              id="dueAt"
              type="datetime-local"
              value={formData.dueAt}
              onChange={(e) => handleInputChange("dueAt", e.target.value)}
              className={cn(
                "block w-full rounded-md border border-slate-300 bg-white px-10 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500",
                errors.dueAt && "border-red-500 focus:border-red-500 focus:ring-red-500"
              )}
            />
          </div>
          {errors.dueAt && <p className="mt-1 text-sm text-red-600">{errors.dueAt}</p>}
        </div>

        <div>
          <Label htmlFor="maxScore" className="required">
            Maximum Marks
          </Label>
          <Input
            id="maxScore"
            type="number"
            min="1"
            max="10000"
            value={formData.maxScore}
            onChange={(e) => handleInputChange("maxScore", e.target.value)}
            placeholder="100"
            className={cn(errors.maxScore && "border-red-500 focus:border-red-500 focus:ring-red-500")}
          />
          {errors.maxScore && <p className="mt-1 text-sm text-red-600">{errors.maxScore}</p>}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Checkbox
          id="isPublished"
          checked={formData.isPublished}
          onCheckedChange={(checked) => handleInputChange("isPublished", checked)}
        />
        <Label htmlFor="isPublished" className="cursor-pointer text-sm text-slate-700">
          Publish (students will see this assignment)
        </Label>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
        <Button type="button" variant="outline" asChild>
          <a href={`/office/assignments/${assignment.id}`}>Cancel</a>
        </Button>
        <Button type="submit" disabled={isSubmitting} className="gap-2">
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Saving...
            </>
          ) : (
            <>
              Save Changes
            </>
          )}
        </Button>
      </div>
    </form>
  );
}