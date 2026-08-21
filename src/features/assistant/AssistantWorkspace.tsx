"use client";

import type { DragEvent } from "react";
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
import { Composer, type ComposerHandle } from "@/features/assistant/components/Composer";
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
import { EphemeralMediaStore } from "@/features/assistant/storage/ephemeralMediaStore";
import { createMediaHistoryDraft } from "@/features/assistant/storage/mediaHistory";
import {
  RepositoryLifecycleCancelledError,
  ResilientAssistantRepository,
} from "@/features/assistant/storage/repositoryFallback";
import { useRepositoryQuery } from "@/features/assistant/storage/useRepositoryQuery";
import type {
  ConversationSnapshot,
  ContextState,
  MediaCapability,
  MediaPart,
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
      case "media_unavailable":
      case "media_rehydration_required":
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
  const mediaStore = useMemo(() => new EphemeralMediaStore(), []);
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
  const [media, setMedia] = useState<MediaPart[]>([]);
  const [capabilities, setCapabilities] = useState<MediaCapability | null>(null);
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
  const composerRef = useRef<ComposerHandle>(null);
  const dragDepthRef = useRef(0);
  const setupRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);
  const selectedSessionIdRef = useRef<SessionId | null>(null);
  const [dropActive, setDropActive] = useState(false);

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
        if (availability.state === "available") {
          const snapshot = await adapter.capabilities?.();
          setCapabilities(
            snapshot ?? {
              text: true,
              image: false,
              audio: false,
              observedAt: Date.now(),
              modelIdentity: null,
              error: null,
            },
          );
        } else {
          setCapabilities(null);
        }
        dispatch({ type: "environment/availability", availability });
      }
    } catch (error) {
      sessionCache.clear();
      setCapabilities(null);
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
        void adapter.capabilities?.().then((snapshot) => {
          if (mountedRef.current && setupRef.current === null) setCapabilities(snapshot ?? null);
        });
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
          if (availability.state === "available") {
            const snapshot = await adapter.capabilities?.();
            setCapabilities(
              snapshot ?? {
                text: true,
                image: false,
                audio: false,
                observedAt: Date.now(),
                modelIdentity: null,
                error: null,
              },
            );
          } else {
            setCapabilities(null);
          }
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
      await repository.markUnownedMediaTurns?.(Date.now());
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
      mediaStore.releaseAll("reload");
      sessionCache.clear();
      unsubscribeSessions();
      repository.destroy();
    };
  }, [mediaStore, recheckAvailability, repository, sessionCache]);

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
        ownerWindowId: mediaStore.ownerWindowId,
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
        const mediaParts = (claimed.turn.mediaRepresentationIds ?? []).length > 0
          ? mediaStore.claim(claimed.turn.submissionId, mediaStore.ownerWindowId)
          : [];
        if ((claimed.turn.mediaRepresentationIds ?? []).length > 0 && !mediaParts) {
          throw new Error("media_rehydration_required");
        }
        if (mediaParts && mediaParts.length > 0) {
          const capability = await adapter.capabilities?.();
          if (
            !capability ||
            !capability.text ||
            mediaParts.some((part) => !capability[part.kind])
          ) {
            throw new Error("media_unavailable");
          }
        }

        const identity = modelSessionIdentity(
          latestConversation,
          currentPersonality.revision,
        );
        if (mediaParts && mediaParts.length > 0) sessionCache.clear();
        let modelSession = mediaParts && mediaParts.length > 0 ? null : sessionCache.take(identity);
        if (!modelSession) {
          modelSession = await adapter.create(
            buildReconstructionPrompts({
              conversation: latestConversation,
              personality: currentPersonality,
            }),
            abort.signal,
            undefined,
            mediaParts?.map((part) => part.kind),
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

        const nextPrompt = currentTurnPrompt(userMessage.text, mediaParts ?? []);
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
        if ((claimed.turn.mediaRepresentationIds ?? []).length > 0) {
          mediaStore.release(claimed.turn.submissionId, "terminal");
        }
        if (
          (!mediaParts || mediaParts.length === 0) &&
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
        if (mountedRef.current) {
          dispatch({ type: "work/completed", turnId: claimed.turnId });
        }
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
          if (claimed.turn.mediaRepresentationIds?.length) {
            mediaStore.retainForRetry(claimed.turn.submissionId);
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
          if (claimed.turn.mediaRepresentationIds?.length) {
            if (code === "media_rehydration_required") {
              mediaStore.release(claimed.turn.submissionId, "unavailable");
            } else {
              mediaStore.retainForRetry(claimed.turn.submissionId);
            }
          }
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
    [adapter, mediaStore, persistContextMeasurement, repository, sessionCache, syncStorageMode],
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
    async (text: string, submittedMedia: MediaPart[] = media): Promise<ReturnType<typeof toSubmissionId> | null> => {
      const submissionId = toSubmissionId(uuid());
      const staged = submittedMedia.length > 0
        ? mediaStore.stage(submissionId, submittedMedia)
        : null;
      try {
        if (staged) {
          const availability = await adapter.availability();
          const capability = await adapter.capabilities?.();
          if (
            availability.state !== "available" ||
            !capability ||
            !capability.text ||
            staged.parts.some((part) => !capability[part.kind])
          ) {
            throw new Error("media_unavailable");
          }
        }
        const representations = staged
          ? await Promise.all(staged.parts.map((part) => createMediaHistoryDraft(part)))
          : [];
        const accepted = await repository.acceptPrompt({
          at: Date.now(),
          sessionId: selectedSessionId,
          submissionId,
          text,
          media: staged
            ? {
                kinds: staged.parts.map((part) => part.kind),
                ownerWindowId: staged.ownerWindowId,
                representations,
              }
            : undefined,
        });
        if (staged) mediaStore.bindTurn(submissionId, accepted.turnId);
        setDraft("");
        setMedia([]);
        setSelectedSessionId(accepted.sessionId);
        selectedSessionIdRef.current = accepted.sessionId;
        await repository.selectSession(accepted.sessionId, Date.now());
        dispatch({ type: "work/queued", turnId: accepted.turnId });
        await processAcceptedTurn(accepted.sessionId, accepted.epoch);
        return submissionId;
      } catch (error) {
        if (staged) mediaStore.release(submissionId, "unavailable");
        const rawCode = error instanceof Error ? error.message : null;
        const code = errorCode(error);
        if (repository.mode() === "temporary" && rawCode !== "session_limit") {
          dispatch({ type: "storage/temporary", reason: "storage_write_failed" });
        } else {
          dispatch({ type: "work/failed", code });
        }
        return null;
      }
    },
    [adapter, media, mediaStore, processAcceptedTurn, repository, selectedSessionId],
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
        dispatch({ type: "work/completed", turnId: null });
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
    mediaStore.releaseAll("cancelled");
    selectedSessionIdRef.current = null;
    setSelectedSessionId(null);
    setConversation(null);
    setDraft("");
    setMedia([]);
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
    mediaStore.releaseAll("cancelled");
    setMedia([]);
    selectedSessionIdRef.current = sessionId;
    setSelectedSessionId(sessionId);
    void repository.selectSession(sessionId, Date.now());
  }

  function retry(turnId: TurnId): void {
    const turn = conversation?.turns.find((candidate) => candidate.id === turnId);
    const message = turn
      ? conversation?.messages.find((candidate) => candidate.id === turn.userMessageId)
      : null;
    if (!turn || !message) return;
    const hasMedia = (turn.mediaRepresentationIds ?? []).length > 0;
    const retryMedia = hasMedia
      ? mediaStore.claim(turn.submissionId, mediaStore.ownerWindowId)
      : [];
    if (hasMedia && !retryMedia) {
      dispatch({ type: "work/failed", code: "media_rehydration_required" });
      return;
    }
    void submit(message.text, retryMedia ?? []).then((submissionId) => {
      if (submissionId && hasMedia) mediaStore.release(turn.submissionId, "replaced");
    });
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
    mediaStore.releaseAll("cancelled");
    setMedia([]);

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
  const workBusy =
    state.work.status === "queued" ||
    state.work.status === "checking_context" ||
    state.work.status === "compacting" ||
    state.work.status === "generating";
  const dropEnabled = ready && !workBusy && Boolean(capabilities?.image || capabilities?.audio);
  const dropLabel = capabilities?.image && capabilities.audio
    ? "Images and audio"
    : capabilities?.image
      ? "Images"
      : "Audio";

  useEffect(() => {
    if (dropEnabled) return;
    dragDepthRef.current = 0;
    setDropActive(false);
  }, [dropEnabled]);

  function hasFileDrag(dataTransfer: DataTransfer): boolean {
    return Array.from(dataTransfer.types).includes("Files");
  }

  function handleDragEnter(event: DragEvent<HTMLDivElement>): void {
    if (!dropEnabled || !hasFileDrag(event.dataTransfer)) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
    dragDepthRef.current += 1;
    setDropActive(true);
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>): void {
    if (!dropEnabled || !hasFileDrag(event.dataTransfer)) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
  }

  function handleDragLeave(event: DragEvent<HTMLDivElement>): void {
    if (!dropEnabled || dragDepthRef.current === 0) return;
    event.preventDefault();
    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
    if (dragDepthRef.current === 0) setDropActive(false);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>): void {
    if (!dropEnabled || !hasFileDrag(event.dataTransfer)) return;
    event.preventDefault();
    dragDepthRef.current = 0;
    setDropActive(false);
    composerRef.current?.addFiles(Array.from(event.dataTransfer.files));
  }

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
      <div
        className="relative flex min-h-0 flex-1 flex-col"
        data-assistant-dropzone
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <Transcript
          conversation={conversation}
          onRetry={retry}
          temporary={repository.mode() === "temporary"}
        />
        <footer className="shrink-0 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-8 lg:px-12">
        <div className="mx-auto max-w-3xl">
          {ready && state.work.status === "failed" ? (
            <p
              className="mb-3 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-100"
              role="alert"
            >
              {state.work.code === "context_too_large"
                ? "Generation did not proceed with verified full context. Compact this chat, shorten the prompt, or start a new chat."
                : state.work.code === "media_rehydration_required"
                  ? "This attachment is no longer available in this page. Reattach it to analyze it again."
                  : state.work.code === "media_unavailable"
                    ? "The current local model no longer accepts that attachment. Remove it or prepare a model with the required capability."
                : state.work.code === "output_filtered"
                  ? "Chrome did not return that response, possibly because its built-in safety checks blocked the output. Rephrase the prompt or start a new chat."
                  : "The local assistant could not complete that response. Retry it, edit the prompt, or start a new chat."}
            </p>
          ) : null}
          {ready ? (
            <Composer
              capabilities={capabilities}
              media={media}
              onChange={setDraft}
              onMediaChange={setMedia}
              ref={composerRef}
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
        {dropActive ? (
          <div
            aria-live="polite"
            className="pointer-events-none absolute inset-3 z-10 flex items-center justify-center rounded-[1.6rem] border-2 border-dashed border-cyan-500 bg-cyan-50/90 p-6 text-center shadow-[0_18px_60px_-30px_rgba(8,145,178,0.45)] dark:border-cyan-300 dark:bg-cyan-950/85"
            role="status"
          >
            <div>
              <p className="text-lg font-semibold text-cyan-950 dark:text-cyan-50">Drop to attach</p>
              <p className="mt-1 text-sm text-cyan-800 dark:text-cyan-200">
                {dropLabel} will be staged for your next message.
              </p>
            </div>
          </div>
        ) : null}
      </div>
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
