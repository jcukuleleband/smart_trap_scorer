# Fieldbook — Trap Scoring PWA

A runnable scorer PWA with typed access-code login, camera/file capture, photo inspection, encrypted pending uploads, receipt reconciliation, and a manual review workflow. **QR login is intentionally not implemented.**

## Run locally

Requires Node.js 18 or newer. No package installation is needed.

From the repository root:

```sh
cd pwa
npm start
```

Open **http://localhost:4173** and enter **FIELD-DEMO**. Use sample images only. An optional `DEV_ACCESS_CODE` environment variable replaces the default code; the custom code is not exposed by the configuration endpoint.

1. Choose a squad and enter a sheet reference.
2. Open the camera or choose an image, inspect it, and confirm readability.
3. Queue and submit. Pending images are encrypted in IndexedDB and removed after server acknowledgment.
4. Open **Submitted sheets**, select a sheet, and manually enter one participant's 25 target results. Click a target to cycle uncertain → hit → miss.
5. Save with a reason, inspect the server-calculated score, then confirm the reviewed version.

The server binds to loopback only. Mobile-camera testing requires a separate HTTPS development setup; a phone's `localhost` is the phone itself. This repository does not configure a public deployment.

## Checks

Run these commands from `pwa/`.

```sh
npm run check
npm test
```

Tests use a temporary local HTTP port and temporary data directory. They cover deterministic scores, denied unauthenticated/CSRF requests, concurrent idempotent uploads, conflicting reuse of a submission ID, stale approval, and versioned review. Files in `.data/` are development records and are ignored by Git.

## Implementation scope

- Responsive capture, pending, submitted, and review screens with keyboard-accessible controls and explicit status messages.
- Camera lifecycle cleanup and still-image selection; original upload bytes retained separately from display.
- AES-GCM encrypted pending packages; non-exportable device key persisted in IndexedDB. This protects stored package content, not a compromised same-origin script or device.
- Atomic local queue-count/byte checks: 10 photos, 50 MB total, 12 MB per image. These are development defaults awaiting requirements approval.
- Stable submission identities, retry/reconciliation, and no false claim that completed transport means receipt.
- Application-shell caching only; API/private evidence is not cached by the service worker.
- Explicit server-side manual calculation and confirmation; no AI arithmetic or publication.

## Important boundaries

This is a **development implementation**, not the complete production system. The included single-event API is a local fixture backend. It stores original images and JSON records on disk; it does not provide production quarantine/sanitization, encrypted server storage, backups, roster enforcement, separate manager origins, or full role administration. Its localhost session cookie deliberately lacks `Secure`; production HTTPS must enforce that attribute. Do not expose this server publicly or use real participant data.

Automatic capture, perspective correction, automated focus/glare/boundary assessment, AI extraction, full multi-row transcription, and manager escalation are not implemented. Photo quality is checked manually, with a resolution advisory. All authentication is typed-code only; no QR scanning is present.

Pending uploads survive normal browser reloads with their encryption key. They can be retried after online reauthentication; a fresh offline launch cannot establish a scorer session or capture event context. There is no automatic age-based deletion until the retention policy is decided. Browser storage clearance/eviction can lose pending work; retain paper originals. Local deletion is offered only before an upload attempt; attempted uploads require reconciliation.

See [implementation status and verification](docs/PWA_IMPLEMENTATION.md), [PWA requirements](../requirements/Trap_Scoring_PWA_Requirements.md), and [system requirements](../requirements/Trap_Scoring_System_Requirements.md).
