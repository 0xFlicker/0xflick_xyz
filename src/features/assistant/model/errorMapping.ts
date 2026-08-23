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
  if (error instanceof Error) {
    switch (error.message) {
      case "storage_quota":
      case "corrupt_assets":
      case "resource_exhausted":
      case "runtime_terminated":
      case "unsupported_device":
        return error.message;
    }
  }
  if (!(error instanceof DOMException)) return "api_changed";

  switch (error.name) {
    case "NotAllowedError":
      return "activation_required";
    case "NotSupportedError":
      return "unsupported_input";
    case "NetworkError":
      return "download_failed";
    case "NotReadableError":
      return "output_filtered";
    case "QuotaExceededError":
      return "storage_quota";
    case "AbortError":
      return "aborted";
    case "InvalidStateError":
    case "OperationError":
      return "operation_failed";
    case "DataError":
      return "corrupt_assets";
    case "UnknownError":
    default:
      return "api_changed";
  }
}

export function normalizedModelError(error: unknown): ModelAdapterError {
  return new ModelAdapterError(normalizeModelError(error));
}
