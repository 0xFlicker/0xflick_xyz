import Dexie from "dexie";
import { describe, expect, it, vi } from "vitest";

import { AssistantDatabase } from "@/features/assistant/storage/database";
import { MODEL_CATALOG } from "@/features/assistant/model/modelCatalog";
import {
  DexieAssistantRepository,
  RepositoryMutationError,
} from "@/features/assistant/storage/dexieRepository";
import {
  toAttemptId,
  toMessageId,
  toSessionId,
  toSubmissionId,
  toTurnId,
} from "@/features/assistant/types";

describe("DexieAssistantRepository", () => {
  it("defines the v3 schema with durable model boundaries and coordination indexes", () => {
    const database = new AssistantDatabase("schema-inspection");
    expect(database.tables.map((table) => table.name).sort()).toEqual([
      "contexts",
      "mediaHistory",
      "messages",
      "meta",
      "modelBoundaries",
      "sessions",
      "settings",
      "tombstones",
      "turns",
    ]);
    expect(database.turns.schema.indexes.map((index) => index.name)).toEqual(
      expect.arrayContaining(["sessionId", "submissionId", "[sessionId+status]", "[sessionId+promptCreatedAt]"]),
    );
    expect(database.modelBoundaries.schema.indexes.map((index) => index.name)).toEqual(
      expect.arrayContaining([
        "sessionId",
        "selectionRevision",
        "afterTurnId",
        "[sessionId+selectionRevision]",
      ]),
    );
    database.close();
  });

  it("rewrites v2 native records to required revision-zero model identity", async () => {
    const name = "assistant-v2-upgrade";
    const sessionId = toSessionId("legacy-session");
    const turnId = toTurnId("legacy-turn");
    const legacy = new Dexie(name);
    legacy.version(2).stores({
      contexts: "&sessionId, epoch, state",
      messages: "&id, sessionId, turnId, [sessionId+createdAt]",
      meta: "&key",
      sessions: "&id, epoch, updatedAt, [epoch+updatedAt]",
      settings: "&key",
      tombstones: "&sessionId, epoch",
      turns:
        "&id, sessionId, submissionId, [sessionId+status], [sessionId+promptCreatedAt]",
      mediaHistory:
        "&id, sessionId, turnId, messageId, createdAt, [sessionId+createdAt], [turnId+createdAt]",
    });
    await legacy.open();
    await legacy.table("sessions").add({
      id: sessionId,
      epoch: 0,
      title: "Legacy",
      titleSourceTurnId: turnId,
      createdAt: 1,
      updatedAt: 1,
      historyRevision: 1,
    });
    await legacy.table("turns").add({
      id: turnId,
      sessionId,
      epoch: 0,
      promptCreatedAt: 1,
      submissionId: toSubmissionId("legacy-submission"),
      userMessageId: toMessageId("legacy-user"),
      assistantMessageId: toMessageId("legacy-assistant"),
      status: "completed",
      generationAttemptId: null,
      startedAt: 1,
      completedAt: 1,
      interruptionReason: null,
      failureCode: null,
    });
    legacy.close();

    const upgraded = new AssistantDatabase(name);
    await upgraded.open();
    expect(await upgraded.sessions.get(sessionId)).toMatchObject({
      activeModelKey: "browser-prompt-api",
      activeModelRevision: 0,
      modelRequestRevision: 0,
      pendingModelRequest: null,
    });
    expect(await upgraded.turns.get(turnId)).toMatchObject({
      modelKey: "browser-prompt-api",
      modelRevision: 0,
      modelRuntimeIdentity: "browser-prompt-api:native:prompt-api:default:1",
    });
    upgraded.close();
    await Dexie.delete(name);
  });

  it("persists coherent sessions, deterministic titles, turns, and checkpoints across instances", async () => {
    const first = new DexieAssistantRepository();
    await first.initialize();
    const accepted = await first.acceptPrompt({
      at: 10,
      sessionId: null,
      submissionId: toSubmissionId("submission-1"),
      text: "  A durable\nchat title  ",
    });
    const attemptId = toAttemptId("attempt-1");
    await first.claimNextTurn({
      at: 11,
      attemptId,
      epoch: accepted.epoch,
      sessionId: accepted.sessionId,
    });
    await expect(first.checkpointResponse({
      at: 12,
      attemptId,
      epoch: accepted.epoch,
      sessionId: accepted.sessionId,
      text: "Stored partial",
      turnId: accepted.turnId,
    })).resolves.toEqual({ ok: true });
    first.destroy();

    const reloaded = new DexieAssistantRepository();
    const snapshot = await reloaded.initialize();
    expect(snapshot.sessions.sessions[0].title).toBe("A durable chat title");
    expect(snapshot.conversation?.messages.map((message) => message.text)).toEqual([
      "A durable\nchat title",
      "Stored partial",
    ]);
    reloaded.destroy();
  });

  it("enforces 100 sessions transactionally without evicting existing history", async () => {
    const repository = new DexieAssistantRepository();
    await repository.initialize();
    for (let index = 0; index < 100; index += 1) {
      await repository.acceptPrompt({
        at: index,
        sessionId: null,
        submissionId: toSubmissionId(`submission-${index}`),
        text: `Chat ${index}`,
      });
    }

    await expect(
      repository.acceptPrompt({
        at: 101,
        sessionId: null,
        submissionId: toSubmissionId("submission-101"),
        text: "Chat 101",
      }),
    ).rejects.toEqual(new RepositoryMutationError("session_limit"));
    expect((await repository.getSessions()).sessions).toHaveLength(100);
    repository.destroy();
  });

  it("scopes deletion, clears personality, and rejects stale epoch writes", async () => {
    const repository = new DexieAssistantRepository();
    await repository.initialize();
    await repository.savePersonality("Warm and brief", 1);
    const retained = await repository.acceptPrompt({
      at: 2,
      sessionId: null,
      submissionId: toSubmissionId("retained"),
      text: "Retained",
    });
    const deleted = await repository.acceptPrompt({
      at: 3,
      sessionId: null,
      submissionId: toSubmissionId("deleted"),
      text: "Deleted",
    });
    await expect(repository.deleteSession(deleted.sessionId, 4)).resolves.toEqual({ ok: true });
    expect(await repository.getConversation(deleted.sessionId)).toBeNull();
    expect(await repository.getConversation(retained.sessionId)).not.toBeNull();
    expect((await repository.getSettings()).personality.text).toBe("Warm and brief");

    const attemptId = toAttemptId("stale-attempt");
    await repository.claimNextTurn({
      at: 5,
      attemptId,
      epoch: retained.epoch,
      sessionId: retained.sessionId,
    });
    await repository.clearAll(6);
    await expect(
      repository.checkpointResponse({
        at: 7,
        attemptId,
        epoch: retained.epoch,
        sessionId: retained.sessionId,
        text: "must not return",
        turnId: retained.turnId,
      }),
    ).resolves.toEqual({ ok: false, code: "dataset_cleared" });
    expect((await repository.getSessions()).sessions).toHaveLength(0);
    expect((await repository.getSettings()).personality.text).toBe("");
    repository.destroy();
  });

  it("requests persistent browser storage only on the first accepted prompt", async () => {
    const persist = vi.fn().mockResolvedValue(true);
    Object.defineProperty(navigator, "storage", {
      configurable: true,
      value: { persist },
    });
    const repository = new DexieAssistantRepository();
    await repository.initialize();
    const first = await repository.acceptPrompt({
      at: 1,
      sessionId: null,
      submissionId: toSubmissionId("persist-one"),
      text: "First prompt",
    });
    await repository.acceptPrompt({
      at: 2,
      sessionId: first.sessionId,
      submissionId: toSubmissionId("persist-two"),
      text: "Second prompt",
    });
    await Promise.resolve();
    expect(persist).toHaveBeenCalledTimes(1);
    repository.destroy();
  });

  it("persists bounded media history and deletes it with its session", async () => {
    const repository = new DexieAssistantRepository();
    await repository.initialize();
    const accepted = await repository.acceptPrompt({
      at: 1,
      sessionId: null,
      submissionId: toSubmissionId("media-history"),
      text: "",
      media: {
        kinds: ["image"],
        ownerWindowId: "owner",
        representations: [
          {
            kind: "image",
            thumbnail: new Blob(["thumbnail"]),
            label: "diagram.png",
            accessibleLabel: "Image: diagram.png",
            mimeType: "image/png",
            byteLength: 10,
            width: 100,
            height: 80,
            durationSeconds: null,
            createdAt: 1,
          },
        ],
      },
    });
    const snapshot = await repository.getConversation(accepted.sessionId);
    expect(snapshot?.mediaRepresentations).toHaveLength(1);
    expect(snapshot?.messages[0].mediaRepresentationIds).toHaveLength(1);
    await expect(repository.deleteSession(accepted.sessionId, 2)).resolves.toEqual({ ok: true });
    expect((await repository.getSessions()).sessions).toHaveLength(0);
    repository.destroy();
  });

  it("lets the first terminal write win a Stop/completion race", async () => {
    const repository = new DexieAssistantRepository();
    await repository.initialize();
    const accepted = await repository.acceptPrompt({
      at: 1,
      sessionId: null,
      submissionId: toSubmissionId("terminal-race"),
      text: "Race this turn",
    });
    const attemptId = toAttemptId("terminal-race-attempt");
    await repository.claimNextTurn({
      at: 2,
      attemptId,
      epoch: accepted.epoch,
      sessionId: accepted.sessionId,
    });
    await expect(
      repository.finishTurn({
        at: 3,
        attemptId,
        epoch: accepted.epoch,
        sessionId: accepted.sessionId,
        status: "completed",
        text: "Completed first",
        turnId: accepted.turnId,
      }),
    ).resolves.toEqual({ ok: true });
    await expect(
      repository.finishTurn({
        at: 4,
        attemptId,
        epoch: accepted.epoch,
        interruptionReason: "visitor",
        sessionId: accepted.sessionId,
        status: "interrupted",
        text: "Stopped second",
        turnId: accepted.turnId,
      }),
    ).resolves.toEqual({ ok: false, code: "already_terminal" });
    expect((await repository.getConversation(accepted.sessionId))?.messages.at(-1)?.text).toBe(
      "Completed first",
    );
    repository.destroy();
  });

  it("uses explicit attempt-aware recovery without Web Locks", async () => {
    const repository = new DexieAssistantRepository();
    await repository.initialize();
    const accepted = await repository.acceptPrompt({
      at: 1,
      sessionId: null,
      submissionId: toSubmissionId("explicit-recovery"),
      text: "Recover this attempt",
    });
    const attemptId = toAttemptId("explicit-recovery-attempt");
    await repository.claimNextTurn({
      at: 2,
      attemptId,
      epoch: accepted.epoch,
      sessionId: accepted.sessionId,
    });
    await expect(repository.recoverTurn({
      at: 3,
      epoch: accepted.epoch,
      expectedAttemptId: attemptId,
      sessionId: accepted.sessionId,
      turnId: accepted.turnId,
    })).resolves.toEqual({ ok: true });
    await expect(repository.finishTurn({
      at: 4,
      attemptId,
      epoch: accepted.epoch,
      sessionId: accepted.sessionId,
      status: "completed",
      text: "Stale completion",
      turnId: accepted.turnId,
    })).resolves.toEqual({ ok: false, code: "already_terminal" });
    expect((await repository.getConversation(accepted.sessionId))?.turns[0]).toMatchObject({
      interruptionReason: "owner_closed",
      status: "interrupted",
    });
    repository.destroy();
  });

  it("uses durable latest-confirmed CAS when Web Locks are unavailable", async () => {
    const repository = new DexieAssistantRepository();
    await repository.initialize();
    const accepted = await repository.acceptPrompt({
      at: 1,
      sessionId: null,
      submissionId: toSubmissionId("selection-cas"),
      text: "Complete before switching",
    });
    const attemptId = toAttemptId("selection-cas-attempt");
    await repository.claimNextTurn({
      at: 2,
      attemptId,
      epoch: accepted.epoch,
      sessionId: accepted.sessionId,
    });
    await repository.finishTurn({
      at: 3,
      attemptId,
      epoch: accepted.epoch,
      sessionId: accepted.sessionId,
      status: "completed",
      text: "Done",
      turnId: accepted.turnId,
    });
    const first = await repository.confirmModelRequest({
      at: 4,
      ownerWindowId: "a",
      reason: "visitor",
      requestId: "dexie-a",
      sessionId: accepted.sessionId,
      targetModelKey: "smollm2-360m-webgpu",
    });
    const second = await repository.confirmModelRequest({
      at: 5,
      ownerWindowId: "b",
      reason: "visitor",
      requestId: "dexie-b",
      sessionId: accepted.sessionId,
      targetModelKey: "smollm2-135m-wasm",
    });
    if (!first.ok || !first.request || !second.ok || !second.request) throw new Error("setup");
    await expect(repository.activateModelRequest({
      at: 6,
      context: null,
      descriptor: MODEL_CATALOG[1],
      expectedEpoch: first.request.capturedEpoch,
      expectedHistoryRevision: first.request.capturedHistoryRevision,
      ownerWindowId: "a",
      requestId: first.request.requestId,
      revision: first.request.revision,
      sessionId: accepted.sessionId,
    })).resolves.toEqual({ ok: false, code: "model_request_stale" });
    await expect(repository.activateModelRequest({
      at: 7,
      context: null,
      descriptor: MODEL_CATALOG[2],
      expectedEpoch: second.request.capturedEpoch,
      expectedHistoryRevision: second.request.capturedHistoryRevision,
      ownerWindowId: "b",
      requestId: second.request.requestId,
      revision: second.request.revision,
      sessionId: accepted.sessionId,
    })).resolves.toEqual({ ok: true });
    expect((await repository.getConversation(accepted.sessionId))?.boundaries).toHaveLength(1);
    repository.destroy();
  });
});
