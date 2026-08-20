# Idea Intake: On-Device AI Assistant

- **Slug**: on-device-ai-assistant
- **Created**: 2026-08-19
- **Updated**: 2026-08-19
- **Source**: pasted text; [Chrome Help: Manage on-device Generative AI models in Chrome](https://support.google.com/chrome/answer/16961953)
- **Type**: new-capability

## Idea (as captured)

> Make an AI assistance interface accessible on the webapp that is accessible on Chrome when local on device AI are detected in the browser. Open up a ChatGPT/Claude/Grok like interface with sessions, new chats, etc saved to the browser. Using the on device AI try to create a helpful AI assistant. Focus right now and making a world class AI assistance user interface supporting simple turns. Follow up tasks (out of scope here) will be tools for web searches and content loads (via the backend) and a memory system. In scope is a personality setting for seting a prompt prefix and context control + compaction. Because local inference can still be slow, use feedback to indicate LLM activity.\
> This is a demostration piece, to show we know how AI works, so the highest quality framework is expected. Use libraries when it makes sense.

### Referenced source

- **Sanitized URL**: https://support.google.com/chrome/answer/16961953
- **Parsed host**: `support.google.com`
- **URL Trust Policy**: `confirmed-by-user`; fetched without following redirects through a validated public address
- **Page title**: “Manage on-device Generative AI models in Chrome - Google Chrome Help”
- **Short excerpt**: “Chrome only downloads the models if your device has the supported hardware capabilities.”

## Restated

Add a browser-persistent, multi-session conversational assistant to the web application, available when supported on-device AI is detected in Chrome. The initial scope covers simple conversational turns, personality prompt configuration, context control and compaction, and clear inference-activity feedback; backend-assisted tools and assistant memory are explicitly deferred.

## Origin & Context

- **Raised by**: User
- **Trigger**: Create a demonstration piece that shows expertise in AI product design and implementation through a world-class assistant interface.

## Clarifications

- **Supported environment**: Target devices and Chrome installations where browser-exposed on-device AI is supported and the required models can be downloaded successfully. Chrome is believed to be the only currently supported browser, subject to research.
- **Discovery and entry**: The exact entry point remains to be determined. It should be easy to find, provide a takeover experience once activated, and have an easy-to-share URL.
- **Session persistence**: Store sessions in the browser. Support deletion of individual sessions and a “clear all” action that fully wipes stored assistant data. Support many sessions with a realistic fixed limit, provisionally in the range of 50–100.
- **Assistant behavior**: Use a concise system prompt suited to a small local model without tools. Keep an always-visible disclaimer that inference is local and users should double-check all results.
- **Context and compaction**: Research whether the browser capability exposes a usable context limit. If it does, consider compaction around 70–80% utilization; otherwise, compaction may need to respond to inference errors. Prefer a visual representation of context if feasible.
- **Personality**: Start with a blank personality prompt prefix, make it editable in settings, persist it in browser storage, and enforce a size limit. A 1,000-character ceiling is an initial upper-bound candidate and may be reduced.
- **Inference feedback**: Use whatever activity and failure-state signals the browser exposes; research should identify the available signals.
- **Captured-text correction**: Remove the unfinished phrase “and keep changes” from the original idea.

## First-Glance Unknowns

- [NEEDS CLARIFICATION: Which current Chrome versions, operating systems, hardware requirements, model-download states, and browser APIs must research establish as the compatibility contract?]
- [NEEDS CLARIFICATION: What exact entry point and shareable URL should launch the takeover experience, and what should visitors see when compatible on-device AI is unavailable?]
- [NEEDS CLARIFICATION: Should the session limit be 50, 100, or another value, and what should happen when that limit or browser storage capacity is reached?]
- [NEEDS CLARIFICATION: Is session export required, and are there additional retention or privacy requirements beyond individual deletion and “clear all”?]
- [NEEDS CLARIFICATION: What concise system prompt and observable quality criteria define a helpful, successful simple turn for a small local model?]
- [NEEDS CLARIFICATION: Can context capacity and usage be observed reliably, and what exact compaction and context-visualization behavior should follow from that capability?]
- [NEEDS CLARIFICATION: Is the personality prompt global or per session, and what final character limit should it enforce?]
- [NEEDS CLARIFICATION: Which inference lifecycle and error signals are exposed by the selected browser API, and how should each be presented?]
