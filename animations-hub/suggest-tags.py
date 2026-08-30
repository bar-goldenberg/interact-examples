#!/usr/bin/env python3
"""Cluster the atmosphere vocabulary and suggest tags per preset.

    python3 animations-hub/suggest-tags.py            # report + write suggestions
    python3 animations-hub/suggest-tags.py --k 9      # choose cluster count

Method
------
1. Co-occurrence: C[a][b] = number of presets carrying both tags.
2. PPMI weighting, which discounts merely-popular tags:
       ppmi(a,b) = max(0, log2( C[a][b] * N / (count[a] * count[b]) ))
   Each tag becomes a vector of its PPMI against every other tag.
3. Similarity = cosine between those vectors.
4. Clusters = average-linkage agglomerative clustering on (1 - cosine).
5. Suggestions for a preset = tags it does NOT have, ranked by mean similarity
   to the tags it DOES have, with two deliberate adjustments:
     * tags the user ADDED by hand count 1.6x - they signal intent
     * tags the user REMOVED by hand are never suggested back
   Both come from the atmosphere_original baseline column.

Reads the CSV read-only. Writes animations-hub/tag-suggestions.json.
"""
import argparse, csv, io, json, math, os, sys, collections

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(HERE)
CSVP = os.path.join(REPO, 'interact-examples-tags.csv')
OUT = os.path.join(HERE, 'tag-suggestions.json')

ADDED_WEIGHT = 1.6
TOP_N = 10


def parse_list(cell):
    cell = (cell or '').strip()
    if not cell:
        return []
    try:
        v = json.loads(cell)
        if isinstance(v, list):
            return [str(x).strip().lower() for x in v if str(x).strip()]
    except (ValueError, TypeError):
        pass
    return [t.strip().lower() for t in cell.lstrip('[').rstrip(']').replace('"', '').split(',') if t.strip()]


def load():
    with open(CSVP, newline='', encoding='utf-8') as fh:
        rows = list(csv.DictReader(fh))
    presets = []
    for n, r in enumerate(rows, start=1):
        cur = parse_list(r.get('Atmosphere'))
        orig = parse_list(r.get('atmosphere_original'))
        presets.append({
            'row': n,
            'name': r.get('Name of preset', '').strip(),
            'path': r.get('path', '').strip(),
            'tags': cur,
            'added': [t for t in cur if orig and t not in orig],
            'removed': [t for t in orig if t not in cur] if orig else [],
        })
    return presets


def similarity(presets):
    tags = sorted({t for p in presets for t in p['tags']})
    idx = {t: i for i, t in enumerate(tags)}
    n = len(tags)
    N = len(presets)
    count = collections.Counter(t for p in presets for t in set(p['tags']))
    co = [[0] * n for _ in range(n)]
    for p in presets:
        ts = sorted(set(p['tags']))
        for i, a in enumerate(ts):
            for b in ts[i:]:
                co[idx[a]][idx[b]] += 1
                if a != b:
                    co[idx[b]][idx[a]] += 1

    ppmi = [[0.0] * n for _ in range(n)]
    for i, a in enumerate(tags):
        for j, b in enumerate(tags):
            c = co[i][j]
            if not c or i == j:
                continue
            v = math.log2(c * N / (count[a] * count[b]))
            if v > 0:
                ppmi[i][j] = v

    norm = [math.sqrt(sum(x * x for x in row)) or 1.0 for row in ppmi]
    sim = [[0.0] * n for _ in range(n)]
    for i in range(n):
        for j in range(i, n):
            s = sum(ppmi[i][k] * ppmi[j][k] for k in range(n)) / (norm[i] * norm[j])
            sim[i][j] = sim[j][i] = s
    for i in range(n):
        sim[i][i] = 1.0
    return tags, idx, sim, count


def cluster(tags, sim, k):
    """Average-linkage agglomerative clustering on 1 - cosine."""
    groups = [[i] for i in range(len(tags))]

    def linkage(g1, g2):
        return sum(sim[a][b] for a in g1 for b in g2) / (len(g1) * len(g2))

    while len(groups) > k:
        best, bi, bj = -2.0, 0, 1
        for i in range(len(groups)):
            for j in range(i + 1, len(groups)):
                s = linkage(groups[i], groups[j])
                if s > best:
                    best, bi, bj = s, i, j
        groups[bi] = groups[bi] + groups[bj]
        groups.pop(bj)

    out = []
    for g in groups:
        # the most central member names the cluster
        centre = max(g, key=lambda i: sum(sim[i][j] for j in g))
        cohesion = (sum(sim[a][b] for a in g for b in g if a != b) /
                    max(1, len(g) * (len(g) - 1)))
        out.append({
            'label': tags[centre],
            'members': sorted(tags[i] for i in g),
            'size': len(g),
            'cohesion': round(cohesion, 3),
        })
    out.sort(key=lambda c: -c['size'])
    return out


def suggest(presets, tags, idx, sim, count):
    res = {}
    for p in presets:
        have = set(p['tags'])
        if not have:
            res[str(p['row'])] = []
            continue
        banned = set(p['removed'])          # never suggest back what was removed
        weights = {t: (ADDED_WEIGHT if t in p['added'] else 1.0) for t in have}
        scored = []
        for cand in tags:
            if cand in have or cand in banned:
                continue
            num = sum(sim[idx[cand]][idx[t]] * w for t, w in weights.items() if t in idx)
            den = sum(weights.values())
            scored.append((num / den, cand))
        scored.sort(key=lambda x: (-x[0], x[1]))
        res[str(p['row'])] = [{'tag': t, 'score': round(s, 4)} for s, t in scored[:TOP_N]]
    return res


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--k', type=int, default=9, help='number of clusters')
    ap.add_argument('--quiet', action='store_true')
    args = ap.parse_args()

    presets = load()
    tagged = [p for p in presets if p['tags']]
    tags, idx, sim, count = similarity(tagged)
    clusters = cluster(tags, sim, args.k)
    sugg = suggest(presets, tags, idx, sim, count)

    json.dump({
        'generated_from': os.path.basename(CSVP),
        'presets': len(presets),
        'vocabulary_in_use': len(tags),
        'clusters': clusters,
        'suggestions': sugg,
    }, open(OUT, 'w'), indent=1)

    if not args.quiet:
        print('presets %d | tags in use %d | clusters %d\n' % (len(tagged), len(tags), len(clusters)))
        for c in clusters:
            print('CLUSTER  %-14s  n=%-3d cohesion=%.3f' % (c['label'], c['size'], c['cohesion']))
            print('   ' + ', '.join(c['members']))
            print()
        edited = [p for p in tagged if p['added'] or p['removed']]
        print('--- sample suggestions for presets you edited ---')
        for p in edited[:6]:
            s = sugg[str(p['row'])]
            print('%s' % p['name'])
            print('   has     : %s' % ', '.join(p['tags']))
            if p['added']:
                print('   you added  : %s' % ', '.join(p['added']))
            if p['removed']:
                print('   you removed: %s  (never suggested back)' % ', '.join(p['removed']))
            print('   suggests: %s' % ', '.join('%s %.2f' % (x['tag'], x['score']) for x in s))
            print()
    print('wrote %s' % os.path.relpath(OUT, REPO))


if __name__ == '__main__':
    main()
