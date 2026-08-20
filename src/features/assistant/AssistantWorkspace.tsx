"use client";

import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { v4 as uuid } from "uuid";

import { buildReconstructionPrompts, currentTurnPrompt } from "@/features/assistant/context/prompt";
import { compactConversation } from "@/features/assistant/context/compaction";
import {
  evaluateContext,
  partitionCompletedTurns,
  projectedContext,
} from "@/features/assistant/context/contextManager";
import { AssistantShell } from "@/features/assistant/components/AssistantShell";
import { AvailabilityPanel } from "@/features/assistant/components/AvailabilityPanel";
import { ConfirmationDialog } from "@/features/assistant/components/ConfirmationDialog";
import { Composer } from "@/features/assistant/components/Composer";
import { Transcript } from "@/features/assistant/components/Transcript";
import {
  ASSISTANT_LOCK_PREFIX,
  MODEL_AVAILABILITY_POLL_INTERVAL_MS,
  PROMPT_VERSION,
  STREAM_CHECKPOINT_INTERVAL_MS,
} from "@/features/assistant/constants";
import { BrowserLanguageModelAdapter } from "@/features/assistant/model/browserLanguageModel";
import type { LocalModelAdapter, LocalModelSession } from "@/features/assistant/model/modelAdapter";
import {
  ModelSessionCache,
  modelSessionIdentity,
} from "@/features/assistant/model/modelSessionCache";
import { assistantReducer, initialAssistantState } from "@/features/assistant/reducer";
import { blankPersonality, type AssistantRepository } from "@/features/assistant/storage/repository";
import { MemoryAssistantRepository } from "@/features/assistant/storage/memoryRepository";
import { DexieAssistantRepository } from "@/features/assistant/storage/dexieRepository";
import {
  RepositoryLifecycleCancelledError,
  ResilientAssistantRepository,
} from "@/features/assistant/storage/repositoryFallback";
import { useRepositoryQuery } from "@/features/assistant/storage/useRepositoryQuery";
import type {
  ConversationSnapshot,
  ContextState,
  ModelContext,
  ModelErrorCode,
  RepositorySnapshot,
  SessionId,
  SessionListSnapshot,
  SettingsSnapshot,
  TurnId,
} from "@/features/assistant/types";
import { toAttemptId, toSubmissionId } from "@/features/assistant/types";

interface AssistantWorkspaceProps {
  adapter?: LocalModelAdapter;
  repository?: AssistantRepository;
}

interface ActiveGeneration {
  abort: AbortController;
  attemptId: ReturnType<typeof toAttemptId>;
  epoch: number;
  lastText: string;
  reason: "visitor" | "session_switched";
  session: LocalModelSession | null;
  sessionId: SessionId;
  turnId: TurnId;
  unsubscribeOverflow: () => void;
  overflowed: boolean;
}

const emptySessions: SessionListSnapshot = {
  activeSessionId: null,
  datasetEpoch: 0,
  sessions: [],
};
const emptySettings: SettingsSnapshot = { personality: blankPersonality() };

function errorCode(error: unknown): ModelErrorCode {
  if (error instanceof DOMException && error.name === "AbortError") return "aborted";
  if (error instanceof Error) {
    switch (error.message) {
      case "activation_required":
      case "unsupported_input":
      case "download_failed":
      case "model_unavailable":
      case "output_filtered":
      case "context_too_large":
      case "aborted":
      case "operation_failed":
      case "api_changed":
      case "empty_response":
        return error.message;
    }
  }
  return "operation_failed";
}

function measuredContextState(
  conversation: ConversationSnapshot,
  measurement: ModelContext,
  personalityRevision: number,
  overflowed: boolean,
): ContextState {
  const prior = conversation.context;
  const assessment = evaluateContext({ ...measurement, overflowed });
  const state =
    assessment.state === "fresh" && prior?.summaryText
      ? "compacted"
      : assessment.state;
  return {
    sessionId: conversation.session.id,
    epoch: conversation.session.epoch,
    state,
    summaryText: prior?.summaryText ?? null,
    summarizedThroughTurnId: prior?.summarizedThroughTurnId ?? null,
    directFromTurnId: prior?.directFromTurnId ?? null,
    contextUsage: measurement.usage,
    contextWindow: measurement.window,
    promptVersion: prior?.promptVersion ?? PROMPT_VERSION,
    sourceHistoryRevision: conversation.session.historyRevision,
    personalityRevision,
    compactedAt: prior?.compactedAt ?? null,
    overflowedAt: overflowed ? prior?.overflowedAt ?? Date.now() : null,
  };
}

export function AssistantWorkspace({
  adapter: providedAdapter,
  repository: providedRepository,
}: AssistantWorkspaceProps) {
  const adapter = useMemo(
    () => providedAdapter ?? new BrowserLanguageModelAdapter(),
    [providedAdapter],
  );
  const repository = useMemo(
    () =>
      providedRepository ??
      new ResilientAssistantRepository(
        new DexieAssistantRepository(),
        new MemoryAssistantRepository(),
      ),
    [providedRepository],
  );
  const sessionCache = useMemo(() => new ModelSessionCache(), []);
  const [state, dispatch] = useReducer(assistantReducer, initialAssistantState);
  const subscribeSettings = useCallback(
    (listener: (value: SettingsSnapshot) => void) =>
      repository.subscribeSettings(listener, (reason) => {
        dispatch({ type: "storage/temporary", reason });
      }),
    [repository],
  );
  const settings = useRepositoryQuery(emptySettings, subscribeSettings);
  const personality = settings.personality;
  const [draft, setDraft] = useState("");
  const [setupPending, setSetupPending] = useState(false);
  const [sessions, setSessions] = useState<SessionListSnapshot>(emptySessions);
  const [conversation, setConversation] = useState<ConversationSnapshot | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<SessionId | null>(null);
  const [confirmation, setConfirmation] = useState<
    | { kind: "delete"; sessionId: SessionId; title: string }
    | { kind: "clear" }
    | null
  >(null);
  const activeRef = useRef<ActiveGeneration | null>(null);
  const setupRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);
  const selectedSessionIdRef = useRef<SessionId | null>(null);

  const syncStorageMode = useCallback((): void => {
    if (repository.mode() === "temporary") {
      dispatch({ type: "storage/temporary", reason: "storage_write_failed" });
    }
  }, [repository]);

  const persistContextMeasurement = useCallback(
    async (
      latestConversation: ConversationSnapshot,
      measurement: ModelContext,
      personalityRevision: number,
      overflowed: boolean,
    ): Promise<ContextState | null> => {
      const context = measuredContextState(
        latestConversation,
        measurement,
        personalityRevision,
        overflowed,
      );
      const result = await repository.commitContext({
        context,
        expectedHistoryRevision: latestConversation.session.historyRevision,
        expectedPersonalityRevision: personalityRevision,
      });
      syncStorageMode();
      return result.ok ? context : null;
    },
    [repository, syncStorageMode],
  );

  const recheckAvailability = useCallback(async (): Promise<void> => {
    setupRef.current?.abort();
    setupRef.current = null;
    setSetupPending(false);
    dispatch({ type: "environment/checking" });
    try {
      const availability = await adapter.availability();
      if (mountedRef.current) {
        if (availability.state !== "available") sessionCache.clear();
        dispatch({ type: "environment/availability", availability });
      }
    } catch (error) {
      sessionCache.clear();
      if (mountedRef.current) {
        dispatch({ type: "environment/failed", code: errorCode(error) });
      }
    }
  }, [adapter, sessionCache]);

  const prepareModel = useCallback((): void => {
    const abort = new AbortController();
    const identity = modelSessionIdentity(conversation, personality.revision);
    setupRef.current?.abort();
    sessionCache.clear();
    setupRef.current = abort;
    setSetupPending(true);
    dispatch({ type: "environment/progress", fraction: null });

    const creation = adapter.create(
      buildReconstructionPrompts({ conversation, personality }),
      abort.signal,
      (progress) => {
        if (abort.signal.aborted || setupRef.current !== abort) return;
        if (progress.state === "preparing") {
          dispatch({ type: "environment/preparing" });
        } else {
          dispatch({ type: "environment/progress", fraction: progress.fraction });
        }
      },
    );

    void creation
      .then((session) => {
        if (abort.signal.aborted || setupRef.current !== abort) {
          session.destroy();
          return;
        }
        setupRef.current = null;
        setSetupPending(false);
        sessionCache.store(identity, session);
        dispatch({ type: "environment/ready" });
      })
      .catch(async (error) => {
        if (setupRef.current === abort) {
          setupRef.current = null;
          setSetupPending(false);
        }
        if (!mountedRef.current || abort.signal.aborted) return;
        try {
          const availability = await adapter.availability();
          if (!mountedRef.current) return;
          if (availability.state === "downloading") {
            dispatch({ type: "environment/availability", availability });
            return;
          }
        } catch (availabilityError) {
          if (mountedRef.current) {
            dispatch({ type: "environment/failed", code: errorCode(availabilityError) });
          }
          return;
        }
        if (mountedRef.current) dispatch({ type: "environment/failed", code: errorCode(error) });
      });
  }, [adapter, conversation, personality, sessionCache]);

  useEffect(() => {
    if (state.environment.status !== "downloading" || setupPending) return;
    let active = true;
    let checking = false;
    let timer: number | null = null;

    const schedule = (): void => {
      if (!active) return;
      timer = window.setTimeout(
        () => void checkAvailability(),
        MODEL_AVAILABILITY_POLL_INTERVAL_MS,
      );
    };

    const checkAvailability = async (): Promise<void> => {
      if (!active || checking) return;
      checking = true;
      try {
        const availability = await adapter.availability();
        if (!active) return;
        if (availability.state === "downloading") {
          schedule();
        } else {
          if (availability.state !== "available") sessionCache.clear();
          dispatch({ type: "environment/availability", availability });
        }
      } catch (error) {
        if (active) dispatch({ type: "environment/failed", code: errorCode(error) });
      } finally {
        checking = false;
      }
    };

    const checkWhenVisible = (): void => {
      if (document.visibilityState !== "visible") return;
      if (timer !== null) window.clearTimeout(timer);
      timer = null;
      void checkAvailability();
    };

    schedule();
    document.addEventListener("visibilitychange", checkWhenVisible);
    return () => {
      active = false;
      if (timer !== null) window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", checkWhenVisible);
    };
  }, [adapter, sessionCache, setupPending, state.environment.status]);

  useEffect(() => {
    mountedRef.current = true;
    let active = true;
    let unsubscribeSessions: () => void = () => undefined;

    async function initialize(): Promise<void> {
      let initial: RepositorySnapshot;
      try {
        initial = await repository.initialize();
      } catch (error) {
        if (!active && error instanceof RepositoryLifecycleCancelledError) return;
        throw error;
      }
      if (!active) return;
      setSessions(initial.sessions);
      setSelectedSessionId(initial.sessions.activeSessionId);
      selectedSessionIdRef.current = initial.sessions.activeSessionId;
      setConversation(initial.conversation);
      if (repository.mode() === "durable") {
        dispatch({ type: "storage/durable" });
      } else {
        dispatch({ type: "storage/temporary", reason: "storage_unavailable" });
      }
      unsubscribeSessions = repository.subscribeSessions(setSessions, (reason) => {
        dispatch({ type: "storage/temporary", reason });
      });

      if (active) await recheckAvailability();
    }

    void initialize();
    return () => {
      active = false;
      mountedRef.current = false;
      setupRef.current?.abort();
      setupRef.current = null;
      activeRef.current?.abort.abort();
      activeRef.current?.session?.destroy();
      sessionCache.clear();
      unsubscribeSessions();
      repository.destroy();
    };
  }, [recheckAvailability, repository, sessionCache]);

  useEffect(() => {
    if (!selectedSessionId) {
      setConversation(null);
      return;
    }
    let active = true;
    void repository.getConversation(selectedSessionId).then((snapshot) => {
      if (active) setConversation(snapshot);
    });
    const unsubscribe = repository.subscribeConversation(
      selectedSessionId,
      (snapshot) => {
        if (active) setConversation(snapshot);
      },
      (reason) => {
        dispatch({ type: "storage/temporary", reason });
      },
    );
    return () => {
      active = false;
      unsubscribe();
    };
  }, [repository, selectedSessionId]);

  useEffect(() => {
    sessionCache.invalidateUnless(
      modelSessionIdentity(conversation, personality.revision),
    );
  }, [conversation, personality.revision, sessionCache]);

  const processOneTurn = useCallback(
    async (sessionId: SessionId, epoch: number): Promise<boolean> => {
      const attemptId = toAttemptId(uuid());
      const claimed = await repository.claimNextTurn({
        at: Date.now(),
        attemptId,
        epoch,
        sessionId,
      });
      if (!claimed) return false;

      dispatch({ type: "work/checking-context", turnId: claimed.turnId });
      const abort = new AbortController();
      const active: ActiveGeneration = {
        abort,
        attemptId,
        epoch,
        lastText: "",
        reason: "visitor",
        session: null,
        sessionId,
        turnId: claimed.turnId,
        unsubscribeOverflow: () => undefined,
        overflowed: false,
      };
      activeRef.current = active;

      try {
        const currentAvailability = await adapter.availability();
        if (currentAvailability.state !== "available") {
          sessionCache.clear();
          dispatch({ type: "environment/availability", availability: currentAvailability });
          throw new Error("model_unavailable");
        }
        let latestConversation = await repository.getConversation(sessionId);
        if (!latestConversation) throw new Error("operation_failed");
        const currentPersonality = (await repository.getSettings()).personality;
        const userMessage = latestConversation.messages.find(
          (message) => message.id === claimed.turn.userMessageId,
        );
        if (!userMessage) throw new Error("operation_failed");

        const identity = modelSessionIdentity(
          latestConversation,
          currentPersonality.revision,
        );
        let modelSession = sessionCache.take(identity);
        if (!modelSession) {
          modelSession = await adapter.create(
            buildReconstructionPrompts({
              conversation: latestConversation,
              personality: currentPersonality,
            }),
            abort.signal,
          );
        }
        active.session = modelSession;
        if (abort.signal.aborted) {
          modelSession.destroy();
          throw new DOMException("The operation was aborted", "AbortError");
        }
        active.overflowed = latestConversation.context?.state === "overflowed";
        const overflowSession = modelSession;
        active.unsubscribeOverflow = overflowSession.onOverflow(() => {
          if (activeRef.current !== active) return;
          active.overflowed = true;
          void (async () => {
            const overflowConversation = await repository.getConversation(sessionId);
            if (!overflowConversation || activeRef.current !== active) return;
            await persistContextMeasurement(
              overflowConversation,
              overflowSession.context(),
              currentPersonality.revision,
              true,
            );
            if (activeRef.current === active) {
              setConversation(await repository.getConversation(sessionId));
            }
          })();
        });

        const nextPrompt = currentTurnPrompt(userMessage.text);
        const projected = projectedContext(
          modelSession.context(),
          await modelSession.measure(nextPrompt, abort.signal),
        );
        const assessment = evaluateContext({
          ...projected,
          overflowed: active.overflowed,
        });
        const hasOlderTurns =
          partitionCompletedTurns(latestConversation.turns).summaryTurns.length > 0;
        if ((assessment.shouldCompact || assessment.blocked) && hasOlderTurns) {
          dispatch({ type: "work/compacting", turnId: claimed.turnId });
          active.unsubscribeOverflow();
          modelSession.destroy();
          active.session = null;
          const compacted = await compactConversation({
            adapter,
            conversation: latestConversation,
            personality: currentPersonality,
            repository,
            signal: abort.signal,
          });
          syncStorageMode();
          if (!compacted.ok) throw new Error(compacted.code);
          latestConversation = await repository.getConversation(sessionId);
          if (!latestConversation) throw new Error("operation_failed");
          modelSession = compacted.session;
          active.session = modelSession;
          active.overflowed = false;
          const replacementOverflowSession = modelSession;
          active.unsubscribeOverflow = replacementOverflowSession.onOverflow(() => {
            if (activeRef.current !== active) return;
            active.overflowed = true;
            void (async () => {
              const overflowConversation = await repository.getConversation(sessionId);
              if (!overflowConversation || activeRef.current !== active) return;
              await persistContextMeasurement(
                overflowConversation,
                replacementOverflowSession.context(),
                currentPersonality.revision,
                true,
              );
              if (activeRef.current === active) {
                setConversation(await repository.getConversation(sessionId));
              }
            })();
          });
        } else if (assessment.blocked) {
          throw new Error("context_too_large");
        }

        dispatch({ type: "environment/ready" });
        dispatch({ type: "work/generating", turnId: claimed.turnId, hasContent: false });

        let lastCheckpointAt = 0;
        for await (const text of modelSession.stream(
          nextPrompt,
          abort.signal,
        )) {
          if (activeRef.current !== active) break;
          active.lastText = text;
          dispatch({ type: "work/generating", turnId: claimed.turnId, hasContent: true });
          const now = Date.now();
          if (lastCheckpointAt === 0 || now - lastCheckpointAt >= STREAM_CHECKPOINT_INTERVAL_MS) {
            await repository.checkpointResponse({
              at: now,
              attemptId,
              epoch,
              sessionId,
              text,
              turnId: claimed.turnId,
            });
            lastCheckpointAt = now;
          }
        }

        if (abort.signal.aborted) throw new DOMException("The operation was aborted", "AbortError");
        if (active.lastText.length === 0) throw new Error("empty_response");
        const finishResult = await repository.finishTurn({
          at: Date.now(),
          attemptId,
          epoch,
          sessionId,
          status: "completed",
          text: active.lastText,
          turnId: claimed.turnId,
        });
        if (!finishResult.ok) {
          throw new Error(
            finishResult.code === "already_terminal" ? "aborted" : "operation_failed",
          );
        }
        let completedConversation = await repository.getConversation(sessionId);
        if (completedConversation) {
          await persistContextMeasurement(
            completedConversation,
            modelSession.context(),
            currentPersonality.revision,
            active.overflowed,
          );
          completedConversation = await repository.getConversation(sessionId);
        }
        if (activeRef.current === active) setConversation(completedConversation);
        if (
          completedConversation &&
          selectedSessionIdRef.current === sessionId &&
          activeRef.current === active
        ) {
          sessionCache.store(
            modelSessionIdentity(completedConversation, currentPersonality.revision),
            modelSession,
          );
          active.session = null;
        }
        if (mountedRef.current) dispatch({ type: "work/completed" });
      } catch (error) {
        sessionCache.clear();
        const code = errorCode(error);
        if (code === "aborted") {
          await repository.finishTurn({
            at: Date.now(),
            attemptId,
            epoch,
            interruptionReason: active.reason,
            sessionId,
            status: "interrupted",
            text: active.lastText,
            turnId: claimed.turnId,
          });
          if (active.reason === "visitor") {
            setConversation(await repository.getConversation(sessionId));
          }
          if (mountedRef.current) dispatch({ type: "work/stopped" });
        } else {
          await repository.finishTurn({
            at: Date.now(),
            attemptId,
            epoch,
            failureCode: code,
            sessionId,
            status: "failed",
            text: active.lastText,
            turnId: claimed.turnId,
          });
          if (activeRef.current === active) {
            setConversation(await repository.getConversation(sessionId));
          }
          if (mountedRef.current) dispatch({ type: "work/failed", code });
        }
      } finally {
        active.unsubscribeOverflow();
        active.session?.destroy();
        if (activeRef.current === active) activeRef.current = null;
      }
      return true;
    },
    [adapter, persistContextMeasurement, repository, sessionCache, syncStorageMode],
  );

  const processAcceptedTurn = useCallback(
    async (sessionId: SessionId, epoch: number): Promise<void> => {
      const processQueue = async (): Promise<void> => {
        while (await processOneTurn(sessionId, epoch)) {
          // Re-read under the same session lock until the persisted queue is empty.
        }
      };

      if (typeof navigator !== "undefined" && navigator.locks) {
        await navigator.locks.request(
          `${ASSISTANT_LOCK_PREFIX}${sessionId}`,
          { mode: "exclusive" },
          processQueue,
        );
      } else {
        await processQueue();
      }
    },
    [processOneTurn],
  );

  const submit = useCallback(
    async (text: string): Promise<void> => {
      try {
        const accepted = await repository.acceptPrompt({
          at: Date.now(),
          sessionId: selectedSessionId,
          submissionId: toSubmissionId(uuid()),
          text,
        });
        setDraft("");
        setSelectedSessionId(accepted.sessionId);
        selectedSessionIdRef.current = accepted.sessionId;
        await repository.selectSession(accepted.sessionId, Date.now());
        dispatch({ type: "work/queued", turnId: accepted.turnId });
        await processAcceptedTurn(accepted.sessionId, accepted.epoch);
      } catch (error) {
        const code = error instanceof Error ? error.message : "storage_write_failed";
        if (repository.mode() === "temporary" && code !== "session_limit") {
          dispatch({ type: "storage/temporary", reason: "storage_write_failed" });
        } else {
          dispatch({ type: "work/failed", code: "operation_failed" });
        }
      }
    },
    [processAcceptedTurn, repository, selectedSessionId],
  );

  const compactCurrentConversation = useCallback(async (): Promise<void> => {
    if (!selectedSessionId || activeRef.current) return;
    const run = async (): Promise<void> => {
      const latestConversation = await repository.getConversation(selectedSessionId);
      if (
        !latestConversation ||
        partitionCompletedTurns(latestConversation.turns).summaryTurns.length === 0
      ) {
        return;
      }
      dispatch({ type: "work/compacting", turnId: null });
      sessionCache.clear();
      const currentPersonality = (await repository.getSettings()).personality;
      const result = await compactConversation({
        adapter,
        conversation: latestConversation,
        personality: currentPersonality,
        repository,
      });
      syncStorageMode();
      const updatedConversation = await repository.getConversation(selectedSessionId);
      setConversation(updatedConversation);
      if (result.ok) {
        if (
          updatedConversation &&
          selectedSessionIdRef.current === selectedSessionId
        ) {
          sessionCache.store(
            modelSessionIdentity(updatedConversation, currentPersonality.revision),
            result.session,
          );
        } else {
          result.session.destroy();
        }
        dispatch({ type: "work/completed" });
      } else {
        dispatch({ type: "work/failed", code: errorCode(new Error(result.code)) });
      }
    };
    if (typeof navigator !== "undefined" && navigator.locks) {
      await navigator.locks.request(
        `${ASSISTANT_LOCK_PREFIX}${selectedSessionId}`,
        { mode: "exclusive" },
        run,
      );
    } else {
      await run();
    }
  }, [adapter, repository, selectedSessionId, sessionCache, syncStorageMode]);

  const savePersonality = useCallback(
    async (text: string) => {
      const result = await repository.savePersonality(text, Date.now());
      if (result.ok) {
        setupRef.current?.abort();
        setupRef.current = null;
        setSetupPending(false);
        sessionCache.clear();
      }
      syncStorageMode();
      return result;
    },
    [repository, sessionCache, syncStorageMode],
  );

  function newChat(): void {
    const active = activeRef.current;
    if (active) {
      active.reason = "session_switched";
      active.abort.abort();
      active.session?.destroy();
    }
    setupRef.current?.abort();
    setupRef.current = null;
    setSetupPending(false);
    sessionCache.clear();
    selectedSessionIdRef.current = null;
    setSelectedSessionId(null);
    setConversation(null);
    setDraft("");
    dispatch({ type: "work/idle" });
    void repository.selectSession(null, Date.now());
  }

  function selectSession(sessionId: SessionId): void {
    if (selectedSessionIdRef.current === sessionId) return;
    const active = activeRef.current;
    if (active && active.sessionId !== sessionId) {
      active.reason = "session_switched";
      active.abort.abort();
      active.session?.destroy();
    }
    setupRef.current?.abort();
    setupRef.current = null;
    setSetupPending(false);
    sessionCache.clear();
    selectedSessionIdRef.current = sessionId;
    setSelectedSessionId(sessionId);
    void repository.selectSession(sessionId, Date.now());
  }

  function retry(turnId: TurnId): void {
    const turn = conversation?.turns.find((candidate) => candidate.id === turnId);
    const message = turn
      ? conversation?.messages.find((candidate) => candidate.id === turn.userMessageId)
      : null;
    if (message) void submit(message.text);
  }

  async function confirmDestructiveAction(): Promise<void> {
    const pending = confirmation;
    if (!pending) return;
    activeRef.current?.abort.abort();
    activeRef.current?.session?.destroy();
    setupRef.current?.abort();
    setupRef.current = null;
    setSetupPending(false);
    sessionCache.clear();

    const result =
      pending.kind === "clear"
        ? await repository.clearAll(Date.now())
        : await repository.deleteSession(pending.sessionId, Date.now());
    if (!result.ok) {
      dispatch({ type: "storage/deletion-unverified" });
      setConfirmation(null);
      return;
    }

    const next = await repository.getSessions();
    setSessions(next);
    setSelectedSessionId(next.activeSessionId);
    selectedSessionIdRef.current = next.activeSessionId;
    setConversation(
      next.activeSessionId
        ? await repository.getConversation(next.activeSessionId)
        : null,
    );
    setConfirmation(null);
    dispatch({ type: "work/idle" });
    window.requestAnimationFrame(() => {
      const selector = window.matchMedia("(min-width: 768px)").matches
        ? "[data-assistant-new-chat]"
        : "[data-assistant-chats]";
      document.querySelector<HTMLButtonElement>(selector)?.focus();
    });
  }

  const ready = state.environment.status === "ready";
  return (
    <>
      <AssistantShell
        canCompact={
          state.work.status !== "generating" &&
          state.work.status !== "compacting" &&
          partitionCompletedTurns(conversation?.turns ?? []).summaryTurns.length > 0
        }
        conversation={conversation}
        onClearAll={() => setConfirmation({ kind: "clear" })}
        onCompact={() => void compactCurrentConversation()}
        onDeleteSession={(sessionId) => {
          const session = sessions.sessions.find((candidate) => candidate.id === sessionId);
          if (session) {
            setConfirmation({ kind: "delete", sessionId, title: session.title });
          }
        }}
        onNewChat={newChat}
        onSelectSession={selectSession}
        onSavePersonality={savePersonality}
        personality={personality}
        sessions={sessions}
        state={state}
      >
      <Transcript conversation={conversation} onRetry={retry} />
      <footer className="shrink-0 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-8 lg:px-12">
        <div className="mx-auto max-w-3xl">
          {ready && state.work.status === "failed" ? (
            <p
              className="mb-3 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-100"
              role="alert"
            >
              {state.work.code === "context_too_large"
                ? "Generation did not proceed with verified full context. Compact this chat, shorten the prompt, or start a new chat."
                : state.work.code === "output_filtered"
                  ? "Chrome did not return that response, possibly because its built-in safety checks blocked the output. Rephrase the prompt or start a new chat."
                  : "The local assistant could not complete that response. Retry it, edit the prompt, or start a new chat."}
            </p>
          ) : null}
          {ready ? (
            <Composer
              onChange={setDraft}
              onStop={() => {
                activeRef.current?.abort.abort();
                activeRef.current?.session?.destroy();
              }}
              onSubmit={() => void submit(draft)}
              value={draft}
              work={state.work}
            />
          ) : (
            <AvailabilityPanel
              environment={state.environment}
              onPrepare={prepareModel}
              onRetry={() => void recheckAvailability()}
              onStopWaiting={() => {
                const setup = setupRef.current;
                setupRef.current = null;
                setSetupPending(false);
                setup?.abort();
                dispatch({ type: "environment/failed", code: "aborted" });
              }}
            />
          )}
          <p className="mx-auto mt-3 max-w-2xl text-center text-[0.68rem] leading-5 text-zinc-600 dark:text-zinc-400">
            Responses are generated locally on this device. This assistant has no tools or live web access. Answers may be wrong or outdated—double-check important results.
          </p>
        </div>
      </footer>
      </AssistantShell>
      <ConfirmationDialog
        confirmLabel={confirmation?.kind === "clear" ? "Clear everything" : "Delete chat"}
        description={
          confirmation?.kind === "clear"
            ? "This removes every local chat, generated response, context summary, and personality preference from this browser. It cannot be undone."
            : `This removes only “${confirmation?.kind === "delete" ? confirmation.title : "this chat"}” from this browser. Your other chats and personality preference stay intact.`
        }
        onClose={() => setConfirmation(null)}
        onConfirm={() => void confirmDestructiveAction()}
        open={confirmation !== null}
        title={
          confirmation?.kind === "clear"
            ? "Clear all local assistant data?"
            : `Delete ${confirmation?.kind === "delete" ? confirmation.title : "this chat"}?`
        }
      />
    </>
  );
}
