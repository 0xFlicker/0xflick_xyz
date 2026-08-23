"use client";

import type { DragEvent } from "react";
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { v4 as uuid } from "uuid";

import { buildReconstructionPrompts, currentTurnPrompt } from "@/features/assistant/context/prompt";
import {
  compactConversation,
  createSwitchCompactionCandidate,
} from "@/features/assistant/context/compaction";
import {
  evaluateContext,
  completedConversationTurns,
  packTargetContext,
  projectedContext,
} from "@/features/assistant/context/contextManager";
import { AssistantShell } from "@/features/assistant/components/AssistantShell";
import { AvailabilityPanel } from "@/features/assistant/components/AvailabilityPanel";
import { ConfirmationDialog } from "@/features/assistant/components/ConfirmationDialog";
import { Composer, type ComposerHandle } from "@/features/assistant/components/Composer";
import { ModelManager } from "@/features/assistant/components/ModelManager";
import { ModelPreparationDialog } from "@/features/assistant/components/ModelPreparationDialog";
import { ModelSelector } from "@/features/assistant/components/ModelSelector";
import { Transcript } from "@/features/assistant/components/Transcript";
import {
  ASSISTANT_LOCK_PREFIX,
  PORTABLE_OUTPUT_TOKEN_ALLOWANCE,
  PROMPT_VERSION,
  STREAM_CHECKPOINT_INTERVAL_MS,
} from "@/features/assistant/constants";
import type { LocalModelAdapter, LocalModelSession } from "@/features/assistant/model/modelAdapter";
import { ModelController } from "@/features/assistant/model/modelController";
import { modelDescriptor } from "@/features/assistant/model/modelCatalog";
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
  ModelKey,
  PendingModelRequest,
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
      case "storage_quota":
      case "corrupt_assets":
      case "resource_exhausted":
      case "runtime_terminated":
      case "unsupported_device":
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
    assessment.state === "fresh" && prior?.state === "compacted"
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
    modelKey: conversation.session.activeModelKey,
    modelRevision: conversation.session.activeModelRevision,
    generatedByModelKey: prior?.generatedByModelKey ?? null,
    appliesThroughTurnId: prior?.appliesThroughTurnId ?? null,
  };
}

export function AssistantWorkspace({
  adapter: providedAdapter,
  repository: providedRepository,
}: AssistantWorkspaceProps) {
  const controller = useMemo(
    () => new ModelController(providedAdapter ? [providedAdapter] : null),
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
  const [modelDialog, setModelDialog] = useState<{
    modelKey: ModelKey;
    phase: "confirm" | "working";
  } | null>(null);
  const [modelManagerOpen, setModelManagerOpen] = useState(false);
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
  const pendingRequestRef = useRef<PendingModelRequest | null>(null);
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

  const publishModelSnapshot = useCallback(
    (snapshot = controller.getSnapshot()): void => {
      dispatch({
        type: "models/discovered",
        options: snapshot.options,
        selectedModelKey: snapshot.selectedModelKey,
        activeModelKey: snapshot.activeModelKey,
        pendingModelKey: snapshot.pendingModelKey,
      });
    },
    [controller],
  );

  useEffect(
    () => controller.subscribe((snapshot) => {
      if (snapshot.options.length > 0) publishModelSnapshot(snapshot);
    }),
    [controller, publishModelSnapshot],
  );

  useEffect(() => controller.observeAssetInvalidation(), [controller]);

  const recheckAvailability = useCallback(async (
    currentConversation: ConversationSnapshot | null,
  ): Promise<void> => {
    setupRef.current?.abort();
    setupRef.current = null;
    setSetupPending(false);
    dispatch({ type: "models/checking" });
    try {
      const snapshot = await controller.discover();
      const storedKey = currentConversation?.session.activeModelKey ?? null;
      const stored = storedKey
        ? snapshot.options.find((option) => option.descriptor.key === storedKey) ?? null
        : null;
      if (stored?.asset.state === "ready") {
        controller.select(stored.descriptor.key);
        controller.activate(stored.descriptor.key);
      } else if (currentConversation && !currentConversation.session.requiresExplicitReplacement) {
        const replacement = snapshot.options.find(
          (option) => option.asset.state === "ready" && option.descriptor.key !== storedKey,
        );
        if (replacement) {
          const activated = await repository.activateReopenFallback({
            at: Date.now(),
            descriptor: replacement.descriptor,
            expectedActiveModelKey: currentConversation.session.activeModelKey,
            expectedActiveRevision: currentConversation.session.activeModelRevision,
            sessionId: currentConversation.session.id,
          });
          const winner = await repository.getConversation(currentConversation.session.id);
          if (winner) setConversation(winner);
          if (activated.ok || winner?.session.activeModelKey === replacement.descriptor.key) {
            controller.activate(replacement.descriptor.key);
          }
        } else if (stored) {
          controller.select(stored.descriptor.key);
        }
      } else if (!currentConversation && snapshot.options[0]?.asset.state === "ready") {
        controller.activate(snapshot.options[0].descriptor.key);
      } else if (stored) {
        controller.select(stored.descriptor.key);
      }
      publishModelSnapshot();
    } catch (error) {
      sessionCache.clear();
      setCapabilities(null);
      if (mountedRef.current) dispatch({ type: "models/failed", code: errorCode(error) });
    }
  }, [controller, publishModelSnapshot, repository, sessionCache]);

  const selectedOption = state.models.options.find(
    (option) => option.descriptor.key === state.models.selectedModelKey,
  ) ?? null;
  const activeModelKey = conversation?.session.activeModelKey ?? state.models.activeModelKey;
  const activeOption = state.models.options.find(
    (option) => option.descriptor.key === activeModelKey,
  ) ?? null;

  useEffect(() => {
    const modelAdapter = activeOption
      ? controller.adapterFor(activeOption.descriptor.key)
      : null;
    if (!modelAdapter || activeOption?.asset.state !== "ready") {
      setCapabilities(null);
      return;
    }
    let current = true;
    if (modelAdapter.capabilities) {
      void modelAdapter.capabilities().then((snapshot) => {
        if (current) setCapabilities(snapshot);
      });
    } else {
      setCapabilities({
        ...activeOption.descriptor.capabilities,
        observedAt: Date.now(),
        modelIdentity: modelAdapter.runtimeIdentity,
        error: null,
      });
    }
    return () => { current = false; };
  }, [activeOption, controller]);

  const prepareModel = useCallback((): void => {
    if (selectedOption) {
      setModelDialog({ modelKey: selectedOption.descriptor.key, phase: "confirm" });
    }
  }, [selectedOption]);

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

      if (active && !initial.sessions.activeSessionId) {
        await recheckAvailability(null);
      }
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
      controller.destroy();
    };
  }, [controller, mediaStore, recheckAvailability, repository, sessionCache]);

  useEffect(() => {
    if (!selectedSessionId) {
      setConversation(null);
      return;
    }
    let active = true;
    void repository.getConversation(selectedSessionId).then(async (snapshot) => {
      if (!active) return;
      setConversation(snapshot);
      await recheckAvailability(snapshot);
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
  }, [recheckAvailability, repository, selectedSessionId]);

  useEffect(() => {
    const key = conversation?.session.activeModelKey ?? state.models.activeModelKey;
    const modelAdapter = key ? controller.adapterFor(key) : null;
    if (!key || !modelAdapter) {
      sessionCache.clear();
      return;
    }
    sessionCache.invalidateUnless(
      modelSessionIdentity(conversation, personality.revision, key, modelAdapter.runtimeIdentity),
    );
    const option = state.models.options.find((candidate) => candidate.descriptor.key === key);
    const controllerSnapshot = controller.getSnapshot();
    if (option?.asset.state === "ready" && controllerSnapshot.activeModelKey !== key) {
      controller.activate(key);
    } else if (controllerSnapshot.selectedModelKey !== key) {
      controller.select(key);
    }
  }, [conversation, controller, personality.revision, sessionCache, state.models.activeModelKey, state.models.options]);

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

      const turnAdapter = controller.adapterFor(claimed.turn.modelKey);
      if (
        !turnAdapter ||
        turnAdapter.runtimeIdentity !== claimed.turn.modelRuntimeIdentity
      ) {
        await repository.finishTurn({
          at: Date.now(),
          attemptId,
          epoch,
          failureCode: "model_unavailable",
          sessionId,
          status: "failed",
          text: "",
          turnId: claimed.turnId,
        });
        dispatch({ type: "work/failed", code: "model_unavailable" });
        return true;
      }

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
        const currentAvailability = await turnAdapter.availability();
        if (currentAvailability.state !== "available") {
          sessionCache.clear();
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
          const capability = await turnAdapter.capabilities?.();
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
          claimed.turn.modelKey,
          claimed.turn.modelRuntimeIdentity,
        );
        if (mediaParts && mediaParts.length > 0) sessionCache.clear();
        let modelSession = mediaParts && mediaParts.length > 0 ? null : sessionCache.take(identity);
        if (!modelSession) {
          modelSession = await turnAdapter.create(
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
        const hasOlderTurns = completedConversationTurns(latestConversation.turns).length > 1;
        if ((assessment.shouldCompact || assessment.blocked) && hasOlderTurns) {
          dispatch({ type: "work/compacting", turnId: claimed.turnId });
          active.unsubscribeOverflow();
          modelSession.destroy();
          active.session = null;
          const compacted = await compactConversation({
            adapter: turnAdapter,
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
            modelSessionIdentity(
              completedConversation,
              currentPersonality.revision,
              claimed.turn.modelKey,
              claimed.turn.modelRuntimeIdentity,
            ),
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
    [controller, mediaStore, persistContextMeasurement, repository, sessionCache, syncStorageMode],
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
      const submissionModelKey =
        conversation?.session.activeModelKey ??
        state.models.activeModelKey ??
        state.models.selectedModelKey;
      const submissionOption = state.models.options.find(
        (option) => option.descriptor.key === submissionModelKey,
      );
      const submissionAdapter = submissionModelKey
        ? controller.adapterFor(submissionModelKey)
        : null;
      if (
        !submissionModelKey ||
        !submissionOption ||
        submissionOption.asset.state !== "ready" ||
        !submissionAdapter ||
        conversation?.session.requiresExplicitReplacement
      ) {
        dispatch({ type: "work/failed", code: "model_unavailable" });
        return null;
      }
      const staged = submittedMedia.length > 0
        ? mediaStore.stage(submissionId, submittedMedia)
        : null;
      try {
        if (staged) {
          const availability = await submissionAdapter.availability();
          const capability = await submissionAdapter.capabilities?.();
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
          model: {
            key: submissionModelKey,
            revision: conversation?.session.activeModelRevision ?? 0,
            runtimeIdentity: submissionAdapter.runtimeIdentity,
          },
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
    [controller, conversation, media, mediaStore, processAcceptedTurn, repository, selectedSessionId, state.models.activeModelKey, state.models.options, state.models.selectedModelKey],
  );

  const compactCurrentConversation = useCallback(async (): Promise<void> => {
    if (!selectedSessionId || activeRef.current) return;
    const run = async (): Promise<void> => {
      const latestConversation = await repository.getConversation(selectedSessionId);
      if (
        !latestConversation ||
        completedConversationTurns(latestConversation.turns).length < 2
      ) {
        return;
      }
      dispatch({ type: "work/compacting", turnId: null });
      sessionCache.clear();
      const currentPersonality = (await repository.getSettings()).personality;
      const compactingAdapter = controller.adapterFor(
        latestConversation.session.activeModelKey,
      );
      if (!compactingAdapter) {
        dispatch({ type: "work/failed", code: "model_unavailable" });
        return;
      }
      const result = await compactConversation({
        adapter: compactingAdapter,
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
            modelSessionIdentity(
              updatedConversation,
              currentPersonality.revision,
              compactingAdapter.descriptor.key,
              compactingAdapter.runtimeIdentity,
            ),
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
  }, [controller, repository, selectedSessionId, sessionCache, syncStorageMode]);

  const requestModelChoice = useCallback((modelKey: ModelKey): void => {
    const busy =
      state.work.status === "queued" ||
      state.work.status === "checking_context" ||
      state.work.status === "compacting" ||
      state.work.status === "generating";
    if (busy || setupPending) return;
    const option = state.models.options.find(
      (candidate) => candidate.descriptor.key === modelKey,
    );
    if (!option) return;
    if (
      modelKey === conversation?.session.activeModelKey &&
      !conversation.session.requiresExplicitReplacement &&
      option.asset.state === "ready"
    ) return;
    controller.select(modelKey);
    setModelDialog({ modelKey, phase: "confirm" });
  }, [controller, conversation, setupPending, state.models.options, state.work.status]);

  const confirmModelChoice = useCallback(async (): Promise<void> => {
    if (!modelDialog) return;
    const option = state.models.options.find(
      (candidate) => candidate.descriptor.key === modelDialog.modelKey,
    );
    const targetAdapter = option
      ? controller.adapterFor(option.descriptor.key)
      : null;
    if (!option || !targetAdapter) return;

    const abort = new AbortController();
    setupRef.current?.abort();
    setupRef.current = abort;
    setSetupPending(true);
    setModelDialog({ modelKey: option.descriptor.key, phase: "working" });
    sessionCache.clear();

    let pending: PendingModelRequest | null = null;
    let pendingSessionId: SessionId | null = null;
    try {
      const latest = selectedSessionId
        ? await repository.getConversation(selectedSessionId)
        : null;
      if (latest) {
        const confirmed = await repository.confirmModelRequest({
          at: Date.now(),
          ownerWindowId: mediaStore.ownerWindowId,
          reason: "visitor",
          requestId: uuid(),
          sessionId: latest.session.id,
          targetModelKey: option.descriptor.key,
        });
        if (!confirmed.ok) {
          if (confirmed.code === "chat_busy") {
            dispatch({ type: "work/failed", code: "operation_failed" });
          }
          throw new Error(confirmed.code);
        }
        if (!confirmed.request && option.asset.state === "ready") {
          controller.activate(option.descriptor.key);
          setModelDialog(null);
          return;
        }
        pending = confirmed.request;
        pendingSessionId = latest.session.id;
        pendingRequestRef.current = pending;
        controller.setPending(option.descriptor.key);
      }

      const prompts = buildReconstructionPrompts({
        conversation: latest,
        personality,
      });
      let packed: Awaited<ReturnType<typeof packTargetContext>> | null = null;
      let switchSummary: Awaited<ReturnType<typeof createSwitchCompactionCandidate>> = null;
      let candidate: LocalModelSession;
      if (latest && pending) {
        const sourceDescriptor = modelDescriptor(latest.session.activeModelKey);
        const sourceAdapter = controller.adapterFor(latest.session.activeModelKey);
        if (
          sourceDescriptor &&
          sourceAdapter &&
          option.descriptor.rank > sourceDescriptor.rank
        ) {
          await repository.updateModelRequest({
            requestId: pending.requestId,
            revision: pending.revision,
            sessionId: latest.session.id,
            status: "compacting",
          });
          switchSummary = await createSwitchCompactionCandidate({
            adapter: sourceAdapter,
            conversation: latest,
            signal: abort.signal,
          });
        }
        await repository.updateModelRequest({
          requestId: pending.requestId,
          revision: pending.revision,
          sessionId: latest.session.id,
          status: "checking",
        });
        const measuringSession = await controller.prepare(
          option.descriptor.key,
          [],
          abort.signal,
        );
        try {
          packed = await packTargetContext({
            conversation: latest,
            measure: (candidatePrompts) => measuringSession.measure(candidatePrompts, abort.signal),
            outputAllowance:
              option.descriptor.kind === "portable"
                ? PORTABLE_OUTPUT_TOKEN_ALLOWANCE
                : 0,
            personality,
            summaryCandidate: switchSummary
              ? {
                  appliesThroughTurnId: switchSummary.appliesThroughTurnId,
                  text: switchSummary.text,
                }
              : null,
          });
        } finally {
          measuringSession.destroy();
        }
        candidate = await controller.prepare(
          option.descriptor.key,
          packed.prompts,
          abort.signal,
        );
      } else {
        candidate = await controller.prepare(
          option.descriptor.key,
          prompts,
          abort.signal,
        );
      }
      if (abort.signal.aborted || setupRef.current !== abort) {
        candidate.destroy();
        return;
      }

      if (!latest || !pending) {
        controller.activate(option.descriptor.key);
        sessionCache.store(
          modelSessionIdentity(
            null,
            personality.revision,
            option.descriptor.key,
            targetAdapter.runtimeIdentity,
          ),
          candidate,
        );
      } else {
        await repository.updateModelRequest({
          requestId: pending.requestId,
          revision: pending.revision,
          sessionId: latest.session.id,
          status: "ready_to_commit",
        });
        const measured = packed?.measurement ?? candidate.context();
        const candidateContext: ContextState = {
          sessionId: latest.session.id,
          epoch: latest.session.epoch,
          state:
            packed &&
            (packed.summaryUsed ||
              packed.directTurnIds.length < completedConversationTurns(latest.turns).length)
              ? "compacted"
              : "fresh",
          summaryText: packed?.summaryUsed ? switchSummary?.text ?? null : null,
          summarizedThroughTurnId: packed?.summaryUsed
            ? switchSummary?.appliesThroughTurnId ?? null
            : null,
          directFromTurnId: packed?.directTurnIds[0] ?? null,
          contextUsage: measured.usage,
          contextWindow: measured.window,
          promptVersion: option.descriptor.promptVersion,
          sourceHistoryRevision: latest.session.historyRevision,
          personalityRevision: personality.revision,
          compactedAt: packed?.summaryUsed ? Date.now() : null,
          overflowedAt: null,
          modelKey: option.descriptor.key,
          modelRevision: pending.revision,
          generatedByModelKey: packed?.summaryUsed
            ? switchSummary?.generatedByModelKey ?? null
            : null,
          appliesThroughTurnId: packed?.summaryUsed
            ? switchSummary?.appliesThroughTurnId ?? null
            : null,
        };
        const activated = await repository.activateModelRequest({
          at: Date.now(),
          context: candidateContext,
          descriptor: option.descriptor,
          expectedEpoch: pending.capturedEpoch,
          expectedHistoryRevision: pending.capturedHistoryRevision,
          ownerWindowId: mediaStore.ownerWindowId,
          requestId: pending.requestId,
          revision: pending.revision,
          sessionId: latest.session.id,
        });
        if (!activated.ok) {
          candidate.destroy();
          throw new Error(activated.code);
        }
        const updated = await repository.getConversation(latest.session.id);
        if (!updated) {
          candidate.destroy();
          throw new Error("session_deleted");
        }
        controller.activate(option.descriptor.key);
        sessionCache.store(
          modelSessionIdentity(
            updated,
            personality.revision,
            option.descriptor.key,
            targetAdapter.runtimeIdentity,
          ),
          candidate,
        );
        setConversation(updated);
      }
      pendingRequestRef.current = null;
      setModelDialog(null);
    } catch (error) {
      const superseded =
        error instanceof Error &&
        (error.message === "model_request_stale" || error.message === "revision_conflict");
      if (pending && pendingSessionId) {
        await repository.cancelModelRequest({
          requestId: pending.requestId,
          revision: pending.revision,
          sessionId: pendingSessionId,
        });
      }
      pendingRequestRef.current = null;
      controller.setPending(null);
      if (pendingSessionId) {
        const current = await repository.getConversation(pendingSessionId);
        if (current) controller.select(current.session.activeModelKey);
      }
      if (superseded) {
        setModelDialog(null);
        dispatch({ type: "work/idle" });
      } else if (!abort.signal.aborted) {
        dispatch({ type: "work/failed", code: errorCode(error) });
      }
    } finally {
      if (setupRef.current === abort) setupRef.current = null;
      setSetupPending(false);
    }
  }, [controller, mediaStore.ownerWindowId, modelDialog, personality, repository, selectedSessionId, sessionCache, state.models.options]);

  const stopModelPreparation = useCallback((): void => {
    const pending = pendingRequestRef.current;
    const setup = setupRef.current;
    setupRef.current = null;
    setSetupPending(false);
    setup?.abort();
    if (modelDialog) controller.stopWaiting(modelDialog.modelKey);
    controller.setPending(null);
    pendingRequestRef.current = null;
    if (pending && selectedSessionId) {
      void repository.cancelModelRequest({
        requestId: pending.requestId,
        revision: pending.revision,
        sessionId: selectedSessionId,
      });
    }
    setModelDialog(null);
  }, [controller, modelDialog, repository, selectedSessionId]);

  const removeModel = useCallback(async (modelKey: ModelKey): Promise<void> => {
    if (setupPending) stopModelPreparation();
    if (activeRef.current?.session?.modelKey === modelKey) {
      activeRef.current.abort.abort();
      activeRef.current.session.destroy();
    }
    sessionCache.clear();
    try {
      await repository.markModelRemoved(modelKey, Date.now());
      await controller.remove(modelKey);
      if (conversation?.session.activeModelKey === modelKey) {
        setConversation(await repository.getConversation(conversation.session.id));
      }
    } catch (error) {
      dispatch({ type: "models/failed", code: errorCode(error) });
    }
  }, [controller, conversation, repository, sessionCache, setupPending, stopModelPreparation]);

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
    const strongest = controller.getSnapshot().options[0];
    if (strongest) controller.chooseDraft(strongest.descriptor.key);
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

  async function recover(turnId: TurnId): Promise<void> {
    if (!conversation) return;
    const turn = conversation.turns.find((candidate) => candidate.id === turnId);
    if (!turn || (turn.status !== "queued" && turn.status !== "generating")) return;
    const result = await repository.recoverTurn({
      at: Date.now(),
      epoch: turn.epoch,
      expectedAttemptId: turn.generationAttemptId,
      sessionId: turn.sessionId,
      turnId,
    });
    if (!result.ok) return;
    sessionCache.clear();
    setConversation(await repository.getConversation(turn.sessionId));
    await processAcceptedTurn(turn.sessionId, turn.epoch);
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

  const ready =
    activeOption?.asset.state === "ready" &&
    !conversation?.session.requiresExplicitReplacement;
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
          completedConversationTurns(conversation?.turns ?? []).length > 1
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
        <ModelSelector
          busy={workBusy || setupPending}
          onManage={() => setModelManagerOpen(true)}
          onSelect={requestModelChoice}
          options={state.models.options}
          selectedModelKey={state.models.selectedModelKey}
        />
        <Transcript
          activeTurnId={
            state.work.status === "queued" ||
            state.work.status === "checking_context" ||
            state.work.status === "generating"
              ? state.work.turnId
              : null
          }
          conversation={conversation}
          onRecover={(turnId) => void recover(turnId)}
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
                  ? "The local model did not return that response. Rephrase the prompt or start a new chat."
                  : state.work.code === "resource_exhausted"
                    ? "This device could not keep the model running. Close other heavy pages or choose a smaller model."
                    : state.work.code === "runtime_terminated"
                      ? "The browser stopped the local model. Retry the response when ready."
                      : state.work.code === "storage_quota"
                        ? "The browser could not store the model. Free browser storage, then retry preparation."
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
              catalog={state.models}
              onPrepare={prepareModel}
              onRetry={() => void recheckAvailability(conversation)}
              onStopWaiting={stopModelPreparation}
              option={selectedOption}
              requiresExplicitReplacement={conversation?.session.requiresExplicitReplacement}
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
            ? "This removes every local chat, generated response, context summary, model boundary, pending choice, and personality preference from this browser. Downloaded local models stay installed. It cannot be undone."
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
      {modelDialog ? (
        <ModelPreparationDialog
          descriptor={
            modelDescriptor(modelDialog.modelKey) ??
            state.models.options.find((option) => option.descriptor.key === modelDialog.modelKey)!.descriptor
          }
          onClose={() => setModelDialog(null)}
          onConfirm={() => void confirmModelChoice()}
          onStop={stopModelPreparation}
          open
          downgrade={
            conversation !== null &&
            (modelDescriptor(conversation.session.activeModelKey)?.rank ?? 0) <
              (modelDescriptor(modelDialog.modelKey)?.rank ?? 0)
          }
          requiresPreparation={
            state.models.options.find((option) => option.descriptor.key === modelDialog.modelKey)?.asset.state !== "ready"
          }
          snapshot={
            modelDialog.phase === "working"
              ? state.models.options.find((option) => option.descriptor.key === modelDialog.modelKey)?.asset ?? null
              : null
          }
        />
      ) : null}
      <ModelManager
        onClose={() => setModelManagerOpen(false)}
        onRemove={(modelKey) => void removeModel(modelKey)}
        open={modelManagerOpen}
        options={state.models.options}
      />
    </>
  );
}
