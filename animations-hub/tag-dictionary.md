# Atmosphere tag dictionary

What each tag means, what to look for in the animation, and what it actually correlates with across the 157 presets in this repo.

`signature` is measured, not asserted - it comes from the presets that carry the tag today, so it shifts as tagging changes.


## Restraint & polish

### `calm`  — 10 presets (6%)

**Means:** Nothing competes for attention; the pace lowers your pulse.

**Look for:** Single slow motion, no loops demanding attention, muted palette.

*Signature:* travels with *classic, soft, gentle, shape, subtle*; triggers `viewProgress`, `hover`, `viewEnter`; median duration 400ms; mostly `scale`, `rotateX`, `rotateY`; 40% genuinely 3D.

*e.g.* BG_Image_ShapeMask_Gallery, BG_image_ShapeMask, Kinetic 155 Horizon

### `classic`  — 11 presets (7%)

**Means:** Familiar, timeless vocabulary. No trend markers.

**Look for:** Fade, slide, simple scale. No 3D, no glitch, no neon. Would have looked fine ten years ago.

*Signature:* travels with *modern, graceful, subtle, soft, high-end*; triggers `viewProgress`, `viewEnter`, `hover`; median duration 900ms; mostly `translateY`, `translateX`, `rotateX`.

*e.g.* Card Spread, horiznotal & vertical scroll, Vertical/ horizontal lanes

### `clean`  — 70 presets (45%)

**Means:** Visually uncluttered - the motion reads instantly.

**Look for:** Few colours (2-3), generous whitespace, one clear thing moving at a time.

*Signature:* travels with *understated, soft, subtle, silky, minimal*; triggers `viewProgress`, `viewEnter`, `hover`; median duration 600ms; mostly `translateY`, `scale`, `translateX`.

*e.g.* Card Spread, classic horziontal scroll, Vertical/ horizontal lanes

### `cloudy`  — 1 presets (1%)

**Means:** Diffuse, hazy, soft-focus quality.

**Look for:** Blur filters, low-contrast washes, overlapping translucency.

*Signature:* triggers `viewProgress`; mostly `translateX`, `translateY`.

*e.g.* Card Spread

### `elegant`  — 70 presets (45%)

**Means:** Restrained motion that still feels considered and expensive.

**Look for:** Asymmetric easing with a long deceleration, serif or high-contrast type, unhurried duration (600ms+).

*Signature:* travels with *soft, classic, understated, gentle, high-end*; triggers `viewProgress`, `viewEnter`, `hover`; median duration 800ms; mostly `translateY`, `scale`, `translateX`.

*e.g.* Card Spread, classic horziontal scroll, Small carousel

### `gentle`  — 16 presets (10%)

**Means:** Low amplitude. The motion is small relative to the element.

**Look for:** Travel under ~40px or scale change under ~10%. Nothing crosses the viewport.

*Signature:* travels with *soft, graceful, calm, modern, classic*; triggers `viewEnter`, `viewProgress`, `interest`; median duration 920ms; mostly `translateY`, `scale`, `translateX`; 25% loop forever.

*e.g.* Card Spread, Vertical/ horizontal lanes, Vertical/ horizontal lanes

### `graceful`  — 8 presets (5%)

**Means:** Unhurried, curved, weight-bearing motion - it looks like it has mass.

**Look for:** Arcs rather than straight lines, no sudden direction changes, slow settle. NN/g's 'long gradual deceleration'.

*Signature:* travels with *soft, modern, gentle, classic, subtle*; triggers `viewProgress`, `viewEnter`, `interest`; median duration 1120ms; mostly `translateY`, `translateX`, `scale`; 25% loop forever.

*e.g.* Card Spread, classic horziontal scroll, Vertical/ horizontal lanes

### `high-end`  — 24 presets (15%)

**Means:** Reads as premium/luxury.

**Look for:** Slow, generous timing, dark or monochrome palette, serif display type, lots of negative space.

*Signature:* travels with *classic, modern, sophisticated, graceful, refined*; triggers `viewProgress`, `viewEnter`, `hover`; median duration 860ms; mostly `scale`, `translateY`, `translateX`.

*e.g.* Card Spread, expand horzinotal scroll, Vertical/ horizontal lanes

### `modern`  — 8 presets (5%)

**Means:** Current design-language markers.

**Look for:** Large geometric sans, flat or subtle-gradient surfaces, generous radii, scroll-linked motion.

*Signature:* travels with *graceful, classic, soft, subtle, fun*; triggers `viewProgress`, `viewEnter`, `interest`; median duration 530ms; mostly `translateY`, `translateX`, `scale`; 29% loop forever.

*e.g.* Card Spread, corner fold scroll animation, acordion scroll

### `refined`  — 72 presets (46%)

**Means:** Nothing extraneous. Every moving part is doing work.

**Look for:** Few simultaneous properties, consistent timing between siblings, no decorative wobble.

*Signature:* travels with *understated, high-end, classic, elegant, gentle*; triggers `viewProgress`, `viewEnter`, `hover`; median duration 700ms; mostly `translateY`, `scale`, `rotate`.

*e.g.* Card Spread, Vertical/ horizontal lanes, Vertical/ horizontal lanes

### `smooth`  — 89 presets (57%)

**Means:** No visible jerk, stutter or hard stop anywhere in the motion.

**Look for:** One continuous curve per property. Ease-out or a gentle cubic-bezier, nothing linear-and-abrupt. If it stutters on scroll it is not smooth.

*Signature:* travels with *gentle, subtle, polished, silky, organized*; triggers `viewProgress`, `viewEnter`, `hover`; median duration 600ms; mostly `translateY`, `scale`, `translateX`.

*e.g.* Card Spread, title folds scroll animation, classic horziontal scroll

### `soft`  — 12 presets (8%)

**Means:** No hard edges in either the easing or the visuals.

**Look for:** Long tails on the easing, blur, feathered masks, rounded corners, low-contrast palette.

*Signature:* travels with *graceful, gentle, subtle, modern, classic*; triggers `viewEnter`, `viewProgress`, `hover`; median duration 1300ms; mostly `scale`, `translateX`, `translateY`; 42% loop forever.

*e.g.* Card Spread, Vertical/ horizontal lanes, Vertical/ horizontal lanes

### `sophisticated`  — 37 presets (24%)

**Means:** Complex underneath, simple on the surface.

**Look for:** Several coordinated properties that resolve into one apparent movement. Orchestration, not a single tween.

*Signature:* travels with *high-end, classic, shape, gradual, refined*; triggers `viewProgress`, `viewEnter`, `interest`; median duration 600ms; mostly `scale`, `translateY`, `translateX`.

*e.g.* expand horzinotal scroll, acordion scroll, horziontally scrolling image gallery

### `subtle`  — 14 presets (9%)

**Means:** You notice the result, not the movement.

**Look for:** Would a non-designer even register it happened? If the effect announces itself, it is not subtle.

*Signature:* travels with *soft, classic, modern, graceful, understated*; triggers `viewProgress`, `viewEnter`, `hover`; median duration 500ms; mostly `translateY`, `scale`, `translateX`.

*e.g.* Card Spread, Vertical/ horizontal lanes, Vertical/ horizontal lanes

### `understated`  — 20 presets (13%)

**Means:** Deliberately less than it could have been.

**Look for:** The effect is clearly held back - short travel, low opacity change, no flourish at the end.

*Signature:* travels with *subtle, graceful, soft, calm, vertical*; triggers `viewProgress`, `hover`, `viewEnter`; median duration 600ms; mostly `translateY`, `translateX`, `rotate`.

*e.g.* Card Spread, capezzani-wordmark-header, invert-header


## Flow & continuity

### `effortless`  — 30 presets (19%)

**Means:** Looks like it costs the interface nothing.

**Look for:** No strain, no bounce, no overshoot. Consistent velocity into a soft stop.

*Signature:* travels with *silky, flowing, understated, vertical, continuous*; triggers `viewProgress`, `hover`, `viewEnter`; median duration 550ms; mostly `translateY`, `translateX`, `rotate`.

*e.g.* title folds scroll animation, classic horziontal scroll, corner fold scroll animation

### `flowing`  — 33 presets (21%)

**Means:** Continuous directional movement, like a current.

**Look for:** Sustained travel in one direction, overlapping element timing so there is never a still frame.

*Signature:* travels with *effortless, spatial, continuous, seamless, gradual*; triggers `viewProgress`, `viewEnter`, `hover`; median duration 460ms; mostly `scale`, `translateY`, `translateX`; 41% genuinely 3D.

*e.g.* title folds scroll animation, classic horziontal scroll, corner fold scroll animation

### `horizontal scroll`  — 1 presets (1%)

**Means:** Vertical scrolling is remapped to sideways travel.

**Look for:** A sticky viewport with a wide track moved by translateX.

*Signature:* triggers `viewProgress`; mostly `translateX`.

*e.g.* classic horziontal scroll

### `polished`  — 53 presets (34%)

**Means:** Finished. Every state and edge is handled.

**Look for:** Hover, active and rest states all defined; nothing pops or reflows; timing consistent across siblings.

*Signature:* travels with *organized, silky, structured, smooth, horizontal*; triggers `viewProgress`, `viewEnter`, `hover`; median duration 600ms; mostly `translateY`, `scale`, `translateX`.

*e.g.* classic horziontal scroll, Small carousel, Wheel Carousel

### `seamless`  — 16 presets (10%)

**Means:** No visible seam, join or restart point.

**Look for:** Loops where you cannot spot the wrap; transitions where the outgoing and incoming states share geometry.

*Signature:* travels with *endless, flowing, cascading, impactful, understated*; triggers `viewEnter`, `viewProgress`, `hover`; median duration 420ms; mostly `scale`, `translateY`, `translateX`; 31% loop forever.

*e.g.* classic horziontal scroll, Small carousel, Wheel Carousel

### `silky`  — 24 presets (15%)

**Means:** Frictionless, high-frame-rate glide.

**Look for:** Transform/opacity only (GPU-friendly), no layout thrash, no jitter under fast scroll.

*Signature:* travels with *graceful, gentle, effortless, modern, unique*; triggers `viewProgress`, `viewEnter`, `hover`; median duration 600ms; mostly `translateY`, `scale`, `rotate`.

*e.g.* sticky repeater stack, horiznotal & vertical scroll, title folds scroll animation

### `simple`  — 1 presets (1%)

**Means:** A single readable idea, easy to describe in one sentence.

**Look for:** If explaining it needs an 'and then', it is not simple.

*Signature:* triggers `viewProgress`; mostly `translateX`.

*e.g.* classic horziontal scroll


## Energy & statement

### `artistic`  — 12 presets (8%)

**Means:** Prioritises expression over utility.

**Look for:** Would sit comfortably in a gallery; composition matters more than conversion.

*Signature:* travels with *unconventional, creative, expressive, edgy, shape*; triggers `viewProgress`, `viewEnter`, `interest`; median duration 600ms; mostly `translateY`, `scale`, `translateX`; 42% genuinely 3D; 25% loop forever.

*e.g.* Accordion Scroll Vertical, 3D small carousel, Diagonal_Slideshow

### `attention-grabbing`  — 18 presets (11%)

**Means:** Designed to interrupt.

**Look for:** High contrast against its surroundings, motion where the eye is not already looking, or a loop.

*Signature:* travels with *impactful, edgy, graphic, futuristic, experimental*; triggers `viewProgress`, `viewEnter`, `pageVisible`; median duration 800ms; mostly `translateY`, `translateX`, `scale`.

*e.g.* expand horzinotal scroll, CardSpread_7, TextMask2Image

### `bold`  — 56 presets (36%)

**Means:** Loud and unmissable. Commits fully to the effect.

**Look for:** Large travel or scale, heavy type, strong contrast, long confident duration (~900ms median here).

*Signature:* travels with *attention-grabbing, expressive, impactful, confident, graphic*; triggers `viewProgress`, `viewEnter`, `hover`; median duration 900ms; mostly `translateY`, `scale`, `translateX`.

*e.g.* expand horzinotal scroll, horiznotal & vertical scroll, Shape scroll

### `continuous`  — 41 presets (26%)

**Means:** Never fully stops while on screen.

**Look for:** `iterations: Infinity`, or a scroll-driven effect with no rest state.

*Signature:* travels with *endless, artistic, flowing, immersive, effortless*; triggers `viewProgress`, `viewEnter`, `hover`; median duration 1000ms; mostly `translateY`, `scale`, `translateX`; 29% loop forever.

*e.g.* corner fold scroll animation, Vertical/ horizontal lanes, Vertical/ horizontal lanes

### `cool`  — 20 presets (13%)

**Means:** Detached, confident, understated-but-current.

**Look for:** Restrained palette with one sharp accent; motion that does not try to please.

*Signature:* travels with *unique, edgy, futuristic, techy, dynamic*; triggers `viewProgress`, `viewEnter`, `hover`; median duration 550ms; mostly `translateY`, `scale`, `translateX`.

*e.g.* expand horzinotal scroll, 3D_Parallax_Gallery, Mirror_Hover_Galery

### `creative`  — 15 presets (10%)

**Means:** An idea you have not seen applied this way.

**Look for:** The mechanism itself is the novelty, not just the styling.

*Signature:* travels with *unique, experimental, artistic, organic, techy*; triggers `viewProgress`, `viewEnter`, `interest`; median duration 850ms; mostly `translateY`, `translateX`, `scale`; 27% loop forever.

*e.g.* horiznotal & vertical scroll, title folds scroll animation, Digital Jukebox

### `dynamic`  — 28 presets (18%)

**Means:** Visibly energetic; velocity is part of the message.

**Look for:** Fast phases, direction changes, several elements moving at once at different rates.

*Signature:* travels with *energetic, futuristic, fun, cool, edgy*; triggers `viewProgress`, `viewEnter`, `interest`; median duration 700ms; mostly `translateY`, `translateX`, `scale`.

*e.g.* expand horzinotal scroll, horiznotal & vertical scroll, corner fold scroll animation

### `edgy`  — 27 presets (17%)

**Means:** Slightly uncomfortable on purpose.

**Look for:** Asymmetry, clipping, glitch, harsh timing, unexpected cuts.

*Signature:* travels with *futuristic, attention-grabbing, experimental, unique, cool*; triggers `viewProgress`, `viewEnter`, `pointerMove`; median duration 760ms; mostly `translateY`, `translateX`, `scale`.

*e.g.* expand horzinotal scroll, sticky repeater stack, Endless Parallax

### `endless`  — 18 presets (11%)

**Means:** Reads as having no beginning or end.

**Look for:** Seamless infinite loop - marquee, lane, wheel. You cannot identify frame zero.

*Signature:* travels with *immersive, continuous, seamless, experimental, organic*; triggers `viewEnter`, `hover`, `viewProgress`; median duration 1700ms; mostly `scale`, `translateY`, `translateX`; 72% loop forever.

*e.g.* Vertical/ horizontal lanes, Vertical/ horizontal lanes, CasperGallery

### `experimental`  — 9 presets (6%)

**Means:** Feels like a prototype exploring an idea.

**Look for:** Unusual mechanics, no established convention, may not survive a usability test.

*Signature:* travels with *unconventional, creative, edgy, endless, attention-grabbing*; triggers `viewEnter`, `viewProgress`, `hover`; median duration 1000ms; mostly `translateY`, `translateX`, `scale`; 38% loop forever.

*e.g.* Accordion Scroll Vertical, 3D small carousel, CasperGallery

### `eye-catching`  — 1 presets (1%)

**Means:** Pulls the eye on first glance.

**Look for:** Same intent as attention-grabbing but usually via colour/shape rather than speed.

*Signature:* triggers `interest`; median duration 450ms; mostly `translateY`.

*e.g.* Accordion Scroll Vertical

### `futuristic`  — 14 presets (9%)

**Means:** Speculative, not-yet-mainstream.

**Look for:** 3D perspective, glass/neon, chromatic effects, unusual axis of movement.

*Signature:* travels with *techy, edgy, unique, dynamic, attention-grabbing*; triggers `viewEnter`, `viewProgress`, `hover`; median duration 600ms; mostly `translateY`, `translateX`, `scale`.

*e.g.* sticky repeater stack, Small carousel, Endless Parallax

### `graphic`  — 47 presets (30%)

**Means:** Poster-like. Reads as flat shape and type.

**Look for:** Oversized type, hard-edged shapes, strong figure/ground, often masks rather than 3D.

*Signature:* travels with *attention-grabbing, impactful, edgy, bold, surprising*; triggers `viewProgress`, `viewEnter`, `pointerMove`; median duration 900ms; mostly `translateY`, `scale`, `translateX`.

*e.g.* Shape scroll, CardSpread_7, Vertical3Dcards

### `impactful`  — 33 presets (21%)

**Means:** Lands with force - there is a moment of arrival.

**Look for:** A sharp deceleration into the final state, often with scale. You feel it stop.

*Signature:* travels with *attention-grabbing, confident, bold, edgy, graphic*; triggers `viewProgress`, `viewEnter`, `pageVisible`; median duration 950ms; mostly `translateY`, `scale`, `translateX`.

*e.g.* expand horzinotal scroll, Digital Jukebox, CardSpread_7

### `techy`  — 21 presets (13%)

**Means:** Machine-like, engineered.

**Look for:** Monospace type, grid overlays, stepped/`steps()` timing, scan-lines, dark UI.

*Signature:* travels with *futuristic, unique, cool, edgy, creative*; triggers `viewEnter`, `viewProgress`, `hover`; median duration 500ms; mostly `translateX`, `translateY`, `scale`.

*e.g.* Small carousel, 3D small carousel, CardSpread_7

### `unconventional`  — 5 presets (3%)

**Means:** Breaks an expected pattern deliberately.

**Look for:** Scroll that moves sideways, nav that is not at the top, reversed reading order.

*Signature:* travels with *experimental, artistic, edgy, dynamic, continuous*; triggers `viewProgress`, `viewEnter`, `interest`; median duration 1150ms; mostly `translateX`, `translateY`, `skewX`.

*e.g.* Accordion Scroll Vertical, 3D small carousel, dot-churn


## Play & response

### `3d effect`

**Means:** Reads three-dimensional without necessarily being real 3D.

**Look for:** Faked shadows/skew that imply volume. Prefer '3d' when perspective is genuinely used.

### `alive`  — 42 presets (27%)

**Means:** Idles rather than waiting - moves without being asked.

**Look for:** A slow continuous float/drift, or pointer-tracking. animations.dev's 'float'.

*Signature:* travels with *organized, interactive, poppy, playful, surprising*; triggers `hover`, `pointerMove`, `viewEnter`; median duration 400ms; mostly `translateY`, `scale`, `rotate`.

*e.g.* acordion scroll, 3D_Parallax_Gallery, BlurFocus_Gallery

### `charming`  — 6 presets (4%)

**Means:** Small, personable, a little humane.

**Look for:** Tiny idiosyncratic details; imperfection used deliberately.

*Signature:* travels with *fun, playful, alive, horizontal, interactive*; triggers `click`, `viewProgress`, `hover`; median duration 400ms; mostly `scale`, `translateY`, `rotate`; 50% dark palette.

*e.g.* sticky repeater stack, Vshape_Headline, lock-toggle

### `energetic`  — 11 presets (7%)

**Means:** High tempo, springy.

**Look for:** Short durations (<400ms), overshoot in the easing curve, quick successive triggers.

*Signature:* travels with *poppy, dynamic, fun, playful, surprising*; triggers `viewProgress`, `viewEnter`, `hover`; median duration 850ms; mostly `scale`, `translateY`, `rotate`; 40% genuinely 3D.

*e.g.* corner fold scroll animation, Shape scroll, CasperGallery

### `fun`  — 15 presets (10%)

**Means:** Produces a small smile.

**Look for:** Unexpected but harmless behaviour - wobble, squash, a face, a pop.

*Signature:* travels with *charming, poppy, expressive, surprising, modern*; triggers `pointerMove`, `viewEnter`, `viewProgress`; median duration 500ms; mostly `translateY`, `scale`, `rotate`.

*e.g.* sticky repeater stack, Shape scroll, acordion scroll

### `horizontal`  — 36 presets (23%)

**Means:** The dominant axis is left/right.

**Look for:** translateX dominates; row layouts; sideways travel.

*Signature:* travels with *polished, techy, interactive, effortless, alive*; triggers `viewProgress`, `hover`, `viewEnter`; median duration 500ms; mostly `translateX`, `translateY`, `scale`.

*e.g.* horziontally scrolling image gallery, CardSpreadByHover, HorizontalCarouselPerspective

### `innovative`  — 3 presets (2%)

**Means:** New technique, not just new styling.

**Look for:** Uses a capability most sites do not - scroll-linked 3D, pointer-driven fields, masked type.

*Signature:* travels with *bold*; triggers `hover`, `viewEnter`, `pointerMove`; median duration 560ms; mostly `scale`, `translateX`, `translateY`; 33% loop forever; 67% dark palette.

*e.g.* Small carousel, Endless Parallax, horziontally scrolling image gallery

### `interactive`  — 57 presets (36%)

**Means:** Responds to you, not to the scroll position.

**Look for:** Requires a hover / click / pointermove / interest trigger. THIS IS A HARD RULE: scroll-only work is never 'interactive'.

*Signature:* travels with *alive, fun, organized, poppy, playful*; triggers `hover`, `viewEnter`, `viewProgress`; median duration 420ms; mostly `scale`, `translateY`, `translateX`.

*e.g.* Shape scroll, acordion scroll, Endless Parallax

### `playful`  — 40 presets (25%)

**Means:** Invites you to mess with it.

**Look for:** Overshoot/bounce in the curve, exaggeration, response to hover or pointer.

*Signature:* travels with *charming, fun, poppy, energetic, surprising*; triggers `hover`, `viewProgress`, `viewEnter`; median duration 400ms; mostly `translateY`, `scale`, `rotate`.

*e.g.* expand horzinotal scroll, sticky repeater stack, horiznotal & vertical scroll

### `poppy`  — 15 presets (10%)

**Means:** Quick, punchy, spring-loaded.

**Look for:** Very short duration with visible overshoot - a spring with low damping (bounce).

*Signature:* travels with *fun, energetic, surprising, expressive, playful*; triggers `viewProgress`, `pointerMove`, `viewEnter`; median duration 420ms; mostly `scale`, `translateY`, `rotate`.

*e.g.* Shape scroll, acordion scroll, CasperGallery

### `surprising`  — 16 presets (10%)

**Means:** Does something you did not predict.

**Look for:** The second half of the motion contradicts what the first half implied.

*Signature:* travels with *poppy, fun, expressive, unique, energetic*; triggers `viewEnter`, `pointerMove`, `viewProgress`; median duration 1000ms; mostly `scale`, `translateY`, `rotate`.

*e.g.* Shape scroll, CasperGallery, CursorTrail

### `unique`  — 9 presets (6%)

**Means:** You would recognise it again.

**Look for:** One distinctive gesture that no other preset here repeats.

*Signature:* travels with *creative, cool, futuristic, techy, surprising*; triggers `viewProgress`, `hover`, `click`; median duration 450ms; mostly `translateY`, `translateX`, `scale`.

*e.g.* sticky repeater stack, horiznotal & vertical scroll, Mirror_Hover_Galery

### `z axis`  — 1 presets (1%)

**Means:** Legacy phrasing for depth movement - prefer 'depth' or '3d'.

**Look for:** translateZ / toward-or-away-from-viewer motion.

*Signature:* triggers `viewProgress`; mostly `rotate`, `scale`, `translateY`; 100% genuinely 3D; 100% dark palette.

*e.g.* sticky repeater stack

### `zoom`  — 42 presets (27%)

**Means:** Scale is the primary motion.

**Look for:** `scale()` doing most of the work - push in or pull out.

*Signature:* travels with *cool, high-end, shape, organic, immersive*; triggers `viewProgress`, `viewEnter`, `hover`; median duration 800ms; mostly `scale`, `translateY`, `translateX`.

*e.g.* sticky repeater stack, horziontally scrolling image gallery, BlurFocus_Gallery


## Depth & space

### `3d`  — 27 presets (17%)

**Means:** Actual three-dimensional transforms, not a fake.

**Look for:** `perspective` plus `rotateX/rotateY` or `translateZ` in the CSS.

*Signature:* travels with *perspective, dimensional, spatial, depth, high-end*; triggers `viewProgress`, `viewEnter`, `pointerMove`; median duration 780ms; mostly `translateY`, `rotateY`, `rotateX`; 96% genuinely 3D.

*e.g.* Endless Parallax, 3D small carousel, 3D_Parallax_Gallery

### `depth`  — 44 presets (28%)

**Means:** Reads as having a front and a back.

**Look for:** Overlap, scale-with-distance, blur-with-distance, or an explicit Z translation. 84% of presets tagged this are genuinely 3D.

*Signature:* travels with *spatial, perspective, dimensional, 3d, layered*; triggers `viewProgress`, `viewEnter`, `interest`; median duration 700ms; mostly `translateY`, `rotateX`, `scale`; 84% genuinely 3D.

*e.g.* sticky repeater stack, Small carousel, acordion scroll

### `dimensional`  — 30 presets (19%)

**Means:** Occupies volume; you could walk around it.

**Look for:** Multiple faces or planes visible at once.

*Signature:* travels with *spatial, perspective, 3d, depth, layered*; triggers `viewProgress`, `viewEnter`, `pointerMove`; median duration 800ms; mostly `translateY`, `rotateX`, `rotateY`; 96% genuinely 3D; 46% dark palette.

*e.g.* 3D_Parallax_Gallery, DiagonalShuffle, HorizontalCarouselPerspective

### `immersive`  — 22 presets (14%)

**Means:** Fills your field of view; you are inside it.

**Look for:** Full-viewport, edge-to-edge, no visible page chrome.

*Signature:* travels with *endless, spatial, classic, attention-grabbing, impactful*; triggers `viewProgress`, `viewEnter`, `pointerMove`; median duration 850ms; mostly `translateY`, `scale`, `rotateX`; 43% genuinely 3D; 29% loop forever.

*e.g.* Vertical/ horizontal lanes, Vertical/ horizontal lanes, CasperGallery

### `layered`  — 31 presets (20%)

**Means:** Distinct stacked planes.

**Look for:** 3+ visually separated depth planes with different motion rates.

*Signature:* travels with *spatial, dimensional, depth, perspective, futuristic*; triggers `viewProgress`, `viewEnter`, `hover`; median duration 900ms; mostly `translateY`, `translateX`, `scale`; 41% genuinely 3D.

*e.g.* 3D_Parallax_Gallery, CardSpreadByHover, CardSpread_7

### `perspective`  — 26 presets (17%)

**Means:** Vanishing-point convergence is visible.

**Look for:** A `perspective()` value; parallel edges converge; near elements move faster.

*Signature:* travels with *3d, spatial, dimensional, depth, calm*; triggers `viewProgress`, `viewEnter`, `pointerMove`; median duration 640ms; mostly `rotateX`, `translateY`, `rotateY`; 100% genuinely 3D; 46% dark palette.

*e.g.* 3D_Parallax_Gallery, HorizontalCarouselPerspective, Interactive_ Rotating_Gallery_Grid

### `spatial`  — 10 presets (6%)

**Means:** The layout itself is a space you move through.

**Look for:** Movement implies travel - into a room, along a corridor, through layers.

*Signature:* travels with *perspective, dimensional, 3d, depth, layered*; triggers `viewProgress`, `viewEnter`, `interest`; median duration 630ms; mostly `translateY`, `rotateX`, `translateX`; 90% genuinely 3D.

*e.g.* acordion scroll, HorizontalCarouselPerspective, Interactive_ Rotating_Gallery_Grid


## Direction & reveal

### `circular`  — 16 presets (10%)

**Means:** Motion follows an arc or a full rotation.

**Look for:** `rotate()` as the main transform, or elements arranged on a radius.

*Signature:* travels with *spiraling, poppy, playful, organized, endless*; triggers `viewProgress`, `viewEnter`, `click`; median duration 750ms; mostly `rotate`, `translateY`, `scale`.

*e.g.* corner fold scroll animation, Digital Jukebox, CardSpread_7

### `confident`  — 20 presets (13%)

**Means:** Decisive. No hesitation, no wobble.

**Look for:** Single committed movement, snappy deceleration, no bounce-back. Figma's 'steep, snappy deceleration'.

*Signature:* travels with *impactful, cascading, bold, graphic, vertical*; triggers `viewProgress`, `viewEnter`, `interest`; median duration 900ms; mostly `translateY`, `scale`, `translateX`; 40% genuinely 3D.

*e.g.* horiznotal & vertical scroll, Digital Jukebox, invert-header

### `expressive`  — 13 presets (8%)

**Means:** The motion carries meaning beyond function.

**Look for:** The movement says something about the content - it is not a generic fade-in.

*Signature:* travels with *fun, surprising, poppy, artistic, bold*; triggers `viewProgress`, `viewEnter`, `pointerMove`; median duration 1000ms; mostly `translateY`, `scale`, `translateX`; 25% loop forever.

*e.g.* Shape scroll, Digital Jukebox, Endless Parallax

### `revealing`  — 78 presets (50%)

**Means:** Content is uncovered rather than moved.

**Look for:** Masks, clip-path, wipes, curtains. The element does not travel - the window onto it changes.

*Signature:* travels with *transformative, shape, organic, minimal, understated*; triggers `viewProgress`, `viewEnter`, `hover`; median duration 800ms; mostly `translateY`, `scale`, `translateX`.

*e.g.* Digital Jukebox, BlurFocus_Gallery, CardSpreadByHover

### `spiraling`  — 5 presets (3%)

**Means:** Rotation combined with scale or depth - a helix.

**Look for:** rotate + scale together, or rotate + translateZ.

*Signature:* travels with *circular, dynamic, bold*; triggers `viewProgress`, `viewEnter`, `click`; median duration 200ms; mostly `rotate`, `translateY`, `translateX`.

*e.g.* Digital Jukebox, CardSpread_7, FerrisWheel

### `vertical`  — 21 presets (13%)

**Means:** The dominant axis is up/down.

**Look for:** translateY dominates; column layouts; top-to-bottom reveals.

*Signature:* travels with *understated, fun, surprising, confident, effortless*; triggers `viewProgress`, `viewEnter`, `pointerMove`; median duration 600ms; mostly `translateY`, `rotateX`, `rotate`.

*e.g.* Digital Jukebox, DolphinAnimation, Vertical3Dcards


## Form & change

### `gradual`  — 60 presets (38%)

**Means:** The change is spread across a long span; no single moment carries it.

**Look for:** Scroll-linked with `linear` easing over a tall section (300vh+). Scrubbing back and forth feels identical.

*Signature:* travels with *calm, shape, sophisticated, flowing, continuous*; triggers `viewProgress`, `viewEnter`, `interest`; median duration 820ms; mostly `translateY`, `scale`, `translateX`.

*e.g.* title folds scroll animation, corner fold scroll animation, acordion scroll

### `minimal`  — 72 presets (46%)

**Means:** Reduced to the fewest possible moving parts.

**Look for:** One or two properties animating; sparse composition; often just opacity + a small transform.

*Signature:* travels with *understated, shape, refined, clean, sophisticated*; triggers `viewProgress`, `viewEnter`, `hover`; median duration 580ms; mostly `scale`, `translateY`, `rotate`.

*e.g.* CursorTrail, Mouse track infinite gallery, Paragraph_Reaveal

### `organic`  — 17 presets (11%)

**Means:** Natural, non-mechanical curvature.

**Look for:** Blob shapes, uneven timing, nothing perfectly aligned to a grid.

*Signature:* travels with *shape, creative, gentle, calm, endless*; triggers `viewEnter`, `viewProgress`, `pointerMove`; median duration 1000ms; mostly `scale`, `translateY`, `translate`; 35% loop forever.

*e.g.* title folds scroll animation, horziontally scrolling image gallery, CasperGallery

### `shape`  — 17 presets (11%)

**Means:** Geometry itself is the subject.

**Look for:** border-radius/clip-path morphing; the silhouette changes.

*Signature:* travels with *organic, calm, transformative, artistic, gradual*; triggers `viewProgress`, `viewEnter`, `hover`; median duration 900ms; mostly `scale`, `translateY`, `translateX`.

*e.g.* horziontally scrolling image gallery, BG_Image_ShapeMask_Gallery, BG_image_ShapeMask

### `transformative`  — 48 presets (31%)

**Means:** The thing becomes something else.

**Look for:** Start and end states are different in kind, not just position - shape morphs, folds, squeezes.

*Signature:* travels with *shape, revealing, organic, confident, gradual*; triggers `viewProgress`, `viewEnter`, `interest`; median duration 820ms; mostly `scale`, `translateY`, `translate`.

*e.g.* title folds scroll animation, BlurFocus_Gallery, Cornergallery01


## Order & choreography

### `cascading`  — 17 presets (11%)

**Means:** A staggered reveal that reads as a wave.

**Look for:** Stagger plus a directional order - left-to-right, top-to-bottom.

*Signature:* travels with *staggered, confident, energetic, techy, futuristic*; triggers `viewEnter`, `viewProgress`, `interest`; median duration 810ms; mostly `translateY`, `scale`, `translateX`.

*e.g.* CursorTrail, DiagonalShuffle, horizontal-stripe-cascade-reveal

### `organized`  — 17 presets (11%)

**Means:** Everything lands on a grid or rhythm.

**Look for:** Consistent spacing and equal timing steps; alignment is obvious.

*Signature:* travels with *structured, alive, polished, interactive, subtle*; triggers `hover`, `viewEnter`, `click`; median duration 300ms; mostly `translateY`, `scale`, `translateX`; 47% dark palette.

*e.g.* Looped tabs with perspective, 3D_Parallax_Gallery, BlurFocus_Gallery

### `staggered`  — 49 presets (31%)

**Means:** Siblings start one after another, not together.

**Look for:** A per-item delay of roughly 40-100ms. animations.dev: prevents the 'lacks elegance' parallel entrance.

*Signature:* travels with *cascading, organized, structured, techy, understated*; triggers `viewEnter`, `viewProgress`, `hover`; median duration 800ms; mostly `translateY`, `scale`, `translateX`.

*e.g.* BlurFocus_Gallery, CasperGallery, DiagonalShuffle

### `structured`  — 33 presets (21%)

**Means:** A visible underlying system.

**Look for:** Repeating modules, clear hierarchy, motion that respects the layout.

*Signature:* travels with *organized, polished, cascading, staggered, confident*; triggers `viewEnter`, `viewProgress`, `hover`; median duration 560ms; mostly `translateY`, `scale`, `translateX`.

*e.g.* Looped tabs with perspective, 3D_Parallax_Gallery, BlurFocus_Gallery


## Loose / idiosyncratic

### `flowless`  — 1 presets (1%)

**Means:** Ambiguous legacy term - probably meant 'flawless' or 'flowing'.

**Look for:** Do not apply to new rows; pick 'seamless' or 'flowing' instead.

*Signature:* triggers `activate`, `pointerMove`, `viewEnter`; median duration 730ms; mostly `scale`, `translateX`, `translateY`; 100% loop forever.

*e.g.* Endless Parallax

### `fluid`  — 3 presets (2%)

**Means:** Liquid-like, continuously deforming.

**Look for:** Curved paths, easing without hard stops, shapes that bend rather than snap.

*Signature:* triggers `viewEnter`, `viewProgress`, `hover`; median duration 550ms; mostly `scale`, `translateY`, `translateX`; 33% loop forever; 67% dark palette.

*e.g.* expand horzinotal scroll, title folds scroll animation, Mouse track infinite gallery

### `groovy`  — 2 presets (1%)

**Means:** Rhythmic, slightly retro, on a beat.

**Look for:** Repeating cycles with a swing feel; wavy rather than linear paths.

*Signature:* triggers `pointerMove`, `hover`; median duration 550ms; mostly `rotate`, `translateY`, `scale`; 50% dark palette.

*e.g.* horziontally scrolling image gallery, DolphinAnimation

### `inspirational`  — 1 presets (1%)

**Means:** Aspirational tone; makes you want the thing.

**Look for:** Wide landscape imagery, generous scale, uplifting upward movement.

*Signature:* triggers `hover`, `viewEnter`; median duration 350ms; mostly `rotateY`, `scale`, `translate`; 100% genuinely 3D; 100% dark palette.

*e.g.* Small carousel

### `layering`  — 1 presets (1%)

**Means:** Legacy phrasing - prefer 'layered'.

**Look for:** Same cue as 'layered'.

*Signature:* triggers `viewProgress`; mostly `rotateX`, `translateY`, `translateZ`; 100% genuinely 3D.

*e.g.* Digital Jukebox


## Legacy wording

### `eye catching`  — 1 presets (1%)

**Means:** Legacy unhyphenated spelling - prefer 'eye-catching'.

**Look for:** Same meaning. Kept only because one existing row uses it.

*Signature:* triggers `viewProgress`; mostly `scale`, `scaleX`, `translateY`; 100% dark palette.

*e.g.* title folds scroll animation

### `horizontal movement`  — 1 presets (1%)

**Means:** Legacy phrasing for sideways travel - prefer 'horizontal'.

**Look for:** Same cue as 'horizontal'. Kept only because existing rows use it.

*Signature:* triggers `viewEnter`, `viewProgress`; median duration 400ms; mostly `scale`, `translateX`, `translateY`.

*e.g.* expand horzinotal scroll

