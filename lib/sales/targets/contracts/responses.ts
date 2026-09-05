import { NextResponse } from "next/server";
import {
  TARGET_ERROR_MESSAGES,
  TargetError,
  newCorrelationId,
  toTargetError,
  type TargetErrorCode,
} from "@/lib/sales/targets/errors";
import { isContractValidationError } from "./validation";

export function targetErrorResponse(error: TargetError): NextResponse {
  const correlationId = error.correlationId ?? newCorrelationId("api");
  const body: {
    error: TargetErrorCode;
    message: string;
    correlationId: string;
    issues?: Array<{ path: string; code: string; message: string }>;
  } = {
    error: error.code,
    message: TARGET_ERROR_MESSAGES[error.code],
    correlationId,
  };

  if (isContractValidationError(error)) {
    body.issues = error.issues;
  }

  return NextResponse.json(body, {
    status: error.httpStatus,
    headers: { "Cache-Control": "no-store" },
  });
}

export function unknownTargetErrorResponse(
  error: unknown,
  fallback: TargetErrorCode = "INTERNAL"
): NextResponse {
  const targetError = toTargetError(error, fallback);
  if (targetError.code === "INTERNAL") {
    console.error(`[TARGETS:${targetError.correlationId ?? "unassigned"}]`, error);
  }
  return targetErrorResponse(targetError);
}
