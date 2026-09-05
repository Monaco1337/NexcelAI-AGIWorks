import { z, type ZodType } from "zod";
import { salesTargetsConfig } from "@/config/sales-targets";
import { TargetError } from "@/lib/sales/targets/errors";

export interface ContractValidationIssue {
  path: string;
  code: string;
  message: string;
}

export class ContractValidationError extends TargetError {
  readonly issues: ContractValidationIssue[];

  constructor(issues: ContractValidationIssue[], detail = "Request validation failed") {
    super("VALIDATION_FAILED", detail, { httpStatus: 400 });
    this.name = "ContractValidationError";
    this.issues = issues;
  }
}

export type ValidationResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: ContractValidationError };

function sanitizeIssues(error: z.ZodError): ContractValidationIssue[] {
  return error.issues.slice(0, 25).map((issue) => ({
    path: issue.path.map(String).join("."),
    code: issue.code,
    message: issue.message,
  }));
}

export function validateContract<T>(
  schema: ZodType<T>,
  input: unknown
): ValidationResult<T> {
  const parsed = schema.safeParse(input);
  if (parsed.success) return { ok: true, data: parsed.data };
  return {
    ok: false,
    error: new ContractValidationError(sanitizeIssues(parsed.error)),
  };
}

export async function validateJsonRequest<T>(
  request: Request,
  schema: ZodType<T>,
  options: { maxBytes?: number } = {}
): Promise<ValidationResult<T>> {
  const maxBytes = options.maxBytes ?? salesTargetsConfig.api.maxJsonBytes;
  const contentType = request.headers.get("content-type")?.split(";", 1)[0]?.trim().toLowerCase();
  if (contentType !== "application/json") {
    return {
      ok: false,
      error: new ContractValidationError(
        [{ path: "", code: "invalid_content_type", message: "Content-Type must be application/json" }],
        "Invalid content type"
      ),
    };
  }

  const declaredLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
    return {
      ok: false,
      error: new ContractValidationError(
        [{ path: "", code: "too_big", message: `Body exceeds ${maxBytes} bytes` }],
        "Request body too large"
      ),
    };
  }

  let text: string;
  try {
    text = await request.text();
  } catch {
    return {
      ok: false,
      error: new ContractValidationError(
        [{ path: "", code: "read_failed", message: "Request body could not be read" }]
      ),
    };
  }

  if (new TextEncoder().encode(text).byteLength > maxBytes) {
    return {
      ok: false,
      error: new ContractValidationError(
        [{ path: "", code: "too_big", message: `Body exceeds ${maxBytes} bytes` }],
        "Request body too large"
      ),
    };
  }

  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return {
      ok: false,
      error: new ContractValidationError(
        [{ path: "", code: "invalid_json", message: "Body must be valid JSON" }],
        "Invalid JSON"
      ),
    };
  }

  return validateContract(schema, body);
}

export function isContractValidationError(error: unknown): error is ContractValidationError {
  return error instanceof ContractValidationError;
}
