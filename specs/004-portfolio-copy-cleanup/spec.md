# Feature Specification: Portfolio copy cleanup

**Feature Branch**: `codex/004-portfolio-copy-cleanup`
**Created**: 2026-10-22
**Status**: Ready for implementation
**Input**: Clean up the copy, reorder the homepage, and simplify navigation. Keep the dry personality; cut repeated slogans.

## User Scenarios & Testing

### User Story 1 — See the work first (Priority: P1)
As a prospective colleague, I want a short introduction followed by concrete work.
**Independent Test**: Read the homepage from top to bottom.
**Acceptance Scenarios**:
1. Given the homepage, the visitor sees an introduction, The House, selected employer work, and contact in that order.
2. Given selected work, the visitor can reach the relevant project detail and the live House product.

### User Story 2 — Navigate directly (Priority: P1)
As a visitor, I want clear navigation on desktop and mobile.
**Independent Test**: Follow header and footer links; operate the mobile menu with keyboard and touch.
**Acceptance Scenarios**:
1. Desktop navigation shows Work, Experience, About, Connect as plain links with a clear current-page indicator.
2. Mobile navigation opens, closes, and follows those same destinations; the footer retains access to the local assistant.

### User Story 3 — Read specific, human copy (Priority: P2)
As a hiring reader, I want career facts and contact details without repeated positioning statements.
**Independent Test**: Read About, Work, Experience, and Connect.
**Acceptance Scenarios**:
1. Repeated slogans and editorial process commentary are removed. The homepage introduction stays factual, per the follow-up copy correction.
2. Career dates, titles, distinct Shutterstock tenures, project anchors, and public contact links remain accurate and usable.
3. Contact actions follow the introduction without lengthy role inventories.

### Edge Cases
- Narrow mobile layouts and long career titles must wrap without horizontal overflow.
- Keyboard focus and active navigation must remain visible in light and dark themes.
- Existing project anchors, archive, assistant, and intro remain reachable.

## Requirements
### Functional Requirements
- **FR-001**: Homepage MUST use the four-section order above and remove philosophy/capability grids.
- **FR-002**: Homepage MUST feature The House followed by GIPHY, Shutterstock, and Verta with concise contributions and links.
- **FR-003**: Header MUST use plain desktop links and an accessible mobile menu; local assistant MUST remain reachable from the footer.
- **FR-004**: About, Work, Experience, Connect, metadata, and editorial guidance MUST remove repeated slogans and process commentary while retaining a dry human voice.
- **FR-005**: Career facts and public links MUST remain consistent with canonical records; existing routes and project anchors MUST work.
- **FR-006**: Affected pages MUST remain usable at desktop and mobile widths, with visible focus/current-page states and no horizontal overflow.

## Success Criteria
- **SC-001**: Homepage presents exactly four main sections and no repeated philosophy grids.
- **SC-002**: Homepage introduction and actions are visible within a 1280×720 desktop viewport.
- **SC-003**: All affected routes and navigation flows pass desktop and 390px-wide mobile checks.
- **SC-004**: Career content validation passes, and the removed architecture slogan is absent from public copy.

## Assumptions
- This is the approved first pass; new imagery, fonts, and major color changes are deferred.
- Existing factual records are authoritative; no new career claims or metrics are introduced.
- Implementation stays local; deployment is outside this request.
