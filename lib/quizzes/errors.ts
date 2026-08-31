import type { QuizAccessErrorCode } from "./types";

/**
 * Domain error thrown by the quiz engine on any access/validation failure.
 * Pages and API routes translate these into friendly responses.
 */
export class QuizError extends Error {
  readonly code: QuizAccessErrorCode;

  constructor(code: QuizAccessErrorCode, message: string) {
    super(message);
    this.name = "QuizError";
    this.code = code;
  }
}
