import type { MediaPart, SubmissionId, TurnId } from "@/features/assistant/types";

export type MediaReleaseReason =
  | "released"
  | "reload"
  | "cancelled"
  | "terminal"
  | "replaced"
  | "unavailable";

export interface EphemeralMediaAttempt {
  submissionId: SubmissionId;
  turnId: TurnId | null;
  ownerWindowId: string;
  parts: MediaPart[];
  retryEligible: boolean;
  createdAt: number;
  releasedReason: MediaReleaseReason | null;
}

function createWindowId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `assistant-window-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/** Raw media is deliberately confined to this document and has no serialization API. */
export class EphemeralMediaStore {
  readonly ownerWindowId = createWindowId();
  private readonly attempts = new Map<SubmissionId, EphemeralMediaAttempt>();

  stage(
    submissionId: SubmissionId,
    parts: MediaPart[],
    createdAt = Date.now(),
  ): EphemeralMediaAttempt {
    const attempt: EphemeralMediaAttempt = {
      submissionId,
      turnId: null,
      ownerWindowId: this.ownerWindowId,
      parts: [...parts],
      retryEligible: true,
      createdAt,
      releasedReason: null,
    };
    this.attempts.set(submissionId, attempt);
    return attempt;
  }

  bindTurn(submissionId: SubmissionId, turnId: TurnId): void {
    const attempt = this.attempts.get(submissionId);
    if (attempt) attempt.turnId = turnId;
  }

  get(submissionId: SubmissionId): EphemeralMediaAttempt | null {
    return this.attempts.get(submissionId) ?? null;
  }

  claim(submissionId: SubmissionId, ownerWindowId: string): MediaPart[] | null {
    const attempt = this.attempts.get(submissionId);
    if (!attempt || attempt.ownerWindowId !== ownerWindowId || !attempt.retryEligible) {
      return null;
    }
    return [...attempt.parts];
  }

  retainForRetry(submissionId: SubmissionId): void {
    const attempt = this.attempts.get(submissionId);
    if (attempt) {
      attempt.retryEligible = true;
      attempt.releasedReason = null;
    }
  }

  release(submissionId: SubmissionId, reason: MediaReleaseReason): void {
    const attempt = this.attempts.get(submissionId);
    if (!attempt) return;
    attempt.parts = [];
    attempt.retryEligible = false;
    attempt.releasedReason = reason;
    this.attempts.delete(submissionId);
  }

  releaseAll(reason: MediaReleaseReason): void {
    for (const submissionId of this.attempts.keys()) this.release(submissionId, reason);
  }
}
