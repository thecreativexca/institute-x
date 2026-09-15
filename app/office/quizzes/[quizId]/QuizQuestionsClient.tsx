"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { OfficeQuizDetail } from "@/lib/office/quizzes/dto";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type Question = {
  id: string;
  question: string;
  options: { id: string; text: string }[];
  correctOptionId: string;
  marks: number;
};

export function QuizQuestionsClient({ quiz, initialQuestions }: { quiz: OfficeQuizDetail; initialQuestions: Question[] }) {
  const router = useRouter();
  const questions = initialQuestions;
  const [published, setPublished] = useState(quiz.isPublished);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", "", "", ""]);
  const [correct, setCorrect] = useState("b");
  const [marks, setMarks] = useState("1");

  const addQuestion = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const body = new FormData();
      body.set("question", question.trim());
      body.set("options", JSON.stringify(options.map((text, index) => ({ id: "abcd"[index], text: text.trim() })).filter((option) => option.text)));
      body.set("correctOptionId", correct);
      body.set("marks", marks);
      body.set("order", String(questions.length));
      body.set("isPublished", "true");
      const response = await fetch(`/api/office/quizzes/${quiz.id}/questions`, { method: "POST", body });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Question add nahi hua");
      window.location.reload();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Question add nahi hua");
    } finally {
      setBusy(false);
    }
  };

  const publish = async () => {
    setError("");
    setBusy(true);
    try {
      const readinessResponse = await fetch(`/api/office/quizzes?action=publish-readiness&quizId=${quiz.id}`);
      const readiness = await readinessResponse.json();
      if (!readinessResponse.ok || !readiness.ready) throw new Error((readiness.issues || [readiness.error || "Quiz ready nahi hai"]).join(", "));
      const response = await fetch(`/api/office/quizzes/${quiz.id}`, {
        method: "PATCH",
        body: new URLSearchParams({ isPublished: "true" }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Publish fail hua");
      setPublished(true);
      router.refresh();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Publish fail hua");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm text-slate-500">{quiz.courseName} · {quiz.type} quiz</p>
            <h1 className="mt-1 text-2xl font-bold text-slate-900">{quiz.title}</h1>
            <p className="mt-2 text-sm text-slate-600">{questions.length} questions · {quiz.totalMarks} marks · Pass {quiz.passingPercentage}%</p>
          </div>
          <span className={`rounded-full px-3 py-1 text-sm font-medium ${published ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}`}>{published ? "Published" : "Draft"}</span>
        </div>
        {quiz.description && <p className="mt-4 text-sm text-slate-600">{quiz.description}</p>}
        {!published && <div className="mt-5"><Button disabled={busy || questions.length === 0} onClick={publish}>Publish quiz</Button></div>}
        {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7">
        <h2 className="text-lg font-semibold text-slate-900">Questions and answers</h2>
        {questions.length === 0 && <p className="mt-3 text-sm text-slate-500">Abhi questions nahi hain. Neeche ek question add karein.</p>}
        <ol className="mt-4 space-y-5">
          {questions.map((item, index) => (
            <li key={item.id} className="rounded-xl border border-slate-200 p-4">
              <p className="font-medium text-slate-900">{index + 1}. {item.question} <span className="text-sm font-normal text-slate-500">({item.marks} marks)</span></p>
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                {item.options.map((option) => (
                  <li key={option.id} className={`rounded-lg px-3 py-2 text-sm ${option.id === item.correctOptionId ? "bg-green-50 font-medium text-green-800" : "bg-slate-50 text-slate-700"}`}>
                    {option.id.toUpperCase()}. {option.text}{option.id === item.correctOptionId ? " ✓" : ""}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </div>

      {!published && <form onSubmit={addQuestion} className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7 space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">Add a question</h2>
        <Textarea aria-label="Question" placeholder="Question" value={question} onChange={(event) => setQuestion(event.target.value)} required maxLength={2000} />
        <div className="grid gap-3 sm:grid-cols-2">
          {options.map((value, index) => <Input key={index} aria-label={`Option ${"ABCD"[index]}`} placeholder={`Option ${"ABCD"[index]}`} value={value} onChange={(event) => setOptions((previous) => previous.map((item, i) => i === index ? event.target.value : item))} required={index < 2} maxLength={1000} />)}
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <label className="text-sm">Correct answer <select className="ml-2 rounded-lg border border-slate-300 p-2" value={correct} onChange={(event) => setCorrect(event.target.value)}>{["a", "b", "c", "d"].map((id) => <option key={id} value={id}>{id.toUpperCase()}</option>)}</select></label>
          <label className="text-sm">Marks <Input className="mt-1 w-24" type="number" min="1" value={marks} onChange={(event) => setMarks(event.target.value)} required /></label>
        </div>
        <Button type="submit" disabled={busy}>Add question</Button>
      </form>}
    </>
  );
}
