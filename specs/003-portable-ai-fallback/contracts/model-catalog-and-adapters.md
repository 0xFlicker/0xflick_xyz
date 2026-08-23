# Contract: Model Catalog and Adapters

**Feature**: 003-portable-ai-fallback

## Purpose

Expose every currently offerable local model through one provider-neutral assistant contract while keeping native Prompt API and portable Transformers.js implementation details isolated.

## Catalog contract

The source-controlled catalog returns ordered `LocalModelDescriptor` records. Each descriptor has a stable `ModelKey`, actual display model/execution identity, rank, capabilities, runtime/artifact identity, approximate size, and adapter factory.

Initial order:

1. `Browser built-in · Prompt API` when the browser exposes and offers it.
2. `SmolLM2 360M · WebGPU` using the pinned 360M q4 artifact when the required WebGPU surface exists.
3. `SmolLM2 135M · WASM` using the pinned 135M q4 artifact when the required WASM/worker/cache surface exists.

The catalog performs structural API checks only. It contains no user-agent, operating-system, memory, GPU-vendor, benchmark, latency, or quality allowlist. An entry is `ready` only after its adapter completes a content-free, non-whitespace readiness generation on the current device.

## Adapter operations

Every descriptor factory supplies a `LocalModelAdapter` equivalent to:

- `getAvailability()`: current structural/provider/cache observation.
- `getCapabilities()`: model-key-bound text/image/audio capabilities.
- `prepare(progress, signal)`: visitor-confirmed preparation and readiness.
- `createSession(options)`: a session with required runtime identity.
- `destroy()`: release adapter-owned live runtime.

Every `LocalModelSession` continues to expose:

- exact context measurement;
- incremental text streaming;
- an overflow signal where the provider supplies one;
- user-driven interruption;
- destruction/disposal.

Portable measurement tokenizes the rendered chat template and returns used/capacity tokens. Native measurement remains delegated to the Prompt API. Errors normalize unavailable, unsupported, quota/storage, corrupt asset, resource exhaustion, interrupted, context overflow, and runtime termination without exposing diagnostic dumps in UI copy.

## Identity contract

The runtime identity contains:

- model key;
- pinned model revision or native model identity;
- backend/device;
- dtype;
- prompt version.

`modelSessionCache` must compare the runtime identity, active model revision, model-bound context revision, history revision, personality revision, and existing session identity. Any mismatch destroys the retained session. A target created during switching remains a candidate and cannot enter the retained cache before activation commits.

## Capability contract

- Native model capabilities remain dynamic and preserve current image/audio behavior.
- Portable models report text `true`, image `false`, and audio `false`.
- Composer capability is always the active model's current capability, not a stale global environment value.
- Existing media history remains rendered when portable text-only capability is active.
- Portable replay/context excludes every media source and representation, including attachment labels.

## No hidden routing

- Adapters never select another adapter.
- Readiness/generation failure may return a recommended model key, but activation waits for confirmation except the documented reopen rule.
- No adapter retries a prompt with another model, replaces partial output, or calls repository prompt acceptance.
- Boundaries are UI/repository events, not adapter prompts.

## Test contract

The fake catalog can expose any combination of native/WebGPU/WASM options and independently control structural offer, cache state, progress shape, readiness output, capabilities, context limit, streaming, stop, and failure. Tests assert exact adapter identity, no unlisted entries, no hidden fallback, cache invalidation across switches, and real readiness before `ready`.
