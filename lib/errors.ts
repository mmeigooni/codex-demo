import { NextResponse } from "next/server";

export interface ErrorResponseBody {
  error: string;
  code: string;
  retryable?: boolean;
}

export class AppError extends Error {
  readonly status: number;
  readonly code: string;
  readonly retryable: boolean;

  constructor(status: number, code: string, message: string, retryable = false) {
    super(message);
    this.name = "AppError";
    this.status = status;
    this.code = code;
    this.retryable = retryable;
  }
}

export function toAppError(error: unknown, fallbackCode = "internal_error"): AppError {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof Error) {
    return new AppError(500, fallbackCode, error.message, false);
  }

  return new AppError(500, fallbackCode, "unknown_error", false);
}

export function toErrorResponse(error: unknown, fallbackCode = "internal_error"): NextResponse<ErrorResponseBody> {
  const appError = toAppError(error, fallbackCode);

  return NextResponse.json(
    {
      error: appError.message,
      code: appError.code,
      retryable: appError.retryable ? true : undefined
    },
    { status: appError.status }
  );
}
