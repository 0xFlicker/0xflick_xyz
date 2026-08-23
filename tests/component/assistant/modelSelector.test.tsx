import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ModelSelector } from "@/features/assistant/components/ModelSelector";
import { Transcript } from "@/features/assistant/components/Transcript";
import { MODEL_CATALOG } from "@/features/assistant/model/modelCatalog";
import type { ConversationSnapshot, LocalModelOption } from "@/features/assistant/types";
import { toMessageId, toSessionId, toSubmissionId, toTurnId } from "@/features/assistant/types";

function option(index: number, state: LocalModelOption["asset"]["state"], active = false, pending = false): LocalModelOption {
  const descriptor = MODEL_CATALOG[index];
  return {
    descriptor,
    active,
    pending,
    asset: {
      modelKey: descriptor.key,
      compatibility: "offered",
      state,
      requiredFiles: [],
      expectedBytes: descriptor.approximateWeightBytes ?? null,
      loadedBytes: null,
      progress: null,
      loadedRuntimeIdentity: active ? "runtime" : null,
      failure: null,
      observedAt: 1,
    },
  };
}

describe("ModelSelector", () => {
  it("renders top-left catalog order with actual names and distinct active/pending states", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <ModelSelector
        busy={false}
        onManage={vi.fn()}
        onSelect={onSelect}
        options={[
          option(0, "ready", true),
          option(1, "preparing", false, true),
          option(2, "unprepared"),
        ]}
        selectedModelKey="browser-prompt-api"
      />,
    );
    const selector = document.querySelector("[data-assistant-model-selector]");
    expect(selector).not.toBeNull();
    await user.click(screen.getByText(/Built-in browser model · Prompt API/));
    const entries = screen.getAllByRole("button");
    expect(entries.map((entry) => entry.textContent)).toEqual(expect.arrayContaining([
      expect.stringMatching(/Built-in browser model.*Prompt API.*Active/),
      expect.stringMatching(/SmolLM2 360M.*WebGPU.*Pending/),
      expect.stringMatching(/SmolLM2 135M.*WASM.*Preparation required/),
    ]));
    await user.click(screen.getByRole("button", { name: /SmolLM2 135M/ }));
    expect(onSelect).toHaveBeenCalledWith("smollm2-135m-wasm");
  });

  it("keeps controls inspectable but blocks model choices while queued or generating", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <ModelSelector
        busy
        onManage={vi.fn()}
        onSelect={onSelect}
        options={[option(0, "ready", true), option(2, "ready")]}
        selectedModelKey="browser-prompt-api"
      />,
    );
    await user.click(screen.getByText(/Built-in browser model · Prompt API/));
    expect(screen.getByText(/Finish the current response/)).toBeVisible();
    expect(screen.getByRole("button", { name: /SmolLM2 135M/ })).toBeDisabled();
  });

  it("closes with Escape and returns focus to the selector summary", async () => {
    const user = userEvent.setup();
    render(
      <ModelSelector
        busy={false}
        onManage={vi.fn()}
        onSelect={vi.fn()}
        options={[option(0, "ready", true), option(2, "unprepared")]}
        selectedModelKey="browser-prompt-api"
      />,
    );
    const summary = screen.getByText(/Built-in browser model · Prompt API/).closest("summary");
    expect(summary).not.toBeNull();
    await user.click(summary as HTMLElement);
    expect(screen.getByRole("button", { name: /SmolLM2 135M/ })).toBeVisible();
    await user.keyboard("{Escape}");
    expect(summary).toHaveFocus();
  });

  it("renders one boundary without adding response model badges", () => {
    const sessionId = toSessionId("session");
    const turnId = toTurnId("turn");
    const userId = toMessageId("user");
    const assistantId = toMessageId("assistant");
    const conversation: ConversationSnapshot = {
      session: {
        id: sessionId,
        epoch: 0,
        title: "Chat",
        titleSourceTurnId: turnId,
        createdAt: 1,
        updatedAt: 3,
        historyRevision: 2,
        activeModelKey: "smollm2-135m-wasm",
        activeModelRevision: 1,
        modelRequestRevision: 1,
        pendingModelRequest: null,
        requiresExplicitReplacement: false,
        modelUnavailableReason: "none",
      },
      turns: [{
        id: turnId,
        sessionId,
        epoch: 0,
        promptCreatedAt: 1,
        submissionId: toSubmissionId("submission"),
        userMessageId: userId,
        assistantMessageId: assistantId,
        status: "completed",
        generationAttemptId: null,
        startedAt: 1,
        completedAt: 2,
        interruptionReason: null,
        failureCode: null,
        modelKey: "browser-prompt-api",
        modelRevision: 0,
        modelRuntimeIdentity: "native",
      }],
      messages: [
        { id: userId, sessionId, turnId, role: "user", text: "Hello", status: "completed", createdAt: 1, updatedAt: 1 },
        { id: assistantId, sessionId, turnId, role: "assistant", text: "Hi", status: "completed", createdAt: 1, updatedAt: 2 },
      ],
      context: null,
      boundaries: [{
        id: "boundary",
        sessionId,
        selectionRevision: 1,
        fromModelKey: "browser-prompt-api",
        toModelKey: "smollm2-135m-wasm",
        toDisplayName: "SmolLM2 135M",
        toExecutionName: "WASM",
        reason: "visitor",
        confirmation: "visitor",
        afterTurnId: turnId,
        createdAt: 3,
      }],
    };
    render(<Transcript conversation={conversation} onRecover={vi.fn()} onRetry={vi.fn()} />);
    expect(screen.getByRole("separator")).toHaveTextContent("Switched to SmolLM2 135M · WASM");
    expect(screen.queryByText(/model:/i)).not.toBeInTheDocument();
  });
});
