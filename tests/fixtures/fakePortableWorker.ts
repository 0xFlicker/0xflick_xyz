import type {
  PortableWorkerCommand,
  PortableWorkerEvent,
} from "@/features/assistant/model/portableWorkerProtocol";
import { validatePortableWorkerCommand } from "@/features/assistant/model/portableWorkerProtocol";

export interface FakePortableWorkerScenario {
  contextLimit?: number;
  deltas?: string[];
  failureCode?: Extract<PortableWorkerEvent, { kind: "error" }>["code"];
  holdOpen?: boolean;
  lateEvents?: boolean;
  progress?: Array<{ loaded: number | null; total: number | null }>;
  readinessText?: string;
}

export class FakePortableWorker {
  onmessage: ((event: MessageEvent<PortableWorkerEvent>) => void) | null = null;
  readonly commands: PortableWorkerCommand[] = [];
  private terminated = false;
  private interrupted = false;

  constructor(private readonly scenario: FakePortableWorkerScenario = {}) {}

  postMessage(input: PortableWorkerCommand): void {
    const command = validatePortableWorkerCommand(input);
    this.commands.push(command);
    queueMicrotask(() => this.respond(command));
  }

  terminate(): void {
    this.terminated = true;
  }

  private emit(event: PortableWorkerEvent): void {
    if (this.terminated && !this.scenario.lateEvents) return;
    this.onmessage?.(new MessageEvent("message", { data: event }));
  }

  private respond(command: PortableWorkerCommand): void {
    if (command.kind === "interrupt") {
      this.interrupted = true;
      return;
    }
    if (command.kind === "dispose") {
      this.emit({
        kind: "disposed",
        attemptId: command.attemptId,
        runtimeIdentity: command.runtimeIdentity,
      });
      return;
    }
    if (this.scenario.failureCode) {
      this.emit({
        kind: "error",
        attemptId: command.attemptId,
        runtimeIdentity: command.runtimeIdentity,
        code: this.scenario.failureCode,
      });
      return;
    }
    if (command.kind === "prepare") {
      for (const progress of this.scenario.progress ?? []) {
        this.emit({
          kind: "progress",
          attemptId: command.attemptId,
          runtimeIdentity: command.runtimeIdentity,
          loaded: progress.loaded,
          total: progress.total,
          progress:
            progress.loaded !== null && progress.total !== null && progress.total > 0
              ? progress.loaded / progress.total
              : null,
          stage: "loading",
        });
      }
      this.emit({
        kind: "ready",
        attemptId: command.attemptId,
        runtimeIdentity: command.runtimeIdentity,
        contextLimit: this.scenario.contextLimit ?? 8_192,
      });
      return;
    }
    if (command.kind === "healthCheck") {
      const text = this.scenario.readinessText ?? "ready";
      this.emit({
        kind: "complete",
        attemptId: command.attemptId,
        runtimeIdentity: command.runtimeIdentity,
        text,
      });
      return;
    }
    if (command.kind === "measure") {
      this.emit({
        kind: "measurement",
        attemptId: command.attemptId,
        runtimeIdentity: command.runtimeIdentity,
        used: 12,
        capacity: this.scenario.contextLimit ?? 8_192,
      });
      return;
    }
    if (command.kind === "generate") {
      let text = "";
      for (const delta of this.scenario.deltas ?? ["Local", " answer"]) {
        if (this.interrupted) {
          this.emit({
            kind: "interrupted",
            attemptId: command.attemptId,
            runtimeIdentity: command.runtimeIdentity,
            text,
          });
          return;
        }
        text += delta;
        this.emit({
          kind: "delta",
          attemptId: command.attemptId,
          runtimeIdentity: command.runtimeIdentity,
          text,
        });
      }
      if (this.scenario.holdOpen) return;
      this.emit({
        kind: "complete",
        attemptId: command.attemptId,
        runtimeIdentity: command.runtimeIdentity,
        text,
      });
      return;
    }
    this.emit({
      kind: "ready",
      attemptId: command.attemptId,
      runtimeIdentity: command.runtimeIdentity,
      contextLimit: this.scenario.contextLimit ?? 8_192,
    });
  }
}
