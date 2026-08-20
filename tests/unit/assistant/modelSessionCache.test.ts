import { describe, expect, it } from "vitest";

import {
  ModelSessionCache,
  type ModelSessionIdentity,
} from "@/features/assistant/model/modelSessionCache";
import { toSessionId } from "@/features/assistant/types";
import { createFakeModelAdapter } from "../../fixtures/fakeLanguageModel";

function identity(
  sessionId: ModelSessionIdentity["sessionId"],
  historyRevision = 0,
): ModelSessionIdentity {
  return {
    compactedAt: null,
    directFromTurnId: null,
    historyRevision,
    personalityRevision: 0,
    promptVersion: 1,
    sessionId,
    summarizedThroughTurnId: null,
  };
}

describe("ModelSessionCache", () => {
  it("hands the same native session to an unchanged active conversation", async () => {
    const fake = createFakeModelAdapter();
    const session = await fake.adapter.create([]);
    const cache = new ModelSessionCache();
    const requested = identity(toSessionId("session-1"), 2);

    cache.store(requested, session);

    expect(cache.take(requested)).toBe(session);
    expect(fake.lifecycle.destroyed).toBe(0);
  });

  it("destroys a retained session when persisted history has advanced", async () => {
    const fake = createFakeModelAdapter();
    const session = await fake.adapter.create([]);
    const cache = new ModelSessionCache();

    cache.store(identity(toSessionId("session-1"), 2), session);

    expect(cache.take(identity(toSessionId("session-1"), 3))).toBeNull();
    expect(fake.lifecycle.destroyed).toBe(1);
  });

  it("invalidates a retained session as soon as an external revision is observed", async () => {
    const fake = createFakeModelAdapter();
    const session = await fake.adapter.create([]);
    const cache = new ModelSessionCache();

    cache.store(identity(toSessionId("session-1"), 2), session);
    cache.invalidateUnless(identity(toSessionId("session-1"), 2));
    expect(fake.lifecycle.destroyed).toBe(0);

    cache.invalidateUnless(identity(toSessionId("session-1"), 3));
    expect(fake.lifecycle.destroyed).toBe(1);
  });

  it("adopts a prepared blank session for its first persisted turn", async () => {
    const fake = createFakeModelAdapter();
    const session = await fake.adapter.create([]);
    const cache = new ModelSessionCache();

    cache.store(identity(null), session);

    expect(cache.take(identity(toSessionId("new-session")))).toBe(session);
    expect(fake.lifecycle.destroyed).toBe(0);
  });

  it("keeps only one idle native session and clears it idempotently", async () => {
    const fake = createFakeModelAdapter();
    const first = await fake.adapter.create([]);
    const second = await fake.adapter.create([]);
    const cache = new ModelSessionCache();

    cache.store(identity(toSessionId("session-1")), first);
    cache.store(identity(toSessionId("session-2")), second);
    cache.clear();
    cache.clear();

    expect(fake.lifecycle.destroyed).toBe(2);
  });
});
