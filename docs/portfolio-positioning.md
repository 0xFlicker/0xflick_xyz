# Portfolio positioning: John Dean / Flick

Status: implemented editorial direction

## Identity

- John Dean is the professional name.
- Flick is the public brand and conversational voice.
- 0xFlicker is the current independent and open-source publishing identity.
- CaptEmulation is the original professional and open-source GitHub identity.
- Both accounts belong to the same engineer and represent different periods of the work.

## Positioning

> Principal Architect and hands-on engineer building AI systems, developer tools, and games.

The site is designed for Principal Software Engineer, Principal Architect, Principal AI Platform Engineer, Staff+ AI Systems Engineer, Developer Platform Architect, Applied AI / Agent Infrastructure Engineer, and hands-on architecture leadership roles.

John is not positioned as a model researcher, pure people manager, consultant, crypto specialist, or generic full-stack engineer. His current AI work is applied systems engineering around agents, tools, identity, permissions, runtime state, products, deployment, and operations.

## Career anchors

1. GIPHY — Principal Architect — 2024–Present
2. Shutterstock — Software Engineer — 2022–2024
3. Verta — employee #6; owned everything that touched the browser — 2020–2022
4. Sandbox VR — US salaried technical employee #4; led cloud systems — 2019–2020
5. Shutterstock — Software Developer — 2015–2019
6. Time Warner Cable, Accenture, Nokia, and Metrowerks / Motorola / Freescale
7. The University of Texas at Austin — B.S. Computer Engineering

The Principal title begins at GIPHY in 2024. The two Shutterstock tenures remain visibly separate. Verta and Sandbox VR did not use formal titles for these roles, so `src/lib/career.ts` records employee number and actual ownership instead of manufacturing title history.

## Page purposes

- Home: a brief personal introduction and current-project preview. No salaried
  employer names or summaries, including metadata, structured data and social image.
- Work: things built or co-created. The House, Morpheus, Editor, Create, and
  open-source tools. Describe the product and a specific contribution; link to
  a playable release, source, design, or the relevant Experience entry. Do not
  repeat job dates, titles, general duties or employer overviews here.
- Experience: canonical employment chronology, titles, responsibilities and
  outcomes, including GIPHY, Verta and both Shutterstock tenures.
- About: personal background and career transitions, without another job list.
- Connect: availability and contact actions.

Web3 remains a meaningful distributed-systems chapter. It is not the headline or the whole career.

## Voice

- Direct, technically specific, and confident
- Dryly funny in small doses
- Clear about what shipped and what was operated
- No invented metrics
- No repeated architecture slogans standing in for facts
- No generic confidentiality disclaimers or anonymous employers

The homepage previews The House briefly and links to its fuller project entry.
Employer summaries belong on Experience, not Home or Work. Product names on
Work may include a company name when that is the name of the actual product.

Keep the introduction factual and avoid architecture slogans.
Remove public commentary about editorial rules and
portfolio construction. Prefer specific contributions over capability lists.

Primary navigation is Work, Experience, About, Connect. The local AI assistant
remains a secondary footer link. Use plain links, visible current-page states,
and an accessible mobile menu. New imagery and typography are a later pass.

## Public-safety rule

Employer descriptions name public companies, products, and approved titles while omitting private architecture, financial amounts, customers, partners, pricing, incidents, roadmaps, internal repositories, strategy, and staffing details. GIPHY copy may describe new revenue channels but must not disclose unpublished financial outcomes. Historical private contact details are not public artifacts.

## Source of truth

- Structured career data: `src/lib/career.ts`
- Editorial facts, discrepancies, and open questions: `docs/career-facts.md`
- Rendered routes: `/`, `/~/about`, `/~/projects`, `/~/cv`, `/~/projects/archive`, `/connect`
- Preserved interactive artifact: `/intro`
