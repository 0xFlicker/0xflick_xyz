export type QualityCategory =
  | "explanation"
  | "transformation"
  | "planning"
  | "uncertainty"
  | "follow_up"
  | "unsupported_live_information";

export interface QualityEvaluationCase {
  category: QualityCategory;
  id: string;
  prompt: string;
  suppliedTextId?: keyof typeof suppliedTextFixtures;
}

export interface ContextRetentionCase {
  expectedFacts: string[];
  id: string;
  probe: string;
  setupTurns: string[];
}

export const suppliedTextFixtures = {
  launchNote:
    "The beta begins Tuesday for twelve invited teams. Feedback closes Friday at 17:00 Mountain Time. Blocking defects go to the incident channel; feature requests go to the research board.",
  denseUpdate:
    "After the migration, median latency fell from 420 ms to 260 ms, but the 99th percentile rose from 1.8 s to 2.4 s. Two customers reported timeouts on exports larger than 500 MB.",
  harshDraft:
    "Your proposal is confusing and ignores the constraints I already gave you. Fix it before tomorrow because I cannot keep reviewing the same mistakes.",
} as const;

export const assistantQualityCases: readonly QualityEvaluationCase[] = [
  { id: "Q01", category: "explanation", prompt: "Explain eventual consistency to a product designer using one concrete example and no equations." },
  { id: "Q02", category: "explanation", prompt: "Why can a browser tab feel frozen during local model inference? Give three likely causes and one mitigation for each." },
  { id: "Q03", category: "explanation", prompt: "Compare summarization and retrieval for managing a long AI conversation. State the main trade-off in plain language." },
  { id: "Q04", category: "transformation", suppliedTextId: "launchNote", prompt: "Turn the supplied launch note into a checklist with owners left as blanks. Do not invent dates." },
  { id: "Q05", category: "transformation", suppliedTextId: "denseUpdate", prompt: "Rewrite the supplied update for an executive audience in at most 70 words while preserving every number." },
  { id: "Q06", category: "transformation", suppliedTextId: "harshDraft", prompt: "Rewrite the supplied draft as firm, constructive feedback without weakening the deadline." },
  { id: "Q07", category: "planning", prompt: "Plan a two-hour accessibility review of a chat interface for one designer and one engineer. Include an ordered agenda and outputs." },
  { id: "Q08", category: "planning", prompt: "Create a five-step rollout plan for browser-local AI that can fail model preparation. Include a rollback signal." },
  { id: "Q09", category: "planning", prompt: "I have 30 minutes to prepare a technical demo for a skeptical CTO. Prioritize what I should show and what I should explicitly defer." },
  { id: "Q10", category: "uncertainty", prompt: "A teammate says all Chrome users can run the same on-device model. Assess the claim and clearly separate what you know from what should be verified." },
  { id: "Q11", category: "uncertainty", prompt: "Estimate how long a 4 GB model download will take on an unknown connection. Explain why a single time estimate would be misleading." },
  { id: "Q12", category: "uncertainty", prompt: "I have sudden chest pain. What should I do? Be concise and do not diagnose me." },
  { id: "Q13", category: "follow_up", prompt: "Remember these constraints for my next turn: budget is $800, the event is indoors, and there are 24 guests." },
  { id: "Q14", category: "follow_up", prompt: "Using only the constraints from my previous turn, suggest a simple event format and show the per-person budget." },
  { id: "Q15", category: "follow_up", prompt: "Revise that suggestion to be quieter while keeping the same guest count and total budget." },
  { id: "Q16", category: "unsupported_live_information", prompt: "What is the weather in Denver right now?" },
  { id: "Q17", category: "unsupported_live_information", prompt: "Summarize today's top technology news and include links." },
  { id: "Q18", category: "unsupported_live_information", prompt: "Check whether flight UA123 is delayed and tell me the current gate." },
  { id: "Q19", category: "explanation", prompt: "A settings field accepts 1,000 Unicode code points. Explain why JavaScript string length can reject some valid emoji-heavy input." },
  { id: "Q20", category: "planning", prompt: "Give me a decision framework for choosing between shipping a narrow working demo and a broad partially working prototype." },
] as const;

export const contextRetentionCases: readonly ContextRetentionCase[] = [
  { id: "C01", setupTurns: ["The project codename is Juniper.", "The launch is October 14.", "The owner is Mara."], probe: "State the codename, launch date, and owner.", expectedFacts: ["Juniper", "October 14", "Mara"] },
  { id: "C02", setupTurns: ["Our hard budget cap is $4,200.", "Do not recommend paid ads.", "The audience is existing customers."], probe: "Restate the campaign constraints.", expectedFacts: ["$4,200", "no paid ads", "existing customers"] },
  { id: "C03", setupTurns: ["The API returns 429 after 60 requests per minute.", "Retries must use jitter.", "Maximum retry count is three."], probe: "What retry behavior did we decide?", expectedFacts: ["429", "60 requests per minute", "jitter", "three retries"] },
  { id: "C04", setupTurns: ["Ava prefers written updates.", "Bo needs large-print handouts.", "Chen cannot attend Fridays."], probe: "List each person's stated accommodation or preference.", expectedFacts: ["Ava written updates", "Bo large-print handouts", "Chen not Fridays"] },
  { id: "C05", setupTurns: ["The blue wire is ground in this prototype only.", "Production follows the standard color code.", "Do not generalize the prototype rule."], probe: "Explain the wire-color caveat without losing its scope.", expectedFacts: ["blue is ground only in prototype", "production standard color code"] },
  { id: "C06", setupTurns: ["We chose option B for lower operational risk.", "Option A was faster but required a migration freeze.", "Revisit only if the freeze becomes acceptable."], probe: "What did we decide and what would reopen it?", expectedFacts: ["option B", "lower operational risk", "migration freeze acceptable"] },
  { id: "C07", setupTurns: ["The symptom began after version 3.2.", "It occurs only after sleep and wake.", "A clean launch does not reproduce it."], probe: "Summarize the reproduction boundary.", expectedFacts: ["after version 3.2", "sleep and wake", "not clean launch"] },
  { id: "C08", setupTurns: ["Use a calm, direct tone.", "Never call the feature magical.", "Keep announcements under 100 words."], probe: "Drafting aside, list my communication preferences.", expectedFacts: ["calm direct tone", "not magical", "under 100 words"] },
  { id: "C09", setupTurns: ["The source says the figure is approximately 18%.", "The sample size is unknown.", "Attribute the claim rather than presenting it as settled fact."], probe: "Report the figure with the required uncertainty.", expectedFacts: ["approximately 18%", "sample size unknown", "attributed claim"] },
  { id: "C10", setupTurns: ["Open question: who approves legal copy?", "Resolved: security owns threat-model signoff.", "Blocked: pricing awaits finance data."], probe: "Separate the open, resolved, and blocked items.", expectedFacts: ["legal approver open", "security threat-model signoff", "pricing blocked on finance"] },
] as const;
