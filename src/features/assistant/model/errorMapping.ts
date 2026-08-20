import type { ModelErrorCode } from "@/features/assistant/types";

export class ModelAdapterError extends Error {
  readonly code: ModelErrorCode;

  constructor(code: ModelErrorCode) {
    super(code);
    this.name = "ModelAdapterError";
    this.code = code;
  }
}

export function normalizeModelError(error: unknown): ModelErrorCode {
  if (error instanceof ModelAdapterError) return error.code;
  if (!(error instanceof DOMException)) return "api_changed";

  switch (error.name) {
    case "NotAllowedError":
      return "activation_required";
    case "NotSupportedError":
      return "unsupported_input";
    case "NetworkError":
      return "download_failed";
    case "NotReadableError":
      return "model_unavailable";
    case "QuotaExceededError":
      return "context_too_large";
    case "AbortError":
      return "aborted";
    case "InvalidStateError":
    case "OperationError":
      return "operation_failed";
    case "UnknownError":
    default:
      return "api_changed";
  }
}

export function normalizedModelError(error: unknown): ModelAdapterError {
  return new ModelAdapterError(normalizeModelError(error));
}
