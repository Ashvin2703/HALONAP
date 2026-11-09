# HALONAP Christmas artwork — 9 November 2026

Decorative enhancement only. Remove the two `/seasonal/christmas.*` includes from
`index.html` to disable; then this directory may be removed. No other application
files need changes. Previous six overlapping inline Christmas systems and their
mount scripts were removed.

## Assets
`assets/{santa,tree,garland,gifts,globe,reindeer,lantern}-{160,320}.webp`.
14 local transparent WebP files, 285 KiB combined for both responsive variants.
Generated using the built-in image tool for this project; no stock assets,
external image hosts, paid third-party services or purchases were used.
Alpha channels checked after conversion. AI-generated artwork is not exclusive.

Prompt set: isolated premium photorealistic 3D assets, true transparent background,
soft warm studio light, realistic materials, full object, no text/logo/watermark.
- Santa: traditional deep-red velvet, detailed fur, boots, small gold present.
- Tree: evergreen, warm fairy lights, red/gold ornaments, golden star, presents.
- Garland: natural pine, berries, pinecones, gold baubles, velvet ribbon, lights.
- Gifts: deep red, champagne gold and cream with satin bows.
- Globe: clear glass, miniature decorated tree, snow, brass base.
- Reindeer: natural brown fur, small antlers, red knitted scarf.
- Lantern: aged brass, warm candle glow, pine and snow.

## Behaviour
Local responsive images; low fetch priority; lazy below-fold artwork. Decorative
nodes are aria-hidden and never accept pointer events. Content geometry is unchanged.
Placement checks text, photos and controls and hides artwork when no safe gap exists.
Mobile hides Santa, lantern, gifts and reindeer; the tree also hides if it cannot fit.
Santa crosses once on desktop and is removed. Lights, peek and globe snow have finite
animation iterations. Snow stays clipped inside the globe. Reduced-motion CSS disables
all decorative animations and JS omits the flyover. No scroll listener or animation loop.

## Validation before release
- Nonseasonal index.html is byte-for-byte unchanged after accounting for removed
  seasonal block and two new includes. Other existing tracked files unchanged.
- JS syntax passes; all seven WebP pairs retain alpha.
- Desktop preview: original photos/copy, product popup, Pink quantity 2 (£25.98),
  bag, checkout-choice entry and sign-in UI checked. Footer artwork fits outside links.
- Mobile iframe layouts at 390 and 320 px checked (375/305 px content after scrollbars),
  no horizontal overflow. Shop popup opens. This is responsive desktop-browser QA,
  not a physical iPhone or Safari test.
- Existing tests: 16 pass, 2 fail. Baseline commit 678ed8f has exactly the same
  failures: overlay z-index assertion and outdated password-success text expectation.
  These unrelated existing tests/application behaviour were not changed.
- Reduced-motion rules verified in source; OS/browser preference toggle not exercised.
- No real payment, credentials submission, customer-data write or admin action.
- Lighthouse/Core Web Vitals and low-end physical-device FPS not measured.
