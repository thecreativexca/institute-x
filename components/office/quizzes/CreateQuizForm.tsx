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
import { Loader2, Calendar, AlertCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { QUIZ_TYPES } from "@/lib/constants";

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

interface CreateQuizFormProps {
  courseOptions: CourseOption[];
}

export function CreateQuizForm({ courseOptions }: CreateQuizFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modules, setModules] = useState<ModuleOption[]>([]);
  const [lessons, setLessons] = useState<LessonOption[]>([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedModule, setSelectedModule] = useState("");
  const [selectedLesson, setSelectedLesson] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    instructions: "",
    type: "module",
    durationMinutes: "",
    passingPercentage: "70",
    maxAttempts: "",
    shuffleQuestions: false,
    shuffleOptions: false,
    showCorrectAnswers: true,
    availableFrom: "",
    availableUntil: "",
    isPublished: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleCourseChange = async (courseId: string) => {
    setSelectedCourse(courseId);
    setSelectedModule("");
    setSelectedLesson("");
    setModules([]);
    setLessons([]);
    if (courseId) {
      try {
        const res = await fetch(`/api/office/quizzes?action=modules&courseId=${courseId}`);
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
        const res = await fetch(`/api/office/quizzes?action=lessons&moduleId=${moduleId}`);
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

  const handleInputChange = (name: string, value: string | boolean | number) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!selectedCourse) newErrors.courseId = "Course is required";
    if (!formData.title.trim()) newErrors.title = "Title is required";
    if (!formData.passingPercentage || parseInt(formData.passingPercentage, 10) < 0 || parseInt(formData.passingPercentage, 10) > 100) {
      newErrors.passingPercentage = "Passing percentage must be between 0 and 100";
    }
    if (formData.durationMinutes && (parseInt(formData.durationMinutes, 10) < 1 || parseInt(formData.durationMinutes, 10) > 600)) {
      newErrors.durationMinutes = "Duration must be between 1 and 600 minutes";
    }
    if (formData.maxAttempts && parseInt(formData.maxAttempts, 10) < 1) {
      newErrors.maxAttempts = "Max attempts must be at least 1";
    }
    if (formData.availableFrom && formData.availableUntil) {
      const from = new Date(formData.availableFrom);
      const until = new Date(formData.availableUntil);
      if (until <= from) newErrors.availableUntil = "Available until must be after available from";
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
      body.set("courseId", selectedCourse);
      if (selectedModule) body.set("moduleId", selectedModule);
      if (selectedLesson) body.set("lessonId", selectedLesson);
      body.set("title", formData.title.trim());
      if (formData.description.trim()) body.set("description", formData.description.trim());
      if (formData.instructions.trim()) body.set("instructions", formData.instructions.trim());
      body.set("type", formData.type);
      if (formData.durationMinutes) body.set("durationMinutes", formData.durationMinutes);
      body.set("passingPercentage", formData.passingPercentage);
      if (formData.maxAttempts) body.set("maxAttempts", formData.maxAttempts);
      body.set("shuffleQuestions", formData.shuffleQuestions.toString());
      body.set("shuffleOptions", formData.shuffleOptions.toString());
      body.set("showCorrectAnswers", formData.showCorrectAnswers.toString());
      if (formData.availableFrom) body.set("availableFrom", formData.availableFrom);
      if (formData.availableUntil) body.set("availableUntil", formData.availableUntil);
      body.set("isPublished", formData.isPublished.toString());

      const res = await fetch("/api/office/quizzes", {
        method: "POST",
        body,
      });

      const data = await res.json();
      if (res.ok && data.success) {
        router.push(`/office/quizzes/${data.quizId}`);
        router.refresh();
      } else {
        setErrors({ form: data.error || "Failed to create quiz" });
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
          placeholder="e.g., Module 1: Introduction to Programming"
          className={cn(errors.title && "border-red-500 focus:border-red-500 focus:ring-red-500")}
          maxLength={200}
        />
        {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
      </div>

      <div>
        <Label htmlFor="description">Description (Optional)</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => handleInputChange("description", e.target.value)}
          placeholder="Brief description of what this quiz covers..."
          rows={3}
          maxLength={1000}
        />
      </div>

      <div>
        <Label htmlFor="instructions">Instructions (Optional)</Label>
        <Textarea
          id="instructions"
          value={formData.instructions}
          onChange={(e) => handleInputChange("instructions", e.target.value)}
          placeholder="Provide instructions for students taking this quiz..."
          rows={4}
          maxLength={4000}
        />
      </div>

      <div>
        <Label htmlFor="type" className="required">
          Quiz Type
        </Label>
        <Select
          value={formData.type}
          onValueChange={(value) => handleInputChange("type", value)}
          className="mt-1 w-full"
        >
          <SelectTrigger id="type">
            <SelectValue placeholder="Select quiz type" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(QUIZ_TYPES).map(([key, value]) => (
              <SelectItem key={value} value={value}>
                {key.charAt(0).toUpperCase() + key.slice(1)} Quiz
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="durationMinutes">Time Limit (Minutes, Optional)</Label>
          <Input
            id="durationMinutes"
            type="number"
            min="1"
            max="600"
            value={formData.durationMinutes}
            onChange={(e) => handleInputChange("durationMinutes", e.target.value)}
            placeholder="e.g., 30"
            className={cn(errors.durationMinutes && "border-red-500 focus:border-red-500 focus:ring-red-500")}
          />
          {errors.durationMinutes && <p className="mt-1 text-sm text-red-600">{errors.durationMinutes}</p>}
        </div>

        <div>
          <Label htmlFor="passingPercentage" className="required">
            Passing Percentage
          </Label>
          <Input
            id="passingPercentage"
            type="number"
            min="0"
            max="100"
            value={formData.passingPercentage}
            onChange={(e) => handleInputChange("passingPercentage", e.target.value)}
            placeholder="70"
            className={cn(errors.passingPercentage && "border-red-500 focus:border-red-500 focus:ring-red-500")}
          />
          {errors.passingPercentage && <p className="mt-1 text-sm text-red-600">{errors.passingPercentage}</p>}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="maxAttempts">Max Attempts (Optional)</Label>
          <Input
            id="maxAttempts"
            type="number"
            min="1"
            max="10"
            value={formData.maxAttempts}
            onChange={(e) => handleInputChange("maxAttempts", e.target.value)}
            placeholder="e.g., 3"
            className={cn(errors.maxAttempts && "border-red-500 focus:border-red-500 focus:ring-red-500")}
          />
          {errors.maxAttempts && <p className="mt-1 text-sm text-red-600">{errors.maxAttempts}</p>}
        </div>

        <div className="flex items-center gap-3">
          <Checkbox
            id="shuffleQuestions"
            checked={formData.shuffleQuestions}
            onCheckedChange={(checked) => handleInputChange("shuffleQuestions", checked)}
          />
          <Label htmlFor="shuffleQuestions" className="cursor-pointer text-sm text-slate-700">
            Shuffle question order
          </Label>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex items-center gap-3">
          <Checkbox
            id="shuffleOptions"
            checked={formData.shuffleOptions}
            onCheckedChange={(checked) => handleInputChange("shuffleOptions", checked)}
          />
          <Label htmlFor="shuffleOptions" className="cursor-pointer text-sm text-slate-700">
            Shuffle answer options
          </Label>
        </div>

        <div className="flex items-center gap-3">
          <Checkbox
            id="showCorrectAnswers"
            checked={formData.showCorrectAnswers}
            onCheckedChange={(checked) => handleInputChange("showCorrectAnswers", checked)}
          />
          <Label htmlFor="showCorrectAnswers" className="cursor-pointer text-sm text-slate-700">
            Show correct answers after submission
          </Label>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="availableFrom">Available From (Optional)</Label>
          <div className="relative mt-1">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" aria-hidden="true" />
            <input
              id="availableFrom"
              type="datetime-local"
              value={formData.availableFrom}
              onChange={(e) => handleInputChange("availableFrom", e.target.value)}
              className={cn(
                "block w-full rounded-md border border-slate-300 bg-white px-10 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500",
                errors.availableFrom && "border-red-500 focus:border-red-500 focus:ring-red-500"
              )}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="availableUntil">Available Until (Optional)</Label>
          <div className="relative mt-1">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" aria-hidden="true" />
            <input
              id="availableUntil"
              type="datetime-local"
              value={formData.availableUntil}
              onChange={(e) => handleInputChange("availableUntil", e.target.value)}
              className={cn(
                "block w-full rounded-md border border-slate-300 bg-white px-10 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500",
                errors.availableUntil && "border-red-500 focus:border-red-500 focus:ring-red-500"
              )}
            />
          </div>
          {errors.availableUntil && <p className="mt-1 text-sm text-red-600">{errors.availableUntil}</p>}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Checkbox
          id="isPublished"
          checked={formData.isPublished}
          onCheckedChange={(checked) => handleInputChange("isPublished", checked)}
        />
        <Label htmlFor="isPublished" className="cursor-pointer text-sm text-slate-700">
          Publish immediately (students will see this quiz)
        </Label>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
        <Button type="button" variant="outline" asChild>
          <Link href="/office/quizzes">Cancel</Link>
        </Button>
        <Button type="submit" disabled={isSubmitting} className="gap-2">
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Creating...
            </>
          ) : (
            <>
              Create Quiz
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
