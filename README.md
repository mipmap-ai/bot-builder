# Bot Builder

A self-contained copy of the public editor at https://botpfp.com, captured on 2026-10-08.

## Run

Use Node.js 20 or newer. Install the build dependencies with `npm ci`. The committed app can run without dependencies; rebuild the photo feature with `npm run build:photo` after changing its source.

```sh
npm run dev
```

Open http://127.0.0.1:5173. Run `npm run check` for module integrity and backend checks.

## Included

Original public artwork, styling, avatar controls, looks, photobooth, undo/redo, randomized avatars, URL state, PNG clipboard support, 1024px/2048px PNG exports, and SVG exports. The footer credit reads "original by Matt · remixed by Brett", with Matt linked to the original credit at https://x.com/mattyp and Brett linked to https://x.com/bretthamlin.

Text feedback saves to this copy's own R2 bucket when hosted, or owner-only JSON files in `.local-data/feedback` locally. It does not send to the original creator. Voice input uses browser speech recognition where supported instead of the original site's private transcription service. Speech recognition can use the browser vendor's service. Microphone permission is requested only after the visitor chooses Record. Analytics collection is disabled.

The private authoring studio and the original site's private backend are not reproduced. The distributed JavaScript is the original public compiled code, not recovered authoring source. The SVG source labels in the original bundle include some development paths; all runtime module imports and public gallery images are included.

## Validation

Desktop and 390px mobile layout checked. All seven editor tabs checked. Head selection and undo/redo checked. Downloaded PNGs verified at 1024×1024 and 2048×2048; SVG downloaded and inspected. Photobooth and share-link controls checked. Module references and feedback validation, persistence, and failure handling pass.

## Photo matching and eye colors

Choose Photo match, select a JPG/PNG/WebP portrait of one person, and choose Create bot. The face detector and CLIP matcher run entirely on the visitor's device. The first match downloads a pinned quantized model from Hugging Face; subsequent matches use the browser cache. No photo or photo crop is uploaded to this site's backend, stored in R2, or sent to an AI service. Closing the dialog cancels processing and clears the selected photo. No API key is required.

The matcher uses the existing catalog only. Face proportions select a head shape; segmented skin and hair colors select palette swatches. Visual classification selects hair, outfit, and visible accessories. Uncertain accessories are omitted. Small or obscured eyes retain the existing eye color. Model predictions are approximate and can differ from the person; manual adjustments remain available. The whole match is one undoable edit.

The Eyes tab provides Black, Dark brown, Brown, Hazel, Green, Blue, Gray, Amber, and Violet. Black remains the default. Eye color is part of URL state, undo/redo, thumbnails, photobooth, PNG and SVG exports.

Photo source files are in `src/photo/`. `scripts/build-photo.mjs` produces the committed browser bundles and copies the WASM runtimes from the exact npm lockfile dependencies. MediaPipe's pinned BlazeFace model is included locally. CLIP model revision is pinned in `src/photo/worker.mjs`.

Photo matching separates hair, face skin, and clothes with MediaPipe SelfieMulticlass before sampling colors. Bright skin samples reduce shadow bias; neutral clothing provides a bounded warm-light correction. FaceLandmarker measures head proportions and iris colors. Hair candidates use visible forehead and hair length; CLIP compares the original and isolated crops. Photos and masks remain on the device. No photo data is included in source or deployment.

Local model assets use Google's pinned model version 1:

- https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_multiclass_256x256/float32/1/selfie_multiclass_256x256.tflite
- https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task

Known limits: lighting correction is approximate, the part library has limited face and hair shapes, and tiny or covered eyes retain the current eye color.

Rabbit is an additional character under Head. Its URL value is `character=rabbit`. Existing character IDs, defaults, and palette IDs are unchanged. `npm run build:rabbit` copies the original vector geometry from `src/rabbit/character.mjs`. Compatibility tests compare rendered SVG hashes with fixtures captured before the addition, including the saved portrait URL and all 16 previous head/character combinations.

## Avatar link compatibility

Keep existing avatar URLs valid and preserve their rendered images. Add new options without renaming existing IDs, changing defaults, or replacing existing artwork. Replace an existing option only when Brett explicitly requests it. The requested Muni-to-Penguin replacement retains `character=muni` so existing links still resolve. Tuxedo is an appended outfit with `outfit=tuxedo`.

Run `npm run check` before publishing. Keep the saved avatar hash fixtures unchanged; test an explicitly requested replacement separately. Build the new artwork with `npm run build:formal` after editing `src/formal`.

Sweet Potato is retired. Legacy `held=sweet-potato` links and `accessory.held` specs map to Nothing held, preserving every other selection. Keep this migration when changing catalogs or parsers.

## Original authorship and licensing

The original BotPFP editor and artwork are credited to Matt (https://x.com/mattyp). Brett modified this copy. No license granting redistribution of the original editor or artwork has been identified. Attribution does not grant redistribution rights. This repository does not claim an open-source license for the original material. Dependency licenses do not license the original application or artwork.

## Cloudflare hosting

Production runs at https://botbuilder.mipmap.ai in the MipMap Cloudflare account. `wrangler.json` deploys the committed editor assets and feedback Worker. Feedback uses the private `botbuilder-feedback` R2 bucket. Photos remain on-device. Existing avatar query strings work unchanged on the new domain.

Run `npm ci`, `npm run check`, and `npm run deploy` with an authorized Cloudflare connection. Keep API credentials outside the repository. No rebuild is needed unless source modules are edited.

The intended Cloudflare Workers Builds setup deploys merged changes from `main`, after running `npm run check`. Automatic deployment is not enabled yet; connecting the `mipmap-ai` GitHub organization requires owner approval. The Git connection and build commands are configured in the Cloudflare dashboard, not in GitHub Actions. See [AGENTS.md](AGENTS.md) for local setup, source builds, compatibility rules, deployment, rollback, and credential handling.
