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

## Usability testing on GitHub Pages

The Pages workflow deploys from `main`. In repository **Settings > Pages**, select
**GitHub Actions**. Leave `PWA_API_BASE_URL` unset for the browser-only demo.

Open https://jcukuleleband.github.io/smart_trap_scorer/ after the workflow succeeds.
No login or backend is needed. Capture a sample sheet, save it, open **Saved
sheets**, enter one participant's 25 targets, save, and confirm the review.
Photos and reviews stay on that browser; **Clear demo data** resets the demo.
This tests usability, not production security, AI extraction, or official scoring.

See the [PWA README](pwa/README.md#github-pages-usability-demo) for details.
