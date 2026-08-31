# Atmosphere tag dictionary

What each tag means, what to look for in the animation, and what it actually correlates with across the 157 presets in this repo.

`signature` is measured, not asserted - it comes from the presets that carry the tag today, so it shifts as tagging changes.


## Restraint & polish

### `calm`  — 23 presets (15%)

**Means:** Nothing competes for attention; the pace lowers your pulse.

**Look for:** Single slow motion, no loops demanding attention, muted palette.

*Signature:* travels with *soft, classic, gentle, subtle, understated*; triggers `viewProgress`, `hover`, `pointerMove`; median duration 820ms; mostly `scale`, `translateY`, `rotateX`.

*e.g.* HorizontalCarouselPerspective, SnakeAnimation, SpecimenCardGallery

### `classic`  — 23 presets (15%)

**Means:** Familiar, timeless vocabulary. No trend markers.

**Look for:** Fade, slide, simple scale. No 3D, no glitch, no neon. Would have looked fine ten years ago.

*Signature:* travels with *soft, calm, graceful, subtle, understated*; triggers `viewProgress`, `viewEnter`, `hover`; median duration 885ms; mostly `translateY`, `scale`, `translateX`.

*e.g.* Card Spread, horiznotal & vertical scroll, classic horziontal scroll

### `clean`  — 77 presets (49%)

**Means:** Visually uncluttered - the motion reads instantly.

**Look for:** Few colours (2-3), generous whitespace, one clear thing moving at a time.

*Signature:* travels with *understated, soft, subtle, minimal, graceful*; triggers `viewProgress`, `viewEnter`, `hover`; median duration 600ms; mostly `translateY`, `scale`, `rotate`.

*e.g.* Card Spread, classic horziontal scroll, Vertical/ horizontal lanes

### `cloudy`  — 6 presets (4%)

**Means:** Diffuse, hazy, soft-focus quality.

**Look for:** Blur filters, low-contrast washes, overlapping translucency.

*Signature:* travels with *understated, soft, calm, classic, gentle*; triggers `viewProgress`, `viewEnter`, `hover`; median duration 300ms; mostly `translateX`, `translateY`, `translate`.

*e.g.* Card Spread, auto-shape-cycle, Blurry_Transition

### `elegant`  — 83 presets (53%)

**Means:** Restrained motion that still feels considered and expensive.

**Look for:** Asymmetric easing with a long deceleration, serif or high-contrast type, unhurried duration (600ms+).

*Signature:* travels with *soft, subtle, understated, calm, gentle*; triggers `viewProgress`, `viewEnter`, `hover`; median duration 600ms; mostly `translateY`, `scale`, `translateX`.

*e.g.* Card Spread, classic horziontal scroll, corner fold scroll animation

### `gentle`  — 31 presets (20%)

**Means:** Low amplitude. The motion is small relative to the element.

**Look for:** Travel under ~40px or scale change under ~10%. Nothing crosses the viewport.

*Signature:* travels with *soft, calm, graceful, classic, subtle*; triggers `viewProgress`, `viewEnter`, `hover`; median duration 820ms; mostly `scale`, `translateY`, `translateX`.

*e.g.* Card Spread, Vertical/ horizontal lanes, Vertical/ horizontal lanes

### `graceful`  — 17 presets (11%)

**Means:** Unhurried, curved, weight-bearing motion - it looks like it has mass.

**Look for:** Arcs rather than straight lines, no sudden direction changes, slow settle. NN/g's 'long gradual deceleration'.

*Signature:* travels with *classic, high-end, understated, soft, modern*; triggers `viewProgress`, `viewEnter`, `hover`; median duration 900ms; mostly `translateY`, `translateX`, `scale`; 29% loop forever.

*e.g.* Card Spread, classic horziontal scroll, Vertical/ horizontal lanes

### `high-end`  — 36 presets (23%)

**Means:** Reads as premium/luxury.

**Look for:** Slow, generous timing, dark or monochrome palette, serif display type, lots of negative space.

*Signature:* travels with *graceful, sophisticated, modern, calm, soft*; triggers `viewProgress`, `viewEnter`, `hover`; median duration 860ms; mostly `translateY`, `scale`, `translateX`.

*e.g.* Card Spread, expand horzinotal scroll, Vertical/ horizontal lanes

### `modern`  — 34 presets (22%)

**Means:** Current design-language markers.

**Look for:** Large geometric sans, flat or subtle-gradient surfaces, generous radii, scroll-linked motion.

*Signature:* travels with *graceful, high-end, organic, fun, shape*; triggers `viewProgress`, `viewEnter`, `hover`; median duration 650ms; mostly `translateY`, `scale`, `translateX`.

*e.g.* Card Spread, corner fold scroll animation, acordion scroll

### `refined`  — 73 presets (46%)

**Means:** Nothing extraneous. Every moving part is doing work.

**Look for:** Few simultaneous properties, consistent timing between siblings, no decorative wobble.

*Signature:* travels with *understated, soft, subtle, calm, gentle*; triggers `viewProgress`, `viewEnter`, `hover`; median duration 700ms; mostly `translateY`, `scale`, `translateX`.

*e.g.* Card Spread, Vertical/ horizontal lanes, Vertical/ horizontal lanes

### `smooth`  — 95 presets (61%)

**Means:** No visible jerk, stutter or hard stop anywhere in the motion.

**Look for:** One continuous curve per property. Ease-out or a gentle cubic-bezier, nothing linear-and-abrupt. If it stutters on scroll it is not smooth.

*Signature:* travels with *gentle, soft, silky, polished, subtle*; triggers `viewProgress`, `viewEnter`, `hover`; median duration 600ms; mostly `translateY`, `scale`, `translateX`.

*e.g.* Card Spread, title folds scroll animation, classic horziontal scroll

### `soft`  — 23 presets (15%)

**Means:** No hard edges in either the easing or the visuals.

**Look for:** Long tails on the easing, blur, feathered masks, rounded corners, low-contrast palette.

*Signature:* travels with *cloudy, gentle, subtle, calm, classic*; triggers `viewProgress`, `viewEnter`, `hover`; median duration 700ms; mostly `scale`, `translateX`, `translateY`; 26% loop forever.

*e.g.* Card Spread, Vertical/ horizontal lanes, Vertical/ horizontal lanes

### `sophisticated`  — 37 presets (24%)

**Means:** Complex underneath, simple on the surface.

**Look for:** Several coordinated properties that resolve into one apparent movement. Orchestration, not a single tween.

*Signature:* travels with *high-end, shape, calm, gradual, refined*; triggers `viewProgress`, `viewEnter`, `interest`; median duration 600ms; mostly `scale`, `translateY`, `translateX`.

*e.g.* expand horzinotal scroll, acordion scroll, horziontally scrolling image gallery

### `subtle`  — 25 presets (16%)

**Means:** You notice the result, not the movement.

**Look for:** Would a non-designer even register it happened? If the effect announces itself, it is not subtle.

*Signature:* travels with *soft, understated, classic, calm, gentle*; triggers `viewProgress`, `hover`, `viewEnter`; median duration 300ms; mostly `translateY`, `scale`, `translateX`.

*e.g.* Card Spread, Vertical/ horizontal lanes, BlurFocus_Gallery

### `understated`  — 23 presets (15%)

**Means:** Deliberately less than it could have been.

**Look for:** The effect is clearly held back - short travel, low opacity change, no flourish at the end.

*Signature:* travels with *cloudy, subtle, soft, classic, graceful*; triggers `viewProgress`, `hover`, `viewEnter`; median duration 450ms; mostly `translateY`, `translateX`, `scale`.

*e.g.* Card Spread, Looped tabs with perspective, capezzani-wordmark-header


## Flow & continuity

### `effortless`  — 32 presets (20%)

**Means:** Looks like it costs the interface nothing.

**Look for:** No strain, no bounce, no overshoot. Consistent velocity into a soft stop.

*Signature:* travels with *silky, flowing, organized, clean, understated*; triggers `viewProgress`, `hover`, `viewEnter`; median duration 500ms; mostly `translateY`, `scale`, `translateX`.

*e.g.* title folds scroll animation, classic horziontal scroll, corner fold scroll animation

### `flowing`  — 36 presets (23%)

**Means:** Continuous directional movement, like a current.

**Look for:** Sustained travel in one direction, overlapping element timing so there is never a still frame.

*Signature:* travels with *effortless, continuous, horizontal, poppy, silky*; triggers `viewProgress`, `viewEnter`, `hover`; median duration 500ms; mostly `translateY`, `scale`, `translateX`.

*e.g.* expand horzinotal scroll, title folds scroll animation, classic horziontal scroll

### `horizontal scroll`

**Means:** Vertical scrolling is remapped to sideways travel.

**Look for:** A sticky viewport with a wide track moved by translateX.

### `polished`  — 53 presets (34%)

**Means:** Finished. Every state and edge is handled.

**Look for:** Hover, active and rest states all defined; nothing pops or reflows; timing consistent across siblings.

*Signature:* travels with *organized, structured, silky, alive, smooth*; triggers `viewProgress`, `viewEnter`, `hover`; median duration 600ms; mostly `translateY`, `scale`, `translateX`.

*e.g.* classic horziontal scroll, Small carousel, Wheel Carousel

### `seamless`  — 17 presets (11%)

**Means:** No visible seam, join or restart point.

**Look for:** Loops where you cannot spot the wrap; transitions where the outgoing and incoming states share geometry.

*Signature:* travels with *endless, graceful, understated, flowing, gentle*; triggers `viewEnter`, `viewProgress`, `hover`; median duration 580ms; mostly `scale`, `translateY`, `translateX`; 35% loop forever.

*e.g.* classic horziontal scroll, Small carousel, Endless Parallax

### `silky`  — 31 presets (20%)

**Means:** Frictionless, high-frame-rate glide.

**Look for:** Transform/opacity only (GPU-friendly), no layout thrash, no jitter under fast scroll.

*Signature:* travels with *graceful, effortless, circular, polished, elegant*; triggers `viewProgress`, `viewEnter`, `hover`; median duration 600ms; mostly `translateY`, `scale`, `rotate`.

*e.g.* sticky repeater stack, horiznotal & vertical scroll, title folds scroll animation

### `simple`

**Means:** A single readable idea, easy to describe in one sentence.

**Look for:** If explaining it needs an 'and then', it is not simple.


## Energy & statement

### `artistic`  — 21 presets (13%)

**Means:** Prioritises expression over utility.

**Look for:** Would sit comfortably in a gallery; composition matters more than conversion.

*Signature:* travels with *unconventional, creative, experimental, attention-grabbing, unique*; triggers `viewProgress`, `viewEnter`, `interest`; median duration 1000ms; mostly `translateY`, `translateX`, `scale`; 29% loop forever.

*e.g.* Accordion Scroll Vertical, 3D small carousel, Diagonal_Slideshow

### `attention-grabbing`  — 33 presets (21%)

**Means:** Designed to interrupt.

**Look for:** High contrast against its surroundings, motion where the eye is not already looking, or a loop.

*Signature:* travels with *impactful, futuristic, artistic, edgy, techy*; triggers `viewProgress`, `viewEnter`, `pointerMove`; median duration 1000ms; mostly `translateY`, `translateX`, `scale`.

*e.g.* expand horzinotal scroll, title folds scroll animation, Endless Parallax

### `bold`  — 60 presets (38%)

**Means:** Loud and unmissable. Commits fully to the effect.

**Look for:** Large travel or scale, heavy type, strong contrast, long confident duration (~900ms median here).

*Signature:* travels with *confident, attention-grabbing, impactful, futuristic, artistic*; triggers `viewProgress`, `viewEnter`, `hover`; median duration 900ms; mostly `translateY`, `translateX`, `scale`.

*e.g.* expand horzinotal scroll, horiznotal & vertical scroll, Shape scroll

### `continuous`  — 41 presets (26%)

**Means:** Never fully stops while on screen.

**Look for:** `iterations: Infinity`, or a scroll-driven effect with no rest state.

*Signature:* travels with *endless, artistic, experimental, flowing, immersive*; triggers `viewProgress`, `viewEnter`, `hover`; median duration 1000ms; mostly `translateY`, `scale`, `translateX`; 29% loop forever.

*e.g.* corner fold scroll animation, Vertical/ horizontal lanes, Vertical/ horizontal lanes

### `cool`  — 32 presets (20%)

**Means:** Detached, confident, understated-but-current.

**Look for:** Restrained palette with one sharp accent; motion that does not try to please.

*Signature:* travels with *unique, experimental, techy, futuristic, dynamic*; triggers `viewProgress`, `viewEnter`, `hover`; median duration 800ms; mostly `translateY`, `scale`, `translateX`.

*e.g.* expand horzinotal scroll, Digital Jukebox, 3D_Parallax_Gallery

### `creative`  — 20 presets (13%)

**Means:** An idea you have not seen applied this way.

**Look for:** The mechanism itself is the novelty, not just the styling.

*Signature:* travels with *experimental, unique, unconventional, artistic, surprising*; triggers `viewProgress`, `viewEnter`, `interest`; median duration 700ms; mostly `translateY`, `translateX`, `scale`.

*e.g.* horiznotal & vertical scroll, title folds scroll animation, Digital Jukebox

### `dynamic`  — 44 presets (28%)

**Means:** Visibly energetic; velocity is part of the message.

**Look for:** Fast phases, direction changes, several elements moving at once at different rates.

*Signature:* travels with *experimental, edgy, futuristic, artistic, attention-grabbing*; triggers `viewProgress`, `viewEnter`, `pointerMove`; median duration 650ms; mostly `translateY`, `translateX`, `scale`.

*e.g.* expand horzinotal scroll, horiznotal & vertical scroll, corner fold scroll animation

### `edgy`  — 42 presets (27%)

**Means:** Slightly uncomfortable on purpose.

**Look for:** Asymmetry, clipping, glitch, harsh timing, unexpected cuts.

*Signature:* travels with *experimental, futuristic, attention-grabbing, dynamic, techy*; triggers `viewProgress`, `viewEnter`, `pointerMove`; median duration 900ms; mostly `translateY`, `translateX`, `scale`.

*e.g.* expand horzinotal scroll, sticky repeater stack, horiznotal & vertical scroll

### `endless`  — 19 presets (12%)

**Means:** Reads as having no beginning or end.

**Look for:** Seamless infinite loop - marquee, lane, wheel. You cannot identify frame zero.

*Signature:* travels with *experimental, continuous, immersive, seamless, artistic*; triggers `viewEnter`, `hover`, `viewProgress`; median duration 1700ms; mostly `scale`, `translateY`, `translateX`; 68% loop forever.

*e.g.* Vertical/ horizontal lanes, Vertical/ horizontal lanes, 3D small carousel

### `experimental`  — 15 presets (10%)

**Means:** Feels like a prototype exploring an idea.

**Look for:** Unusual mechanics, no established convention, may not survive a usability test.

*Signature:* travels with *unconventional, creative, techy, surprising, artistic*; triggers `viewEnter`, `viewProgress`, `hover`; median duration 1000ms; mostly `translateY`, `translateX`, `scale`; 29% loop forever.

*e.g.* Accordion Scroll Vertical, 3D small carousel, CasperGallery

### `eye-catching`

**Means:** Pulls the eye on first glance.

**Look for:** Same intent as attention-grabbing but usually via colour/shape rather than speed.

### `futuristic`  — 30 presets (19%)

**Means:** Speculative, not-yet-mainstream.

**Look for:** 3D perspective, glass/neon, chromatic effects, unusual axis of movement.

*Signature:* travels with *techy, experimental, attention-grabbing, edgy, unique*; triggers `viewEnter`, `viewProgress`, `hover`; median duration 800ms; mostly `translateY`, `translateX`, `scale`.

*e.g.* sticky repeater stack, horiznotal & vertical scroll, Small carousel

### `graphic`  — 58 presets (37%)

**Means:** Poster-like. Reads as flat shape and type.

**Look for:** Oversized type, hard-edged shapes, strong figure/ground, often masks rather than 3D.

*Signature:* travels with *attention-grabbing, futuristic, experimental, confident, techy*; triggers `viewProgress`, `viewEnter`, `pointerMove`; median duration 900ms; mostly `translateY`, `scale`, `translateX`.

*e.g.* expand horzinotal scroll, Shape scroll, Endless Parallax

### `impactful`  — 39 presets (25%)

**Means:** Lands with force - there is a moment of arrival.

**Look for:** A sharp deceleration into the final state, often with scale. You feel it stop.

*Signature:* travels with *attention-grabbing, confident, bold, edgy, immersive*; triggers `viewProgress`, `viewEnter`, `hover`; median duration 900ms; mostly `translateY`, `scale`, `translateX`.

*e.g.* expand horzinotal scroll, Digital Jukebox, 3D small carousel

### `techy`  — 28 presets (18%)

**Means:** Machine-like, engineered.

**Look for:** Monospace type, grid overlays, stepped/`steps()` timing, scan-lines, dark UI.

*Signature:* travels with *futuristic, experimental, attention-grabbing, edgy, cool*; triggers `viewEnter`, `viewProgress`, `hover`; median duration 600ms; mostly `translateX`, `translateY`, `scale`.

*e.g.* Small carousel, 3D small carousel, CardSpread_7

### `unconventional`  — 9 presets (6%)

**Means:** Breaks an expected pattern deliberately.

**Look for:** Scroll that moves sideways, nav that is not at the top, reversed reading order.

*Signature:* travels with *experimental, artistic, creative, surprising, expressive*; triggers `viewEnter`, `viewProgress`, `activate`; median duration 1700ms; mostly `translateX`, `translateY`, `scale`; 44% loop forever.

*e.g.* Endless Parallax, Accordion Scroll Vertical, 3D small carousel


## Play & response

### `3d effect`

**Means:** Reads three-dimensional without necessarily being real 3D.

**Look for:** Faked shadows/skew that imply volume. Prefer '3d' when perspective is genuinely used.

### `alive`  — 42 presets (27%)

**Means:** Idles rather than waiting - moves without being asked.

**Look for:** A slow continuous float/drift, or pointer-tracking. animations.dev's 'float'.

*Signature:* travels with *charming, organized, interactive, poppy, fun*; triggers `hover`, `pointerMove`, `viewEnter`; median duration 400ms; mostly `translateY`, `scale`, `rotate`.

*e.g.* acordion scroll, 3D_Parallax_Gallery, BlurFocus_Gallery

### `charming`  — 11 presets (7%)

**Means:** Small, personable, a little humane.

**Look for:** Tiny idiosyncratic details; imperfection used deliberately.

*Signature:* travels with *groovy, fun, playful, alive, energetic*; triggers `hover`, `click`, `viewEnter`; median duration 400ms; mostly `scale`, `rotate`, `translateY`; 45% dark palette.

*e.g.* sticky repeater stack, CasperGallery, CursorTrail

### `energetic`  — 19 presets (12%)

**Means:** High tempo, springy.

**Look for:** Short durations (<400ms), overshoot in the easing curve, quick successive triggers.

*Signature:* travels with *poppy, fun, charming, playful, expressive*; triggers `viewProgress`, `viewEnter`, `hover`; median duration 850ms; mostly `translateY`, `scale`, `rotate`.

*e.g.* corner fold scroll animation, Shape scroll, 3D_Parallax_Gallery

### `fun`  — 21 presets (13%)

**Means:** Produces a small smile.

**Look for:** Unexpected but harmless behaviour - wobble, squash, a face, a pop.

*Signature:* travels with *groovy, charming, innovative, poppy, playful*; triggers `pointerMove`, `viewEnter`, `hover`; median duration 500ms; mostly `scale`, `translateY`, `rotate`.

*e.g.* sticky repeater stack, Shape scroll, acordion scroll

### `horizontal`  — 39 presets (25%)

**Means:** The dominant axis is left/right.

**Look for:** translateX dominates; row layouts; sideways travel.

*Signature:* travels with *flowing, polished, techy, effortless, interactive*; triggers `viewProgress`, `viewEnter`, `hover`; median duration 500ms; mostly `translateX`, `translateY`, `scale`.

*e.g.* expand horzinotal scroll, horiznotal & vertical scroll, classic horziontal scroll

### `innovative`  — 5 presets (3%)

**Means:** New technique, not just new styling.

**Look for:** Uses a capability most sites do not - scroll-linked 3D, pointer-driven fields, masked type.

*Signature:* travels with *groovy, fun, expressive, playful, futuristic*; triggers `pointerMove`, `hover`, `viewEnter`; median duration 500ms; mostly `translateY`, `scale`, `translateX`; 60% dark palette.

*e.g.* Small carousel, Endless Parallax, horziontally scrolling image gallery

### `interactive`  — 55 presets (35%)

**Means:** Responds to you, not to the scroll position.

**Look for:** Requires a hover / click / pointermove / interest trigger. THIS IS A HARD RULE: scroll-only work is never 'interactive'.

*Signature:* travels with *alive, fun, organized, playful, poppy*; triggers `hover`, `viewEnter`, `pointerMove`; median duration 435ms; mostly `scale`, `translateY`, `translateX`.

*e.g.* Shape scroll, acordion scroll, Endless Parallax

### `playful`  — 38 presets (24%)

**Means:** Invites you to mess with it.

**Look for:** Overshoot/bounce in the curve, exaggeration, response to hover or pointer.

*Signature:* travels with *fun, charming, poppy, energetic, circular*; triggers `hover`, `pointerMove`, `viewProgress`; median duration 400ms; mostly `translateY`, `scale`, `translateX`.

*e.g.* expand horzinotal scroll, sticky repeater stack, horiznotal & vertical scroll

### `poppy`  — 19 presets (12%)

**Means:** Quick, punchy, spring-loaded.

**Look for:** Very short duration with visible overshoot - a spring with low damping (bounce).

*Signature:* travels with *fun, energetic, surprising, playful, expressive*; triggers `viewProgress`, `pointerMove`, `viewEnter`; median duration 600ms; mostly `translateY`, `scale`, `rotate`.

*e.g.* corner fold scroll animation, Shape scroll, acordion scroll

### `surprising`  — 26 presets (17%)

**Means:** Does something you did not predict.

**Look for:** The second half of the motion contradicts what the first half implied.

*Signature:* travels with *unconventional, experimental, unique, expressive, poppy*; triggers `viewEnter`, `viewProgress`, `pointerMove`; median duration 600ms; mostly `translateY`, `scale`, `translateX`.

*e.g.* Shape scroll, Accordion Scroll Vertical, CasperGallery

### `unique`  — 16 presets (10%)

**Means:** You would recognise it again.

**Look for:** One distinctive gesture that no other preset here repeats.

*Signature:* travels with *creative, surprising, experimental, artistic, cool*; triggers `viewProgress`, `hover`, `viewEnter`; median duration 400ms; mostly `translateY`, `scale`, `translateX`.

*e.g.* sticky repeater stack, horiznotal & vertical scroll, Mirror_Hover_Galery

### `z axis`

**Means:** Legacy phrasing for depth movement - prefer 'depth' or '3d'.

**Look for:** translateZ / toward-or-away-from-viewer motion.

### `zoom`  — 35 presets (22%)

**Means:** Scale is the primary motion.

**Look for:** `scale()` doing most of the work - push in or pull out.

*Signature:* travels with *shape, organic, impactful, high-end, cool*; triggers `viewProgress`, `viewEnter`, `hover`; median duration 860ms; mostly `scale`, `translateY`, `translateX`.

*e.g.* sticky repeater stack, horziontally scrolling image gallery, Cornergallery01


## Depth & space

### `3d`  — 29 presets (18%)

**Means:** Actual three-dimensional transforms, not a fake.

**Look for:** `perspective` plus `rotateX/rotateY` or `translateZ` in the CSS.

*Signature:* travels with *perspective, spatial, dimensional, depth, immersive*; triggers `viewProgress`, `viewEnter`, `pointerMove`; median duration 800ms; mostly `translateY`, `rotateX`, `rotateY`; 96% genuinely 3D.

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

### `immersive`  — 33 presets (21%)

**Means:** Fills your field of view; you are inside it.

**Look for:** Full-viewport, edge-to-edge, no visible page chrome.

*Signature:* travels with *endless, 3d, perspective, dimensional, artistic*; triggers `viewProgress`, `viewEnter`, `pointerMove`; median duration 850ms; mostly `scale`, `translateY`, `rotateX`; 56% genuinely 3D; 25% loop forever.

*e.g.* expand horzinotal scroll, Vertical/ horizontal lanes, Vertical/ horizontal lanes

### `layered`  — 40 presets (25%)

**Means:** Distinct stacked planes.

**Look for:** 3+ visually separated depth planes with different motion rates.

*Signature:* travels with *dimensional, 3d, depth, perspective, immersive*; triggers `viewProgress`, `viewEnter`, `hover`; median duration 900ms; mostly `translateY`, `translateX`, `scale`; 58% genuinely 3D.

*e.g.* Digital Jukebox, 3D_Parallax_Gallery, CardSpreadByHover

### `perspective`  — 24 presets (15%)

**Means:** Vanishing-point convergence is visible.

**Look for:** A `perspective()` value; parallel edges converge; near elements move faster.

*Signature:* travels with *spatial, 3d, dimensional, depth, immersive*; triggers `viewProgress`, `viewEnter`, `pointerMove`; median duration 640ms; mostly `rotateX`, `translateY`, `rotateY`; 100% genuinely 3D; 46% dark palette.

*e.g.* 3D_Parallax_Gallery, HorizontalCarouselPerspective, Interactive_ Rotating_Gallery_Grid

### `spatial`  — 10 presets (6%)

**Means:** The layout itself is a space you move through.

**Look for:** Movement implies travel - into a room, along a corridor, through layers.

*Signature:* travels with *perspective, dimensional, 3d, depth, immersive*; triggers `viewProgress`, `pointerMove`, `viewEnter`; median duration 630ms; mostly `translateY`, `rotateX`, `rotateY`; 90% genuinely 3D.

*e.g.* acordion scroll, HorizontalCarouselPerspective, Interactive_ Rotating_Gallery_Grid


## Direction & reveal

### `circular`  — 16 presets (10%)

**Means:** Motion follows an arc or a full rotation.

**Look for:** `rotate()` as the main transform, or elements arranged on a radius.

*Signature:* travels with *spiraling, playful, poppy, energetic, silky*; triggers `viewProgress`, `viewEnter`, `click`; median duration 820ms; mostly `rotate`, `translateY`, `scale`.

*e.g.* corner fold scroll animation, Digital Jukebox, CardSpread_7

### `confident`  — 23 presets (15%)

**Means:** Decisive. No hesitation, no wobble.

**Look for:** Single committed movement, snappy deceleration, no bounce-back. Figma's 'steep, snappy deceleration'.

*Signature:* travels with *vertical, impactful, cascading, bold, graphic*; triggers `viewProgress`, `viewEnter`, `interest`; median duration 1000ms; mostly `translateY`, `rotateX`, `translateX`; 43% genuinely 3D.

*e.g.* horiznotal & vertical scroll, Digital Jukebox, Vertical3Dcards

### `expressive`  — 26 presets (17%)

**Means:** The motion carries meaning beyond function.

**Look for:** The movement says something about the content - it is not a generic fade-in.

*Signature:* travels with *unconventional, experimental, surprising, fun, creative*; triggers `viewProgress`, `viewEnter`, `pointerMove`; median duration 1000ms; mostly `translateY`, `scale`, `translateX`; 28% loop forever.

*e.g.* Shape scroll, Digital Jukebox, Endless Parallax

### `revealing`  — 78 presets (50%)

**Means:** Content is uncovered rather than moved.

**Look for:** Masks, clip-path, wipes, curtains. The element does not travel - the window onto it changes.

*Signature:* travels with *transformative, shape, organic, impactful, staggered*; triggers `viewProgress`, `viewEnter`, `hover`; median duration 800ms; mostly `translateY`, `scale`, `translateX`.

*e.g.* Digital Jukebox, BlurFocus_Gallery, CardSpreadByHover

### `spiraling`  — 6 presets (4%)

**Means:** Rotation combined with scale or depth - a helix.

**Look for:** rotate + scale together, or rotate + translateZ.

*Signature:* travels with *circular, vertical, surprising, playful, impactful*; triggers `viewProgress`, `viewEnter`, `click`; median duration 200ms; mostly `translateY`, `rotate`, `translateX`.

*e.g.* Digital Jukebox, CardSpread_7, FerrisWheel

### `vertical`  — 22 presets (14%)

**Means:** The dominant axis is up/down.

**Look for:** translateY dominates; column layouts; top-to-bottom reveals.

*Signature:* travels with *confident, fun, playful, surprising, expressive*; triggers `viewProgress`, `viewEnter`, `pointerMove`; median duration 600ms; mostly `translateY`, `translateX`, `rotateX`.

*e.g.* horiznotal & vertical scroll, Digital Jukebox, DolphinAnimation


## Form & change

### `gradual`  — 61 presets (39%)

**Means:** The change is spread across a long span; no single moment carries it.

**Look for:** Scroll-linked with `linear` easing over a tall section (300vh+). Scrubbing back and forth feels identical.

*Signature:* travels with *shape, sophisticated, high-end, calm, continuous*; triggers `viewProgress`, `viewEnter`, `interest`; median duration 820ms; mostly `translateY`, `scale`, `translateX`.

*e.g.* Card Spread, title folds scroll animation, classic horziontal scroll

### `minimal`  — 60 presets (38%)

**Means:** Reduced to the fewest possible moving parts.

**Look for:** One or two properties animating; sparse composition; often just opacity + a small transform.

*Signature:* travels with *subtle, calm, understated, soft, clean*; triggers `viewProgress`, `hover`, `viewEnter`; median duration 500ms; mostly `translateY`, `scale`, `rotate`.

*e.g.* classic horziontal scroll, Vertical/ horizontal lanes, Mouse track infinite gallery

### `organic`  — 23 presets (15%)

**Means:** Natural, non-mechanical curvature.

**Look for:** Blob shapes, uneven timing, nothing perfectly aligned to a grid.

*Signature:* travels with *shape, modern, transformative, calm, gentle*; triggers `viewProgress`, `viewEnter`, `hover`; median duration 860ms; mostly `scale`, `translateY`, `translate`.

*e.g.* title folds scroll animation, horziontally scrolling image gallery, DolphinAnimation

### `shape`  — 22 presets (14%)

**Means:** Geometry itself is the subject.

**Look for:** border-radius/clip-path morphing; the silhouette changes.

*Signature:* travels with *organic, sophisticated, transformative, soft, zoom*; triggers `viewProgress`, `viewEnter`, `hover`; median duration 900ms; mostly `scale`, `translateY`, `translateX`.

*e.g.* Card Spread, horziontally scrolling image gallery, BG_Image_ShapeMask_Gallery

### `transformative`  — 50 presets (32%)

**Means:** The thing becomes something else.

**Look for:** Start and end states are different in kind, not just position - shape morphs, folds, squeezes.

*Signature:* travels with *shape, organic, continuous, revealing, gradual*; triggers `viewProgress`, `viewEnter`, `interest`; median duration 860ms; mostly `scale`, `translateY`, `translate`.

*e.g.* title folds scroll animation, Cornergallery01, DolphinAnimation


## Order & choreography

### `cascading`  — 17 presets (11%)

**Means:** A staggered reveal that reads as a wave.

**Look for:** Stagger plus a directional order - left-to-right, top-to-bottom.

*Signature:* travels with *staggered, confident, techy, futuristic, structured*; triggers `viewEnter`, `viewProgress`, `interest`; median duration 810ms; mostly `translateY`, `scale`, `translateX`.

*e.g.* CursorTrail, DiagonalShuffle, horizontal-stripe-cascade-reveal

### `organized`  — 17 presets (11%)

**Means:** Everything lands on a grid or rhythm.

**Look for:** Consistent spacing and equal timing steps; alignment is obvious.

*Signature:* travels with *structured, alive, polished, interactive, staggered*; triggers `hover`, `viewEnter`, `click`; median duration 300ms; mostly `translateY`, `scale`, `translateX`; 47% dark palette.

*e.g.* Looped tabs with perspective, 3D_Parallax_Gallery, BlurFocus_Gallery

### `staggered`  — 48 presets (31%)

**Means:** Siblings start one after another, not together.

**Look for:** A per-item delay of roughly 40-100ms. animations.dev: prevents the 'lacks elegance' parallel entrance.

*Signature:* travels with *cascading, organized, structured, techy, futuristic*; triggers `viewEnter`, `viewProgress`, `hover`; median duration 800ms; mostly `translateY`, `scale`, `translateX`.

*e.g.* BlurFocus_Gallery, CasperGallery, DiagonalShuffle

### `structured`  — 33 presets (21%)

**Means:** A visible underlying system.

**Look for:** Repeating modules, clear hierarchy, motion that respects the layout.

*Signature:* travels with *organized, polished, cascading, staggered, techy*; triggers `viewEnter`, `viewProgress`, `hover`; median duration 560ms; mostly `translateY`, `scale`, `translateX`.

*e.g.* Looped tabs with perspective, 3D_Parallax_Gallery, BlurFocus_Gallery


## Loose / idiosyncratic

### `flowless`

**Means:** Ambiguous legacy term - probably meant 'flawless' or 'flowing'.

**Look for:** Do not apply to new rows; pick 'seamless' or 'flowing' instead.

### `fluid`

**Means:** Liquid-like, continuously deforming.

**Look for:** Curved paths, easing without hard stops, shapes that bend rather than snap.

### `groovy`  — 5 presets (3%)

**Means:** Rhythmic, slightly retro, on a beat.

**Look for:** Repeating cycles with a swing feel; wavy rather than linear paths.

*Signature:* travels with *innovative, charming, fun, playful, modern*; triggers `pointerMove`, `hover`, `click`; median duration 500ms; mostly `rotate`, `scale`, `translateY`.

*e.g.* horziontally scrolling image gallery, CursorTrail, DolphinAnimation

### `inspirational`  — 1 presets (1%)

**Means:** Aspirational tone; makes you want the thing.

**Look for:** Wide landscape imagery, generous scale, uplifting upward movement.

*Signature:* triggers `hover`, `viewEnter`; median duration 350ms; mostly `rotateY`, `scale`, `translate`; 100% genuinely 3D; 100% dark palette.

*e.g.* Small carousel

### `layering`

**Means:** Legacy phrasing - prefer 'layered'.

**Look for:** Same cue as 'layered'.


## Legacy wording

### `eye catching`

**Means:** Legacy unhyphenated spelling - prefer 'eye-catching'.

**Look for:** Same meaning. Kept only because one existing row uses it.

### `horizontal movement`

**Means:** Legacy phrasing for sideways travel - prefer 'horizontal'.

**Look for:** Same cue as 'horizontal'. Kept only because existing rows use it.

