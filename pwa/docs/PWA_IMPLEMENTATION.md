# PWA implementation record

Status: draft deployment implementation, updated 2026-09-15. User direction: implement the PWA; omit QR login. This authorizes implementation work and explicitly defers QR login. It does not approve unspecified production policies or establish production readiness.

## Design allocation

- `public/app.js`: DOM-based scorer workflow and configured API client. Local
  development uses the same origin; a Pages build may use an explicitly
  configured HTTPS API. Dynamic content uses text nodes, not HTML interpolation.
- `public/api.js`: validates the public API base URL and constructs requests
  without putting credentials or access codes in URLs.
- `public/queue.js`: IndexedDB transactions and AES-GCM packages; encrypted context and original bytes; stable retry identities; persisted non-exportable key.
- `public/sw.js`: project-scoped, versioned static shell only. No API or runtime
  configuration caching and no forced activation during an active session.
- `server.mjs`: dependency-free development backend with typed-code sessions,
  CSRF token, exact-origin CORS controls, configurable secure cookie attributes,
  serial writes, upload identity conflicts, manual scoring, and approval history.
- `scripts/build-pages.mjs`: creates the static Pages artifact and injects only
  the validated public API URL.
- `tests/server.test.mjs` and `tests/pages.test.mjs`: functional integrity,
  access-control, cross-origin, scoped-path, and cache-isolation checks.

No production framework/provider or AI-model selection has been made. No external service is called. The development event and single-row manual review are fixtures for exercising the frontend/backend boundary.

## Requirement conformance summary

| Area | Implemented behavior | Remaining work |
|---|---|---|
| PWA-AC | Typed code, event context, sign-out, short session | QR login explicitly deferred; role/assignment management; installed-device testing; easier expired-session recovery |
| PWA-CP | Camera permission/fallback, overlay, manual shutter, original preview, full-size inspection, readability confirmation, camera shutdown | Automatic shutter, real defect detection, corner detection/correction, templates and sheet QR |
| PWA-UP | Encrypted bounded pending storage, durable local transaction before queue display, foreground retries, stable identity and reconciliation, purge after acknowledgment | Approved key/retention policy, age limits, recovery tests, production durability, cross-tab deletion race coordination |
| PWA-RV | Server inventory, manual 25-cell review, reasons, versioned saves, deterministic server scores, explicit confirmation, no client publication | AI/multi-row results, full manager referrals, evidence crops, automatic status polling, complete offline session UX |
| PWA-SE | No service credentials, CSRF, restrictive CSP, exact-origin credentialed CORS, configurable Secure/SameSite cookies, no generic private-data cache, text rendering | Production TLS termination and configuration verification, full threat review, manager/public-origin separation, image sanitization and encrypted backend storage |
| PWA-OP | Project-scoped static offline shell, app version, no forced service-worker activation, reproducible Pages artifact and draft deployment workflow | Production backend deployment, migration/rollback compatibility protocol, fresh-offline capture initialization |
| PWA-QA | Responsive layout, labels, keyboard controls, visible status and manual image inspection | Device field trials, screen-reader audit, formal accessibility checks, load/memory/timing evidence |

## Development policy defaults

One development event; all 22 squads available to its code. Sessions last one hour. Rate limit: 20 login attempts per minute per connection address. Photo allowlist: JPEG, PNG, WebP, maximum 12 MB. Client decoded-image maximum: 40 million pixels (checked after decode, not a security boundary). Queue: 10 photos / 50 MB. No pending-package age eviction. These values are implementation defaults, not resolution of D-04/D-05/D-06 or PD-02/PD-05.

Sign-out clears active private review data and terminates the server session while retaining encrypted pending packages. Reauthentication to the same development event is required before retry. Code values are not retained in browser storage. The persistent device key remains available to this origin and must be covered by the production threat model.

## Evidence

- JavaScript syntax checks: passed.
- Automated server/scoring integration tests: passed, including concurrent
  duplicate requests, version conflicts, credentialed preflight, secure cookie
  attributes, CSRF rejection, project-scoped paths, and cache isolation.
- Pages artifact build: passed with both an absent backend configuration and a
  representative HTTPS API URL. The absent configuration fails closed in the
  browser by disabling login.
- Real-browser camera, IndexedDB encryption/restart, service-worker install/offline/update, and visual/accessibility validation: **not yet executed** in this environment.
- Production release gates: **not passed**. The parent requirement and decision registers remain open.

Before production, replace the fixture backend with the approved ingestion/review interfaces, close the listed gaps, and execute the PWA verification cases on the supported browser/device matrix. Paper/manual scoring remains the official fallback.
