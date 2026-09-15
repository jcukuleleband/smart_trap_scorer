# Smart Trap Scorer

Trap league score-sheet capture, review, and scoring.

## Project layout

- [pwa/](pwa/README.md) — Fieldbook scorer PWA, local development server, tests, and implementation notes.
- [requirements/](requirements/Trap_Scoring_System_Requirements.md) — CONOPS, system requirements, and PWA requirements.

## Run the PWA

```sh
cd pwa
npm start
```

Open **http://localhost:4173** and use development code **FIELD-DEMO**. QR login is not implemented.

## Check the PWA

```sh
cd pwa
npm run check
npm test
```

See the [PWA README](pwa/README.md) for setup and development limitations, and the [implementation record](pwa/docs/PWA_IMPLEMENTATION.md) for requirement coverage.

The draft GitHub Pages packaging and deployment workflow is documented in the
[PWA README](pwa/README.md#draft-github-pages-deployment). It publishes only the
static scorer shell; a separately operated HTTPS API is required for login and
protected scorer operations.
