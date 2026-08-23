# Contract: Portable Model Worker

**Feature**: 003-portable-ai-fallback

## Purpose

Keep model loading, tokenization, WebGPU/WASM execution, compaction, and generation off the React main thread while preserving the existing adapter semantics.

## Command envelope

Every main-to-worker command contains:

- protocol version;
- command kind;
- worker attempt ID;
- runtime identity;
- command-specific payload.

Supported commands:

- `inspect`: return runtime/config identity without conversation data.
- `prepare`: load required files and construct the pipeline with aggregate progress.
- `healthCheck`: run the fixed conversation-free prompt and require non-whitespace output.
- `measure`: apply the chat template and return exact token use/capacity.
- `generate`: stream one assistant response.
- `interrupt`: interrupt only the matching generation attempt.
- `dispose`: release the pipeline and worker session.

Messages with an unknown protocol version, runtime identity, command, or payload fail closed. No provider object, tensor, GPU buffer, media value, or Cache response crosses into React.

## Event envelope

Every worker-to-main event contains the matching attempt ID and one of:

- `progress`: loaded/total/percentage when measured, otherwise stage-only indeterminate state;
- `ready`: runtime identity plus loaded context capacity;
- `measurement`: used/capacity tokens;
- `delta`: incremental finalized text;
- `complete`: final text and terminal metadata;
- `interrupted`: preserves text already emitted;
- `error`: normalized category and safe action key;
- `disposed`.

The main thread ignores every event whose attempt/runtime token is no longer current.

## Generation contract

- Use the tokenizer's chat template with `add_generation_prompt`.
- Use `TextStreamer` with prompt/special-token output excluded.
- Use a finite output-token allowance derived from context capacity, not elapsed time.
- Use `InterruptableStoppingCriteria` for a matching user stop.
- Preserve already-streamed partial output under existing terminal-turn rules.
- If a backend cannot yield to cooperative stop, terminating the page-owned worker is permitted as a user-driven action. A subsequent turn reconstructs from durable text.

## Preparation/stop contract

- Preparation begins only after required visitor confirmation.
- `progress_total` drives measured progress; missing totals remain visibly indeterminate.
- Stop-waiting detaches the attempt and restores controls. Late progress/readiness cannot alter UI, selection, or conversation state.
- Transformers.js loading has no supported load-time `AbortSignal`; therefore the product does not promise network transfer cancellation. Terminating a page worker may stop computation, while completed cached files remain reusable.
- No timer terminates preparation, health check, measurement, compaction, or generation.

## Resource contract

- The worker owns one live portable pipeline at a time.
- WebGPU and WASM are explicit devices; no automatic cross-device execution-provider fallback occurs inside the worker.
- WASM uses one thread and does not require COOP/COEP.
- Pipeline/session disposal is idempotent and occurs on switch, removal, stale activation, clear/delete conflict, fatal worker error, and page teardown.
- A model-specific asset lock prevents prepare/remove races across pages; worker lifetime does not claim asset ownership.

## Privacy contract

- `prepare`, cache inspection, and health check receive no conversation/session/personality/title/media data.
- Model/runtime fetches use only pinned public asset identities.
- `measure` and `generate` operate entirely in the worker after assets are ready and make no application network request.
- Errors/events never contain prompts, model output beyond intentional deltas, session titles, personality text, media metadata, or internal stack dumps.

## Test contract

A fake worker implements the same protocol and simulates measured/indeterminate preparation, late events, corrupt assets, readiness whitespace, long-running work, stop, stale completion, context limits, worker death, and both backends. A production-worker smoke test verifies bundling and protocol parsing. Real acceptance verifies each pinned model/backend separately.
