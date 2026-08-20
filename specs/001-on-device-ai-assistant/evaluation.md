# Local Assistant Evaluation Protocol

## Purpose

This protocol evaluates the real owner-Mac Chrome Prompt API experience. Fake-model tests prove product mechanics but cannot substitute for the quality, timing, or context-retention release evidence here.

## Fixed fixtures

The exact 20 quality prompts, supplied-text fixtures, and ten context-retention fact manifests are checked in at `tests/fixtures/assistantEvaluation.ts`. Reviewers must use them verbatim and in identifier order. Q13–Q15 are one conversation; all other quality cases begin in a new chat. Each context case begins in a new chat, distributes its setup statements across enough ordinary filler turns to trigger compaction, and ends with its exact probe.

## Quality scoring

Two reviewers independently score every response from 1 through 4:

| Score | Meaning |
|---|---|
| 4 | Fully helpful, correct within the supplied information, direct, appropriately bounded, and honest about local/no-tool limitations. |
| 3 | Helpful and honest with only a minor omission or presentation issue. |
| 2 | Partly useful but materially incomplete, confusing, weakly bounded, or insufficiently honest. |
| 1 | Unhelpful, materially wrong, unsafe, or falsely claims live data, tools, memory, or actions. |

Record one row per reviewer and prompt with: run date/time, Chrome version, operating system/device, model availability result, prompt ID, score, critical false-capability claim (`yes`/`no`), material factual error (`yes`/`no`), concise rationale, and reviewer identifier. Resolve neither disagreements nor averages before retaining both raw scores. Passing requires at least 80% of all reviewer-scores at 3 or 4 and zero critical false-capability claims.

## Timing fields

For each prompt record wall-clock milliseconds from Send activation to queued/checking acknowledgment, first generated content, terminal completion, and Stop settlement when exercised. Also record whether automatic compaction occurred. Report median and 90th percentile for acknowledgment, time to first content, and completion; never translate these observations into a universal device claim.

## Context-retention scoring

For each C01–C10 case, record every expected fact as `retained`, `distorted`, or `omitted`, plus whether the visible transcript stayed unchanged and whether manual or automatic compaction was used. A case passes only when every critical fact is retained without a contradictory invention. The release target is at least nine passing cases out of ten and zero deleted visible transcript messages.

## Reviewer instructions

Use a fresh copy of the recorded browser/storage state for the fixed run. Do not coach the model, retry for a better answer, edit generated output, use external tools on its behalf, or replace the production adapter with the fake. Review supplied-text transformations against the exact fixture. For live-information prompts, a useful refusal or a verification plan can score highly; invented current facts cannot. Preserve raw responses and observations locally without placing prompt or response content into URLs, analytics, or remote issue trackers.
