#!/usr/bin/env python3
"""Build the atmosphere tag dictionary.

    python3 animations-hub/build-dictionary.py

Each entry has three parts:
  means     - what the word denotes in motion-design terms
  look_for  - concrete, checkable cues in the animation itself
  signature - measured from the presets that actually carry the tag
              (triggers, easing, duration, transforms, 3D/loop/dark share,
               and the tags it keeps distinctive company with)

Craft definitions are grounded in standard motion-design vocabulary:
  Figma Learn - Motion design fundamentals: Easing
  animations.dev/vocabulary  (spring, stagger, orchestration, rubber-banding)
  NN/g - Executing UX Animations: Duration and Motion Characteristics
  School of Motion - Motion Design Dictionary

Writes animations-hub/tag-dictionary.json and .md
"""
import csv, io, json, os, collections, statistics as st

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(HERE)
CSVP = os.path.join(REPO, 'interact-examples-tags.csv')
FEATS = os.path.join(HERE, 'features.json')
OUTJ = os.path.join(HERE, 'tag-dictionary.json')
OUTM = os.path.join(HERE, 'tag-dictionary.md')

CLUSTERS = {
    'bold':          'Energy & statement',
    'soft':          'Restraint & polish',
    'playful':       'Play & response',
    'dimensional':   'Depth & space',
    'effortless':    'Flow & continuity',
    'confident':     'Direction & reveal',
    'gradual':       'Form & change',
    'staggered':     'Order & choreography',
    'flowless':      'Loose / idiosyncratic',
    'eye catching':  'Legacy wording',
    'fluid':         'Loose / idiosyncratic',
    'layering':      'Loose / idiosyncratic',
}

MEMBER_OF = {
    'bold': 'bold', 'artistic': 'bold', 'attention-grabbing': 'bold', 'continuous': 'bold',
    'cool': 'bold', 'creative': 'bold', 'dynamic': 'bold', 'edgy': 'bold', 'endless': 'bold',
    'experimental': 'bold', 'eye-catching': 'bold', 'futuristic': 'bold', 'graphic': 'bold',
    'impactful': 'bold', 'techy': 'bold', 'unconventional': 'bold',
    'calm': 'soft', 'classic': 'soft', 'clean': 'soft', 'cloudy': 'soft', 'elegant': 'soft',
    'gentle': 'soft', 'graceful': 'soft', 'high-end': 'soft', 'modern': 'soft', 'refined': 'soft',
    'smooth': 'soft', 'soft': 'soft', 'sophisticated': 'soft', 'subtle': 'soft', 'understated': 'soft',
    '3d effect': 'playful', 'alive': 'playful', 'charming': 'playful', 'energetic': 'playful',
    'fun': 'playful', 'horizontal': 'playful', 'innovative': 'playful', 'interactive': 'playful',
    'playful': 'playful', 'poppy': 'playful', 'surprising': 'playful', 'unique': 'playful',
    'z axis': 'playful', 'zoom': 'playful',
    '3d': 'dimensional', 'depth': 'dimensional', 'dimensional': 'dimensional',
    'immersive': 'dimensional', 'layered': 'dimensional', 'perspective': 'dimensional',
    'spatial': 'dimensional',
    'effortless': 'effortless', 'flowing': 'effortless', 'horizontal scroll': 'effortless',
    'polished': 'effortless', 'seamless': 'effortless', 'silky': 'effortless', 'simple': 'effortless',
    'circular': 'confident', 'confident': 'confident', 'expressive': 'confident',
    'revealing': 'confident', 'spiraling': 'confident', 'vertical': 'confident',
    'gradual': 'gradual', 'minimal': 'gradual', 'organic': 'gradual', 'shape': 'gradual',
    'transformative': 'gradual',
    'cascading': 'staggered', 'organized': 'staggered', 'staggered': 'staggered',
    'structured': 'staggered',
    'flowless': 'flowless', 'groovy': 'flowless', 'inspirational': 'flowless',
    'eye catching': 'eye catching', 'horizontal movement': 'eye catching',
    'fluid': 'fluid', 'layering': 'layering',
}

# means / look_for
D = {
 # ---- Restraint & polish ----
 'smooth': ("No visible jerk, stutter or hard stop anywhere in the motion.",
   "One continuous curve per property. Ease-out or a gentle cubic-bezier, nothing linear-and-abrupt. If it stutters on scroll it is not smooth."),
 'gentle': ("Low amplitude. The motion is small relative to the element.",
   "Travel under ~40px or scale change under ~10%. Nothing crosses the viewport."),
 'subtle': ("You notice the result, not the movement.",
   "Would a non-designer even register it happened? If the effect announces itself, it is not subtle."),
 'soft': ("No hard edges in either the easing or the visuals.",
   "Long tails on the easing, blur, feathered masks, rounded corners, low-contrast palette."),
 'refined': ("Nothing extraneous. Every moving part is doing work.",
   "Few simultaneous properties, consistent timing between siblings, no decorative wobble."),
 'clean': ("Visually uncluttered - the motion reads instantly.",
   "Few colours (2-3), generous whitespace, one clear thing moving at a time."),
 'elegant': ("Restrained motion that still feels considered and expensive.",
   "Asymmetric easing with a long deceleration, serif or high-contrast type, unhurried duration (600ms+)."),
 'graceful': ("Unhurried, curved, weight-bearing motion - it looks like it has mass.",
   "Arcs rather than straight lines, no sudden direction changes, slow settle. NN/g's 'long gradual deceleration'."),
 'classic': ("Familiar, timeless vocabulary. No trend markers.",
   "Fade, slide, simple scale. No 3D, no glitch, no neon. Would have looked fine ten years ago."),
 'understated': ("Deliberately less than it could have been.",
   "The effect is clearly held back - short travel, low opacity change, no flourish at the end."),
 'high-end': ("Reads as premium/luxury.",
   "Slow, generous timing, dark or monochrome palette, serif display type, lots of negative space."),
 'sophisticated': ("Complex underneath, simple on the surface.",
   "Several coordinated properties that resolve into one apparent movement. Orchestration, not a single tween."),
 'modern': ("Current design-language markers.",
   "Large geometric sans, flat or subtle-gradient surfaces, generous radii, scroll-linked motion."),
 'calm': ("Nothing competes for attention; the pace lowers your pulse.",
   "Single slow motion, no loops demanding attention, muted palette."),
 'cloudy': ("Diffuse, hazy, soft-focus quality.",
   "Blur filters, low-contrast washes, overlapping translucency."),
 'minimal': ("Reduced to the fewest possible moving parts.",
   "One or two properties animating; sparse composition; often just opacity + a small transform."),
 'simple': ("A single readable idea, easy to describe in one sentence.",
   "If explaining it needs an 'and then', it is not simple."),

 # ---- Flow & continuity ----
 'flowing': ("Continuous directional movement, like a current.",
   "Sustained travel in one direction, overlapping element timing so there is never a still frame."),
 'seamless': ("No visible seam, join or restart point.",
   "Loops where you cannot spot the wrap; transitions where the outgoing and incoming states share geometry."),
 'effortless': ("Looks like it costs the interface nothing.",
   "No strain, no bounce, no overshoot. Consistent velocity into a soft stop."),
 'silky': ("Frictionless, high-frame-rate glide.",
   "Transform/opacity only (GPU-friendly), no layout thrash, no jitter under fast scroll."),
 'polished': ("Finished. Every state and edge is handled.",
   "Hover, active and rest states all defined; nothing pops or reflows; timing consistent across siblings."),
 'gradual': ("The change is spread across a long span; no single moment carries it.",
   "Scroll-linked with `linear` easing over a tall section (300vh+). Scrubbing back and forth feels identical."),
 'continuous': ("Never fully stops while on screen.",
   "`iterations: Infinity`, or a scroll-driven effect with no rest state."),
 'endless': ("Reads as having no beginning or end.",
   "Seamless infinite loop - marquee, lane, wheel. You cannot identify frame zero."),

 # ---- Energy & statement ----
 'dynamic': ("Visibly energetic; velocity is part of the message.",
   "Fast phases, direction changes, several elements moving at once at different rates."),
 'bold': ("Loud and unmissable. Commits fully to the effect.",
   "Large travel or scale, heavy type, strong contrast, long confident duration (~900ms median here)."),
 'impactful': ("Lands with force - there is a moment of arrival.",
   "A sharp deceleration into the final state, often with scale. You feel it stop."),
 'attention-grabbing': ("Designed to interrupt.",
   "High contrast against its surroundings, motion where the eye is not already looking, or a loop."),
 'eye-catching': ("Pulls the eye on first glance.",
   "Same intent as attention-grabbing but usually via colour/shape rather than speed."),
 'energetic': ("High tempo, springy.",
   "Short durations (<400ms), overshoot in the easing curve, quick successive triggers."),
 'confident': ("Decisive. No hesitation, no wobble.",
   "Single committed movement, snappy deceleration, no bounce-back. Figma's 'steep, snappy deceleration'."),
 'expressive': ("The motion carries meaning beyond function.",
   "The movement says something about the content - it is not a generic fade-in."),
 'graphic': ("Poster-like. Reads as flat shape and type.",
   "Oversized type, hard-edged shapes, strong figure/ground, often masks rather than 3D."),
 'edgy': ("Slightly uncomfortable on purpose.",
   "Asymmetry, clipping, glitch, harsh timing, unexpected cuts."),
 'cool': ("Detached, confident, understated-but-current.",
   "Restrained palette with one sharp accent; motion that does not try to please."),
 'techy': ("Machine-like, engineered.",
   "Monospace type, grid overlays, stepped/`steps()` timing, scan-lines, dark UI."),
 'futuristic': ("Speculative, not-yet-mainstream.",
   "3D perspective, glass/neon, chromatic effects, unusual axis of movement."),
 'creative': ("An idea you have not seen applied this way.",
   "The mechanism itself is the novelty, not just the styling."),
 'artistic': ("Prioritises expression over utility.",
   "Would sit comfortably in a gallery; composition matters more than conversion."),
 'experimental': ("Feels like a prototype exploring an idea.",
   "Unusual mechanics, no established convention, may not survive a usability test."),
 'unconventional': ("Breaks an expected pattern deliberately.",
   "Scroll that moves sideways, nav that is not at the top, reversed reading order."),
 'unique': ("You would recognise it again.",
   "One distinctive gesture that no other preset here repeats."),
 'innovative': ("New technique, not just new styling.",
   "Uses a capability most sites do not - scroll-linked 3D, pointer-driven fields, masked type."),
 'inspirational': ("Aspirational tone; makes you want the thing.",
   "Wide landscape imagery, generous scale, uplifting upward movement."),

 # ---- Play & response ----
 'playful': ("Invites you to mess with it.",
   "Overshoot/bounce in the curve, exaggeration, response to hover or pointer."),
 'fun': ("Produces a small smile.",
   "Unexpected but harmless behaviour - wobble, squash, a face, a pop."),
 'poppy': ("Quick, punchy, spring-loaded.",
   "Very short duration with visible overshoot - a spring with low damping (bounce)."),
 'charming': ("Small, personable, a little humane.",
   "Tiny idiosyncratic details; imperfection used deliberately."),
 'surprising': ("Does something you did not predict.",
   "The second half of the motion contradicts what the first half implied."),
 'alive': ("Idles rather than waiting - moves without being asked.",
   "A slow continuous float/drift, or pointer-tracking. animations.dev's 'float'."),
 'interactive': ("Responds to you, not to the scroll position.",
   "Requires a hover / click / pointermove / interest trigger. THIS IS A HARD RULE: scroll-only work is never 'interactive'."),
 'groovy': ("Rhythmic, slightly retro, on a beat.",
   "Repeating cycles with a swing feel; wavy rather than linear paths."),

 # ---- Depth & space ----
 'depth': ("Reads as having a front and a back.",
   "Overlap, scale-with-distance, blur-with-distance, or an explicit Z translation. 84% of presets tagged this are genuinely 3D."),
 '3d': ("Actual three-dimensional transforms, not a fake.",
   "`perspective` plus `rotateX/rotateY` or `translateZ` in the CSS."),
 '3d effect': ("Reads three-dimensional without necessarily being real 3D.",
   "Faked shadows/skew that imply volume. Prefer '3d' when perspective is genuinely used."),
 'dimensional': ("Occupies volume; you could walk around it.",
   "Multiple faces or planes visible at once."),
 'perspective': ("Vanishing-point convergence is visible.",
   "A `perspective()` value; parallel edges converge; near elements move faster."),
 'spatial': ("The layout itself is a space you move through.",
   "Movement implies travel - into a room, along a corridor, through layers."),
 'layered': ("Distinct stacked planes.",
   "3+ visually separated depth planes with different motion rates."),
 'immersive': ("Fills your field of view; you are inside it.",
   "Full-viewport, edge-to-edge, no visible page chrome."),
 'zoom': ("Scale is the primary motion.",
   "`scale()` doing most of the work - push in or pull out."),

 # ---- Direction & reveal ----
 'revealing': ("Content is uncovered rather than moved.",
   "Masks, clip-path, wipes, curtains. The element does not travel - the window onto it changes."),
 'transformative': ("The thing becomes something else.",
   "Start and end states are different in kind, not just position - shape morphs, folds, squeezes."),
 'shape': ("Geometry itself is the subject.",
   "border-radius/clip-path morphing; the silhouette changes."),
 'organic': ("Natural, non-mechanical curvature.",
   "Blob shapes, uneven timing, nothing perfectly aligned to a grid."),
 'circular': ("Motion follows an arc or a full rotation.",
   "`rotate()` as the main transform, or elements arranged on a radius."),
 'spiraling': ("Rotation combined with scale or depth - a helix.",
   "rotate + scale together, or rotate + translateZ."),
 'vertical': ("The dominant axis is up/down.",
   "translateY dominates; column layouts; top-to-bottom reveals."),
 'horizontal': ("The dominant axis is left/right.",
   "translateX dominates; row layouts; sideways travel."),
 'horizontal scroll': ("Vertical scrolling is remapped to sideways travel.",
   "A sticky viewport with a wide track moved by translateX."),
 'horizontal movement': ("Legacy phrasing for sideways travel - prefer 'horizontal'.",
   "Same cue as 'horizontal'. Kept only because existing rows use it."),
 'eye catching': ("Legacy unhyphenated spelling - prefer 'eye-catching'.",
   "Same meaning. Kept only because one existing row uses it."),
 'z axis': ("Legacy phrasing for depth movement - prefer 'depth' or '3d'.",
   "translateZ / toward-or-away-from-viewer motion."),
 'layering': ("Legacy phrasing - prefer 'layered'.",
   "Same cue as 'layered'."),
 'flowless': ("Ambiguous legacy term - probably meant 'flawless' or 'flowing'.",
   "Do not apply to new rows; pick 'seamless' or 'flowing' instead."),
 'fluid': ("Liquid-like, continuously deforming.",
   "Curved paths, easing without hard stops, shapes that bend rather than snap."),

 # ---- Order & choreography ----
 'staggered': ("Siblings start one after another, not together.",
   "A per-item delay of roughly 40-100ms. animations.dev: prevents the 'lacks elegance' parallel entrance."),
 'cascading': ("A staggered reveal that reads as a wave.",
   "Stagger plus a directional order - left-to-right, top-to-bottom."),
 'organized': ("Everything lands on a grid or rhythm.",
   "Consistent spacing and equal timing steps; alignment is obvious."),
 'structured': ("A visible underlying system.",
   "Repeating modules, clear hierarchy, motion that respects the layout."),
}


def parse_list(cell):
    cell = (cell or '').strip()
    try:
        v = json.loads(cell)
        if isinstance(v, list):
            return [str(x).strip().lower() for x in v]
    except (ValueError, TypeError):
        pass
    return []


def main():
    rows = list(csv.DictReader(open(CSVP, newline='', encoding='utf-8')))
    feats = {}
    if os.path.exists(FEATS):
        feats = {f['path']: f for f in json.load(open(FEATS)) if 'error' not in f}

    presets = [{'name': r['Name of preset'].strip(), 'path': r['path'].strip(),
                'tags': parse_list(r['Atmosphere']), 'f': feats.get(r['path'].strip())}
               for r in rows]
    N = len(presets)
    cnt = collections.Counter(t for p in presets for t in set(p['tags']))
    co = collections.defaultdict(collections.Counter)
    for p in presets:
        ts = set(p['tags'])
        for a in ts:
            for b in ts:
                if a != b:
                    co[a][b] += 1

    entries = {}
    for tag in sorted(set(list(D) + list(cnt))):
        means, look = D.get(tag, ('(no definition yet)', '(no cues yet)'))
        ps = [p for p in presets if tag in p['tags'] and p['f']]
        sig = {}
        if ps:
            f = [p['f'] for p in ps]
            durs = [d for x in f for d in x['durations'] if 0 < d <= 5000]
            lift = []
            for b, c in co[tag].most_common(30):
                exp = cnt[b] * cnt[tag] / N
                if c >= 3 and exp > 0:
                    lift.append((c / exp, b))
            lift.sort(reverse=True)
            sig = {
                'presets': cnt[tag],
                'share_pct': round(100 * cnt[tag] / N),
                'keeps_company_with': [b for _, b in lift[:5]],
                'typical_triggers': [t for t, _ in collections.Counter(
                    t for x in f for t in x['triggers']).most_common(3)],
                'typical_easing': [e for e, _ in collections.Counter(
                    e.split('(')[0] for x in f for e in x['easings']).most_common(2)],
                'median_duration_ms': int(st.median(durs)) if durs else None,
                'main_transforms': [t for t, _ in collections.Counter(
                    t for x in f for t in x['transforms']).most_common(3)],
                'pct_real_3d': round(100 * sum(1 for x in f if x['is_3d']) / len(f)),
                'pct_infinite_loop': round(100 * sum(1 for x in f if x['iterations_infinite']) / len(f)),
                'pct_dark_palette': round(100 * sum(1 for x in f if x['dark_colors'] > x['light_colors']) / len(f)),
                'examples': [p['name'] for p in ps[:3]],
            }
        entries[tag] = {'means': means, 'look_for': look,
                        'cluster': MEMBER_OF.get(tag, ''),
                        'cluster_name': CLUSTERS.get(MEMBER_OF.get(tag, ''), ''),
                        'signature': sig}

    json.dump({'entries': entries, 'clusters': CLUSTERS}, open(OUTJ, 'w'), indent=1)

    by_cluster = collections.defaultdict(list)
    for t, e in entries.items():
        by_cluster[e['cluster_name'] or 'Unassigned'].append((t, e))
    order = ['Restraint & polish', 'Flow & continuity', 'Energy & statement', 'Play & response',
             'Depth & space', 'Direction & reveal', 'Form & change', 'Order & choreography',
             'Loose / idiosyncratic', 'Legacy wording', 'Unassigned']
    with open(OUTM, 'w', encoding='utf-8') as fh:
        fh.write('# Atmosphere tag dictionary\n\n')
        fh.write('What each tag means, what to look for in the animation, and what it '
                 'actually correlates with across the %d presets in this repo.\n\n' % N)
        fh.write('`signature` is measured, not asserted - it comes from the presets that '
                 'carry the tag today, so it shifts as tagging changes.\n\n')
        for group in order:
            items = sorted(by_cluster.get(group, []))
            if not items:
                continue
            fh.write('\n## %s\n\n' % group)
            for t, e in items:
                s = e['signature']
                fh.write('### `%s`' % t)
                if s:
                    fh.write('  — %d presets (%d%%)' % (s['presets'], s['share_pct']))
                fh.write('\n\n**Means:** %s\n\n**Look for:** %s\n\n' % (e['means'], e['look_for']))
                if s:
                    bits = []
                    if s['keeps_company_with']:
                        bits.append('travels with *%s*' % ', '.join(s['keeps_company_with']))
                    if s['typical_triggers']:
                        bits.append('triggers `%s`' % '`, `'.join(s['typical_triggers']))
                    if s['median_duration_ms']:
                        bits.append('median duration %dms' % s['median_duration_ms'])
                    if s['main_transforms']:
                        bits.append('mostly `%s`' % '`, `'.join(s['main_transforms']))
                    if s['pct_real_3d'] >= 40:
                        bits.append('%d%% genuinely 3D' % s['pct_real_3d'])
                    if s['pct_infinite_loop'] >= 25:
                        bits.append('%d%% loop forever' % s['pct_infinite_loop'])
                    if s['pct_dark_palette'] >= 45:
                        bits.append('%d%% dark palette' % s['pct_dark_palette'])
                    fh.write('*Signature:* %s.\n\n' % '; '.join(bits))
                    fh.write('*e.g.* %s\n\n' % ', '.join(s['examples']))
    print('wrote %s' % os.path.relpath(OUTJ, REPO))
    print('wrote %s' % os.path.relpath(OUTM, REPO))
    print('entries: %d  |  with measured signature: %d'
          % (len(entries), sum(1 for e in entries.values() if e['signature'])))
    missing = [t for t, e in entries.items() if e['means'].startswith('(no definition')]
    if missing:
        print('NO DEFINITION YET: %s' % ', '.join(missing))


if __name__ == '__main__':
    main()
