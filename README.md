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

Cloudflare Workers Builds automatically deploys merged changes from `main`, after running `npm run check`. Preview builds are disabled. The Git connection and build commands are configured in the Cloudflare dashboard, not in GitHub Actions. See [AGENTS.md](AGENTS.md) for local setup, source builds, compatibility rules, deployment, rollback, and credential handling.

The former Sites URL redirects to production using `legacy-site/index.js`, preserving each URL path and query string. Browsers also retain URL fragments across the HTTP redirect. The editor and its assets are served only from Cloudflare.

## WebMCP site tools

Supported browser agents can discover valid options, read or change the current bot, randomize, undo/redo, retrieve a share link, and download PNG or SVG exports. Changes use the existing editor state, option IDs, and URL serialization. Browsers without WebMCP retain the normal interface.

Photo tools open the existing dialog and can start matching a photo already selected by the visitor. `match_selected_photo` returns immediately; poll `get_photo_match_status` for `complete`, `failed`, or `cancelled`, then read the bot. Photos stay on-device and are never included in tool results. These tools cannot select files or fetch photos from a URL.

Rebuild the tool modules with `npm run build:webmcp`. Run `npm run check` and verify actual calls through the browser's WebMCP interface before merging.

## Hosted MCP server

Connect an MCP client to **https://botbuilder.mipmap.ai/mcp** using Streamable HTTP. No login or API key is required. A client that supports remote MCP can add this URL as a server; use its normal MCP server settings.

The six tools are `get_bot_options`, `create_bot`, `edit_bot`, `randomize_bot`, `get_bot_share_link`, and `export_bot`. First list options, then pass stable IDs in `selections`. Creation returns full selections, unavailable fields, and a share URL. Editing takes that URL plus new selections. Export returns a public PNG or SVG download URL, at 1024 or 2048 pixels. Old share URLs retain the editor's existing migrations.

For example, call `create_bot` with:

```json
{
  "selections": {
    "character": "rabbit",
    "eyeColor": "blue",
    "outfit": "tuxedo",
    "frame": "front-center"
  }
}
```

This server is stateless. It does not read or change an open browser, provide undo history, access private feedback, or accept photos, file paths, or remote photo URLs. Photo matching and editor undo/redo remain available through the site's WebMCP tools and normal controls. Nothing is saved by MCP; clients retain their own bot links.

`npm run build:mcp` extracts the catalog, URL logic, and SVG renderer from the captured editor by following resolved module bindings. It bundles the official MCP SDK and a static resvg WASM module for Cloudflare. Generated Worker modules are ignored by Git and rebuilt by `npm run check` and `npm run deploy`. Keep artwork fixtures unchanged.

For a real local Worker and protocol check:

```sh
npm ci
npm run check
npx wrangler dev --port 8787
# In another terminal:
npm run verify:mcp
```

After a successful Cloudflare build, verify the deployed endpoint:

```sh
npm run verify:mcp -- https://botbuilder.mipmap.ai
```

This uses an actual MCP client and checks every tool, legacy links, both export formats and sizes, rejected inputs, origin protection, and existing site routes. The SVG/PNG API accepts only catalog selections and bounded sizes. It never renders caller-supplied SVG.

## World clothing and accessories

The Outfit selector adds 12 distinct garments: Thai Chakri, Sari, Kimono, Hanbok, Qipao, Bunad, Flamenco dress, Andean jacket, Kaftan, Kente wrap, Maasai shuka, and Puletasi. The existing garments remain available. Six new fabric colors are appended.

Hair adds Neat bun, Braided updo, Twin braids, and Side braid. Extras adds separate Headwear, Hair ornaments, and Jewelry selectors for hats, flowers, a gold hairpin, earrings, necklaces, and a brooch. You can mix these with any available clothing and character. No new complete-look presets are added.

All pieces use the existing renderer, thumbnail controls, undo/redo, URL serialization, randomizer, WebMCP, and hosted MCP. Old links retain their artwork. URLs for retired trial garments resolve to the retained counterpart. Source is in `src/world`; run `npm run build:world` after edits and commit the generated browser modules.
