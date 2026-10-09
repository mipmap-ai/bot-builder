# BotPFP copy

A self-contained copy of the public editor at https://botpfp.com, captured on 2026-10-08.

## Run

Use Node.js 20 or newer. No dependency installation is required.

```sh
npm run dev
```

Open http://127.0.0.1:5173. Run `npm run check` for module integrity and backend checks.

## Included

Original public artwork, styling, avatar controls, looks, photobooth, undo/redo, randomized avatars, URL state, PNG clipboard support, 1024px/2048px PNG exports, and SVG exports. Original creator credit is retained.

Text feedback saves to this copy's own R2 bucket when hosted, or owner-only JSON files in `.local-data/feedback` locally. It does not send to the original creator. Voice input uses browser speech recognition where supported instead of the original site's private transcription service. Speech recognition can use the browser vendor's service. Microphone permission is requested only after the visitor chooses Record. Analytics collection is disabled.

The private authoring studio and the original site's private backend are not reproduced. The distributed JavaScript is the original public compiled code, not recovered authoring source. The SVG source labels in the original bundle include some development paths; all runtime module imports and public gallery images are included.

## Validation

Desktop and 390px mobile layout checked. All six editor tabs checked. Head selection and undo/redo checked. Downloaded PNGs verified at 1024×1024 and 2048×2048; SVG downloaded and inspected. Photobooth and share-link controls checked. Module references and feedback validation, persistence, and failure handling pass.
