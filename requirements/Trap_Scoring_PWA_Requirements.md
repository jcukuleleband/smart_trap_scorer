---
title: Trap Scoring Capture PWA Requirements
version: 0.1
date: 2026-09-14
status: Draft for review
parent: Trap_Scoring_System_Requirements.md, version 0.1
---

# Trap Scoring Capture PWA Requirements

## 1. Purpose and baseline

The capture Progressive Web App (PWA) lets an authorized scorer photograph a paper score sheet, check image quality, submit it despite intermittent connectivity, and review server-produced transcription and results. Its primary outcome is a readable, correctly associated sheet received exactly once, with an understandable path to human confirmation.

This subsystem specification refines the [system requirements](Trap_Scoring_System_Requirements.md) and [CONOPS v0.2](Trap_Scoring_System_CONOPS.md). It follows the CLU practices identified in the [practice source manifest](CLU_Practice_Sources.md): verifiable requirements, source traceability, explicit assumptions, proportionate assurance, and evidence before acceptance. Source recommendations and unanswered decisions remain proposals. No baseline approval or implementation evidence is implied.

**Scope assumption:** “PWA” means CONOPS development area 1, the scorer capture experience, including the scorer's permitted review and confirmation. Manager administration and the public scoreboard remain separate surfaces. This document specifies integration behavior without selecting a framework, storage library, endpoint names, or browser API.

**Assurance:** Inherits the system's provisional DAL-E assessment and D-01 conditions: paper fallback, recoverable scoring consequences, no physical control or material financial authority. The PWA adds no such authority. Confirm those conditions before detailed design; escalate above-DAL-E consequences under the parent governance process.

### Conventions

- Every `PWA-…` requirement has priority, parent trace, and acceptance criteria. **Must/shall** means proposed mandatory release behavior; **Should/should** means a recommendation requiring disposition.
- `TS-…` identifies a parent requirement. `D-…` identifies a decision in the parent document. `PD-…` identifies a PWA-specific decision in section 8. Derived controls are explicitly labeled in their trace.
- **T** = automated test; **D** = witnessed demonstration; **I** = inspection; **A** = measured analysis.
- Each requirement reserves a verification case `V-<ID>`. All cases are **Planned, not executed**; design, implementation, evidence, reviewer, and execution date are unassigned. An unresolved parameter cannot be treated as passing acceptance.

## 2. Users, boundaries, and operating assumptions

| Actor / boundary | Responsibility |
|---|---|
| Scorer | Select the assigned event/sheet, capture readable evidence, submit, inspect results, correct within permission, and explicitly confirm |
| Event manager | Resolve escalated ambiguity, duplicates, reassignment, and policy-restricted approval in the manager surface |
| PWA | Local guidance, preview, encrypted pending submissions, transport, status display, and authorized review UI |
| Backend | Validate sessions and uploads; preserve evidence; orchestrate extraction; calculate/freeze/version results; enforce approval and publication |
| Browser/OS | Camera, storage, lifecycle, and connectivity environment to be verified against the supported-device matrix |

The phone, QR content, selected files, and client requests are untrusted. Client checks improve usability; server validation remains authoritative. Only selected image evidence and required identifiers cross the upload boundary. Private review data crosses an authenticated boundary and is not part of the public projection.

Expected workload is six scorers and approximately 22 sheets per night across 12 nights. These are test inputs, not client limits. First use and initial authentication require connectivity; offline continuation requires prior initialization and the approved pending-data/key policy. Background execution, closed-app upload, permanent browser storage, and first-ever offline launch are not acceptance assumptions. The scorer can reopen the PWA and use foreground retry.

**Excluded:** event/roster creation; code administration; manager adjudication and reassignment; locking/unlocking; publication; authoritative arithmetic; on-device AI transcription; direct model/cloud/database credentials; native app-store delivery; required push notifications; required MCP. Full manual transcription remains a system capability; the PWA offers only the portion authorized for scorers under D-09.

## 3. User journey and state meanings

1. Open the capture URL and enter or scan an event access code.
2. Check the displayed event and assigned sheet context.
3. Frame the paper, follow quality guidance, and capture automatically or manually.
4. Inspect the corrected preview; retake or submit.
5. See whether the package is waiting locally, uploading, or durably received.
6. Continue other capture work while processing runs on the server.
7. Reopen the authorized submission, review evidence and server results, correct permitted fields, and confirm or refer to the manager.

### Proposed client state vocabulary

This vocabulary refines the parent lifecycle proposal; D-12 must approve its mapping before implementation. Server processing and publication states remain separate from local delivery state.

| Client state | Meaning | Expected action / transition |
|---|---|---|
| Draft | Selected image has not been committed to the pending queue | Retake, discard, or submit |
| Queued | Encrypted package was committed locally; server receipt is unconfirmed | Foreground retry, wait for network/authentication, or delete if never sent |
| Uploading | Submission attempt is in flight | Await response; interruption becomes Receipt unknown |
| Receipt unknown | An attempt may have reached the server but acknowledgment is missing | Reconcile using the same submission identity; do not claim cancellation or acceptance |
| Received | Server has acknowledged durable receipt and supplied record identity | Purge local package; show server processing status |
| Action required | Authentication, validation, storage, expiry, or retry policy prevents progress | Explain the specific cause and permitted recovery action |
| Discarded | An unsent local package was deliberately deleted | No automatic submission |

`Processing`, `Review needed`, `Verified`, and any publication labels are server-reported states, not conclusions inferred from upload progress. Draft loss and pending-queue loss must never be presented as successful receipt. A browser storage-loss condition may be detectable only partially; the inventory on the server and retained paper are the reconciliation basis.

## 4. Functional requirements

### 4.1 Launch, identity, and sessions

| ID | Requirement | Priority | Parent / rationale | Acceptance / verification |
|---|---|---|---|---|
| PWA-AC-01 | The PWA shall provide the scorer workflow through an HTTPS browser URL without requiring installation. | Must | TS-CP-01, TS-SE-02 | D: Complete capture, receipt, and authorized confirmation from a browser tab on every D-06 supported configuration. |
| PWA-AC-02 | The PWA should offer installation guidance where included in the supported-device profile. | Should | TS-CP-01; derived convenience | D: PD-01 identifies applicable configurations; guidance is dismissible and browser operation remains available; installed-mode tests pass where offered. |
| PWA-AC-03 | The PWA shall exchange a typed or scanned access code for a server-issued scoped session without persisting the code. | Must | TS-AC-01, TS-AC-04; CONOPS §5.2 | T/I: Valid code establishes the correct event/role; invalid code fails; inspect URLs, caches, storage, history, and telemetry for code absence after exchange. |
| PWA-AC-04 | The PWA shall display the authenticated event and assigned capture context before submission. | Must | TS-AC-03, TS-EV-01 | D/T: Event name/date and squad/sheet identity are visible; switching context never silently relabels an existing package. |
| PWA-AC-05 | The PWA shall suspend protected operations when the server reports an expired or revoked session and provide reauthentication. | Must | TS-AC-02, TS-CP-07 | T: Denied request cannot proceed as successful; pending encrypted evidence follows D-04; after reauthentication it uploads only if the server authorizes its original event/assignment. |
| PWA-AC-06 | The PWA shall provide sign-out that ends the active server session and clears visible private review data. | Must | TS-SE-02, TS-DT-03; derived | T/D: Back navigation and cached routes reveal no prior review payload; pending-data/key treatment follows PD-02 and is explained before any user-requested deletion. |

### 4.2 Camera and sheet capture

| ID | Requirement | Priority | Parent / rationale | Acceptance / verification |
|---|---|---|---|---|
| PWA-CP-01 | The PWA shall request camera access in response to a scorer capture action and explain denial or unavailability. | Must | TS-CP-01, TS-QA-06; derived | D: Permission denial, absent camera, and camera-in-use scenarios present a recovery instruction and the alternate image-selection path. |
| PWA-CP-02 | The PWA shall permit selection of an existing still image as an alternative capture path. | Must | TS-QA-06, TS-IN-01; derived | D/T: Selected files enter the same quality/preview/validation workflow; unsupported types or limits produce specific errors. Device image-library retention is distinguished from PWA-managed storage. |
| PWA-CP-03 | The PWA shall show a framing overlay and evaluate full-sheet boundaries, perspective, blur, glare, shadow, stability, and resolution. | Must | TS-CP-02 | D/A: Approved D-06 fixture set includes each defect and valid sheets; feedback identifies defects under the approved warning/block thresholds. |
| PWA-CP-04 | The PWA shall show actionable quality feedback without relying solely on color. | Must | TS-CP-02, TS-QA-06 | D: For every rejected/warned fixture, scorer receives a named issue and action such as moving the sheet into frame or reducing glare. |
| PWA-CP-05 | The PWA shall support automatic capture when readiness criteria pass and deliberate manual capture with equivalent quality feedback. | Must | TS-CP-03 | T/D: Stable valid fixture triggers one capture and opens preview; continued camera frames do not create repeated submissions; manual capture preserves warnings and any submission blocks. |
| PWA-CP-06 | The PWA shall produce a perspective-corrected preview linked to the selected original image. | Must | TS-CP-04, TS-IN-02 | T/D: Rotation/skew fixtures display correct orientation and boundaries; preview transformations do not replace or mutate the selected original bytes for upload. |
| PWA-CP-07 | The PWA shall allow zoom inspection, retake, and deliberate submit from preview. | Must | TS-CP-04; derived inspection detail | D: Scorer can inspect names and cell marks; retake replaces the draft; preview alone triggers no image upload. |
| PWA-CP-08 | The PWA shall interpret supported template/sheet identifiers and require resolution of identity conflicts before submission. | Must | TS-IN-01, TS-CP-09 | T: Unknown templates and event/squad conflicts are surfaced; QR identifiers cannot grant access or reassign records. D-03 defines marked and markerless form behavior. |
| PWA-CP-09 | The PWA should permit manual boundary adjustment when automatic boundary detection fails. | Should | TS-CP-02, TS-CP-09; CONOPS §7 | D: If selected in PD-03, scorer adjusts corners, inspects corrected preview, and retains the original; resulting boundaries meet the approved completeness policy. |
| PWA-CP-10 | The PWA shall stop its camera capture when leaving the capture view and shall upload no continuous camera stream. | Must | TS-CP-05; derived resource/privacy control | I/D: Camera lifecycle and network inspection show capture stops after navigation/sign-out; only deliberately submitted still images reach the backend. |

### 4.3 Pending data, upload, and reconciliation

| ID | Requirement | Priority | Parent / rationale | Acceptance / verification |
|---|---|---|---|---|
| PWA-UP-01 | The PWA shall commit a minimal encrypted pending package before representing a submission as locally queued. | Must | TS-CP-06 | T: Simulated storage/encryption/write failure does not show Queued; success stores image, original context, payload version, and stable retry identity under D-04 limits. |
| PWA-UP-02 | The PWA shall enforce approved queue count, byte, and age limits and display remaining capacity or a capacity error. | Must | TS-CP-06 | T: Boundary/over-limit tests preserve existing pending work; full storage prevents new queue acceptance with a recovery instruction; expiry behavior follows PD-02 without silent success. |
| PWA-UP-03 | The PWA shall preserve each queued package's original event, sheet context, and submission identity across retries and permitted restarts. | Must | TS-CP-07, TS-IN-03 | T: Restart/reconnect/relogin does not change identifiers; cross-event login cannot silently upload the package to the newly selected event. Key recovery is tested under PD-02. |
| PWA-UP-04 | The PWA shall upload the selected original still image and required submission metadata over an authorized HTTPS interface. | Must | TS-CP-05, TS-IN-01, TS-IN-02 | T/I: Server-accepted bytes match selected original; metadata contains the expected context and retry identity; no continuous frames or client service credentials are sent. |
| PWA-UP-05 | The PWA shall distinguish queued, uploading, receipt-unknown, received, and action-required conditions using evidence appropriate to each state. | Must | TS-CP-07, TS-IN-05, TS-LC-01 | T: Network success indicators or completed byte transfer alone cannot cause Received; only the durable-receipt contract in section 5 can. |
| PWA-UP-06 | The PWA shall retry transient upload failures using the same idempotency identity within the approved retry policy. | Must | TS-IN-03, TS-CP-07, TS-SE-03 | T: Lost response, timeout, duplicate tap, and concurrent-tab fixtures produce one server record; retry delays/limits obey D-08 and server retry guidance; permanent errors require corrective action. |
| PWA-UP-07 | The PWA shall reconcile uncertain receipt before treating an attempted upload as absent or replacing it with a new submission. | Must | TS-IN-03, TS-IN-04, TS-IN-05 | T: Server accepted/lost acknowledgment fixture resolves to the existing record; corrected/replacement payload receives a distinct identity only through the approved duplicate/replacement workflow. |
| PWA-UP-08 | The PWA shall provide foreground retry and refresh controls independent of optional background delivery. | Must | TS-CP-07; derived portability | D: With background delivery disabled, reopening the PWA and choosing retry delivers authorized queued work; UI explains that pending work may require reopening. |
| PWA-UP-09 | The PWA shall allow deletion of an unsent pending package and explain that local cancellation cannot withdraw an upload already received or in doubt. | Must | TS-CP-08, TS-PB-04; derived race handling | T/D: Never-attempted package is deleted and never uploaded; in-flight/unknown receipt routes to reconciliation; local deletion never claims server withdrawal. |
| PWA-UP-10 | The PWA shall purge its local image and pending payload after confirmed durable receipt within the approved purge interval. | Must | TS-CP-08, TS-DT-03 | T/I: Successful acknowledgment removes managed pending content; purge interruption resumes on restart; status references follow PD-02 and never include retained images. |
| PWA-UP-11 | The PWA shall surface detected queue corruption, missing key, or storage loss with a recovery instruction. | Must | TS-CP-06, TS-QA-05; derived | T/D: Corrupt package/key-loss fixtures are not uploaded as valid or marked received; scorer reconciles server inventory and recaptures paper where needed. No claim is made to detect records erased with all local metadata. |

### 4.4 Processing status and scorer review

| ID | Requirement | Priority | Parent / rationale | Acceptance / verification |
|---|---|---|---|---|
| PWA-RV-01 | The PWA shall let scorers retrieve authorized submission status after leaving and returning to the capture view. | Must | TS-PR-02, TS-CP-07, TS-AC-03 | D/T: Close/reopen and reauthenticate; server listing recovers authorized received/processing/review-needed records without requiring local evidence copies. |
| PWA-RV-02 | The PWA shall display server status with its last successful refresh time and indicate stale or unavailable data. | Must | TS-QA-05, TS-PR-04 | T: Outage preserves a visibly stale state; a stale response cannot overwrite a newer known record version; failed extraction presents review/manual-workflow direction. |
| PWA-RV-03 | The PWA shall permit further captures while previously received sheets process asynchronously. | Must | TS-PR-02, TS-CP-07 | D: First sheet remains processing while a second capture submits; their identifiers and statuses stay distinct. |
| PWA-RV-04 | The PWA shall display authorized server transcription, participant/round identity, computed totals, handwritten totals, and review reasons alongside matching evidence. | Must | TS-RV-01, TS-SC-05, TS-AI-04 | D/T: Select a disputed cell/name; correct sheet/row/crop and values appear; uncertain cells and mismatched totals are explicit. |
| PWA-RV-05 | The PWA shall permit only server-authorized scorer corrections and require a reason for each submitted correction. | Must | TS-RV-02, TS-AC-03 | T/D: Allowed edits submit record version, changed fields, and reason; unauthorized fields/actions are denied server-side; unsubmitted edits are visibly unsaved. |
| PWA-RV-06 | The PWA shall display authoritative calculated results only from the backend's versioned result response. | Must | TS-SC-01, TS-SC-02, TS-SC-03 | T: Alter client values/totals; server rejects or disregards authoritative-score input; after a correction the displayed accepted total is the server-recomputed result. |
| PWA-RV-07 | The PWA shall require deliberate confirmation of the current reviewed version and show success only after server acknowledgment. | Must | TS-RV-03, TS-RV-09 | T/D: No automatic confirmation on extraction or view; stale version fails with refresh/review; lost response is reconciled without attaching approval to a different version. |
| PWA-RV-08 | The PWA shall direct policy-restricted discrepancies, duplicates, and reassignment to manager review. | Must | TS-RV-05, TS-IN-04, TS-RV-03 | D/T: D-09 restricted examples show an escalation route/status; scorer cannot mark a manager-only decision complete. |
| PWA-RV-09 | The PWA shall prevent offline review edits or confirmations from being presented as accepted decisions. | Must | TS-RV-02, TS-RV-03, TS-RV-09; derived | T: Disconnect during correction/confirmation; show unsaved or receipt-unknown state; reconcile on reconnect. Persisted offline review mutation queues are excluded from this initial scope. |

## 5. Backend interface obligations

These are integration dependencies on parent requirements, not a new API architecture. The interface contract must be versioned before integration. Scorer identity is derived from the authenticated server session, not trusted client fields.

| Operation | Client input | Required response / invariant | Trace |
|---|---|---|---|
| Session exchange/end | Code in request body; authenticated sign-out | Scoped session/event/assignments; expiry/error semantics; session termination | PWA-AC-03, PWA-AC-05, PWA-AC-06 |
| Capture configuration | Authenticated context | Allowed assignments/templates, target structure, upload/queue policy versions and limits | PWA-AC-04, PWA-CP-08, PWA-UP-02 |
| Submit/reconcile | Original bytes, original context, idempotency identity, payload version; reconciliation identity | Durable record identity, original submission association, receipt state; same key/different payload rejected; duplicate disposition | PWA-UP-04, PWA-UP-05, PWA-UP-06, PWA-UP-07 |
| List/status/review | Authorized event/record reference | Versioned state, refresh time, sanitized evidence, cells/results, findings, allowed actions | PWA-RV-01, PWA-RV-02, PWA-RV-04 |
| Correct/confirm | Record/transcription version, changes/reason or explicit confirmation intent | New/current authoritative version, audit acknowledgment, or explicit conflict/denial; no silent overwrite | PWA-RV-05, PWA-RV-06, PWA-RV-07 |

A transport acknowledgment is insufficient: `Received` means the server has durably preserved evidence and a recoverable processing obligation under TS-IN-05. Request size limits, timeouts, retry guidance, error taxonomy, idempotency retention horizon, and reconciliation authorization must be mutually compatible with D-04/D-08. API paths, event-push versus polling, and storage mechanisms belong in design decisions.

## 6. Security, data lifecycle, and PWA operation

| ID | Requirement | Priority | Parent / rationale | Acceptance / verification |
|---|---|---|---|---|
| PWA-SE-01 | The PWA shall isolate its origin and service-worker scope from manager and public surfaces. | Must | TS-SE-01 | I/T: Scope/cookie/cache inspection and cross-origin tests reveal no manager/public privilege or storage sharing. |
| PWA-SE-02 | The PWA shall use server-managed Secure, HttpOnly session cookies, CSRF protection, and the approved restrictive content security policy. | Must | TS-SE-02 | T/I: Inspect headers/cookies; forged mutation and injected-content tests cannot perform authenticated scorer actions. |
| PWA-SE-03 | The PWA shall exclude model, hosting, database, and infrastructure secrets from client assets, storage, and requests. | Must | TS-AI-01, TS-SE-04 | I/T: Build/network/storage scans find none; all model interpretation is requested through authorized backend workflow. |
| PWA-SE-04 | The PWA shall exclude private review responses, codes, and raw evidence from generic browser/service-worker application caches. | Must | TS-AC-04, TS-DT-03; derived | I/T: Offline cache inspection and sign-out/back-navigation tests find only approved static assets; the encrypted pending store is the explicit evidence exception. |
| PWA-SE-05 | The PWA shall render QR, roster, OCR, and error content as untrusted data without executing instructions or navigating arbitrary scanned links. | Must | TS-AI-06, TS-IN-01; derived | T: Script/markup and hostile QR fixtures cannot execute, change authorization, or redirect the scorer to an attacker-controlled destination. |
| PWA-SE-06 | The PWA shall emit diagnostics without image content, participant names, access codes, session tokens, or correction text. | Must | TS-SE-07, TS-SE-06 | I/T: Capture, failure, and review telemetry samples contain only approved non-content event/error/version identifiers; PD-02 governs diagnostic retention. |
| PWA-OP-01 | After initialization, the PWA shall expose an offline application shell with pending-work status and recovery instructions. | Must | TS-CP-06, TS-CP-07; derived | D: Launch offline on each supported mode with retained approved assets; distinguish initialization failure from usable offline queue mode; do not imply offline authentication or server review access. |
| PWA-OP-02 | A PWA update shall preserve accepted local pending submissions or explicitly prevent activation until they can be safely handled. | Must | TS-CP-06, TS-CP-07; CLU derived | T/D: Update during draft, queue, upload, and unknown-receipt states; no silent loss or new retry identity; unsupported local schema remains recoverable under PD-04. |
| PWA-OP-03 | The PWA shall identify its application version and provide a controlled recovery path for incompatible client/server versions. | Must | TS-OP-03; CLU derived | T/D: Old client against incompatible API shows an update action, preserves pending work, and does not submit misinterpreted payloads; rollback drill follows PD-04. |

### Managed device data

| Data | Permitted lifetime / handling |
|---|---|
| Access code | In memory only for exchange; clear after exchange/cancel |
| Session | Protected server-issued cookie; expiry/revocation/sign-out under D-05 |
| Live camera frames and draft preview | Transient capture/preview only; no background frame upload or implicit gallery save |
| Pending evidence/context/retry identity | Encrypted bounded store until durable receipt, explicit permitted deletion, or approved expiry treatment; D-04 / PD-02 |
| Private server review payload and unsaved review changes | Active authorized view memory only; clear on sign-out; no offline review persistence |
| Minimal receipt/status references | Only if approved in PD-02; recoverable from authorized server inventory |
| Static application assets | Versioned non-private offline shell; update/rollback governed by PD-04 |
| User-selected image-library file | Outside PWA-managed storage; local package purge does not claim deletion of the source library file |

Encryption does not substitute for origin security, authorization, and minimization. Key custody, restart recovery, logout/expiry behavior, and inability to decrypt are explicit design decisions; this specification does not claim that client-side encryption protects against all compromise of the running capture origin.

## 7. Quality and acceptance profile

| ID | Requirement | Priority | Parent / rationale | Acceptance / verification |
|---|---|---|---|---|
| PWA-QA-01 | The PWA shall meet approved response-time targets for launch, quality feedback, local queue acknowledgment, and server-status refresh. | Must | TS-QA-01, TS-QA-02 | A: Measure p50/p95 on D-06 device and D-07 network/image/load profiles; separate local processing, upload, and backend extraction times; apply PD-05 targets. |
| PWA-QA-02 | The PWA shall support keyboard and assistive-technology operation of capture alternatives, pending queue, review, errors, and confirmation. | Must | TS-QA-06 | D/I: Automated checks and manual walkthrough verify names/roles, focus order, status announcements, zoom/reflow, contrast, and non-color cues against D-06; a cell grid provides identifiable row/cell labels. |
| PWA-QA-03 | The PWA shall remain usable for the approved maximum image and queue sizes on the least-capable supported device. | Must | TS-CP-06, TS-QA-04 | D/A: At D-04/D-06 limits, capture/preview/queue operations meet PD-05 resource/latency limits and preserve previously queued packages; oversized input fails without losing prior work. |
| PWA-QA-04 | A trained scorer shall complete representative capture, retry, and confirmation tasks within approved time/error thresholds. | Must | TS-QA-03, TS-OP-06 | D/A: Field trial records clean-sheet and exception completion times, retake rate, wrong-sheet association, abandoned tasks, and user errors against PD-05 / D-14. |

Numerical targets are not silently invented. The acceptance profile must specify device/browser versions and modes; image size and template set; lighting/motion cases; network bandwidth/latency/loss; sample counts; queue limits; p95 timing thresholds; accessibility criteria; and allowed task-error rates. PD-05 is a release-test-plan blocker until these values are approved. Mandatory integrity criteria already have absolute outcomes: no duplicate accepted score from retries, no false durable-receipt indication, no unauthorized confirmation, and no silent loss caused by application update/queue eviction logic.

## 8. Decisions, hazards, and delivery gate

### PWA decisions

All remain **Open**. Parent decisions are inherited, not replaced. Javier approves scope and material risks; listed roles prepare evidence.

| ID | Decision / evidence needed | Parent | Owner | Due |
|---|---|---|---|---|
| PD-01 | Supported browser/device matrix, optional installed mode, first-use/offline capability boundaries | D-06 | Technical lead / scorer representative | Capture design |
| PD-02 | Pending encryption/key recovery; queue count/bytes/age; sign-out/expiry/deletion races; purge interval; retained status metadata and diagnostics | D-04, D-05, D-10 | Technical lead / operator / Javier | Offline/security design |
| PD-03 | Form templates, QR payload distinctions between access code and sheet identity, manual boundaries, warning/block rules | D-03, D-06 | Event manager / technical lead | Capture design |
| PD-04 | Complete client/server state/error contract; schema migration, minimum client version, rollback, reconciliation and idempotency horizons | D-08, D-11, D-12 | Technical lead / operator | Integration design |
| PD-05 | Measured launch/feedback/queue/status timing, memory/image envelope, task time/error rates, network profiles, and pilot samples | D-06, D-07, D-14 | Technical lead / event manager | Acceptance test plan |
| PD-06 | Exact scorer correction/confirmation authority and manager referral workflow; offline review persistence remains excluded | D-02, D-09 | Event manager / Javier | Review design |

Parent D-01 assurance and D-13 CLU baseline confirmation still apply. D-10 privacy/retention must be resolved before real participant data use. Browser/platform choices and any formal standards claims require primary-source verification during the relevant design work; this document does not claim current platform compatibility or legal conformance.

### PWA hazard checklist

All likelihoods are preliminary; residual risks remain unaccepted. Review at design and pilot gates.

| Risk | Likelihood / consequence | Treatment and verification | Owner |
|---|---|---|---|
| Wrong event/sheet submitted | Medium / scoring rework or misattribution | Visible context, immutable queued association, server validation; PWA-AC-04, PWA-CP-08, PWA-UP-03 | Event manager |
| Lost acknowledgment leads to duplicate/false receipt | Medium / incorrect inventory or scores | Stable retry identity and reconciliation; PWA-UP-05, PWA-UP-06, PWA-UP-07 | Technical lead |
| Storage/key loss or update destroys pending image | Medium / recapture required | Bounded encrypted store, explicit failure, preserved update identity, paper fallback; PWA-UP-11, PWA-OP-02 | Technical lead / scorer |
| Shared device exposes participant data | Medium / privacy disclosure | Clear review state, no private caches, retention/key review; PWA-AC-06, PWA-SE-04 | Operator |
| Incorrect cell confirmed against stale version | Medium / wrong result | Evidence view, version-bound confirmation, server conflict rejection; PWA-RV-04, PWA-RV-07 | Event manager |

### Verification and selected artifacts

This document is the PWA requirements artifact. The parent artifact baseline remains in force. PWA-specific implementation preparation comprises an interface/state contract and short ADRs (technical lead, before implementation), a capture/offline threat and data-lifecycle review (technical lead/operator, before participant data), fixtures and test procedures (implementer/scorer representative, before pilot), and update/rollback/field recovery instructions (operator, before release). No separate heavyweight governance package or approved waiver is implied.

For each reserved `V-PWA-…` case, record parent requirement, design reference, implementation commit, procedure, device/browser/build, configuration/fixtures, expected/actual outcome, evidence path, date, and reviewer. Every Must criterion must pass; Should requirements require an explicit disposition.

Minimum scenario set: permission denial; selected-file fallback; blur/glare/clipping/skew; wrong QR/event; manual capture; offline restart; queue full and expiry; session revocation; lost acknowledgment; concurrent tabs; deletion during uncertain receipt; missing key/storage loss; background delivery unavailable; asynchronous processing; correction conflict; model outage; malicious content; sign-out/back navigation; update/rollback with queued work; keyboard/screen-reader review; representative field rehearsal.

Release additionally inherits the parent build/test/review/security/accessibility gates. Pilot results reconcile with paper/manual scoring under D-14. This specification's completion does not indicate implementation readiness while applicable decisions remain unresolved.

### Approval and revision

- [ ] Scorer/event manager validates the workflow and authority allocation.
- [ ] Technical lead validates feasibility, interface dependencies, and acceptance profile.
- [ ] Javier approves the PWA baseline and material residual-risk decisions.

| Version | Date | Change | Status |
|---|---|---|---|
| 0.1 | 2026-09-14 | Initial PWA decomposition of system requirements v0.1 | Draft for review |
