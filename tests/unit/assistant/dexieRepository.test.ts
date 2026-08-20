import { describe, expect, it, vi } from "vitest";

import { AssistantDatabase } from "@/features/assistant/storage/database";
import {
  DexieAssistantRepository,
  RepositoryMutationError,
} from "@/features/assistant/storage/dexieRepository";
import {
  toAttemptId,
  toSubmissionId,
} from "@/features/assistant/types";

describe("DexieAssistantRepository", () => {
  it("defines the complete version-one local schema and coordination indexes", () => {
    const database = new AssistantDatabase("schema-inspection");
    expect(database.tables.map((table) => table.name).sort()).toEqual([
      "contexts",
      "messages",
      "meta",
      "sessions",
      "settings",
      "tombstones",
      "turns",
    ]);
    expect(database.turns.schema.indexes.map((index) => index.name)).toEqual(
      expect.arrayContaining(["sessionId", "submissionId", "[sessionId+status]", "[sessionId+promptCreatedAt]"]),
    );
    database.close();
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
});
