import { describe, expect, it } from "vitest";

import { buildReconstructionPrompts, currentTurnPrompt } from "@/features/assistant/context/prompt";
import { EphemeralMediaStore } from "@/features/assistant/storage/ephemeralMediaStore";
import { MemoryAssistantRepository } from "@/features/assistant/storage/memoryRepository";
import { imageFixture } from "../../fixtures/mediaFixtures";
import type { MediaHistoryDraft } from "@/features/assistant/types";
import {
  toSessionId,
  toSubmissionId,
} from "@/features/assistant/types";

describe("media foundation", () => {
  it("keeps exact selected sources page-local and owner-bound", () => {
    const store = new EphemeralMediaStore();
    const source = imageFixture();
    const attempt = store.stage(toSubmissionId("submission"), [source]);

    expect(store.claim(attempt.submissionId, attempt.ownerWindowId)?.[0].source).toBe(source.source);
    expect(store.claim(attempt.submissionId, "another-window")).toBeNull();
    store.release(attempt.submissionId, "reload");
    expect(store.get(attempt.submissionId)).toBeNull();
  });

  it("builds ordered media content without replacing the source with a derivative", () => {
    const image = imageFixture();
    const prompt = currentTurnPrompt("Describe this", [image]);
    expect(prompt[0]?.content).toEqual([
      { type: "text", value: "Describe this" },
      { type: "image", value: image.source },
    ]);
  });

  it("persists bounded history metadata while enforcing owner-aware claims", async () => {
    const repository = new MemoryAssistantRepository();
    const draft: MediaHistoryDraft = {
      kind: "image",
      thumbnail: null,
      label: "sample.png",
      accessibleLabel: "Image: sample.png",
      mimeType: "image/png",
      byteLength: 4,
      width: null,
      height: null,
      durationSeconds: null,
      createdAt: 1,
    };
    const accepted = await repository.acceptPrompt({
      at: 1,
      sessionId: null,
      submissionId: toSubmissionId("media-submission"),
      text: "",
      media: { kinds: ["image"], ownerWindowId: "owner", representations: [draft] },
    });
    const conversation = await repository.getConversation(accepted.sessionId);
    expect(conversation?.mediaRepresentations?.[0].thumbnail).toBeNull();
    expect(conversation?.messages[0].mediaRepresentationIds).toHaveLength(1);
    expect(
      await repository.claimNextTurn({
        at: 2,
        attemptId: "wrong" as never,
        epoch: accepted.epoch,
        sessionId: accepted.sessionId,
        ownerWindowId: "another-window",
      }),
    ).toBeNull();
    expect(
      await repository.claimNextTurn({
        at: 2,
        attemptId: "right" as never,
        epoch: accepted.epoch,
        sessionId: accepted.sessionId,
        ownerWindowId: "owner",
      }),
    ).not.toBeNull();
  });

  it("reconstructs only text and accessible attachment labels", () => {
    const conversation = {
      context: null,
      messages: [
        {
          id: "user" as never,
          sessionId: toSessionId("session"),
          turnId: "turn" as never,
          role: "user" as const,
          text: "What is this?",
          status: "completed" as const,
          createdAt: 1,
          updatedAt: 1,
          mediaRepresentationIds: ["history" as never],
        },
        {
          id: "assistant" as never,
          sessionId: toSessionId("session"),
          turnId: "turn" as never,
          role: "assistant" as const,
          text: "A sample.",
          status: "completed" as const,
          createdAt: 1,
          updatedAt: 1,
        },
      ],
      mediaRepresentations: [
        {
          ...({} as MediaHistoryDraft),
          id: "history" as never,
          sessionId: toSessionId("session"),
          turnId: "turn" as never,
          messageId: "user" as never,
          kind: "image" as const,
          label: "sample.png",
          accessibleLabel: "Image: sample.png",
          mimeType: "image/png",
          thumbnail: new Blob(["raw-thumbnail"]),
          byteLength: 12,
          width: null,
          height: null,
          durationSeconds: null,
          createdAt: 1,
        },
      ],
      session: {
        id: toSessionId("session"),
        epoch: 0,
        title: "sample",
        titleSourceTurnId: "turn" as never,
        createdAt: 1,
        updatedAt: 1,
        historyRevision: 1,
      },
      turns: [
        {
          id: "turn" as never,
          sessionId: toSessionId("session"),
          epoch: 0,
          promptCreatedAt: 1,
          submissionId: "submission" as never,
          userMessageId: "user" as never,
          assistantMessageId: "assistant" as never,
          status: "completed" as const,
          generationAttemptId: null,
          startedAt: 1,
          completedAt: 1,
          interruptionReason: null,
          failureCode: null,
        },
      ],
    };
    const prompts = buildReconstructionPrompts({
      conversation,
      personality: { key: "personality", text: "", revision: 0, updatedAt: 0 },
    });
    const serialized = JSON.stringify(prompts);
    expect(serialized).toContain("Image: sample.png");
    expect(serialized).not.toContain("raw-thumbnail");
  });
});
