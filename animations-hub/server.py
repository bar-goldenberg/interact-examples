#!/usr/bin/env python3
"""Local server for the animations hub, with tag editing that writes to the CSV.

    python3 animations-hub/server.py            # http://localhost:3000
    python3 animations-hub/server.py --port 8080

Serves the whole repo statically (so the animation iframes work) and adds:

    GET  /api/presets           -> current preset + tag data, read fresh from the CSV
    POST /api/tags              -> {"row": N, "atmosphere": [...]}  updates that row

Writes are atomic (temp file + replace) and serialised behind a lock. The first
write of each run snapshots the CSV to animations-hub/tags-backup.csv.
"""
import argparse, csv, datetime, io, json, os, re, shutil, sys, threading
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import quote

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(HERE)
CSVP = os.path.join(REPO, 'interact-examples-tags.csv')
BACKUP = os.path.join(HERE, 'tags-backup.csv')

VERBOSE = bool(os.environ.get('HUB_VERBOSE'))
LOCK = threading.Lock()
_backed_up = False

MANUAL = {
    'Card Spread', 'expand horzinotal scroll', 'sticky repeater stack',
    'horiznotal & vertical scroll', 'title folds scroll animation',
    'classic horziontal scroll', 'corner fold scroll animation', 'Shape scroll',
    '3D rotating fan', '3D room', 'Small carousel', 'acordion scroll',
    'Digital Jukebox', 'Vertical/ horizontal lanes', 'Endless Parallax',
    'horziontally scrolling image gallery', 'Accordion Scroll Vertical',
    'Wheel Carousel', '3D small carousel', 'Looped tabs with perspective',
}

MAX_TAGS = 40
MAX_TAG_LEN = 40
MIN_TAGS = 1
VOCABP = os.path.join(HERE, 'vocabulary.json')


def load_vocab():
    try:
        with open(VOCABP, encoding='utf-8') as fh:
            return {t.strip().lower() for t in json.load(fh).get('atmosphere', [])}
    except Exception as e:
        print('  ! vocabulary.json unreadable (%s) - new-term guard disabled' % e)
        return set()


VOCAB = load_vocab()


# ---------------------------------------------------------------- csv helpers

def read_csv():
    with open(CSVP, 'rb') as fh:
        raw = fh.read()
    lines = raw.split(b'\r\n')
    trailing = lines and lines[-1] == b''
    if trailing:
        lines = lines[:-1]
    rows = list(csv.reader(io.StringIO(raw.decode('utf-8'))))
    if len(rows) != len(lines):
        raise RuntimeError('CSV has embedded newlines; line-safe editing is off')
    return raw, lines, rows, trailing


def field(v):
    return '"' + v.replace('"', '""') + '"' if any(c in v for c in ',"\r\n') else v


def split_list(cell):
    return [t.strip() for t in cell.split(',') if t.strip()]


def parse_atmosphere(cell):
    cell = (cell or '').strip()
    if not cell:
        return []
    try:
        v = json.loads(cell)
        if isinstance(v, list):
            return [str(x).strip() for x in v if str(x).strip()]
    except (ValueError, TypeError):
        pass
    return split_list(cell.lstrip('[').rstrip(']').replace('"', ''))


def sec_key(row):
    return 'section_type ' if 'section_type ' in row else 'section_type'


def build_presets():
    _, _, rows, _ = read_csv()
    header = rows[0]
    idx = {h: i for i, h in enumerate(header)}
    ai = idx['Atmosphere']
    bi = idx['business_type']
    si = idx.get('section_type ', idx.get('section_type'))
    ni, pi = idx['Name of preset'], idx['path']
    gi = idx.get(ORIG_COL)
    ri = idx.get(REVIEW_COL)
    moi = idx.get(MOTION_COL)
    mdi = idx.get(MOOD_COL)
    out = []
    for n, r in enumerate(rows[1:], start=1):     # n == physical/logical row index
        path = r[pi].strip()
        out.append({
            'row': n,
            'name': r[ni].strip(),
            'path': path,
            'folder': path.split('/')[0] if path else '(no file)',
            'src': '../' + '/'.join(quote(s) for s in path.split('/')) if path else '',
            'source': 'manual' if r[ni].strip() in MANUAL else 'claude',
            'atmosphere': parse_atmosphere(r[ai]),
            'original': parse_atmosphere(r[gi]) if gi is not None else [],
            'reviewed': (r[ri].strip() if ri is not None else ''),
            'motion_tag': (r[moi].strip() if moi is not None else ''),
            'mood_tag': (r[mdi].strip() if mdi is not None else ''),
            'motion_orphan': bool(moi is not None and r[moi].strip()
                                  and r[moi].strip().lower() not in AXES.get('motion', [])),
            'mood_orphan': bool(mdi is not None and r[mdi].strip()
                                and r[mdi].strip().lower() not in AXES.get('mood', [])),
            'business': split_list(r[bi]),
            'section': split_list(r[si]),
        })
    out.sort(key=lambda p: (p['folder'] == '(no file)', p['folder'].lower(), p['name'].lower()))
    return out


ORIG_COL = 'atmosphere_original'
HISTORY = os.path.join(HERE, 'tag-history.csv')
REVIEW_COL = 'reviewed'
MOTION_COL = 'motion_tag'
MOOD_COL = 'mood_tag'
AXESP = os.path.join(HERE, 'main-tag-axes.json')


def load_axes():
    try:
        with open(AXESP, encoding='utf-8') as fh:
            d = json.load(fh)
        return {k: [t.lower() for t in d.get(k, [])]
                for k in ('motion', 'mood', 'uncategorised')}
    except Exception as e:
        print('  ! main-tag-axes.json unreadable (%s) - axis dropdowns disabled' % e)
        return {'motion': [], 'mood': [], 'uncategorised': []}


AXES = load_axes()
AXIS_COL = {'motion': MOTION_COL, 'mood': MOOD_COL}
HISTORY_COLS = ['timestamp', 'row', 'preset', 'path', 'action',
                'added', 'removed', 'before', 'after']


def log_history(entry):
    """Append-only audit trail. Never rewritten, so it survives any later edit."""
    new = not os.path.exists(HISTORY)
    with open(HISTORY, 'a', newline='', encoding='utf-8') as fh:
        w = csv.DictWriter(fh, fieldnames=HISTORY_COLS, extrasaction='ignore')
        if new:
            w.writeheader()
        w.writerow(entry)


def write_atmosphere(row_index, tags):
    """Replace one row's Atmosphere cell. Every other byte of the file is preserved.

    The first time a row is edited its pre-edit tags are copied into
    atmosphere_original, giving a permanent baseline to diff against. Rows that
    are never touched keep that column empty - the baseline is not retroactive.
    """
    global _backed_up
    with LOCK:
        raw, lines, rows, trailing = read_csv()
        if not (1 <= row_index < len(rows)):
            raise IndexError('row %r out of range' % row_index)
        if not _backed_up:
            shutil.copy2(CSVP, BACKUP)
            _backed_up = True
            print('  snapshot -> %s' % os.path.relpath(BACKUP, REPO))

        header = rows[0]
        ai = header.index('Atmosphere')
        oi = header.index(ORIG_COL) if ORIG_COL in header else None
        ni = header.index('Name of preset')
        pi = header.index('path')

        r = list(rows[row_index])
        before = parse_atmosphere(r[ai])
        if before == tags:
            return r[ni].strip(), tags, {
                'unchanged': True,
                'original_list': parse_atmosphere(r[oi]) if oi is not None else [],
            }

        # capture the baseline once, on the first edit of this row
        if oi is not None and not r[oi].strip():
            r[oi] = json.dumps(before, ensure_ascii=False)

        r[ai] = json.dumps(tags, ensure_ascii=False)
        lines[row_index] = ','.join(field(x) for x in r).encode('utf-8')

        blob = b'\r\n'.join(lines) + (b'\r\n' if trailing else b'')
        tmp = CSVP + '.tmp'
        with open(tmp, 'wb') as fh:
            fh.write(blob)
        os.replace(tmp, CSVP)

        added = [t for t in tags if t not in before]
        removed = [t for t in before if t not in tags]
        entry = {
            'timestamp': datetime.datetime.now().isoformat(timespec='seconds'),
            'row': row_index,
            'preset': r[ni].strip(),
            'path': r[pi].strip(),
            'action': 'tags',
            'added': ', '.join(added),
            'removed': ', '.join(removed),
            'before': ', '.join(before),
            'after': ', '.join(tags),
            'original_list': parse_atmosphere(r[oi]) if oi is not None else [],
        }
        try:
            log_history(entry)
        except Exception as e:
            print('  ! could not write history: %s' % e)
        return r[ni].strip(), tags, entry


def set_reviewed(row_index, on):
    """Stamp or clear the reviewed column for one row. Same atomic write path."""
    global _backed_up
    with LOCK:
        raw, lines, rows, trailing = read_csv()
        if not (1 <= row_index < len(rows)):
            raise IndexError('row %r out of range' % row_index)
        header = rows[0]
        if REVIEW_COL not in header:
            raise RuntimeError('CSV has no %r column' % REVIEW_COL)
        if not _backed_up:
            shutil.copy2(CSVP, BACKUP)
            _backed_up = True
            print('  snapshot -> %s' % os.path.relpath(BACKUP, REPO))

        vi = header.index(REVIEW_COL)
        ni = header.index('Name of preset')
        pi = header.index('path')
        r = list(rows[row_index])
        was = r[vi].strip()
        now = datetime.datetime.now().isoformat(timespec='seconds')
        r[vi] = now if on else ''
        if r[vi] == was:
            return r[ni].strip(), was, False

        lines[row_index] = ','.join(field(x) for x in r).encode('utf-8')
        blob = b'\r\n'.join(lines) + (b'\r\n' if trailing else b'')
        tmp = CSVP + '.tmp'
        with open(tmp, 'wb') as fh:
            fh.write(blob)
        os.replace(tmp, CSVP)
        try:
            log_history({'timestamp': now, 'row': row_index, 'preset': r[ni].strip(),
                         'path': r[pi].strip(),
                         'action': 'approved' if on else 'un-approved',
                         'added': '', 'removed': '', 'before': was, 'after': r[vi]})
        except Exception as e:
            print('  ! could not write history: %s' % e)
        return r[ni].strip(), r[vi], True


def set_axis(row_index, axis, tag):
    """Set or clear one row's motion_tag or mood_tag.

    The value must come from that axis's list in main-tag-axes.json - the UI
    offers a closed dropdown and the server enforces the same list. Pass '' to
    clear. Unlike the atmosphere tags these are curated categories, so the value
    need not be one of the preset's own tags.
    """
    global _backed_up
    if axis not in AXIS_COL:
        raise ValueError('axis must be motion or mood')
    col = AXIS_COL[axis]
    with LOCK:
        raw, lines, rows, trailing = read_csv()
        if not (1 <= row_index < len(rows)):
            raise IndexError('row %r out of range' % row_index)
        header = rows[0]
        if col not in header:
            raise RuntimeError('CSV has no %r column' % col)
        if not _backed_up:
            shutil.copy2(CSVP, BACKUP)
            _backed_up = True
            print('  snapshot -> %s' % os.path.relpath(BACKUP, REPO))

        vi = header.index(col)
        ni = header.index('Name of preset')
        pi = header.index('path')
        tag = re.sub(r'\s+', ' ', str(tag or '')).strip().lower()
        allowed = AXES.get(axis, [])
        if tag and allowed and tag not in allowed:
            raise ValueError('%r is not a valid %s tag' % (tag, axis))

        r = list(rows[row_index])
        was = r[vi].strip()
        if tag == was:
            return r[ni].strip(), was, False
        r[vi] = tag
        lines[row_index] = ','.join(field(x) for x in r).encode('utf-8')
        blob = b'\r\n'.join(lines) + (b'\r\n' if trailing else b'')
        tmp = CSVP + '.tmp'
        with open(tmp, 'wb') as fh:
            fh.write(blob)
        os.replace(tmp, CSVP)
        try:
            log_history({'timestamp': datetime.datetime.now().isoformat(timespec='seconds'),
                         'row': row_index, 'preset': r[ni].strip(), 'path': r[pi].strip(),
                         'action': ('%s tag' % axis) if tag else ('%s tag cleared' % axis),
                         'added': tag, 'removed': was, 'before': was, 'after': tag})
        except Exception as e:
            print('  ! could not write history: %s' % e)
        return r[ni].strip(), tag, True


def all_labels():
    """Every label an axis may contain: the allowed vocabulary plus anything the
    CSV actually uses. The vocabulary side matters - it lets a newly added term be
    placed on an axis before any preset carries it yet."""
    _, _, rows, _ = read_csv()
    ai = rows[0].index('Atmosphere')
    in_use = {t.lower() for r in rows[1:] for t in parse_atmosphere(r[ai])}
    return sorted(in_use | set(VOCAB))


def save_axes(motion, mood):
    """Rewrite main-tag-axes.json. Values already assigned to presets are NOT
    cleared when they leave an axis - they are reported as orphans and flagged in
    the UI instead, so nothing is lost silently."""
    global AXES
    def clean(lst, label):
        if not isinstance(lst, list):
            raise ValueError('%s must be a list' % label)
        out = []
        for t in lst:
            t = re.sub(r'\s+', ' ', str(t)).strip().lower()
            if not t:
                continue
            if t not in out:
                out.append(t)
        return out

    motion, mood = clean(motion, 'motion'), clean(mood, 'mood')
    both = set(motion) & set(mood)
    if both:
        raise ValueError('a tag cannot be in both axes: %s' % ', '.join(sorted(both)))
    labels = all_labels()
    unknown = [t for t in motion + mood if t not in labels]
    if unknown:
        raise ValueError('not an existing atmosphere label: %s' % ', '.join(unknown))

    other = [t for t in labels if t not in motion and t not in mood]
    with LOCK:
        payload = {'_note': 'Allowed values for the motion_tag and mood_tag dropdowns. '
                            '"uncategorised" is every remaining atmosphere label, shown '
                            'read-only in the hub for review.',
                   'motion': motion, 'mood': mood, 'uncategorised': other}
        tmp = AXESP + '.tmp'
        with open(tmp, 'w', encoding='utf-8') as fh:
            json.dump(payload, fh, indent=1)
        os.replace(tmp, AXESP)
        AXES = load_axes()

    # count presets whose assigned value is now off-list
    _, _, rows, _ = read_csv()
    hdr = rows[0]
    moi = hdr.index(MOTION_COL) if MOTION_COL in hdr else None
    mdi = hdr.index(MOOD_COL) if MOOD_COL in hdr else None
    orphans = []
    for n, r in enumerate(rows[1:], 1):
        if moi is not None and r[moi].strip() and r[moi].strip().lower() not in motion:
            orphans.append((n, r[0].strip(), 'motion', r[moi].strip()))
        if mdi is not None and r[mdi].strip() and r[mdi].strip().lower() not in mood:
            orphans.append((n, r[0].strip(), 'mood', r[mdi].strip()))
    try:
        log_history({'timestamp': datetime.datetime.now().isoformat(timespec='seconds'),
                     'row': 0, 'preset': '(axis definition)', 'path': '',
                     'action': 'axes edited',
                     'added': 'motion %d, mood %d' % (len(motion), len(mood)),
                     'removed': '%d orphaned' % len(orphans) if orphans else '',
                     'before': '', 'after': ''})
    except Exception as e:
        print('  ! could not write history: %s' % e)
    return payload, orphans


def read_history(limit=400, row=None):
    if not os.path.exists(HISTORY):
        return []
    with open(HISTORY, newline='', encoding='utf-8') as fh:
        items = list(csv.DictReader(fh))
    if row is not None:
        items = [i for i in items if str(i.get('row')) == str(row)]
    return items[-limit:][::-1]     # newest first


def clean_tags(value, allow_new=False, allow_empty=False):
    """Normalise and guard a tag list. Rejects off-vocabulary terms and near-wipes
    unless the caller explicitly opted in."""
    if not isinstance(value, list):
        raise ValueError('atmosphere must be a list')
    out = []
    for t in value:
        if not isinstance(t, str):
            raise ValueError('tags must be strings')
        t = re.sub(r'\s+', ' ', t).strip().strip(',"\'').lower()
        if not t:
            continue
        if len(t) > MAX_TAG_LEN:
            raise ValueError('tag too long: %r' % t[:50])
        if not re.fullmatch(r"[a-z0-9][a-z0-9 &/'\-]*", t):
            raise ValueError('tag has unexpected characters: %r' % t)
        if t not in out:
            out.append(t)
    if len(out) > MAX_TAGS:
        raise ValueError('too many tags (max %d)' % MAX_TAGS)
    if len(out) < MIN_TAGS and not allow_empty:
        raise ValueError('refusing to leave a preset with no atmosphere tags '
                         '(pass allowEmpty to override)')
    if VOCAB and not allow_new:
        unknown = [t for t in out if t not in VOCAB]
        if unknown:
            raise ValueError('not in vocabulary.json: %s (pass allowNew to override)'
                             % ', '.join(repr(u) for u in unknown))
    return out


# ---------------------------------------------------------------- http handler

class Handler(SimpleHTTPRequestHandler):
    # Deliberately HTTP/1.0 (connection per request). SimpleHTTPRequestHandler's
    # HTTP/1.1 keep-alive can desync a connection after an error response, which
    # showed up as a stray 404 page rendering inside the animation iframe.
    protocol_version = 'HTTP/1.0'

    def __init__(self, *a, **kw):
        super().__init__(*a, directory=REPO, **kw)

    def send_error(self, code, message=None, explain=None):
        self.close_connection = True
        self._no_store = True
        return super().send_error(code, message, explain)

    def end_headers(self):
        # Never let an error page (or an edited animation) be cached. Chrome will
        # heuristically cache a header-less 404 and then replay it from disk,
        # which looked exactly like a server bug.
        if getattr(self, '_no_store', False) or (self.path or '').endswith('.html') \
                or (self.path or '').endswith('/'):
            self.send_header('Cache-Control', 'no-store, must-revalidate')
        super().end_headers()

    def guess_type(self, path):
        t = super().guess_type(path)
        # SimpleHTTPRequestHandler omits the charset, which mangles non-ASCII text
        if t in ('text/html', 'text/css', 'application/javascript', 'text/javascript'):
            return t + '; charset=utf-8'
        return t

    def log_message(self, fmt, *args):
        msg = fmt % args if args else fmt
        if VERBOSE or '/api/' in (self.path or '') or ' 4' in msg or ' 5' in msg:
            sys.stderr.write('  %s %s -> %s\n' % (self.command, self.path, msg))
            if '404' in msg:
                try:
                    sys.stderr.write('      translate_path -> %r  exists=%s\n'
                                     % (self.translate_path(self.path),
                                        os.path.exists(self.translate_path(self.path))))
                except Exception as e:
                    sys.stderr.write('      translate_path failed: %s\n' % e)

    def _json(self, code, payload):
        body = json.dumps(payload, ensure_ascii=False).encode('utf-8')
        self.send_response(code)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.send_header('Cache-Control', 'no-store')
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        route = self.path.split('?')[0]
        # Browsers ask for this on every page; a 404 here is noise at best and,
        # with keep-alive, could poison a later response.
        if route in ('/favicon.ico', '/animations-hub/favicon.ico'):
            self.send_response(204)
            self.send_header('Content-Length', '0')
            self.send_header('Cache-Control', 'max-age=86400')
            self.end_headers()
            return
        if route.startswith('/api/history'):
            try:
                from urllib.parse import parse_qs, urlparse
                qs = parse_qs(urlparse(self.path).query)
                rw = qs.get('row', [None])[0]
                return self._json(200, {'ok': True,
                                        'entries': read_history(row=int(rw) if rw else None)})
            except Exception as e:
                return self._json(500, {'ok': False, 'error': str(e)})
        if route == '/api/presets':
            try:
                return self._json(200, {'ok': True, 'editable': True,
                                        'vocabulary': sorted(VOCAB),
                                        'axes': AXES,
                                        'presets': build_presets()})
            except Exception as e:
                return self._json(500, {'ok': False, 'error': str(e)})
        return super().do_GET()

    def do_POST(self):
        route = self.path.split('?')[0]
        if route == '/api/axes':
            try:
                n = int(self.headers.get('Content-Length') or 0)
                data = json.loads(self.rfile.read(n) or b'{}')
                payload, orphans = save_axes(data.get('motion'), data.get('mood'))
                print('  axes saved: motion %d, mood %d, uncategorised %d, orphans %d'
                      % (len(payload['motion']), len(payload['mood']),
                         len(payload['uncategorised']), len(orphans)))
                return self._json(200, {'ok': True, 'axes': payload,
                                        'orphans': [{'row': o[0], 'preset': o[1],
                                                     'axis': o[2], 'tag': o[3]} for o in orphans]})
            except Exception as e:
                return self._json(400, {'ok': False, 'error': '%s: %s' % (type(e).__name__, e)})
        if route == '/api/axis':
            try:
                n = int(self.headers.get('Content-Length') or 0)
                data = json.loads(self.rfile.read(n) or b'{}')
                row = data.get('row')
                if not isinstance(row, int):
                    raise ValueError('row must be an integer')
                name, val, changed = set_axis(row, data.get('axis'), data.get('tag', ''))
                if changed:
                    print('  %-6s tag %-30s %s' % (data.get('axis'), name[:30], val or '(cleared)'))
                return self._json(200, {'ok': True, 'row': row,
                                        'axis': data.get('axis'), 'tag': val})
            except Exception as e:
                return self._json(400, {'ok': False, 'error': '%s: %s' % (type(e).__name__, e)})
        if route == '/api/reviewed':
            try:
                n = int(self.headers.get('Content-Length') or 0)
                data = json.loads(self.rfile.read(n) or b'{}')
                row = data.get('row')
                if not isinstance(row, int):
                    raise ValueError('row must be an integer')
                name, val, changed = set_reviewed(row, bool(data.get('reviewed')))
                if changed:
                    print('  %-10s %s' % ('approved' if val else 'un-approved', name[:40]))
                return self._json(200, {'ok': True, 'row': row, 'reviewed': val})
            except Exception as e:
                return self._json(400, {'ok': False, 'error': '%s: %s' % (type(e).__name__, e)})
        if route != '/api/tags':
            return self._json(404, {'ok': False, 'error': 'unknown endpoint'})
        try:
            n = int(self.headers.get('Content-Length') or 0)
            if n > 200_000:
                raise ValueError('payload too large')
            data = json.loads(self.rfile.read(n) or b'{}')
            row = data.get('row')
            if not isinstance(row, int):
                raise ValueError('row must be an integer')
            tags = clean_tags(data.get('atmosphere'),
                              allow_new=bool(data.get('allowNew')),
                              allow_empty=bool(data.get('allowEmpty')))
            name, saved, info = write_atmosphere(row, tags)
            if info.get('unchanged'):
                print('  no change %-34s' % name[:34])
            else:
                print('  saved %-34s +%s -%s' % (name[:34], info.get('added') or '-', info.get('removed') or '-'))
            return self._json(200, {'ok': True, 'row': row, 'atmosphere': saved,
                                    'original': info.get('original_list', []),
                                    'change': info})
        except Exception as e:
            return self._json(400, {'ok': False, 'error': '%s: %s' % (type(e).__name__, e)})


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--port', type=int, default=3000)
    args = ap.parse_args()
    try:
        sys.stdout.reconfigure(line_buffering=True)   # so logs show when piped
    except AttributeError:
        pass
    if not os.path.exists(CSVP):
        sys.exit('missing %s' % CSVP)
    presets = build_presets()

    # Fail loudly rather than serving 404s: confirm the paths in the CSV really
    # resolve under the directory we are about to serve.
    checked = [p for p in presets if p['path']]
    missing = [p['path'] for p in checked if not os.path.isfile(os.path.join(REPO, p['path']))]
    if missing:
        print('  ! %d preset paths do not resolve under %s' % (len(missing), REPO))
        for m in missing[:5]:
            print('      %s' % m)
    else:
        print('  self-check: all %d preset files resolve' % len(checked))

    srv = ThreadingHTTPServer(('127.0.0.1', args.port), Handler)
    print('animations hub  http://localhost:%d/animations-hub/' % args.port)
    print('serving %s' % REPO)
    print('%d presets  |  tag editing ENABLED (writes to interact-examples-tags.csv)'
          % len(presets))
    print('Ctrl-C to stop')
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        print('\nstopped')


if __name__ == '__main__':
    main()
