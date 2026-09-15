---
title: Trap Scoring System Requirements
version: 0.1
date: 2026-09-14
status: Draft for review
source: Trap_Scoring_System_CONOPS.md, version 0.2
---

# Trap Scoring System Requirements

## 1. Baseline and reading conventions

**Purpose:** Convert handwritten league score sheets into reproducible, human-approved results with a traceable path from the photograph to the public scoreboard.

**Audience:** Javier Cortez, event managers, implementers, testers, and system operators.

**Status:** Proposed requirements baseline; no stakeholder approval, implementation, or verification is claimed. The source [CONOPS](Trap_Scoring_System_CONOPS.md) remains unchanged. Its metadata is dated 2026-09-15; this draft records the actual preparation date, 2026-09-14, without changing the source date.

**CLU provenance:** Applied the local CLU charter, core engineering principles, requirements practices/template, DAL assessment, artifact selection gate, engineering flow, testing strategy, release gates, and ADR 0001. Local repository: `/home/javierc/Documents/clu/clu`; HEAD: `b1a9dd5cf8fc54c7eca71f5daf89d9abf47c1d9c`. That checkout contains modified and untracked practices, so HEAD alone does **not** reproduce the guidance used. A file-hash manifest accompanies this document: [CLU practice sources](CLU_Practice_Sources.md). Confirm an authoritative practice baseline before implementation; no governing-practice changes are proposed here.

The user's request controls the work. The CONOPS supplies operational needs; its recommendations and unresolved decisions are not treated as approved decisions. CLU supplies the requested engineering practices.

### Requirement conventions

- Each table row has a stable identifier, priority, source, and planned verification criterion.
- **Must** means required for the initial operational release, once this draft is approved. **Should** means a recommendation requiring an explicit disposition before baseline approval. **Won't** items appear in the exclusions.
- “Shall” denotes a proposed mandatory requirement; “should” denotes a recommendation.
- `C§n` means CONOPS section n. `CLU` means a derived engineering control. `D-nn` means an unresolved decision in section 9.
- Every requirement `TS-X-nn` maps to a planned verification case `V-TS-X-nn` containing the criterion in its row. All cases are **Planned / not executed**. Implementation and evidence links are **Unassigned** until produced; these identifiers are traceability reservations, not existing tests.
- Verification methods: **T** automated test; **D** witnessed demonstration; **I** inspection; **A** measured analysis. Where a criterion depends on a decision, it cannot pass until that decision is resolved and the approved value recorded.
- Scope and rationale are in sections 2–3; functional requirements in section 4; quality/data/operations in sections 5–6; verification and governance in sections 7–10.

## 2. Context, scope, and assurance

### 2.1 Users and authority

| Actor | Need | Authority boundary |
|---|---|---|
| Scorer | Capture, inspect, correct, and confirm sheets | Assigned capture/review functions within one event; no manager operations |
| Event manager | Account for sheets, adjudicate, approve, publish, and close | Event-wide authority under the configured policy |
| Public viewer | Read released standings | Published fields only; no private evidence or mutation rights |
| System operator | Deploy, monitor, back up, restore, and manage secrets | Technical administration; no routine score adjudication |
| AI extraction service | Return image observations | Advisory only; no approval, scoring authority, or publication privileges |
| Javier Cortez | Approve requirements, material decisions, and residual risk | Baseline and risk acceptance owner |

### 2.2 System and trust boundaries

The system includes capture, ingestion, background processing, AI integration, deterministic scoring, manager review, publication, and operational storage. External dependencies are the paper form and league rules, mobile browsers/cameras, connectivity, OpenAI image interpretation, and hosting infrastructure.

| Boundary | Data crossing | Required control / trace |
|---|---|---|
| Untrusted phone → application | Access-code exchange, photograph, identifiers, corrections | Server authorization and validation; TS-AC, TS-IN |
| Application → private storage/database/queue | Evidence, records, jobs | Least privilege, private storage, durable/idempotent processing; TS-IN, TS-PR, TS-DT |
| Backend → AI service → backend | Selected image data and untrusted observations | Server credential, minimized payload, schema validation, no authority; TS-AI, TS-SE-06 |
| Manager browser → application | Review and publication decisions | Event-scoped authorization, CSRF controls, version checks, audit; TS-AC, TS-RV |
| Application → public surface | Explicit released projection | Allowlisted fields and coherent publication version; TS-PB |
| Operator → infrastructure/backups | Configuration, secrets, recovery actions | Separate service/administration privileges, protected backups and audit; TS-SE, TS-OP |

### 2.3 Scope and constraints

Included: event and roster setup, PWA capture, bounded offline submissions, private evidence handling, AI-assisted transcription, deterministic results, human review, manager dashboard, controlled public standings, exports, audit, recovery, and portability.

Excluded from initial capability: conventional user accounts/passwords or broad identity management; mobile possession of service credentials; AI approval/locking/publication; seven independently deployed services or repositories; mandatory MCP; equipment or firearm control; payments and prize disbursement. The last two exclusions are derived scope assumptions requiring confirmation under D-01.

Source-imposed design constraints are recorded separately from behavioral requirements in section 6.2. No hosting vendor, database product, model version, or software framework is selected by this document.

### 2.4 Preliminary assurance assessment

**Proposed classification: CLU DAL-E, conditional on D-01.** This is CLU's internal consequence classification, not aviation certification. The stated system records sporting results and does not control shooting equipment. The CONOPS provides paper/manual fallback and parallel operation. On that basis, the scoped failure consequence is a recoverable scoring delay or correction.

Assumptions requiring confirmation: paper originals remain available for the dispute/recovery period; staff can resume manual scoring within minutes; standings do not automatically control material payments, eligibility rights, or safety operations; collection is limited to ordinary league identification and scores. A browser crash may lose an unsent capture, but the paper allows recapture. Loss of originals or authoritative records without a practical recovery path invalidates this rationale.

No higher-consequence function is specified in the CONOPS. If assessment establishes material financial loss, significant unrecoverable work, safety dependency, or other consequence above DAL-E, stop the CLU design workflow and escalate to Javier and an appropriate specialist. D-01 must be resolved before detailed design or live use; this draft does not assert that a risk review has passed.

## 3. Outcomes and demand assumptions

| Outcome | Measure and acceptance basis | Requirement trace |
|---|---|---|
| Reproducible results | Every published result in acceptance fixtures traces to evidence, frozen cells, rules, and approval; recomputation matches exactly | TS-SC-01–05, TS-DT-01, TS-PB-01 |
| Controlled publication | Zero unresolved results or private fields released in authorization and publication tests | TS-PB-01–04, TS-SE-01 |
| Faster reporting | Compare capture-to-confirmation time and manual review effort against a measured manual baseline; threshold set in D-07 | TS-QA-01–03 |
| Complete night accounting | Every expected sheet has a receipt state or an explicit closeout disposition | TS-EV-02, TS-RV-06 |
| Recoverable operation | Interrupt/retry/restore scenarios preserve accepted records and produce no duplicate official scores | TS-IN-03, TS-PR-02, TS-OP-02 |

Source load is approximately six scorers, 22 squads, 22 expected sheets per night, and 12 league nights. At one sheet per squad-night this is **264 original sheets per season**, excluding recaptures, amendments, derivatives, and model responses. The number of shooters, rounds, public viewers, image sizes, upload burst duration, and concurrency beyond scorers are not specified. D-07 establishes a representative workload and a 10× growth assessment; 22 is not a software limit.

## 4. Functional requirements

### 4.1 Event configuration and access

| ID | Requirement | Priority | Source | Acceptance / verification |
|---|---|---|---|---|
| TS-EV-01 | The system shall let managers create or import versioned events, squads, rosters, scheduled traps, templates, and publication policies. | Must | C§5.1, §10 | T/D: Create and import a fixture; reject invalid associations; retrieve the saved version and values. Import format resolved in D-11. |
| TS-EV-02 | The system shall derive the expected sheet inventory from event configuration and record a disposition for each expected sheet. | Must | C§8, §13 | T: Missing, received, duplicate, and excluded fixtures reconcile to the expected inventory without double-counting. |
| TS-EV-03 | The system shall represent events, squads, shooters, sheets, and rounds as data rather than fixed league-size limits. | Must | C§3 | T/I: Configure both smaller and 10× source-size fixtures without changing code; assess performance separately under TS-QA-04. |
| TS-AC-01 | The system shall issue distinct event- and role-scoped access codes exchangeable for short-lived sessions. | Must | C§3, §5.1–2 | T: Scorer and manager codes issue only their scoped sessions; invalid codes fail; expiry follows D-05. |
| TS-AC-02 | The system shall allow authorized managers to revoke and rotate their event's access codes. | Must | C§9 | T: Revoked/replaced codes cannot establish sessions; existing-session invalidation meets D-05. |
| TS-AC-03 | The system shall enforce role, event, and assigned-resource authorization server-side for every private operation. | Must | C§2, §9 | T: Deny public private-data reads, cross-event requests, unassigned scorer access, and scorer calls to all manager operations, including direct API calls. |
| TS-AC-04 | The client shall exclude access codes from URLs and persistent browser storage. | Must | C§9 | I/T: Inspect history, referrers, cookies, local databases, caches, and storage after login/logout; no access code remains. A session token is separately governed by TS-SE-02. |

### 4.2 Capture and offline handling

| ID | Requirement | Priority | Source | Acceptance / verification |
|---|---|---|---|---|
| TS-CP-01 | The system shall provide a mobile-browser PWA capture workflow without an app-store installation requirement. | Must | C§3–4 | D: Complete capture on every browser/device in the approved D-06 matrix using a URL. |
| TS-CP-02 | The capture client shall evaluate sheet completeness, perspective, blur, glare, shadow, stability, and resolution and identify failed checks to the scorer. | Must | C§5.3, §7 | D/A: Labeled examples for each defect trigger the approved warning/block policy and a specific retake instruction; thresholds set by D-06. |
| TS-CP-03 | The client shall support automatic capture when readiness checks pass and deliberate manual capture with the same quality feedback. | Must | C§5.3 | D: Ready fixture triggers capture; manual capture remains available; failed checks remain visible. |
| TS-CP-04 | The client shall show a perspective-corrected preview and permit retake or submission before upload. | Must | C§5.4 | D: Retake replaces the selected image; the accepted preview corresponds to the original selected evidence. |
| TS-CP-05 | The client shall upload only the selected still image for a submission rather than a continuous video stream. | Must | C§5.4 | I/T: Network inspection during framing and capture shows no continuous camera upload. |
| TS-CP-06 | The client shall retain offline submissions only in a bounded, encrypted pending queue. | Must | C§3, §7, §14 | T/D: Network loss permits queued submission; package contains only necessary evidence and identifiers; count, bytes, and age limits and key behavior meet D-04; capacity exhaustion is visible and does not silently evict pending work. |
| TS-CP-07 | The client shall display pending/received/processing/review-needed status and retry queued submissions safely after connectivity returns. | Must | C§7, §11 | T/D: Interrupt connectivity before and after server acceptance; resume to the same server record and correct visible state. Expired sessions require reauthentication without embedding codes in queued data. |
| TS-CP-08 | The client shall permit deletion before upload and purge its pending package after confirmed durable server receipt. | Must | C§7, §14 | T: Deleted pending data is not uploaded; successful durable acknowledgment removes local image/package; lost acknowledgment retains recoverable pending status. |
| TS-CP-09 | The form should provide four corner markers and a QR-coded event, squad, sheet, and template identity. | Should | C§3, §14 | D: If D-03 adopts this form, decode valid identities and reject inconsistent identifiers; markerless forms use the approved boundary-confirmation path. |

### 4.3 Ingestion and processing

| ID | Requirement | Priority | Source | Acceptance / verification |
|---|---|---|---|---|
| TS-IN-01 | The ingestion service shall validate authorization, identifiers, allowlisted file type, file signature, dimensions, and configured size limits before accepting a submission. | Must | C§5.5, §9 | T: Invalid, mismatched, oversized, and unauthorized fixtures fail with a recoverable error; limits are specified in D-06. |
| TS-IN-02 | The system shall assign a generated evidence identifier and privately preserve the accepted original image without modification. | Must | C§5.5, §9 | T: Retrieved authorized original has the same hash as accepted bytes; client filenames cannot control storage paths; public reads fail. |
| TS-IN-03 | The system shall make submission retries idempotent. | Must | C§7, §11 | T: Concurrent requests with the same key/payload return one record; reuse with a different payload is rejected; lost acknowledgment/retry creates no second score. |
| TS-IN-04 | The system shall detect duplicate candidates using sheet identity and content fingerprint and route ambiguous duplicates to review. | Must | C§7 | T: Exact repeats map to one canonical record; different photos of one sheet are flagged; unrelated sheets are not silently merged. |
| TS-IN-05 | The system shall acknowledge receipt only after original evidence and its processing obligation are durably recoverable. | Must | C§5.5, §11; CLU derived | T: Inject failures between storage, metadata, and enqueue operations; no acknowledged evidence is lost or stranded without recoverable work. |
| TS-PR-01 | The pipeline shall quarantine uploads and decode/re-encode them in isolation into sanitized, orientation- and perspective-corrected derivatives. | Must | C§5.6, §9 | T/I: Malformed/decompression fixtures are contained under D-06 limits; derivatives decode correctly; originals remain unchanged and are never directly executed or published. |
| TS-PR-02 | The pipeline shall process asynchronously with bounded retries and idempotent job effects. | Must | C§7, §11 | T: Closing the capture page does not cancel accepted work; duplicate delivery and worker termination do not create duplicate records; retry exhaustion follows D-08 and enters manual review. |
| TS-PR-03 | The pipeline shall produce evidence crops associated with sheet, participant, round, and cell coordinates as needed for extraction and review. | Must | C§5.6–9 | T/D: Every disputed cell opens the corresponding region of the correct derivative and links back to its original. |
| TS-PR-04 | The system shall contain individual sheet failures and expose degraded dependency status. | Must | C§7, §11 | T/D: One failed job does not stop another sheet; AI unavailability leaves evidence queued or manually actionable and is visible to the manager. |

### 4.4 AI interpretation

| ID | Requirement | Priority | Source | Acceptance / verification |
|---|---|---|---|---|
| TS-AI-01 | The backend shall perform image interpretation through a server-held OpenAI credential. | Must | C§1.3, §3 | I/T: Client bundles, requests, storage, and logs contain no model credential; browser cannot invoke a privileged model proxy without authorization. |
| TS-AI-02 | The extraction service shall return versioned structured observations for metadata, participant candidates, ordered target classifications, handwritten totals, confidence, and review reasons. | Must | C§5.7, §6 | T: Validate schema/types/enumerations; require exactly 25 cells per applicable default round row; reject missing/extra cells. D-02 controls any other configured target count. |
| TS-AI-03 | The extraction workflow should use two independently obtained readings, such as forward and reverse target order. | Should | C§6, §14 | I/T: D-09 selects reading independence and comparison rules; separate requests/results are evidenced and disagreements route to review. Two readings do not by themselves prove correctness. |
| TS-AI-04 | The system shall route disagreement, low confidence, uncertain marks, and malformed observations to review without substituting guessed results. | Must | C§6–7 | T: Disputed cells are identified individually; unambiguous cells remain visible; malformed output retries under policy and then permits manual transcription. |
| TS-AI-05 | The system shall preserve each model response with model identifier/version as reported, schema version, run identity, and processing timestamps. | Must | C§6, §10 | I/T: Reprocessing adds a distinct run; prior responses remain accessible to authorized review within retention. Record prompt/configuration version as derived provenance. |
| TS-AI-06 | The system shall treat image text and model responses as untrusted data with no authority to change permissions, approve, lock, or publish records. | Must | C§1.3, §6; CLU | T/I: Adversarial sheet text and response fields cannot trigger privileged actions or bypass schema/review gates. |

### 4.5 Scoring and review

| ID | Requirement | Priority | Source | Acceptance / verification |
|---|---|---|---|---|
| TS-SC-01 | The system shall freeze an ordered, versioned target-cell transcription before calculating an authoritative result. | Must | C§5.8, §6 | T: Calculation references an immutable transcription version; later extraction cannot overwrite that version. |
| TS-SC-02 | The scoring core shall calculate round scores by deterministic counting of frozen hits/misses. | Must | C§5.8, §6 | T: For a complete 25-target round, score = 25 minus misses; all-hit, all-miss, and mixed fixtures reproduce exactly; uncertain/incomplete cells cannot yield a verified score. |
| TS-SC-03 | The scoring core shall calculate team totals and standings using an explicit, versioned league rule set. | Must | C§5.8, §10 | T: Approved D-02 fixtures cover counting shooters/rounds, ties, substitutions, absences, and season aggregation if included; every result stores the rule version. |
| TS-SC-04 | The system shall validate roster membership, participant/round structure, and target counts before verification. | Must | C§5.8, §13 | T: Unknown/duplicate participants, missing/extra rounds, and wrong cell counts prevent verification until resolved under D-02. |
| TS-SC-05 | The system shall compare computed totals with independently read handwritten totals without altering cells to force agreement. | Must | C§5.8, §6–7 | T: A mismatch retains both totals and opens a review finding; blank/unreadable totals follow D-02; only an audited cell correction changes arithmetic. |
| TS-RV-01 | The system shall present source evidence, derivatives/crops, frozen grid, candidate identities, totals, confidence, and review reasons to authorized reviewers. | Must | C§5.9, §8 | D: Reviewer can resolve a disputed cell/name using the correct evidence and see the resulting calculation. |
| TS-RV-02 | The system shall record corrections with actor/session, before/after values, evidence reference, reason, and timestamp. | Must | C§5.9, §10 | T: Empty reason is rejected; correction creates a new transcription/result version without erasing earlier values. |
| TS-RV-03 | The system shall require explicit authorized human confirmation before a record becomes Verified. | Must | C§1.3, §5.9; §14 proposed policy | T: Clean extraction alone cannot verify; D-09 selects who may confirm clean/discrepant sheets; unauthorized confirmations fail. |
| TS-RV-04 | The system shall support manual transcription when extraction is unavailable or unusable. | Must | C§7, §11 | D/T: With AI disabled, a reviewer enters cells from evidence and completes validation/approval under the same scoring and audit controls. |
| TS-RV-05 | The system shall restrict sheet reassignment to managers and preserve the original association in history. | Must | C§7 | T: Manager reassignment is audited, invalidates prior approval, and revalidates destination roster/rules; scorer attempt fails. |
| TS-RV-06 | The manager view shall show expected, received, processing, review-needed, verified, and missing sheet counts. | Must | C§5.10, §8 | T/D: Counts reconcile to the inventory across retries, rejected duplicates, and amendments; cumulative receipt and mutually exclusive workflow counts are labeled distinctly. |
| TS-RV-07 | The system shall require a manager disposition for every remaining exception before event lock. | Must | C§5.12 | T: Undisposed exceptions block lock; accepted exclusions remain visible in accounting and do not convert uncertain cells into verified scores. |
| TS-RV-08 | The system shall prevent ordinary edits to locked results and require controlled manager unlock, amendment, reapproval, and republication. | Must | C§5.12, §7 | T: Direct edit to an Official result fails; authorized correction preserves old versions and cannot appear as official before reapproval/republication. |
| TS-RV-09 | The system shall reject stale concurrent review and publication changes rather than silently overwrite a newer version. | Must | CLU; C§10 | T: Two clients edit/approve one version; the second conflicting write fails with refresh/review instructions; approval never applies to different cells. |

### 4.6 Publication and exports

| ID | Requirement | Priority | Source | Acceptance / verification |
|---|---|---|---|---|
| TS-PB-01 | The system shall publish only verified, human-approved result versions eligible under the event publication policy. | Must | C§5.10–11, §8 | T: Hold policy releases nothing until manager action; authorized automatic provisional policy releases only eligible records; unresolved records never enter the projection. Policy choice remains D-09. |
| TS-PB-02 | The public view shall show released team/individual standings, event name/date, reported count, update time, and Live/Provisional/Official status. | Must | C§4.1, §8 | T/D: Display reconciles with a single release version; Official requires locked event; excluded/missing sheet accounting does not imply complete reporting. |
| TS-PB-03 | Public APIs, pages, downloads, and caches shall expose only the approved public field projection. | Must | C§8–9 | T/I: Public requests and artifact inspection reveal no images, private observations, unresolved entries, codes, or audit data; participant naming follows D-10. |
| TS-PB-04 | The system shall withdraw or amend affected published results and atomically regenerate coherent standings with publication history. | Must | C§7, §10 | T: Correction cannot produce mixed old/new totals; old release remains privately auditable; public caches refresh/invalidate within D-07's approved interval. |
| TS-PB-05 | The system shall provide manager exports and printable scorecards/final reports, plus public printable released results. | Must | C§5.12, §8 | D/T: Exports and printouts match their labeled result/rule/publication versions; public exports obey TS-PB-03; formats selected in D-11. |

### 4.7 Lifecycle interpretation requiring approval

The CONOPS lifecycle lists `Submitted`, `Failed`, `Discarded`, `Rejected`, `Reprocessing`, `Amended`, and `Withdrawn` as destinations without defining all of them, and combines device, processing, approval, and publication states. D-12 resolves this before state-machine implementation.

Proposed interpretation: device state tracks Draft → Queued/Submitted → acknowledged Received or Failed/Discarded; receipt is authoritative only at the server. Server processing tracks Received → Processing → Review needed/Failed/Rejected; review can trigger reprocessing. Human approval establishes Verified for a specific immutable version. Publication tracks unpublished/Published/Withdrawn, with Official only for a locked release. Amendment creates a successor requiring validation and approval, preserving prior versions. This is a proposal, not an approved replacement for C§5.1.

| ID | Requirement | Priority | Source | Acceptance / verification |
|---|---|---|---|---|
| TS-LC-01 | The system shall enforce a documented lifecycle with authorized transitions and recoverable failure destinations. | Must | C§5.1; CLU | T: Approved D-12 transition matrix covers every source state and exceptional destination; forbidden transitions fail; device submission never impersonates durable receipt. |

## 5. Quality, security, and data requirements

### 5.1 Quality attributes

| ID | Requirement | Priority | Source | Acceptance / verification |
|---|---|---|---|---|
| TS-QA-01 | The client shall provide capture-quality and submission-state feedback within approved response-time targets. | Must | C§11, §13 | A/D: Measure p95 local feedback and acknowledgment time on D-06 devices and D-07 network/load profile; pass approved D-07 limits. |
| TS-QA-02 | The system shall complete healthy-dependency processing within an approved end-to-end latency target. | Must | C§11–13 | A: Measure receipt-to-review-ready p50/p95 and failures using D-07 workload and model; report queue and model time separately. |
| TS-QA-03 | Trained scorers shall be able to complete capture and confirmation within the approved usability time and error thresholds. | Must | C§13 | D/A: Field trial on representative phones/lighting measures clean sheets and exception sheets separately against D-07; document training and sample sizes. |
| TS-QA-04 | The system shall support the source league workload and demonstrate capacity behavior at 10× source scale. | Must | C§3; CLU | A/T: D-07 load report covers 6 scorers/22 sheets and 60 scorers/220 sheets per simulated night, configured public demand, cost, bottlenecks, and recovery; integrity holds under both loads. A 10× latency SLA requires explicit approval. |
| TS-QA-05 | The system shall expose dependency failure without falsely reporting queued work as complete. | Must | C§7, §11 | T: AI, queue, storage, and database outage fixtures display accurate pending/degraded status; last successful public update remains identifiable. |
| TS-QA-06 | Browser workflows shall support keyboard navigation, semantic labels, visible focus, announced errors/status, and information conveyed independently of color. | Must | C§8; CLU | D/I: Automated accessibility checks plus keyboard/screen-reader walkthrough of capture, manual review, and scoreboard pass the D-06 accessibility profile; provide a non-camera/manual capture path where camera automation is inaccessible. |
| TS-QA-07 | The AI pipeline shall meet approved cell, identity, and whole-sheet accuracy and review-burden thresholds on labeled pilot data before operational reliance. | Must | C§12–14 | A: Report accuracy denominators, incorrect automatic acceptance, uncertainty/review rates, sample composition, and held-out evaluation results against D-09 thresholds; agreed readings alone are insufficient evidence. |

### 5.2 Security and privacy

| ID | Requirement | Priority | Source | Acceptance / verification |
|---|---|---|---|---|
| TS-SE-01 | Capture, manager, and public browser surfaces shall use separate origins with isolated cookies, storage, scripts, and service-worker scopes. | Must | C§9 | I/T: Origin/storage/cookie review and cross-origin request tests show no unintended privilege sharing; public-origin script cannot read manager sessions/private responses. |
| TS-SE-02 | Authenticated browser sessions shall use HTTPS and Secure, HttpOnly, short-lived cookies with CSRF defenses and a restrictive content security policy. | Must | C§9 | I/T: Cookie/header inspection and forged state-changing requests verify controls; expiry and revocation tests meet D-05. |
| TS-SE-03 | The system shall enforce configurable abuse limits for access-code exchanges, upload requests, and billable processing. | Must | C§9, §11 | T: D-05/D-08 thresholds reject excess requests without duplicate jobs; authorized work resumes under the approved recovery policy. |
| TS-SE-04 | Infrastructure shall restrict each service identity to its required resources and keep secrets out of clients, source, logs, and exports. | Must | C§9; CLU | I/T: Permission-negative tests deny unnecessary operations; secrets scan covers build and deployment artifacts; credential rotation demonstration succeeds. |
| TS-SE-05 | Private server records, evidence, backups, and offline pending data shall be encrypted at rest with documented key ownership and recovery/destruction procedures. | Must | C§7, §9; CLU derived | I/D: Inspect storage protections and key access; demonstrate authorized restore and denial without required key access. D-04/D-10 define lifecycle and recovery tradeoffs. |
| TS-SE-06 | The system shall limit AI payloads and public disclosures to the fields necessary for their approved purposes. | Must | C§9; CLU | I/T: Inspect representative prompts and projections; no unrelated participant information, credentials, or audit data is sent; D-10 records provider handling and naming policy. |
| TS-SE-07 | The system shall record authentication exchanges, submissions, model runs, decisions, publication, administrative actions, and failures without logging secrets. | Must | C§9–10 | T/I: Each fixture generates correlated actor/session, action, record/version, and timestamp events; secret values are absent; unauthorized users cannot modify audit history. |

### 5.3 Authoritative data and retention

| Record group | Required content | Access | Retention basis |
|---|---|---|---|
| Event/roster | Rules, policy, eligibility, aliases, effective versions, code references | Authorized scorer subset; managers; operator only as needed | D-10 |
| Evidence | Original identity/hash, derivative lineage, event/squad association, state | Assigned reviewer/scorer and manager; operator as needed | D-10 dispute/audit window |
| Extraction | Model/schema/config versions, observations, confidence, crop references, run times | Authorized review and technical diagnosis | D-10 |
| Transcription/result | Participant/round, ordered cells, immutable version, rule version, totals, validations | Authorized review; public approved projection only | D-10 |
| Decisions/publication | Actor/session, old/new values, reason, evidence, release version/status/time, amendment history | Manager/auditor; public release fields only | D-10 |
| Device queue | Minimal encrypted evidence, identifiers, idempotency token, pending status | Capture origin on the device | D-04; purge on receipt/deletion |

| ID | Requirement | Priority | Source | Acceptance / verification |
|---|---|---|---|---|
| TS-DT-01 | Every published score shall retain a resolvable chain to original evidence identity, frozen cells, rule version, and human approval history throughout the approved audit period. | Must | C§10, §13 | T/I: Traverse every acceptance-fixture publication to its sources; reproduce totals; after authorized image deletion retain a deletion record and explicitly identify evidence as expired. |
| TS-DT-02 | The system shall preserve prior authoritative versions and link replacements rather than silently overwrite score history. | Must | C§10 | T: Correction/reprocessing/reassignment leaves earlier results and their decisions retrievable within retention. |
| TS-DT-03 | The system shall enforce approved retention and deletion rules across originals, derivatives, model responses, records, logs, device caches, and backups. | Must | C§9, §14; CLU | T/I: Time-controlled expiration tests and backup lifecycle inspection meet D-10; restoration reapplies deletion records and does not silently resurrect expired public/private data. |
| TS-DT-04 | The system shall export and restore authoritative event data with identifiers, versions, relationships, audit, and retained evidence intact. | Must | C§1.2, §11, §14 | D/T: Export/import into a clean environment; compare counts, hashes, relationships, reproducible totals, and publication history; expired images are identified explicitly. |

## 6. Operations and design constraints

### 6.1 Operational requirements

| ID | Requirement | Priority | Source | Acceptance / verification |
|---|---|---|---|---|
| TS-OP-01 | The deployment shall expose health, queue age/depth, processing failures/latency, review backlog, usage, and cost indicators with assigned alert ownership. | Must | C§8, §9, §11; CLU | D/T: Inject a failed dependency and quota threshold; D-08 alerts reach the configured operator with record correlation and no secrets. |
| TS-OP-02 | Backup and recovery procedures shall restore event configuration, transcriptions, decisions, publication history, and images within retention to approved recovery objectives. | Must | C§11 | D/A: Restore a representative backup into a clean environment and reconcile records within D-08 recovery time and maximum data-loss interval. |
| TS-OP-03 | The operator shall maintain tested deployment, rollback, incident response, vulnerability reporting, and patching procedures. | Must | C§9, §12; CLU | I/D: Release evidence includes reproducible build/deploy steps, schema-aware rollback/recovery drill, incident contacts, and D-08 remediation deadlines. |
| TS-OP-04 | The deployment shall enforce approved spending budgets, quotas, usage alerts, and approval controls for billable services. | Must | C§11 | T/D: Simulated threshold stops or defers billable work as D-08 specifies; accepted evidence remains recoverable and manual review remains possible. |
| TS-OP-05 | The release process shall retain risk-tailored SSDF evidence for Prepare, Protect, Produce, and Respond practices, including the AI component. | Must | C§9, §12 | I: Control/evidence map addresses source-named NIST SP 800-218 SSDF 1.1 and SP 800-218A; applicability and current source verification are completed in D-13 before a conformance claim. |
| TS-OP-06 | Operational transition shall use parallel manual/digital scoring until the approved accuracy, review burden, recovery, and publication acceptance gates pass. | Must | C§12 | D/I: D-14 specifies nights and thresholds; reconciliation report and manager/Javier acceptance authorize transition; manual method remains official during pilot. |
| TS-OP-07 | The operator shall maintain a retirement procedure for final export, access revocation, secret destruction, and policy-driven data deletion. | Must | CLU | D/I: Rehearsal verifies usable final export, rejected revoked access, and deletion evidence subject to D-10 retention obligations. |

### 6.2 Source-imposed architecture constraints

| ID | Requirement | Priority | Source | Acceptance / verification |
|---|---|---|---|---|
| TS-AR-01 | Initial delivery shall use one modular web product and containerized application backend with relational storage, private object storage, and background processing. | Must | C§4 | I/D: Deployment and module diagram demonstrate the stated topology and seven functional areas without requiring seven independent services/repositories. |
| TS-AR-02 | Infrastructure interfaces shall permit deployment on another provider or an administered private server without changing the authoritative data model or operating workflow. | Must | C§1.2, §4, §14 | I/D: Adapter/configuration boundaries are documented; migrate a representative dataset and run scoring/review/publication acceptance fixtures on a second environment. Provider/model choice remains an ADR. |
| TS-AR-03 | Normal capture, review, scoring, and publication shall operate without MCP. | Must | C§1.3, §14 | D: Complete end-to-end workflow with no MCP service configured. Future MCP starts as a separate scope decision. |

## 7. Verification and delivery traceability

### 7.1 Source coverage

| CONOPS source | Requirements / treatment |
|---|---|
| §§1–3: purpose, actors, environment | Sections 2–3; TS-EV, TS-AC, TS-CP, TS-AR |
| §4: seven areas and portable foundation | TS-CP, TS-IN, TS-PR, TS-AI, TS-SC, TS-RV, TS-PB, TS-AR |
| §5: normal scenario/lifecycle | Functional tables; TS-LC-01 and D-12 cover incomplete state definitions |
| §6: AI and authority | TS-AI, TS-SC, TS-RV-03; two readings remain a Should pending D-09 |
| §7: exception operations | TS-CP-02/06–08, TS-IN-03/04, TS-AI-04, TS-SC-04/05, TS-RV-04/05/08, TS-PB-04 |
| §8: manager/public views | TS-RV-01/06, TS-PB, TS-QA-06 |
| §9: security/privacy/assurance | TS-AC, TS-SE, TS-DT-03, TS-OP-02–05 |
| §10: data and audit | TS-AI-05, TS-SC-01/03, TS-RV-02/09, TS-SE-07, TS-DT |
| §11: continuity/performance/cost | TS-IN-03/05, TS-PR-02/04, TS-QA, TS-OP |
| §12: increments and transition | Section 7.2; TS-OP-05/06 |
| §13: acceptance | Section 3; row-level verification and section 7.3 |
| §14: decisions | D-02–11, D-14; proposed options are not approved selections |

### 7.2 Increment exit evidence

| Increment | Requirement groups | Exit evidence to produce |
|---|---|---|
| 1. Data and rules | TS-EV, TS-SC, TS-DT-01/02, TS-LC | Approved rule fixtures, deterministic tests, lifecycle/versioning tests |
| 2. Secure portable foundation | TS-AC, TS-IN, TS-SE, TS-DT-03/04, TS-OP-01–04, TS-AR | Threat review, authorization negatives, durable receipt/retry tests, export/restore and cost-control demonstrations |
| 3. Capture pilot | TS-CP, TS-QA-01/03/06 | Device/lighting results, accessibility checks, interruption/offline/purge tests |
| 4. AI processing | TS-PR, TS-AI, TS-QA-02/07 | Schema/failure tests, held-out labeled evaluation, disagreement/manual-path demonstration |
| 5. Manager operations | TS-RV, TS-EV-02 | Normal/exception scripts, concurrent-edit tests, lock/amendment history |
| 6. Controlled publication | TS-PB | Fixture reconciliation, projection leak tests, cache withdrawal and printable export checks |
| 7. Production readiness | All Must requirements, especially TS-QA-04/05 and TS-OP | Closed trace matrix, scans/review, load/recovery/rollback results, parallel-run acceptance |

### 7.3 Evidence and release gates

The implementation test plan expands each `V-<requirement ID>` into executable/manual steps and records: requirement and source, design/ADR, implementation commit/PR, test identifier, environment/configuration, expected/actual result, evidence location, reviewer, date, and disposition. No missing evidence is counted as passing.

Before implementation: resolve D-01 and applicable blocking decisions; approve requirements and selected artifacts; document architecture/interfaces, threat review, and test plan. Before release: all Must acceptance criteria pass; Should items have recorded disposition; all tests/build/lint/secret scans pass; dependency findings have approved treatment; peer review and hazard review complete; accessibility and recovery evidence exists; coverage is reported against the CLU DAL-E 60%+ critical-path target and does not decrease without an approved deviation. Coverage is supporting evidence, not proof of correctness. Parallel-run transition follows TS-OP-06.

Critical scenarios include zero/25 misses; uncertain/extra/missing cells; roster and total mismatch; malformed image/model output; lost upload acknowledgment; duplicate queue delivery; concurrent edits/publication; wrong-event reassignment; expired/revoked sessions; AI outage/manual scoring; public private-data access attempts; official-result correction; restore with expired/deleted evidence; and rollback across schema changes.

## 8. Proportionate artifact baseline and risk register

### 8.1 Selected artifacts

This is a **proposed** artifact selection, with role owners awaiting assignment by Javier. No artifact is silently waived. Related small artifacts may be combined in one document.

| Artifact | Owner role | Due gate | Status / acceptance |
|---|---|---|---|
| CONOPS | Javier / event manager | Requirements approval | Existing v0.2; approval status not supplied |
| Requirements, assumptions, decisions, hazard checklist | CLU drafts; Javier approves | Before detailed design | This draft; close blocking unknowns and confirm DAL-E |
| Architecture, interface/data contracts, ADRs | Technical lead | Before implementation | Planned; include module/trust boundaries, state machine, scoring rules, provider alternatives, and schema |
| Security/privacy assessment and control plan | Technical lead / operator | Before real participant data | Planned; threat model, access-code risks, keys, AI data handling, retention, jurisdiction review |
| Test plan and fixtures/evaluation dataset | Technical lead / event manager | Before implementation of relevant increment | Planned; row-level traceability and labeled ground truth |
| Test cases and execution evidence | Implementer / reviewer | Increment exit and release | Planned; all critical controls and recovery scenarios evidenced |
| Build/release/operations documentation | Operator / technical lead | Before release | Planned; deployment, rollback, incident response, backup/restore, cost controls, retirement |
| Pilot instructions and transition record | Event manager / Javier | Pilot / operational transition | Planned; manual fallback, field rehearsal, reconciliation, accepted thresholds |

### 8.2 Initial hazards and risks

Likelihood and consequence are preliminary judgments, not measured incident rates. All residual risks are **unaccepted** pending review; review at design gate and again before pilot. Owners are role assignments proposed for confirmation.

| ID | Failure / consequence | Likelihood | Treatment / requirement trace | Residual uncertainty | Owner |
|---|---|---|---|---|---|
| R-01 | Correlated AI error yields incorrect standings | Medium | Freeze cells; deterministic rules; human review; labeled evaluation; TS-AI-04, TS-SC, TS-RV-03, TS-QA-07 | Clean-looking mistakes can survive review | Event manager |
| R-02 | Retry/concurrency creates duplicate or stale official result | Medium | Durable receipt, idempotency, version conflict checks, atomic publication; TS-IN-03/05, TS-RV-09, TS-PB-04 | Cross-store recovery needs demonstrated design | Technical lead |
| R-03 | Shared/lost manager code permits unauthorized changes or weak attribution | Medium | Scoped sessions, revocation, rate limits, audit; TS-AC, TS-SE | Session identity does not prove which person used a shared code; D-05 | Javier / technical lead |
| R-04 | Phone loss, public endpoint, or AI disclosure exposes participant information | Medium | Minimal encrypted pending data, private storage, projection controls, retention; TS-CP-06/08, TS-SE, TS-DT-03 | Browser key protection and external data policy unresolved | Operator |
| R-05 | Outage or evidence loss delays/requires re-entry of results | Medium | Retain paper, manual path, restore/reconciliation drill; TS-RV-04, TS-OP-02/06 | Paper custody and minutes-to-fallback unconfirmed; D-01 | Event manager / operator |
| R-06 | Unbounded AI retries/uploads cause unexpected charges | Medium | Quotas, retry caps, alerts, budget controls; TS-PR-02, TS-OP-04 | Budget/limits not yet agreed | Operator / Javier |
| R-07 | Retention expiry prevents a later scoring dispute review | Medium | Approved dispute period and auditable deletion; TS-DT-01/03 | Retention vs. evidence obligations unresolved | Event manager |

Safety: no physical actuation is in scope; confirm no indirect equipment/safety dependency. Privacy: names, handwriting, scores, and images are personal information; minimize access and retention. Legal: jurisdiction, participant ages, consent/notice, hosting/AI terms, licensing, and dispute-record obligations remain D-10/D-13 inputs; this document makes no legal compliance determination. Accessibility: practical browser controls are specified, with a formal acceptance profile to be selected. Security: shared access codes and untrusted images/model output require explicit design review.

## 9. Decision and assumption register

All entries are **Open**. Javier approves consequential choices; suggested owners prepare options and evidence. “Before” gates apply to the affected work, not to drafting these requirements.

| ID | Decision / unknown | Proposed starting point or required evidence | Owner | Resolve before |
|---|---|---|---|---|
| D-01 | DAL-E scope, failure consequence, and paper recovery | Confirm no equipment control/material financial dependence; paper custody through dispute period; timed manual fallback within minutes; clarify any eligibility/prize effects | Javier / event manager | Detailed design |
| D-02 | Complete league rule set | Confirm 25 targets/round, rounds, counting team members, ties, absences, substitutions, eligibility, handwritten-total exceptions, and whether season standings are required; supply worked examples | Event manager | Scoring design |
| D-03 | Printed sheet and identity | Prefer four corner markers plus QR; determine template dimensions/versions and handling of existing forms, missing markers, and manual boundary confirmation | Event manager / technical lead | Capture design |
| D-04 | Offline queue limits and protection | Select maximum count/bytes/age, key lifecycle across browser restart, behavior on eviction/logout/expiry, and purge timing; demonstrate recoverability on supported devices | Technical lead / operator | Offline design |
| D-05 | Codes, sessions, revocation, attribution | Choose entropy, validity, retry limits, session lifetime, active-session invalidation, manager bootstrap/recovery, and scorer assignments; assess per-scorer codes instead of one shared code per role | Technical lead / Javier | Access design |
| D-06 | Capture/device/accessibility profile | Identify supported browsers/devices; permitted image formats, bytes/pixels/decode limits; measured quality thresholds and warning/block rules; choose accessibility profile and test matrix | Technical lead / event manager | Capture pilot |
| D-07 | Latency, demand, usability, and public freshness | Define image size/network/burst/public-viewer workload, feedback/upload/processing p95 targets, review time, cache withdrawal interval, baseline manual effort, and 10× assessment criteria; measure before committing numeric SLOs | Technical lead / event manager | Performance test plan |
| D-08 | Continuity, costs, and operations | Set RTO/RPO, backup frequency, operational hours, alerts, retry/backoff/timeouts, quotas/spend ceiling/approval owner, outage/manual procedures, patch and incident response times | Operator / Javier | Foundation acceptance |
| D-09 | Approval and AI acceptance | Prefer two readings; scorer confirms clean sheets, manager adjudicates discrepancies/reassignment; define auto-cell acceptance thresholds, labeled dataset/split, accuracy/review-rate gates, and publication modes | Event manager / Javier | AI/review design |
| D-10 | Data/publication/retention obligations | Determine jurisdiction, minors if any, notices/consent basis, public name fields, AI/provider handling, image/dispute period, audit/backup retention, deletion holds, and export authority | Javier / event manager / operator | Real participant data use |
| D-11 | Hosting, portability and formats | Compare total cost/operational fit; record ADR for provider and migration approach; choose versioned import/export schemas and printable formats | Technical lead / operator / Javier | Foundation design |
| D-12 | Complete lifecycle and closeout semantics | Approve section 4.7 interpretation or alternative; define all transitions, actors, reprocessing, duplicate/rejected dispositions, accepted exceptions, and withdrawal during amendment | Technical lead / event manager | State-machine design |
| D-13 | Applicable standards and authoritative CLU baseline | Pin approved CLU practices including local modifications; verify current primary standards sources and applicable legal/licensing obligations before claiming compliance | Technical lead / Javier | Baseline approval / relevant design |
| D-14 | Pilot and transition | Set number of parallel nights and thresholds for accuracy, review burden, usability, recovery, and publication control; identify fallback and acceptance signatories | Event manager / Javier | Pilot start |

These gaps are not permission to invent scoring policy or pass unmeasured acceptance criteria. Once resolved, replace each referenced parameter with the approved value/version and update affected requirements and verification cases.

## 10. Approval and change control

- [ ] Javier confirms the DAL-E assessment and scoped consequences.
- [ ] Event manager validates operational coverage, rules, and exceptions.
- [ ] Technical lead reviews feasibility, dependencies, and measurable acceptance targets.
- [ ] Javier approves the requirements and artifact baseline, decisions, and any material residual risks.

Approval is not implied by creation of this document. Baseline changes retain stable IDs, record source/rationale and impacted tests/design, and obtain Javier's approval when changing scope, major design choices, controls, or material risk. Any deviation records owner, consequence, compensating controls, review/expiry date, and explicit acceptance.

| Version | Date | Change | Approval |
|---|---|---|---|
| 0.1 | 2026-09-14 | Initial traceable conversion of CONOPS v0.2 using local CLU practices | Pending |
