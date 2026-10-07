"use client";

import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import {
  CURRICULUM_CSV_TEMPLATE,
  type CurriculumCsvImportResult,
  type CurriculumCsvPreview,
} from "@/lib/office/courses/curriculum-csv-shared";

interface CurriculumCsvImportProps {
  courseId: string;
  onImported: (result: CurriculumCsvImportResult) => void;
}

interface ApiResponse {
  success: boolean;
  error?: string;
  preview?: CurriculumCsvPreview;
  result?: CurriculumCsvImportResult;
}

function downloadTemplate(): void {
  const blob = new Blob([CURRICULUM_CSV_TEMPLATE], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "course-curriculum-template.csv";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function CurriculumCsvImport({ courseId, onImported }: CurriculumCsvImportProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<CurriculumCsvPreview | null>(null);
  const [result, setResult] = useState<CurriculumCsvImportResult | null>(null);
  const [error, setError] = useState("");
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  function reset(): void {
    setFile(null);
    setPreview(null);
    setResult(null);
    setError("");
    setIsPreviewing(false);
    setIsImporting(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  function close(): void {
    if (isPreviewing || isImporting) return;
    setOpen(false);
    reset();
  }

  async function submitFile(selectedFile: File, operation: "preview" | "import"): Promise<ApiResponse> {
    const formData = new FormData();
    formData.set("operation", operation);
    formData.set("file", selectedFile);
    const response = await fetch(`/api/office/courses/${courseId}/curriculum/import`, {
      method: "POST",
      body: formData,
    });
    const body = (await response.json().catch(() => ({}))) as ApiResponse;
    if (!response.ok || !body.success) {
      if (body.preview) setPreview(body.preview);
      throw new Error(body.error ?? "Could not process the CSV file.");
    }
    return body;
  }

  async function chooseFile(selectedFile: File | null): Promise<void> {
    setFile(selectedFile);
    setPreview(null);
    setResult(null);
    setError("");
    if (!selectedFile) return;
    if (!selectedFile.name.toLowerCase().endsWith(".csv")) {
      setError("Please choose a .csv file.");
      return;
    }

    setIsPreviewing(true);
    try {
      const body = await submitFile(selectedFile, "preview");
      setPreview(body.preview ?? null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not preview the CSV file.");
    } finally {
      setIsPreviewing(false);
    }
  }

  async function importCsv(): Promise<void> {
    if (!file || !preview || preview.invalidRows > 0 || preview.errors.length > 0) return;
    setError("");
    setIsImporting(true);
    try {
      const body = await submitFile(file, "import");
      if (!body.result) throw new Error("The server did not return an import summary.");
      setResult(body.result);
      onImported(body.result);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not import the curriculum.");
    } finally {
      setIsImporting(false);
    }
  }

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        Import CSV
      </Button>
      <Modal
        open={open}
        onClose={close}
        title="Import Curriculum from CSV"
        description="Preview and validate modules and lessons before anything is saved. Existing items are skipped, never overwritten."
        className="max-w-3xl"
        footer={
          result ? (
            <Button onClick={close}>Done</Button>
          ) : (
            <>
              <Button variant="ghost" onClick={close} disabled={isPreviewing || isImporting}>
                Cancel
              </Button>
              <Button
                onClick={importCsv}
                isLoading={isImporting}
                disabled={
                  isPreviewing ||
                  !file ||
                  !preview ||
                  preview.invalidRows > 0 ||
                  preview.errors.length > 0 ||
                  preview.lessonCount === 0
                }
              >
                {isImporting ? "Importing curriculum..." : "Import Curriculum"}
              </Button>
            </>
          )
        }
      >
        <div className="max-h-[65vh] space-y-5 overflow-y-auto pr-1">
          {!result ? (
            <>
              <div className="flex flex-col gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <label htmlFor="curriculum-csv-file" className="text-sm font-semibold text-slate-800">
                    Choose CSV file
                  </label>
                  <p className="mt-1 text-xs text-slate-500">UTF-8 CSV, up to 2 MB and 2,500 lesson rows.</p>
                </div>
                <input
                  ref={inputRef}
                  id="curriculum-csv-file"
                  type="file"
                  accept=".csv,text/csv"
                  disabled={isPreviewing || isImporting}
                  onChange={(event) => void chooseFile(event.target.files?.[0] ?? null)}
                  className="w-full max-w-sm cursor-pointer rounded-md border border-slate-300 bg-white px-3 py-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-primary-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-primary-800"
                />
              </div>

              <Button variant="secondary" size="sm" onClick={downloadTemplate}>
                Download CSV Template
              </Button>

              {isPreviewing ? (
                <p role="status" className="rounded-lg bg-primary-50 px-4 py-3 text-sm text-primary-800">
                  Parsing and validating CSV...
                </p>
              ) : null}
              {error ? (
                <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">
                  {error}
                </p>
              ) : null}
              {preview ? <CsvPreview preview={preview} fileName={file?.name ?? "CSV file"} /> : null}
            </>
          ) : (
            <div className="space-y-4">
              <p role="status" className="rounded-lg bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
                Curriculum imported successfully.
              </p>
              <dl className="grid gap-3 sm:grid-cols-2">
                <SummaryItem label="Modules created" value={result.modulesCreated} />
                <SummaryItem label="Lessons created" value={result.lessonsCreated} />
                <SummaryItem label="Skipped" value={result.skipped} />
                <SummaryItem label="Failed" value={result.failed} />
              </dl>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}

function SummaryItem({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-1 text-xl font-semibold text-slate-900">{value}</dd>
    </div>
  );
}

function CsvPreview({ preview, fileName }: { preview: CurriculumCsvPreview; fileName: string }) {
  return (
    <section className="space-y-4" aria-labelledby="csv-preview-heading">
      <div>
        <h3 id="csv-preview-heading" className="text-base font-semibold text-slate-900">
          CSV Preview
        </h3>
        <p className="mt-1 text-xs text-slate-500">{fileName}</p>
      </div>

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryItem label="Modules" value={preview.moduleCount} />
        <SummaryItem label="Lessons" value={preview.lessonCount} />
        <SummaryItem label="Valid rows" value={preview.validRows} />
        <SummaryItem label="Invalid rows" value={preview.invalidRows} />
      </dl>

      {preview.duplicateModules > 0 || preview.duplicateLessons > 0 ? (
        <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {preview.duplicateModules} module{preview.duplicateModules === 1 ? "" : "s"} and{" "}
          {preview.duplicateLessons} lesson{preview.duplicateLessons === 1 ? "" : "s"} already appear to exist.
          Existing items will be skipped; nothing will be overwritten.
        </p>
      ) : null}

      {preview.errors.length > 0 ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <h4 className="text-sm font-semibold text-red-900">Validation errors</h4>
          <ul className="mt-2 space-y-1 text-sm text-red-800">
            {preview.errors.map((item, index) => (
              <li key={`${item.row}-${item.message}-${index}`}>
                Row {item.row}: {item.message}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {preview.modules.length > 0 ? (
        <ol className="divide-y divide-slate-100 rounded-lg border border-slate-200">
          {preview.modules.map((module) => (
            <li key={`${module.order}-${module.title}`} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-800">
                  Module {module.order} — {module.title}
                </p>
                <p className="text-xs text-slate-500">
                  {module.lessonCount} lesson{module.lessonCount === 1 ? "" : "s"}
                </p>
              </div>
              {module.alreadyExists ? (
                <span className="shrink-0 rounded-full bg-amber-50 px-2 py-1 text-xs font-medium text-amber-800">
                  Existing module
                </span>
              ) : null}
            </li>
          ))}
        </ol>
      ) : null}
    </section>
  );
}

