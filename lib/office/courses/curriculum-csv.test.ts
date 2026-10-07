import assert from "node:assert/strict";
import test from "node:test";

import { parseCurriculumCsv } from "./curriculum-csv";

const headers = [
  "module_order",
  "module_title",
  "module_description",
  "lesson_order",
  "lesson_title",
  "lesson_type",
  "youtube_url",
  "text_content",
  "pdf_url",
  "lesson_description",
  "duration_minutes",
  "is_preview",
  "is_published",
].join(",");

test("groups and sorts modules and lessons while preserving quoted CSV content", async () => {
  const csv = [
    headers,
    '2,Advanced,"Description, with comma",2,Second,text,,"Line one\nLine two",,,10,false,true',
    "1,Introduction,Start here,1,Welcome,youtube,https://youtu.be/dQw4w9WgXcQ,,,,15,false,true",
    "2,Advanced,Description with comma,1,First,pdf,,,https://example.com/notes.pdf,Read first,5,true,false",
  ].join("\n");

  const parsed = await parseCurriculumCsv(csv);
  assert.equal(parsed.errors.length, 0);
  assert.equal(parsed.validRows, 3);
  assert.deepEqual(parsed.modules.map((item) => item.order), [1, 2]);
  assert.deepEqual(parsed.modules[1].lessons.map((item) => item.order), [1, 2]);
  assert.equal(parsed.modules[1].lessons[1].textContent, "Line one\nLine two");
});

test("supports one module with multiple YouTube, text, and PDF lessons", async () => {
  const csv = [
    headers,
    "1,Module,,1,Video,youtube,https://www.youtube.com/watch?v=dQw4w9WgXcQ,,,,10,false,true",
    "1,Module,,2,Article,text,,Lesson body,,,5,false,true",
    "1,Module,,3,Document,pdf,,,https://example.com/document.pdf,,5,true,false",
  ].join("\n");

  const parsed = await parseCurriculumCsv(csv);
  assert.equal(parsed.errors.length, 0);
  assert.equal(parsed.modules.length, 1);
  assert.deepEqual(parsed.modules[0].lessons.map((item) => item.type), ["youtube", "text", "pdf"]);
});

test("reports missing required columns", async () => {
  const parsed = await parseCurriculumCsv("module_order,module_title\n1,Introduction");
  assert.equal(parsed.validRows, 0);
  assert.ok(parsed.errors.some((error) => error.message.includes("lesson_order")));
  assert.ok(parsed.errors.some((error) => error.message.includes("lesson_type")));
});

test("reports conditional, URL, numeric, and boolean validation errors", async () => {
  const csv = [
    headers,
    "0,,,-1,,audio,not-a-url,,,,many,yes,no",
    "1,Intro,,1,Video,youtube,https://example.com/video,,,,10,false,true",
    "2,Text,,1,Empty text,text,,,,,10,false,true",
    "3,PDF,,1,Empty PDF,pdf,,,,,10,false,true",
  ].join("\n");

  const parsed = await parseCurriculumCsv(csv);
  assert.equal(parsed.invalidRows, 4);
  assert.ok(parsed.errors.some((error) => error.message.includes("positive whole number")));
  assert.ok(parsed.errors.some((error) => error.message.includes("Invalid lesson_type")));
  assert.ok(parsed.errors.some((error) => error.message.includes("supported YouTube URL")));
  assert.ok(parsed.errors.some((error) => error.message.includes("text_content is required")));
  assert.ok(parsed.errors.some((error) => error.message.includes("pdf_url is required")));
  assert.ok(parsed.errors.some((error) => error.message.includes("is_preview must be true or false")));
});

test("rejects duplicate module and lesson ordering inside one CSV", async () => {
  const csv = [
    headers,
    "1,First,,1,Lesson A,text,,Body A,,,10,false,true",
    "1,Second,,1,Lesson B,text,,Body B,,,10,false,true",
    "2,Third,,1,Lesson C,text,,Body C,,,10,false,true",
    "2,Third,,1,Lesson D,text,,Body D,,,10,false,true",
  ].join("\n");

  const parsed = await parseCurriculumCsv(csv);
  assert.ok(parsed.errors.some((error) => error.message.includes("already used by another module")));
  assert.ok(parsed.errors.some((error) => error.message.includes("lesson_order 1 is duplicated")));
});

test("rejects CSV files above the row limit before import", async () => {
  const rows = Array.from(
    { length: 2_501 },
    (_, index) => `1,Module,,${index + 1},Lesson ${index + 1},text,,Body,,,1,false,true`
  );
  const parsed = await parseCurriculumCsv([headers, ...rows].join("\n"));
  assert.ok(parsed.errors.some((error) => error.message.includes("at most 2,500")));
  assert.equal(parsed.validRows, 0);
});

