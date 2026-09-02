#!/usr/bin/env python3
"""Regenerate animations-hub/index.html from interact-examples-tags.csv.

The tag data is inlined into the HTML so the hub needs no fetch() and works
straight off the static server. Run this again whenever the CSV changes:

    python3 animations-hub/build-hub.py
"""
import csv, io, json, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(HERE)
CSVP = os.path.join(REPO, 'interact-examples-tags.csv')
OUT = os.path.join(HERE, 'index.html')

# The 20 presets your team tagged by hand, before any automated tagging.
MANUAL = {
    'Card Spread', 'expand horzinotal scroll', 'sticky repeater stack',
    'horiznotal & vertical scroll', 'title folds scroll animation',
    'classic horziontal scroll', 'corner fold scroll animation', 'Shape scroll',
    '3D rotating fan', '3D room', 'Small carousel', 'acordion scroll',
    'Digital Jukebox', 'Vertical/ horizontal lanes', 'Endless Parallax',
    'horziontally scrolling image gallery', 'Accordion Scroll Vertical',
    'Wheel Carousel', '3D small carousel', 'Looped tabs with perspective',
}


def split_list(cell):
    return [t.strip() for t in cell.split(',') if t.strip()]


def parse_atmosphere(cell):
    cell = cell.strip()
    if not cell:
        return []
    try:
        v = json.loads(cell)
        if isinstance(v, list):
            return [str(x).strip() for x in v if str(x).strip()]
    except (ValueError, TypeError):
        pass
    return split_list(cell.lstrip('[').rstrip(']').replace('"', ''))


def load():
    with open(CSVP, newline='', encoding='utf-8') as fh:
        rows = list(csv.DictReader(fh))
    presets = []
    for n, r in enumerate(rows, start=1):   # n matches the CSV's physical row index
        name = r['Name of preset'].strip()
        path = r['path'].strip()
        presets.append({
            'row': n,
            'name': name,
            'path': path,
            'folder': path.split('/')[0] if path else '(no file)',
            'file': os.path.basename(path) if path else '',
            'src': '../' + '/'.join(_q(s) for s in path.split('/')) if path else '',
            'source': 'manual' if name in MANUAL else 'claude',
            'atmosphere': parse_atmosphere(r['Atmosphere']),
            'original': parse_atmosphere(r.get('atmosphere_original') or ''),
            'reviewed': (r.get('reviewed') or '').strip(),
            'motion_tag': (r.get('motion_tag') or '').strip(),
            'mood_tag': (r.get('mood_tag') or '').strip(),
            'business': split_list(r['business_type']),
            'section': split_list(r.get('section_type ') or r.get('section_type') or ''),
        })
    presets.sort(key=lambda p: (p['folder'] == '(no file)', p['folder'].lower(), p['name'].lower()))
    return presets


def _q(seg):
    from urllib.parse import quote
    return quote(seg)


HTML = r"""<meta charset="utf-8">
<title>Animations Hub</title>
<style>
  :root {
    --bg: #f6f6f7; --panel: #ffffff; --line: #e2e2e6; --ink: #16161a;
    --muted: #6b6b76; --accent: #3b5bfd; --chip: #eef0ff; --chip-ink: #2b3ec4;
    --manual: #0d7a4f; --manual-bg: #e3f5ec; --auto: #7a4fd0; --auto-bg: #f0e9fb;
    --warn: #a8620a; --warn-bg: #fdf0e0; --danger: #c0392b;
    --sidebar: 286px; --tags: 300px;
  }
  @media (prefers-color-scheme: dark) {
    :root:not([data-theme="light"]) {
      --bg: #14141a; --panel: #1c1c24; --line: #2e2e3a; --ink: #ecedf2;
      --muted: #9b9bab; --accent: #8ba0ff; --chip: #262b4d; --chip-ink: #b9c4ff;
      --manual: #6fdca8; --manual-bg: #17362a; --auto: #c9aef8; --auto-bg: #2c2242;
      --warn: #e0a558; --warn-bg: #3a2a13; --danger: #e8705f;
    }
  }
  :root[data-theme="dark"] {
    --bg: #14141a; --panel: #1c1c24; --line: #2e2e3a; --ink: #ecedf2;
    --muted: #9b9bab; --accent: #8ba0ff; --chip: #262b4d; --chip-ink: #b9c4ff;
    --manual: #6fdca8; --manual-bg: #17362a; --auto: #c9aef8; --auto-bg: #2c2242;
    --warn: #e0a558; --warn-bg: #3a2a13; --danger: #e8705f;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0; background: var(--bg); color: var(--ink);
    font: 14px/1.45 -apple-system, BlinkMacSystemFont, "Segoe UI", Inter, sans-serif;
    height: 100vh; display: grid; overflow: hidden;
    grid-template-columns: var(--sidebar) 1fr var(--tags);
    grid-template-areas: "side stage tags";
  }
  body.no-tags { grid-template-columns: var(--sidebar) 1fr 0; }

  /* ---------- sidebar ---------- */
  #side {
    grid-area: side; background: var(--panel); border-right: 1px solid var(--line);
    display: flex; flex-direction: column; min-height: 0;
  }
  .side-head { padding: 12px 14px 10px; border-bottom: 1px solid var(--line); }
  .side-head h1 { margin: 0 0 2px; font-size: 14px; letter-spacing: .01em; }
  .side-head p { margin: 0; font-size: 11px; color: var(--muted); }
  #q {
    width: 100%; margin-top: 10px; padding: 7px 9px; font-size: 13px;
    border: 1px solid var(--line); border-radius: 7px;
    background: var(--bg); color: var(--ink);
  }
  #q:focus { outline: 2px solid var(--accent); outline-offset: -1px; }
  #tagIndexBar { margin-top: 9px; font-size: 11px; }
  #drawerBar { margin-top: 5px; font-size: 11px; color: var(--muted); }
  #dictBar { margin-top: 4px; font-size: 11px; }
  #filterNote {
    display: none; margin-top: 6px; font-size: 11px; color: var(--muted);
  }
  #filterNote button {
    border: 0; background: none; color: var(--accent); cursor: pointer;
    font: inherit; text-decoration: underline; padding: 0;
  }
  #list { overflow-y: auto; flex: 1; padding: 6px 0 20px; min-height: 0; }
  .grp {
    display: flex; align-items: center; gap: 8px; width: 100%;
    padding: 9px 12px 8px; border: 0; border-top: 1px solid var(--line);
    background: var(--panel); cursor: pointer; text-align: left;
    font: inherit; font-size: 10px; letter-spacing: .09em;
    text-transform: uppercase; color: var(--muted);
    position: sticky; top: 0; z-index: 2;
  }
  #list > .grp:first-child { border-top: 0; }
  .grp:hover { color: var(--ink); }
  .grp .chev {
    flex: none; font-size: 9px; line-height: 1; transition: transform .16s ease;
  }
  .grp[aria-expanded="false"] .chev { transform: rotate(-90deg); }
  .grp .gname { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .grp .gcount { font-weight: 400; letter-spacing: 0; text-transform: none; opacity: .8; }
  .grp .gdots { display: flex; gap: 3px; flex: none; }
  .item .axisTag {
    flex: none; font-size: 9px; color: var(--warn); opacity: .9;
    max-width: 96px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }
  .item .suggTag {
    flex: none; font-size: 9px; color: var(--accent); opacity: .75; font-style: italic;
    max-width: 104px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }
  .grpitems { padding-bottom: 4px; }
  .grpitems.hidden { display: none; }
  .allToggle {
    border: 0; background: none; color: var(--accent); cursor: pointer;
    font: inherit; font-size: 11px; padding: 0; text-decoration: underline;
  }
  .item {
    display: flex; align-items: center; gap: 7px; width: 100%;
    padding: 6px 12px 6px 14px; border: 0; background: none; cursor: pointer;
    text-align: left; color: var(--ink); font: inherit; border-left: 2px solid transparent;
  }
  .item:hover { background: var(--bg); }
  .item.on { background: var(--chip); border-left-color: var(--accent); font-weight: 600; }
  .item.dead { opacity: .45; cursor: not-allowed; }
  .item .nm { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .dot { width: 6px; height: 6px; border-radius: 50%; flex: none; }
  .dot.manual { background: var(--manual); }
  .dot.claude { background: var(--auto); }

  /* ---------- stage ---------- */
  #stage { grid-area: stage; display: flex; flex-direction: column; min-width: 0; }
  #bar {
    display: flex; align-items: center; gap: 10px; padding: 9px 14px;
    background: var(--panel); border-bottom: 1px solid var(--line); min-height: 46px;
  }
  #bar .t { font-weight: 650; font-size: 14px; }
  #bar .p { font-size: 11px; color: var(--muted); font-family: ui-monospace, monospace; }
  #bar .sp { flex: 1; }
  .btn {
    border: 1px solid var(--line); background: var(--bg); color: var(--ink);
    border-radius: 7px; padding: 5px 10px; cursor: pointer; font: inherit; font-size: 12px;
  }
  .btn:hover { border-color: var(--accent); color: var(--accent); }
  #frameWrap { flex: 1; position: relative; background: var(--bg); min-height: 0; }
  iframe { width: 100%; height: 100%; border: 0; display: block; background: #fff; }
  #empty {
    position: absolute; inset: 0; display: grid; place-items: center;
    text-align: center; color: var(--muted); font-size: 13px; padding: 30px;
  }

  /* ---------- tags ---------- */
  #tags {
    grid-area: tags; background: var(--panel); border-left: 1px solid var(--line);
    overflow-y: auto; padding: 14px; min-height: 0;
  }
  body.no-tags #tags { display: none; }
  .badge {
    display: inline-flex; align-items: center; gap: 5px; padding: 3px 8px;
    border-radius: 999px; font-size: 11px; font-weight: 650;
  }
  .badge.manual { background: var(--manual-bg); color: var(--manual); }
  .badge.claude { background: var(--auto-bg); color: var(--auto); }
  .grouphead {
    width: 100%; margin: 16px 0 7px; padding: 0; border: 0; background: none;
    font: inherit; font-size: 10px; letter-spacing: .09em; text-align: left;
    text-transform: uppercase; color: var(--muted); cursor: default;
    display: flex; gap: 7px; align-items: baseline;
  }
  .grouphead .glabel { flex: 1; }
  .grouphead .gn { font-weight: 400; letter-spacing: 0; text-transform: none; }
  .grouphead.fold { cursor: pointer; }
  .grouphead.fold:hover { color: var(--ink); }
  .grouphead .chev {
    font-size: 9px; line-height: 1; transition: transform .16s ease; flex: none;
  }
  .grouphead[aria-expanded="false"] .chev { transform: rotate(-90deg); }
  .chips { display: flex; flex-wrap: wrap; gap: 5px; }
  .chips.hidden { display: none; }
  .chip {
    border: 0; background: var(--chip); color: var(--chip-ink);
    padding: 3px 8px; border-radius: 999px; font-size: 11.5px;
    cursor: pointer; font: inherit; font-size: 11.5px; line-height: 1.5;
  }
  .chip:hover { outline: 1px solid var(--accent); }
  .chip.lit { background: var(--accent); color: #fff; }
  .hint { font-size: 11px; color: var(--muted); margin-top: 18px; line-height: 1.6; }

  /* ---------- guarded tag editing ---------- */
  #lockRow {
    display: flex; align-items: center; gap: 8px; margin-top: 14px;
    padding-top: 12px; border-top: 1px solid var(--line);
  }
  #lockBtn {
    display: inline-flex; align-items: center; gap: 6px;
    border: 1px solid var(--line); background: var(--bg); color: var(--muted);
    border-radius: 999px; padding: 4px 11px; cursor: pointer; font: inherit; font-size: 11px;
  }
  #lockBtn:hover { border-color: var(--accent); color: var(--accent); }
  #lockBtn.open {
    border-color: var(--warn); color: var(--warn); background: var(--warn-bg); font-weight: 650;
  }
  #saveState { font-size: 11px; color: var(--muted); flex: 1; }
  #saveState.err { color: var(--danger); }
  #saveState.ok { color: var(--manual); }
  #undoBtn {
    border: 0; background: none; color: var(--accent); cursor: pointer;
    font: inherit; font-size: 11px; text-decoration: underline; padding: 0; display: none;
  }
  body.editing #tags { box-shadow: inset 3px 0 0 var(--warn); }
  #editBox { display: none; margin-top: 10px; }
  body.editing #editBox { display: block; }
  #editBox .row { display: flex; gap: 6px; }
  #newTag {
    flex: 1; padding: 5px 8px; font-size: 12px; border: 1px solid var(--line);
    border-radius: 6px; background: var(--bg); color: var(--ink);
  }
  #newTag:focus { outline: 2px solid var(--accent); outline-offset: -1px; }
  #addBtn {
    border: 1px solid var(--line); background: var(--bg); color: var(--ink);
    border-radius: 6px; padding: 5px 10px; cursor: pointer; font: inherit; font-size: 12px;
  }
  #addBtn:hover { border-color: var(--accent); color: var(--accent); }
  .chip .x {
    display: none; margin-left: 5px; opacity: .55; font-weight: 700;
  }
  body.editing .chips[data-row="Atmosphere"] .chip .x { display: inline; }
  .chip.arm {
    background: var(--danger); color: #fff;
  }
  .chip.arm .x { opacity: 1; }
  .warnline { font-size: 10.5px; color: var(--muted); margin-top: 7px; line-height: 1.5; }

  /* ---------- motion / mood dropdowns ---------- */
  #axisBox { margin: 10px 0 2px; }
  .axisRow {
    display: flex; align-items: center; gap: 8px; margin-bottom: 6px;
  }
  .axisRow label {
    flex: none; width: 58px; font-size: 9.5px; letter-spacing: .08em;
    text-transform: uppercase; color: var(--muted); font-weight: 600;
  }
  .axisRow select {
    flex: 1; padding: 4px 6px; font-size: 12px; font-family: inherit;
    border: 1px solid var(--line); border-radius: 6px;
    background: var(--bg); color: var(--ink);
  }
  .axisRow select:focus { outline: 2px solid var(--accent); outline-offset: -1px; }
  .axisRow select.set {
    border-color: var(--warn); background: var(--warn-bg);
    color: var(--warn); font-weight: 650;
  }
  .axisRow select.ro {
    color: var(--muted); background: var(--panel); border-style: dashed;
  }
  .axisRow select.ro:hover { border-color: var(--accent); }
  .axisNote { font-size: 10px; color: var(--muted); margin: 2px 0 0; line-height: 1.4; }
  #unTags { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 6px; }
  #unTags .rochip {
    border: 1px dashed var(--line); background: none; color: var(--muted);
    border-radius: 999px; padding: 2px 7px; font: inherit; font-size: 10.5px;
    cursor: help;
  }
  #unTags .rochip:hover { border-color: var(--accent); color: var(--accent); }
  #unTags .lbl {
    font-size: 9.5px; letter-spacing: .07em; text-transform: uppercase;
    color: var(--muted); width: 100%; margin-bottom: 1px;
  }

  /* ---------- suggested tags ---------- */
  .schip {
    border: 1px dashed var(--line); background: none; color: var(--muted);
    border-radius: 999px; padding: 3px 8px; font: inherit; font-size: 11.5px;
    cursor: pointer; line-height: 1.5;
  }
  .schip:hover { border-style: solid; border-color: var(--accent); color: var(--accent); }
  .schip .plus { opacity: .6; margin-right: 3px; }

  /* ---------- inline definitions for this preset ---------- */
  .defsub {
    font-size: 9.5px; letter-spacing: .08em; text-transform: uppercase;
    color: var(--muted); margin: 9px 0 5px;
  }
  .defsub:first-child { margin-top: 2px; }
  .defrow {
    font-size: 11.5px; line-height: 1.45; margin: 0 0 6px;
    padding-left: 8px; border-left: 2px solid var(--line);
  }
  .defrow b { color: var(--chip-ink); font-weight: 650; }
  .defrow.sug b { color: var(--muted); font-weight: 600; }
  .defrow .lf {
    display: block; color: var(--muted); font-size: 10.5px; margin-top: 1px;
  }
  .defrow:hover { border-left-color: var(--accent); }

  /* ---------- search the whole vocabulary from the panel ---------- */
  #sugSearch {
    width: 100%; margin: 7px 0 5px; padding: 5px 8px; font-size: 12px;
    border: 1px solid var(--line); border-radius: 6px;
    background: var(--bg); color: var(--ink);
  }
  #sugSearch:focus { outline: 2px solid var(--accent); outline-offset: -1px; }
  #sugHits { display: flex; flex-wrap: wrap; gap: 5px; }
  #sugHits .none { font-size: 11px; color: var(--muted); }
  .schip.has { border-style: solid; opacity: .45; cursor: default; }
  .schip.has:hover { border-color: var(--line); color: var(--muted); }

  /* ---------- change tracking ---------- */
  .edited {
    flex: none; display: inline-flex; align-items: center; color: var(--warn);
  }
  .edited svg { display: block; fill: currentColor; }
  .item.on .edited { color: var(--warn); }
  .dh .edited { margin-right: 2px; }

  /* ---------- approved / done ---------- */
  .done { flex: none; display: inline-flex; align-items: center; color: var(--manual); }
  .done svg { display: block; fill: currentColor; }
  #doneBtn {
    border: 1px solid var(--line); background: var(--bg); color: var(--muted);
    border-radius: 7px; padding: 5px 11px; cursor: pointer; font: inherit; font-size: 12px;
    display: inline-flex; align-items: center; gap: 6px;
  }
  #doneBtn:hover { border-color: var(--manual); color: var(--manual); }
  #doneBtn.on {
    background: var(--manual-bg); border-color: var(--manual);
    color: var(--manual); font-weight: 650;
  }
  #doneBtn svg { fill: currentColor; }
  #axSugg { margin-top: 8px; padding: 8px 9px; border: 1px dashed var(--accent);
    border-radius: 8px; background: rgba(99,102,241,.06); display: none; }
  #axSugg .hd { font-size: 9.5px; letter-spacing: .09em; text-transform: uppercase;
    color: var(--accent); font-weight: 700; margin-bottom: 6px; }
  #axSugg .sRow { display: flex; align-items: center; gap: 6px; margin: 4px 0; }
  #axSugg .sRow > span.ax { font-size: 10px; color: var(--muted); width: 44px; flex: none; }
  #axSugg button.sChip {
    border: 1px solid var(--accent); background: none; color: var(--accent);
    border-radius: 999px; padding: 2px 9px; cursor: pointer; font: inherit; font-size: 11px;
  }
  #axSugg button.sChip:hover { background: var(--accent); color: #fff; }
  #axSugg button.sChip.taken { border-style: solid; background: var(--accent); color: #fff; cursor: default; }
  #axSugg .conf { font-size: 9.5px; color: var(--muted); }
  #axSugg .ev { margin-top: 6px; font-size: 10.5px; line-height: 1.45; color: var(--muted); }
  #axSugg .warn2 { color: var(--warn); font-weight: 650; }
  #reviewFilter { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 7px; }
  #reviewFilter button {
    border: 1px solid var(--line); background: none; color: var(--muted);
    border-radius: 999px; padding: 2px 9px; cursor: pointer; font: inherit; font-size: 10.5px;
  }
  #reviewFilter button:hover { border-color: var(--accent); color: var(--accent); }
  #reviewFilter button.on {
    background: var(--accent); border-color: var(--accent); color: #fff; font-weight: 650;
  }
  #diffBox {
    display: none; margin-top: 12px; padding: 10px;
    border: 1px solid var(--warn); border-radius: 8px; background: var(--warn-bg);
  }
  #diffBox.show { display: block; }
  #diffBox .dh {
    font-size: 10px; letter-spacing: .08em; text-transform: uppercase;
    color: var(--warn); font-weight: 700; margin-bottom: 7px;
    display: flex; align-items: baseline; gap: 7px;
  }
  #diffBox .dh .sp { flex: 1; }
  .dchip {
    display: inline-block; padding: 2px 7px; border-radius: 999px;
    font-size: 11px; margin: 0 4px 4px 0;
  }
  .dchip.add { background: var(--manual-bg); color: var(--manual); }
  .dchip.rem { background: var(--danger); color: #fff; text-decoration: line-through; }
  .dlabel { font-size: 10.5px; color: var(--muted); margin: 4px 0 2px; }
  #revertBtn {
    border: 1px solid var(--warn); background: none; color: var(--warn);
    border-radius: 6px; padding: 3px 8px; cursor: pointer; font: inherit; font-size: 11px;
  }
  #revertBtn:hover { background: var(--warn); color: #fff; }
  #histBody { overflow-y: auto; padding: 6px 18px 20px; }
  .hrow {
    display: grid; grid-template-columns: 132px 1fr; gap: 12px;
    padding: 9px 0; border-bottom: 1px solid var(--line); font-size: 12.5px;
  }
  .hrow:last-child { border-bottom: 0; }
  .hrow .ts {
    font-size: 11px; color: var(--muted); font-family: ui-monospace, monospace;
  }
  .hrow .nm { font-weight: 600; margin-bottom: 3px; }
  .hrow .nm button {
    border: 0; background: none; color: var(--accent); cursor: pointer;
    font: inherit; font-weight: 600; padding: 0; text-decoration: underline;
  }
  kbd {
    font: inherit; font-size: 10.5px; border: 1px solid var(--line);
    border-bottom-width: 2px; border-radius: 4px; padding: 0 4px; background: var(--bg);
  }
  /* ---------- axis editor ---------- */
  #axCols { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 14px; }
  .axCol { min-width: 0; }
  .axCol h3 {
    margin: 0 0 8px; font-size: 10px; letter-spacing: .09em; text-transform: uppercase;
    display: flex; justify-content: space-between; align-items: baseline;
  }
  .axCol.motion h3 { color: var(--accent); }
  .axCol.mood h3 { color: var(--warn); }
  .axCol.other h3 { color: var(--muted); }
  .axCol h3 span { font-weight: 400; letter-spacing: 0; text-transform: none; opacity: .7; }
  .axList {
    border: 1px solid var(--line); border-radius: 8px; padding: 7px;
    min-height: 120px; max-height: 46vh; overflow-y: auto;
    display: flex; flex-wrap: wrap; gap: 4px; align-content: flex-start;
  }
  .axCol.motion .axList { border-color: var(--accent); }
  .axCol.mood .axList { border-color: var(--warn); }
  .axchip {
    border: 1px solid var(--line); background: var(--bg); color: var(--ink);
    border-radius: 999px; padding: 2px 8px; font: inherit; font-size: 11.5px;
    cursor: pointer; display: inline-flex; gap: 5px; align-items: baseline;
  }
  .axchip:hover { border-color: var(--accent); color: var(--accent); }
  .axchip .n { font-size: 10px; opacity: .6; font-variant-numeric: tabular-nums; }
  .axchip.sel { background: var(--accent); color: #fff; border-color: var(--accent); }
  #axBar {
    display: flex; align-items: center; gap: 8px; margin-top: 12px;
    padding-top: 10px; border-top: 1px solid var(--line); flex-wrap: wrap;
  }
  #axBar .sp { flex: 1; }
  #axBar .move {
    border: 1px solid var(--line); background: var(--bg); color: var(--ink);
    border-radius: 7px; padding: 4px 10px; cursor: pointer; font: inherit; font-size: 12px;
  }
  #axBar .move:hover:not(:disabled) { border-color: var(--accent); color: var(--accent); }
  #axBar .move:disabled { opacity: .4; cursor: default; }
  #axSave {
    border: 1px solid var(--manual); background: var(--manual-bg); color: var(--manual);
    border-radius: 7px; padding: 5px 13px; cursor: pointer; font: inherit;
    font-size: 12px; font-weight: 650;
  }
  #axSave:disabled { opacity: .45; cursor: default; }
  #axMsg { font-size: 11px; color: var(--muted); }
  #axMsg.err { color: var(--danger); }
  #axMsg.ok { color: var(--manual); }
  .item .orphan {
    flex: none; font-size: 11px; color: var(--danger); font-weight: 700; cursor: help;
  }

  /* ---------- atmosphere tag index (overlay) ---------- */
  #tagIndex, .overlay {
    position: fixed; inset: 0; z-index: 50; display: none;
    background: rgba(0,0,0,.45); padding: 40px 24px;
  }
  #tagIndex.open, .overlay.open { display: block; }
  #tiCard {
    max-width: 900px; margin: 0 auto; background: var(--panel);
    border: 1px solid var(--line); border-radius: 12px;
    max-height: calc(100vh - 80px); display: flex; flex-direction: column;
    box-shadow: 0 24px 60px rgba(0,0,0,.35);
  }
  #tiHead {
    padding: 16px 18px 12px; border-bottom: 1px solid var(--line);
    display: flex; gap: 12px; align-items: center; flex-wrap: wrap;
  }
  #tiHead h2 { margin: 0; font-size: 15px; }
  #tiHead .sub { font-size: 11px; color: var(--muted); flex: 1; }
  #tiHead .tihint {
    font-size: 10.5px; color: var(--accent); border: 1px dashed var(--accent);
    border-radius: 999px; padding: 2px 8px; white-space: nowrap;
  }
  #tiSearch {
    padding: 6px 9px; font-size: 13px; border: 1px solid var(--line);
    border-radius: 7px; background: var(--bg); color: var(--ink); width: 190px;
  }
  #tiSearch:focus { outline: 2px solid var(--accent); outline-offset: -1px; }
  #tiBody { overflow-y: auto; padding: 14px 18px 20px; }
  #tiBody h3 {
    margin: 4px 0 9px; font-size: 10px; letter-spacing: .09em;
    text-transform: uppercase; color: var(--muted); font-weight: 600;
  }
  #tiBody h3:not(:first-child) { margin-top: 20px; }
  .tigrid { display: flex; flex-wrap: wrap; gap: 6px; }
  .tichip {
    border: 1px solid var(--line); background: var(--chip); color: var(--chip-ink);
    border-radius: 999px; padding: 5px 11px; cursor: pointer; font: inherit;
    font-size: 12.5px; display: inline-flex; gap: 7px; align-items: baseline;
  }
  .tichip:hover { border-color: var(--accent); }
  .tichip .n { font-size: 10.5px; opacity: .7; font-variant-numeric: tabular-nums; }
  .tichip.lit { background: var(--accent); color: #fff; border-color: var(--accent); }
  .tichip.zero {
    background: none; color: var(--muted); cursor: not-allowed; opacity: .6;
  }
  .tichip.zero:hover { border-color: var(--line); }
  #tiDef {
    display: none; margin: 0 0 14px; padding: 12px 14px;
    border: 1px solid var(--accent); border-radius: 9px; background: var(--chip);
  }
  #tiDef.show { display: block; }
  #tiDef h4 {
    margin: 0 0 6px; font-size: 14px; color: var(--chip-ink);
    display: flex; gap: 8px; align-items: baseline;
  }
  #tiDef h4 .cl {
    font-size: 10px; letter-spacing: .07em; text-transform: uppercase;
    opacity: .7; font-weight: 500;
  }
  #tiDef p { margin: 4px 0; font-size: 12.5px; line-height: 1.5; }
  #tiDef .lbl { font-weight: 700; }
  #tiDef .sig { font-size: 11.5px; color: var(--muted); margin-top: 7px; }
  #tiDef .use {
    margin-top: 9px; border: 1px solid var(--accent); background: none;
    color: var(--accent); border-radius: 6px; padding: 3px 9px;
    cursor: pointer; font: inherit; font-size: 11.5px;
  }
  #tiDef .use:hover { background: var(--accent); color: #fff; }
  #tiClose {
    border: 1px solid var(--line); background: var(--bg); color: var(--ink);
    border-radius: 7px; padding: 5px 10px; cursor: pointer; font: inherit; font-size: 12px;
  }
  #tiClose:hover { border-color: var(--accent); color: var(--accent); }

  @media (max-width: 900px) {
    body { grid-template-columns: 1fr; grid-template-areas: "side" "stage" "tags"; overflow: auto; height: auto; }
    #frameWrap { height: 70vh; }
  }
</style>

<div id="side">
  <div class="side-head">
    <h1>Animations Hub</h1>
    <p id="count"></p>
    <input id="q" type="search" placeholder="Search name or tag…" autocomplete="off">
    <div id="tagIndexBar">
      <button class="allToggle" id="openTagIndex" title="Browse every atmosphere tag (t)">All atmosphere tags →</button>
      &nbsp;·&nbsp;
      <button class="allToggle" id="openHist" title="Every tag change you have made (h)">History</button>
    </div>
    <div id="dictBar">
      <button class="allToggle" id="openDict" title="What every tag means and what to look for (d)">Tag dictionary</button>
      &nbsp;·&nbsp;
      <button class="allToggle" id="openAx" title="Move tags between the motion and mood axes (a)">Edit axes</button>
    </div>
    <div id="drawerBar"><button class="allToggle" id="allToggle"></button></div>
    <div id="reviewFilter">
      <button data-rf="all" class="on">All</button>
      <button data-rf="todo">To review</button>
      <button data-rf="done">Done</button>
      <button data-rf="untagged" title="No motion tag and no mood tag yet">Untagged</button>
    </div>
    <div id="filterNote"></div>
  </div>
  <div id="list"></div>
</div>

<div id="stage">
  <div id="bar">
    <div>
      <div class="t" id="title">Pick an animation</div>
      <div class="p" id="path"></div>
    </div>
    <div class="sp"></div>
    <button class="btn" id="prev" title="Previous (↑ / k)">↑</button>
    <button class="btn" id="next" title="Next (↓ / j)">↓</button>
    <button class="btn" id="reload" title="Reload">↻</button>
    <button class="btn" id="pop" title="Open in a new tab">↗</button>
    <button class="btn" id="toggleTags" title="Hide tag panel">Tags</button>
    <button id="doneBtn" type="button" title="Mark this preset as reviewed and approved"></button>
  </div>
  <div id="frameWrap">
    <iframe id="frame" title="Animation preview" style="display:none"></iframe>
    <div id="empty">Choose a preset from the left to preview it.</div>
  </div>
</div>

<div id="tags">
  <div id="tagBody">
    <p class="hint">Tags appear here once you pick a preset.<br>
    Click any tag to find every preset sharing it.</p>
  </div>
  <div id="lockRow" style="display:none">
    <button id="lockBtn" type="button"><span id="lockIcon">🔒</span><span id="lockText">Locked</span></button>
    <span id="saveState"></span>
    <button id="undoBtn" type="button">Undo</button>
  </div>
  <div id="editBox">
    <div class="row">
      <input id="newTag" list="vocabList" placeholder="add atmosphere tag…" autocomplete="off">
      <button id="addBtn" type="button">Add</button>
    </div>
    <datalist id="vocabList"></datalist>
    <p class="warnline" id="warnline"></p>
  </div>
  <div id="diffBox">
    <div class="dh">
      <span class="edited" id="diffIcon"></span><span>Changed from original</span><span class="sp"></span>
      <button id="revertBtn" type="button">Revert</button>
    </div>
    <div id="diffContent"></div>
  </div>
</div>

<div id="axEdit" class="overlay">
  <div id="tiCard">
    <div id="tiHead">
      <h2>Edit axes</h2>
      <span class="sub" id="axSub"></span>
      <button id="axClose" type="button">Close</button>
    </div>
    <div id="tiBody">
      <div id="axCols">
        <div class="axCol motion"><h3>Motion <span id="axnMotion"></span></h3><div class="axList" id="axMotion"></div></div>
        <div class="axCol mood"><h3>Mood <span id="axnMood"></span></h3><div class="axList" id="axMood"></div></div>
        <div class="axCol other"><h3>Uncategorised <span id="axnOther"></span></h3><div class="axList" id="axOther"></div></div>
      </div>
      <div id="axBar">
        <button class="move" id="axToMotion" type="button">→ Motion</button>
        <button class="move" id="axToMood" type="button">→ Mood</button>
        <button class="move" id="axToOther" type="button">→ Uncategorised</button>
        <span class="sp"></span>
        <span id="axMsg"></span>
        <button id="axSave" type="button">Save axes</button>
      </div>
    </div>
  </div>
</div>

<div id="histIndex" class="overlay">
  <div id="tiCard">
    <div id="tiHead">
      <h2>Change history</h2>
      <span class="sub" id="histSub"></span>
      <button id="histClose" type="button">Close</button>
    </div>
    <div id="histBody"></div>
  </div>
</div>

<div id="tagIndex">
  <div id="tiCard">
    <div id="tiHead">
      <h2>Atmosphere tags</h2>
      <span class="tihint">click a tag for its definition</span>
      <span class="sub" id="tiSub"></span>
      <input id="tiSearch" type="search" placeholder="filter tags…" autocomplete="off">
      <button id="tiClose" type="button">Close</button>
    </div>
    <div id="tiBody"><div id="tiDef"></div></div>
  </div>
</div>

<script>
const PRESETS = __DATA__;
const VOCAB_ALL = __VOCAB__;

const EDIT_ICON = '<svg viewBox="0 0 16 16" width="11" height="11" aria-hidden="true">'
  + '<path d="M11.4 1.7a1.35 1.35 0 0 1 1.9 0l1 1a1.35 1.35 0 0 1 0 1.9l-1 1-2.9-2.9 1-1z"/>'
  + '<path d="M9.6 3.5l2.9 2.9-6.4 6.4-3.5.6.6-3.5L9.6 3.5z"/></svg>';

const DONE_ICON = '<svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">'
  + '<path d="M6.2 12.3L2.4 8.5l1.3-1.3 2.5 2.5 6-6L13.5 5l-7.3 7.3z"/></svg>';
const $ = s => document.querySelector(s);
const listEl = $('#list'), qEl = $('#q'), frame = $('#frame');
let current = -1, tagFilter = null, view = PRESETS.slice();
let bust = Date.now();   // cache-buster seed for iframe loads
let reviewFilter = 'all';   // all | todo | done | untagged

/* ---- collapsible folder drawers ---- */
const STORE = 'animationsHub.collapsedFolders';
let collapsed = new Set();
try {
  const saved = localStorage.getItem(STORE);
  if (saved) collapsed = new Set(JSON.parse(saved));
} catch (e) { /* private window / blocked storage - just start expanded */ }

function saveDrawers() {
  try { localStorage.setItem(STORE, JSON.stringify([...collapsed])); } catch (e) {}
}
function toggleDrawer(folder) {
  collapsed.has(folder) ? collapsed.delete(folder) : collapsed.add(folder);
  saveDrawers(); renderList();
}
function setAllDrawers(collapse) {
  collapsed = collapse ? new Set(PRESETS.map(p => p.folder)) : new Set();
  saveDrawers(); renderList();
}

const norm = s => s.toLowerCase();
const cntAtmosphere = t => PRESETS.filter(p => p.atmosphere.some(x => norm(x) === norm(t))).length;
const allTags = p => [...p.atmosphere, ...p.business, ...p.section];

function matches(p, q) {
  if (reviewFilter === 'done' && !p.reviewed) return false;
  if (reviewFilter === 'todo' && p.reviewed) return false;
  // "untagged" = neither axis assigned yet, i.e. still to be given a main tag pair
  if (reviewFilter === 'untagged' && (p.motion_tag || p.mood_tag)) return false;
  if (tagFilter && !allTags(p).some(t => norm(t) === norm(tagFilter))) return false;
  if (!q) return true;
  const hay = [p.name, p.path, ...allTags(p)].join(' ').toLowerCase();
  return q.split(/\s+/).filter(Boolean).every(w => hay.includes(w));
}

function renderList() {
  const q = norm(qEl.value.trim());
  const searching = !!q || !!tagFilter;   // while filtering, force every drawer open
  view = PRESETS.filter(p => matches(p, q));
  listEl.innerHTML = '';

  const order = [];
  const groups = new Map();
  view.forEach(p => {
    if (!groups.has(p.folder)) { groups.set(p.folder, []); order.push(p.folder); }
    groups.get(p.folder).push(p);
  });

  order.forEach(folder => {
    const items = groups.get(folder);
    const shut = !searching && collapsed.has(folder);
    const head = document.createElement('button');
    head.className = 'grp';
    head.setAttribute('aria-expanded', String(!shut));
    head.innerHTML =
      '<span class="chev">▼</span><span class="gname"></span>' +
      '<span class="gdots"></span><span class="gcount"></span>';
    head.querySelector('.gname').textContent = folder;
    head.querySelector('.gcount').textContent = items.length;
    const man = items.filter(x => x.source === 'manual').length;
    if (man) {
      const d = document.createElement('span');
      d.className = 'dot manual';
      d.title = man + ' manually tagged';
      head.querySelector('.gdots').appendChild(d);
    }
    head.title = shut ? 'Open ' + folder : 'Close ' + folder;
    head.onclick = () => toggleDrawer(folder);
    listEl.appendChild(head);

    const box = document.createElement('div');
    box.className = 'grpitems' + (shut ? ' hidden' : '');
    items.forEach(p => {
      const b = document.createElement('button');
      b.className = 'item' + (p.path ? '' : ' dead') + (PRESETS.indexOf(p) === current ? ' on' : '');
      b.innerHTML = '<span class="dot ' + p.source + '"></span><span class="nm"></span>' +
        (isEdited(p) ? '<span class="edited" title="edited - tags differ from the original">' + EDIT_ICON + '</span>' : '') +
        (p.reviewed ? '<span class="done" title="approved ' + p.reviewed + '">' + DONE_ICON + '</span>' : '');
      if (p.motion_orphan || p.mood_orphan) {
        const w = document.createElement('span');
        w.className = 'orphan';
        w.textContent = '\u26A0';
        const bits = [];
        if (p.motion_orphan) bits.push('motion “' + p.motion_tag + '” is no longer a motion tag');
        if (p.mood_orphan) bits.push('mood “' + p.mood_tag + '” is no longer a mood tag');
        w.title = bits.join('\n');
        b.insertBefore(w, b.querySelector('.edited') || b.querySelector('.done') || null);
      }
      const ax = [p.motion_tag, p.mood_tag].filter(Boolean);
      if (ax.length) {
        const mt = document.createElement('span');
        mt.className = 'axisTag';
        mt.textContent = ax.join(' · ');
        mt.title = (p.motion_tag ? 'motion: ' + p.motion_tag : '') +
                   (p.motion_tag && p.mood_tag ? '\n' : '') +
                   (p.mood_tag ? 'mood: ' + p.mood_tag : '');
        b.insertBefore(mt, b.querySelector('.edited') || b.querySelector('.done') || null);
      } else {
        const s = SUGG[String(p.row)];
        if (s) {                                 // proposed, not applied
          const st = document.createElement('span');
          st.className = 'suggTag';
          st.textContent = [s.motion, s.mood].filter(Boolean).join(' · ');
          st.title = 'Suggested (not applied) — motion: ' + s.motion +
                     ' (' + s.motion_conf + '), mood: ' + s.mood + ' (' + s.mood_conf + ')' +
                     '\nOpen the preset to accept.';
          b.insertBefore(st, b.querySelector('.edited') || b.querySelector('.done') || null);
        }
      }
      b.querySelector('.nm').textContent = p.name;
      b.title = (p.path || 'No file in this repo') + (isEdited(p) ? '  (edited)' : '');
      b.onclick = () => select(PRESETS.indexOf(p));
      box.appendChild(b);
    });
    listEl.appendChild(box);
  });

  const nEdited = PRESETS.filter(isEdited).length;
  const nDone = PRESETS.filter(p => p.reviewed).length;
  $('#count').textContent = view.length + ' of ' + PRESETS.length + ' presets' +
    (nEdited ? '  ·  ' + nEdited + ' edited' : '') +
    (nDone ? '  ·  ' + nDone + ' done' : '') +
    (PRESETS.filter(x => x.motion_orphan || x.mood_orphan).length
      ? '  ·  \u26A0 ' + PRESETS.filter(x => x.motion_orphan || x.mood_orphan).length + ' orphaned' : '');
  const allShut = order.length > 0 && order.every(f => collapsed.has(f));
  const at = $('#allToggle');
  at.textContent = allShut ? 'Open all' : 'Close all';
  at.onclick = () => setAllDrawers(!allShut);
  $('#drawerBar').style.display = searching ? 'none' : 'block';
  const note = $('#filterNote');
  if (tagFilter) {
    note.style.display = 'block';
    note.innerHTML = 'Filtered by tag <b></b> — ';
    note.querySelector('b').textContent = '“' + tagFilter + '”';
    const clr = document.createElement('button');
    clr.textContent = 'clear';
    clr.onclick = () => { tagFilter = null; renderList(); if (current >= 0) renderTags(PRESETS[current]); };
    note.appendChild(clr);
  } else note.style.display = 'none';
}

/* Business type and Section type stay folded away by default - only Atmosphere
   is open, since that is the axis you actually work in. */
const TG_STORE = 'animationsHub.collapsedTagGroups';
let tagGroupShut = new Set(['Business type', 'Section type']);
try {
  const s = localStorage.getItem(TG_STORE);
  if (s) tagGroupShut = new Set(JSON.parse(s));
} catch (e) {}

function toggleTagGroup(label) {
  tagGroupShut.has(label) ? tagGroupShut.delete(label) : tagGroupShut.add(label);
  try { localStorage.setItem(TG_STORE, JSON.stringify([...tagGroupShut])); } catch (e) {}
  if (current >= 0) renderTags(PRESETS[current]);
}

function chipRow(label, items, total, foldable) {
  if (!items.length) return '';
  const shut = foldable && tagGroupShut.has(label);
  const head = '<button class="grouphead' + (foldable ? ' fold' : '') + '" data-g="' + label + '"' +
    (foldable ? ' aria-expanded="' + String(!shut) + '"' : '') + '>' +
    (foldable ? '<span class="chev">▼</span>' : '') +
    '<span class="glabel">' + label + '</span><span class="gn">' + items.length +
    (total ? ' of ' + total : '') + '</span></button>';
  return head + '<div class="chips' + (shut ? ' hidden' : '') + '" data-row="' + label + '"></div>';
}

function renderTags(p) {
  const body = $('#tagBody');
  body.innerHTML =
    '<span class="badge ' + p.source + '">' +
      (p.source === 'manual' ? '● Tagged manually' : '● Tagged by Claude') + '</span>' +
    '<div id="axisBox">' +
      '<div id="axSugg"></div>' +
      '<div class="axisRow"><label>Motion</label><select id="selMotion"></select></div>' +
      '<div class="axisRow"><label>Mood</label><select id="selMood"></select></div>' +
      '<div class="axisRow"><label>Other</label><select id="selOther" class="ro"></select></div>' +
      '<p class="axisNote" id="axisNote"></p>' +
      '<div id="unTags"></div>' +
    '</div>' +
    chipRow('Atmosphere', p.atmosphere) +
    '<div class="grouphead"><span class="glabel">Suggested</span>' +
      '<span class="gn">nearest ' + suggestionsFor(p).length + '</span></div>' +
    '<div class="chips" data-row="Suggested"></div>' +
    '<input id="sugSearch" type="search" placeholder="search all ' + VOCAB_ALL.length +
      ' tags\u2026" autocomplete="off">' +
    '<div id="sugHits"></div>' +
    chipRow('Business type', p.business, 43, true) +
    chipRow('Section type', p.section, 0, true) +
    defBlock(p);
  const fill = (label, items, removable) => {
    const row = body.querySelector('[data-row="' + label + '"]');
    if (!row) return;
    items.forEach(t => {
      const c = document.createElement('button');
      const isArmed = removable && armed === t;
      c.className = 'chip' + (tagFilter && norm(t) === norm(tagFilter) ? ' lit' : '') + (isArmed ? ' arm' : '');
      c.appendChild(document.createTextNode(isArmed ? t + '  remove?' : t));
      if (removable) {
        const x = document.createElement('span');
        x.className = 'x';
        x.textContent = '×';
        x.title = 'Remove this tag';
        x.onclick = e => { e.stopPropagation(); armRemove(p, t); };
        c.appendChild(x);
      }
      const def = DICT[norm(t)];
      if (def) c.title = def.means + '  |  Look for: ' + def.look_for;
      c.onclick = () => {
        tagFilter = (tagFilter && norm(tagFilter) === norm(t)) ? null : t;
        renderList(); renderTags(p);
      };
      row.appendChild(c);
    });
  };
  paintAxes(p);
  fillSuggested(p, body);
  wireSugSearch(p, body);
  fillDefs(p, body);
  fill('Atmosphere', p.atmosphere, true);
  fill('Business type', p.business, false);
  fill('Section type', p.section, false);
  body.querySelectorAll('.grouphead.fold').forEach(h => {
    h.onclick = () => toggleTagGroup(h.dataset.g);
  });
  const h = document.createElement('p');
  h.className = 'hint';
  h.innerHTML = 'Click a tag to filter the list.<br><kbd>↑</kbd><kbd>↓</kbd> or <kbd>j</kbd><kbd>k</kbd> flip · <kbd>/</kbd> search · <kbd>t</kbd> all tags';
  body.appendChild(h);
  $('#lockRow').style.display = 'flex';
  paintLock();
  renderDiff(p);
  paintDone();
}

function select(i) {
  const p = PRESETS[i];
  if (!p) return;
  current = i;
  if (collapsed.has(p.folder)) { collapsed.delete(p.folder); saveDrawers(); }
  $('#title').textContent = p.name;
  $('#path').textContent = p.path || 'no file in this repo';
  renderTags(p);
  if (p.src) {
    // Cache-buster: a bare path can be served from a stale disk-cache entry
    // (including a cached 404 from a previous broken run). A fresh query string
    // guarantees the request actually reaches the server.
    frame.src = p.src + (p.src.includes('?') ? '&' : '?') + 'v=' + (++bust);
    frame.style.display = 'block';
    $('#empty').style.display = 'none';
  } else {
    frame.removeAttribute('src');
    frame.style.display = 'none';
    $('#empty').style.display = 'grid';
    $('#empty').textContent = '“' + p.name + '” has no matching file in this repo, so there is nothing to preview. Its tags are still shown on the right.';
  }
  renderList();
  const on = listEl.querySelector('.item.on');
  if (on) on.scrollIntoView({ block: 'nearest' });
}

function step(d) {
  if (!view.length) return;
  const vi = view.indexOf(PRESETS[current]);
  const next = vi < 0 ? 0 : Math.min(view.length - 1, Math.max(0, vi + d));
  select(PRESETS.indexOf(view[next]));
}

/* ================= axis editor =================
   Move labels between motion / mood / uncategorised and save to
   main-tag-axes.json. A label leaving an axis does NOT clear presets already
   assigned to it - those become "orphans", flagged with a red marker in the
   sidebar so you can see and fix them deliberately. */
let axDraft = null, axSel = new Set();

function openAx() {
  axDraft = {
    motion: (AXES.motion || []).slice(),
    mood: (AXES.mood || []).slice(),
    other: (AXES.uncategorised || []).slice(),
  };
  axSel = new Set();
  $('#axEdit').classList.add('open');
  renderAx();
}
function closeAx() { $('#axEdit').classList.remove('open'); }

function renderAx() {
  const map = { motion: '#axMotion', mood: '#axMood', other: '#axOther' };
  Object.keys(map).forEach(k => {
    const box = $(map[k]);
    box.innerHTML = '';
    axDraft[k].slice().sort((a, b) => cntAtmosphere(b) - cntAtmosphere(a) || a.localeCompare(b))
      .forEach(t => {
        const c = document.createElement('button');
        c.className = 'axchip' + (axSel.has(t) ? ' sel' : '');
        c.innerHTML = '<span></span><span class="n"></span>';
        c.firstChild.textContent = t;
        c.lastChild.textContent = cntAtmosphere(t);
        const def = DICT[norm(t)];
        if (def) c.title = def.means;
        c.onclick = () => { axSel.has(t) ? axSel.delete(t) : axSel.add(t); renderAx(); };
        box.appendChild(c);
      });
  });
  $('#axnMotion').textContent = axDraft.motion.length;
  $('#axnMood').textContent = axDraft.mood.length;
  $('#axnOther').textContent = axDraft.other.length;
  const n = axSel.size;
  ['#axToMotion', '#axToMood', '#axToOther'].forEach(id => { $(id).disabled = !n; });
  $('#axSub').textContent = n ? n + ' selected — now pick a destination'
                              : 'click tags to select, then move them';
  const changed = JSON.stringify(axDraft.motion) !== JSON.stringify(AXES.motion || []) ||
                  JSON.stringify(axDraft.mood) !== JSON.stringify(AXES.mood || []);
  $('#axSave').disabled = !changed;
  if (!changed) $('#axMsg').textContent = '';
}

function axMove(dest) {
  ['motion', 'mood', 'other'].forEach(k => {
    axDraft[k] = axDraft[k].filter(t => !axSel.has(t));
  });
  axDraft[dest] = axDraft[dest].concat([...axSel]);
  axSel = new Set();
  renderAx();
}

$('#openAx').onclick = openAx;
$('#axClose').onclick = closeAx;
$('#axEdit').onclick = e => { if (e.target.id === 'axEdit') closeAx(); };
$('#axToMotion').onclick = () => axMove('motion');
$('#axToMood').onclick = () => axMove('mood');
$('#axToOther').onclick = () => axMove('other');
$('#axSave').onclick = async () => {
  if (!serverEditable) { $('#axMsg').textContent = 'needs the local server'; $('#axMsg').className = 'err'; return; }
  try {
    const r = await fetch('/api/axes', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ motion: axDraft.motion, mood: axDraft.mood })
    });
    const d = await r.json();
    const msg = $('#axMsg');
    if (!d.ok) { msg.textContent = d.error || 'save failed'; msg.className = 'err'; return; }
    AXES = d.axes;
    const orph = d.orphans || [];
    // refresh presets so orphan flags come back from the server
    try {
      const pr = await fetch('/api/presets', { cache: 'no-store' });
      const pd = await pr.json();
      if (pd.ok) pd.presets.forEach((f, i) => Object.assign(PRESETS[i], f));
    } catch (e) {}
    renderAx(); renderList();
    // set the message AFTER renderAx, which clears it when the draft is in sync
    msg.textContent = 'saved' + (orph.length ? ' — \u26A0 ' + orph.length + ' preset value(s) now orphaned' : '');
    msg.className = orph.length ? 'err' : 'ok';
    if (current >= 0) renderTags(PRESETS[current]);
  } catch (e) {
    $('#axMsg').textContent = 'server unreachable'; $('#axMsg').className = 'err';
  }
};

/* ================= motion / mood axis tags =================
   Two closed dropdowns backed by main-tag-axes.json. Values a preset already
   carries as an atmosphere tag are grouped first, since those are the likely
   picks; the rest stay available because these are curated categories, not
   necessarily applied tags. The third select is deliberately disabled - it just
   lets you review the 40 labels that sit in neither axis. */
let AXES = { motion: [], mood: [], uncategorised: [] };

function fillAxisSelect(el, axis, p, current) {
  const list = AXES[axis] || [];
  const have = new Set(p.atmosphere.map(norm));
  el.innerHTML = '';
  const blank = document.createElement('option');
  blank.value = ''; blank.textContent = '— none —';
  el.appendChild(blank);
  const group = (label, items) => {
    if (!items.length) return;
    const g = document.createElement('optgroup');
    g.label = label;
    items.forEach(t => {
      const o = document.createElement('option');
      o.value = t; o.textContent = t;
      g.appendChild(o);
    });
    el.appendChild(g);
  };
  group('on this preset', list.filter(t => have.has(t)));
  group('other ' + axis + ' tags', list.filter(t => !have.has(t)));
  if (current && !list.includes(norm(current))) {      // orphan - keep it visible
    const g = document.createElement('optgroup');
    g.label = 'no longer a ' + axis + ' tag';
    const o = document.createElement('option');
    o.value = norm(current); o.textContent = norm(current) + '  \u26A0';
    g.appendChild(o); el.appendChild(g);
  }
  el.value = current ? norm(current) : '';
  el.classList.toggle('set', !!el.value);
  el.onchange = () => setAxis(p, axis, el.value);
}

/* Claude's suggested main tags, for presets that have none yet. Read-only until
   clicked; clicking goes through the same guarded /api/axis call as the dropdowns. */
function paintSugg(p) {
  const box = $('#axSugg');
  if (!box) return;
  const s = SUGG[String(p.row)];
  if (!s) { box.style.display = 'none'; return; }
  box.style.display = 'block';
  box.innerHTML = '';
  const hd = document.createElement('div');
  hd.className = 'hd';
  hd.textContent = 'suggested' + (s.off_candidate ? ' \u00b7 outside this preset\u2019s own tags' : '');
  box.appendChild(hd);

  [['motion', s.motion, s.motion_conf, s.motion_runner_up],
   ['mood', s.mood, s.mood_conf, s.mood_runner_up]].forEach(([axis, tag, conf, ru]) => {
    if (!tag) return;
    const row = document.createElement('div');
    row.className = 'sRow';
    const lab = document.createElement('span');
    lab.className = 'ax'; lab.textContent = axis;
    row.appendChild(lab);
    const b = document.createElement('button');
    b.className = 'sChip';
    b.textContent = tag;
    const live = axis === 'motion' ? p.motion_tag : p.mood_tag;
    if (norm(live || '') === norm(tag)) {
      b.classList.add('taken'); b.title = 'already set'; b.disabled = true;
    } else {
      b.title = 'Set ' + axis + ' to \u201c' + tag + '\u201d';
      b.onclick = () => setAxis(p, axis, tag);
    }
    row.appendChild(b);
    const c = document.createElement('span');
    c.className = 'conf';
    c.textContent = conf + (ru ? ' \u00b7 else ' + ru : '');
    row.appendChild(c);
    box.appendChild(row);
  });

  if (s.evidence) {
    const e = document.createElement('div');
    e.className = 'ev'; e.textContent = s.evidence;
    box.appendChild(e);
  }
  if (s.revised) {
    const r = document.createElement('div');
    r.className = 'ev'; r.textContent = '\u21bb ' + s.revised;
    box.appendChild(r);
  }
  if (s.conflict) {
    const k = document.createElement('div');
    k.className = 'ev warn2'; k.textContent = '\u26A0 ' + s.conflict;
    box.appendChild(k);
  }
}

async function setAxis(p, axis, tag) {
  if (!serverEditable) { status('read-only — start server.py', 'err'); renderTags(p); return; }
  try {
    const r = await fetch('/api/axis', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ row: p.row, axis: axis, tag: tag })
    });
    const d = await r.json();
    if (!d.ok) { status(d.error || 'could not save', 'err'); renderTags(p); return; }
    if (axis === 'motion') p.motion_tag = d.tag; else p.mood_tag = d.tag;
    status(d.tag ? axis + ' tag: ' + d.tag : axis + ' tag cleared', d.tag ? 'ok' : '');
    renderList(); renderTags(p);
  } catch (e) { status('server unreachable', 'err'); }
}

function paintAxes(p) {
  const m = $('#selMotion'), d = $('#selMood'), o = $('#selOther');
  if (!m) return;
  fillAxisSelect(m, 'motion', p, p.motion_tag);
  fillAxisSelect(d, 'mood', p, p.mood_tag);
  // read-only review list
  const un = (AXES.uncategorised || []);
  const have = new Set(p.atmosphere.map(norm));
  const onThis = un.filter(t => have.has(t));
  o.innerHTML = '';
  const head = document.createElement('option');
  head.textContent = onThis.length
    ? onThis.length + ' uncategorised tag' + (onThis.length === 1 ? '' : 's') + ' on this preset'
    : 'none of the ' + un.length + ' uncategorised tags here';
  o.appendChild(head);
  const g1 = document.createElement('optgroup'); g1.label = 'on this preset';
  onThis.forEach(t => { const x=document.createElement('option'); x.textContent=t; g1.appendChild(x); });
  if (onThis.length) o.appendChild(g1);
  const g2 = document.createElement('optgroup'); g2.label = 'all uncategorised (' + un.length + ')';
  un.forEach(t => { const x=document.createElement('option'); x.textContent=t; g2.appendChild(x); });
  o.appendChild(g2);
  o.selectedIndex = 0;
  o.title = 'Review only — pick one to read its definition; it is never assigned';
  o.onchange = () => {
    const t = norm(o.value || o.options[o.selectedIndex].textContent);
    o.selectedIndex = 0;                       // nothing sticks - this is a viewer
    const def = DICT[t];
    const n = cntAtmosphere(t);
    status(def ? t + ' — ' + def.means + '  (' + n + ' presets)'
               : t + ' — ' + n + ' presets', '');
  };
  paintSugg(p);
  const box = $('#unTags');
  if (box) {
    box.innerHTML = '';
    if (onThis.length) {
      const l = document.createElement('span');
      l.className = 'lbl';
      l.textContent = 'uncategorised on this preset · ' + onThis.length;
      box.appendChild(l);
      onThis.forEach(t => {
        const c = document.createElement('span');
        c.className = 'rochip';
        c.textContent = t;
        const def = DICT[norm(t)];
        c.title = (def ? def.means + '  |  Look for: ' + def.look_for + '  |  ' : '') +
                  cntAtmosphere(t) + ' presets  —  in neither axis';
        box.appendChild(c);
      });
    }
  }
  $('#axisNote').textContent = AXES.motion.length
    ? AXES.motion.length + ' motion · ' + AXES.mood.length + ' mood · ' + un.length + ' uncategorised'
    : 'axis lists unavailable (needs the local server)';
}

/* ================= suggested tags =================
   Ranked by animations-hub/suggest-tags.py: PPMI co-occurrence + cosine, scored
   against the tags this preset already has. Tags you removed by hand are never
   suggested back. Regenerate with:
       python3 animations-hub/suggest-tags.py --k 12 */
let SUGGEST = {};
let sugQuery = '';   // survives re-renders so typing is not interrupted

function suggestionsFor(p) {
  const raw = SUGGEST[String(p.row)] || [];
  const have = new Set(p.atmosphere.map(norm));
  return raw.filter(x => !have.has(norm(x.tag)));
}

function fillSuggested(p, body) {
  const row = body.querySelector('[data-row="Suggested"]');
  if (!row) return;
  suggestionsFor(p).forEach(x => {
    const c = document.createElement('button');
    c.className = 'schip';
    c.innerHTML = '<span class="plus">+</span>';
    c.appendChild(document.createTextNode(x.tag));
    c.title = 'closeness ' + x.score + (unlocked ? ' - click to add' : ' - unlock editing to add');
    c.onclick = () => addSuggested(p, x.tag);
    row.appendChild(c);
  });
}

function wireSugSearch(p, body) {
  const inp = body.querySelector('#sugSearch');
  const hits = body.querySelector('#sugHits');
  if (!inp || !hits) return;
  inp.value = sugQuery;
  const draw = () => {
    const q = norm(inp.value.trim());
    hits.innerHTML = '';
    if (!q) return;
    const have = new Set(p.atmosphere.map(norm));
    // search the WHOLE vocabulary - excluding what is already listed above only
    // made "elegant" report "no match", which was plainly wrong
    const found = VOCAB_ALL.filter(t => t.includes(q)).slice(0, 24);
    if (!found.length) {
      const n = document.createElement('span');
      n.className = 'none';
      n.textContent = 'no tag matches \u201c' + inp.value.trim() + '\u201d';
      hits.appendChild(n);
      return;
    }
    found.forEach(t => {
      const already = have.has(t);
      const c = document.createElement('button');
      c.className = 'schip' + (already ? ' has' : '');
      if (!already) c.innerHTML = '<span class="plus">+</span>';
      c.appendChild(document.createTextNode(t));
      const d = DICT[t];
      c.title = already ? 'already applied'
              : (d ? d.means + '  |  Look for: ' + d.look_for : 'add this tag');
      if (!already) c.onclick = () => { sugQuery = ''; addSuggested(p, t); };
      hits.appendChild(c);
    });
  };
  inp.oninput = () => { sugQuery = inp.value; draw(); };
  inp.onkeydown = e => {
    if (e.key === 'Escape') { inp.value = ''; sugQuery = ''; draw(); }
    if (e.key === 'Enter') {
      e.preventDefault();
      const first = hits.querySelector('.schip:not(.has)');
      if (first) first.click();
    }
  };
  draw();
}

async function addSuggested(p, tag) {
  if (!unlocked) { status('unlock editing to accept a suggestion', 'err'); return; }
  if (p.atmosphere.some(t => norm(t) === norm(tag))) return;
  undoSnap = { row: p.row, tags: p.atmosphere.slice() };
  if (await postTags(p, p.atmosphere.concat([tag]), { allowNew: true })) renderList();
  renderTags(p);
}

(async function loadSuggestions() {
  try {
    const r = await fetch('tag-suggestions.json', { cache: 'no-store' });
    if (!r.ok) return;
    const d = await r.json();
    SUGGEST = d.suggestions || {};
    if (current >= 0) renderTags(PRESETS[current]);
  } catch (e) { /* no suggestions file - the row simply does not appear */ }
})();

/* ================= approved / done =================
   A one-click toggle, unlike tag editing: it adds no risk of losing data, it is
   trivially reversible, and it is the action you take most often. It stamps a
   timestamp into the CSV's `reviewed` column and logs to the history. */
function paintDone() {
  const btn = $('#doneBtn');
  if (current < 0) { btn.style.display = 'none'; return; }
  const p = PRESETS[current];
  btn.style.display = 'inline-flex';
  btn.classList.toggle('on', !!p.reviewed);
  btn.innerHTML = DONE_ICON + '<span>' + (p.reviewed ? 'Done' : 'Mark done') + '</span>';
  btn.title = p.reviewed
    ? 'Approved ' + p.reviewed + ' - click to un-approve'
    : 'Mark this preset as reviewed and approved';
  if (!serverEditable) {
    btn.title = 'Needs the local server (python3 animations-hub/server.py)';
  }
}

$('#doneBtn').onclick = async () => {
  if (current < 0) return;
  const p = PRESETS[current];
  if (!serverEditable) { status('read-only - start server.py to approve', 'err'); return; }
  const want = !p.reviewed;
  try {
    const r = await fetch('/api/reviewed', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ row: p.row, reviewed: want })
    });
    const d = await r.json();
    if (!d.ok) { status(d.error || 'could not save', 'err'); return; }
    p.reviewed = d.reviewed;
    status(want ? 'marked done' : 'un-marked', want ? 'ok' : '');
    paintDone(); renderList();
  } catch (e) {
    status('server unreachable', 'err');
  }
};

/* ================= change tracking =================
   The CSV carries an atmosphere_original column. It stays empty until a row is
   first edited, at which point the server copies the pre-edit tags into it. So
   "has an original that differs from now" == "you changed this one". */
function isEdited(p) {
  const o = p.original || [];
  if (!o.length) return false;
  const a = p.atmosphere || [];
  return o.length !== a.length || o.some(t => !a.includes(t)) || a.some(t => !o.includes(t));
}

function renderDiff(p) {
  const box = $('#diffBox');
  if (!isEdited(p)) { box.classList.remove('show'); return; }
  const o = p.original, a = p.atmosphere;
  const added = a.filter(t => !o.includes(t));
  const removed = o.filter(t => !a.includes(t));
  const c = $('#diffContent');
  c.innerHTML = '';
  const line = (label, items, cls) => {
    if (!items.length) return;
    const l = document.createElement('div');
    l.className = 'dlabel';
    l.textContent = label;
    c.appendChild(l);
    const w = document.createElement('div');
    items.forEach(t => {
      const s = document.createElement('span');
      s.className = 'dchip ' + cls;
      s.textContent = t;
      w.appendChild(s);
    });
    c.appendChild(w);
  };
  $('#diffIcon').innerHTML = EDIT_ICON;
  line('added', added, 'add');
  line('removed', removed, 'rem');
  const base = document.createElement('div');
  base.className = 'dlabel';
  base.style.marginTop = '7px';
  base.textContent = 'original (' + o.length + '): ' + o.join(', ');
  c.appendChild(base);
  box.classList.add('show');
}

$('#revertBtn').onclick = async () => {
  if (current < 0) return;
  const p = PRESETS[current];
  if (!isEdited(p)) return;
  if (!serverEditable) { status('read-only', 'err'); return; }
  if (!confirm('Revert “' + p.name + '” to its original tags?\n\nnow:      ' +
      p.atmosphere.join(', ') + '\noriginal: ' + p.original.join(', '))) return;
  undoSnap = { row: p.row, tags: p.atmosphere.slice() };
  if (await postTags(p, p.original.slice(), { allowNew: true })) renderList();
  renderTags(p);
};

/* ---- change history overlay ---- */
async function openHist() {
  $('#histIndex').classList.add('open');
  const body = $('#histBody');
  body.innerHTML = '<p class="hint">Loading…</p>';
  try {
    const r = await fetch('/api/history', { cache: 'no-store' });
    const d = await r.json();
    const items = (d && d.entries) || [];
    $('#histSub').textContent = items.length
      ? items.length + ' change' + (items.length === 1 ? '' : 's') + ', newest first'
      : '';
    if (!items.length) {
      body.innerHTML = '<p class="hint">No changes recorded yet.<br>' +
        'Every add or remove you make from here is appended to ' +
        '<code>animations-hub/tag-history.csv</code>.</p>';
      return;
    }
    body.innerHTML = '';
    items.forEach(e => {
      const row = document.createElement('div');
      row.className = 'hrow';
      const left = document.createElement('div');
      left.className = 'ts';
      left.textContent = (e.timestamp || '').replace('T', '  ');
      const right = document.createElement('div');
      const nm = document.createElement('div');
      nm.className = 'nm';
      const jump = document.createElement('button');
      jump.textContent = e.preset;
      jump.onclick = () => {
        const p = PRESETS.find(x => String(x.row) === String(e.row));
        if (p) { closeHist(); qEl.value = ''; tagFilter = null; select(PRESETS.indexOf(p)); }
      };
      nm.appendChild(jump);
      right.appendChild(nm);
      const mk = (label, val, cls) => {
        if (!val) return;
        val.split(',').map(s => s.trim()).filter(Boolean).forEach(t => {
          const s = document.createElement('span');
          s.className = 'dchip ' + cls;
          s.textContent = (cls === 'add' ? '+ ' : '− ') + t;
          right.appendChild(s);
        });
      };
      mk('added', e.added, 'add');
      mk('removed', e.removed, 'rem');
      if (!e.added && !e.removed) {
        const a = document.createElement('span');
        a.className = 'dchip ' + (e.action === 'approved' ? 'add' : 'rem');
        a.style.textDecoration = 'none';
        a.textContent = e.action === 'approved' ? '\u2713 marked done'
                       : e.action === 'un-approved' ? '\u2715 un-marked'
                       : e.action;
        right.appendChild(a);
      }
      row.appendChild(left); row.appendChild(right);
      body.appendChild(row);
    });
  } catch (err) {
    body.innerHTML = '<p class="hint">History needs the local server ' +
      '(<code>python3 animations-hub/server.py</code>).</p>';
    $('#histSub').textContent = '';
  }
}
function closeHist() { $('#histIndex').classList.remove('open'); }
$('#openHist').onclick = openHist;
$('#histClose').onclick = closeHist;
$('#histIndex').onclick = e => { if (e.target.id === 'histIndex') closeHist(); };

/* ================= atmosphere tag index =================
   Every atmosphere tag in one place, with how many presets carry it. Picking one
   applies exactly the same filter as clicking a chip in the side panel. */
function atmosphereCounts() {
  const c = new Map();
  PRESETS.forEach(p => p.atmosphere.forEach(t => {
    const k = norm(t);
    c.set(k, (c.get(k) || 0) + 1);
  }));
  return c;
}

function renderTagIndex() {
  const counts = atmosphereCounts();
  const q = norm($('#tiSearch').value.trim());
  const used = [...counts.entries()].filter(([t]) => !q || t.includes(q));
  used.sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  const unused = VOCAB_ALL
    .map(norm)
    .filter(t => !counts.has(t) && (!q || t.includes(q)))
    .sort();

  const body = $('#tiBody');
  const keep = $('#tiDef');
  body.innerHTML = '';
  if (keep) body.appendChild(keep);
  const section = (title, rows, zero) => {
    if (!rows.length) return;
    const h = document.createElement('h3');
    h.textContent = title;
    body.appendChild(h);
    const g = document.createElement('div');
    g.className = 'tigrid';
    rows.forEach(entry => {
      const t = zero ? entry : entry[0];
      const n = zero ? 0 : entry[1];
      const b = document.createElement('button');
      b.className = 'tichip' + (zero ? ' zero' : '') +
        (tagFilter && norm(tagFilter) === t ? ' lit' : '');
      b.innerHTML = '<span></span><span class="n"></span>';
      b.firstChild.textContent = t;
      b.lastChild.textContent = zero ? '—' : n;
      b.title = zero ? 'in vocabulary.json but not used by any preset'
                     : n + ' preset' + (n === 1 ? '' : 's');
      b.onclick = () => showDef(t);
      g.appendChild(b);
    });
    body.appendChild(g);
  };
  section('In use · ' + used.length + ' tags', used, false);
  section('Available but unused · ' + unused.length, unused, true);
  if (!used.length && !unused.length) {
    body.innerHTML = '<p class="hint">No tag matches that.</p>';
  }
  $('#tiSub').textContent = counts.size + ' tags in use across ' + PRESETS.length +
    ' presets · ' + VOCAB_ALL.length + ' allowed by vocabulary.json' +
    (tagFilter ? ' · filtering by “' + tagFilter + '”' : '');
}

let DICT = {}, SUGG = {};

(async function loadDict() {
  try {
    const rs = await fetch('main-tag-suggestions.json', { cache: 'no-store' });
    if (rs.ok) SUGG = (await rs.json()).by_row || {};
  } catch (e) { /* suggestions optional */ }
  try {
    const r = await fetch('tag-dictionary.json', { cache: 'no-store' });
    if (!r.ok) return;
    DICT = (await r.json()).entries || {};
    if (current >= 0) renderTags(PRESETS[current]);
  } catch (e) { /* dictionary optional */ }
})();

function showDef(tag) {
  const d = DICT[norm(tag)];
  const box = $('#tiDef');
  if (!d) { box.classList.remove('show'); return; }
  const s = d.signature || {};
  const bits = [];
  if (s.keeps_company_with && s.keeps_company_with.length) bits.push('travels with ' + s.keeps_company_with.join(', '));
  if (s.typical_triggers && s.typical_triggers.length) bits.push('triggers ' + s.typical_triggers.join(', '));
  if (s.median_duration_ms) bits.push('median ' + s.median_duration_ms + 'ms');
  if (s.pct_real_3d >= 40) bits.push(s.pct_real_3d + '% genuinely 3D');
  if (s.pct_infinite_loop >= 25) bits.push(s.pct_infinite_loop + '% loop forever');
  if (s.pct_dark_palette >= 45) bits.push(s.pct_dark_palette + '% dark palette');
  box.innerHTML = '';
  const h = document.createElement('h4');
  h.innerHTML = '<span></span><span class="cl"></span>';
  h.firstChild.textContent = tag;
  h.lastChild.textContent = d.cluster_name || '';
  box.appendChild(h);
  const mk = (label, text) => {
    const el = document.createElement('p');
    el.innerHTML = '<span class="lbl"></span> ';
    el.firstChild.textContent = label;
    el.appendChild(document.createTextNode(text));
    box.appendChild(el);
  };
  mk('Means:', d.means);
  mk('Look for:', d.look_for);
  if (bits.length) {
    const sg = document.createElement('div');
    sg.className = 'sig';
    sg.textContent = bits.join(' · ') + (s.examples && s.examples.length ? '  —  e.g. ' + s.examples.join(', ') : '');
    box.appendChild(sg);
  }
  const btn = document.createElement('button');
  btn.className = 'use';
  btn.textContent = 'Filter presets by “' + tag + '”';
  btn.onclick = () => pickTag(tag);
  box.appendChild(btn);
  box.classList.add('show');
  box.scrollIntoView({ block: 'nearest' });
}

function defBlock(p) {
  if (!Object.keys(DICT).length) return '';
  const applied = p.atmosphere.filter(t => DICT[norm(t)]);
  const sugg = suggestionsFor(p).map(x => x.tag).filter(t => DICT[norm(t)]);
  if (!applied.length && !sugg.length) return '';
  const shut = tagGroupShut.has('Definitions');
  return '<button class="grouphead fold" data-g="Definitions" aria-expanded="' + String(!shut) + '">' +
    '<span class="chev">\u25BC</span><span class="glabel">What these mean</span>' +
    '<span class="gn">' + (applied.length + sugg.length) + '</span></button>' +
    '<div class="chips' + (shut ? ' hidden' : '') + '" data-row="Definitions" ' +
    'style="display:block"></div>';
}

function fillDefs(p, body) {
  const box = body.querySelector('[data-row="Definitions"]');
  if (!box) return;
  const applied = p.atmosphere.filter(t => DICT[norm(t)]);
  const sugg = suggestionsFor(p).map(x => x.tag).filter(t => DICT[norm(t)]);
  const section = (label, list, cls) => {
    if (!list.length) return;
    const h = document.createElement('div');
    h.className = 'defsub';
    h.textContent = label;
    box.appendChild(h);
    list.forEach(t => {
      const d = DICT[norm(t)];
      const row = document.createElement('div');
      row.className = 'defrow' + (cls ? ' ' + cls : '');
      row.innerHTML = '<b></b> <span class="mn"></span><span class="lf"></span>';
      row.querySelector('b').textContent = t;
      row.querySelector('.mn').textContent = d.means;
      row.querySelector('.lf').textContent = 'Look for: ' + d.look_for;
      row.title = (d.cluster_name ? d.cluster_name + ' — ' : '') + d.means;
      box.appendChild(row);
    });
  };
  section('applied \u00b7 ' + applied.length, applied, '');
  section('suggested \u00b7 ' + sugg.length, sugg, 'sug');
}

function pickTag(t) {
  tagFilter = (tagFilter && norm(tagFilter) === norm(t)) ? null : t;
  closeTagIndex();
  qEl.value = '';
  renderList();
  if (current >= 0) renderTags(PRESETS[current]);
}

function openTagIndex() {
  $('#tagIndex').classList.add('open');
  $('#tiSearch').value = '';
  renderTagIndex();
  $('#tiSearch').focus();
}
function closeTagIndex() { $('#tagIndex').classList.remove('open'); }

$('#openTagIndex').onclick = openTagIndex;
$('#openDict').onclick = () => {
  openTagIndex();
  // land on a definition straight away so the feature explains itself
  const first = (current >= 0 && PRESETS[current].atmosphere[0]) || 'graceful';
  showDef(first);
};
$('#tiClose').onclick = closeTagIndex;
$('#tiSearch').oninput = renderTagIndex;
$('#tagIndex').onclick = e => { if (e.target.id === 'tagIndex') closeTagIndex(); };

document.querySelectorAll('#reviewFilter button').forEach(btn => {
  btn.onclick = () => {
    reviewFilter = btn.dataset.rf;
    document.querySelectorAll('#reviewFilter button')
      .forEach(b => b.classList.toggle('on', b === btn));
    renderList();
  };
});

qEl.oninput = renderList;
$('#prev').onclick = () => step(-1);
$('#next').onclick = () => step(1);
$('#reload').onclick = () => { if (current >= 0) { frame.src = 'about:blank'; setTimeout(() => select(current), 40); } };
$('#pop').onclick = () => { if (frame.src) window.open(frame.src, '_blank'); };
$('#toggleTags').onclick = () => document.body.classList.toggle('no-tags');

addEventListener('keydown', e => {
  if (e.key === 'Escape' && $('#tagIndex').classList.contains('open')) {
    closeTagIndex(); return;
  }
  if (e.key === 'Escape' && $('#histIndex').classList.contains('open')) {
    closeHist(); return;
  }
  if (e.key === 'Escape' && $('#axEdit').classList.contains('open')) {
    closeAx(); return;
  }
  if (e.target.tagName === 'INPUT') { if (e.key === 'Escape') e.target.blur(); return; }
  if (e.key === '/') { e.preventDefault(); qEl.focus(); return; }
  if (e.key === 't') { e.preventDefault(); openTagIndex(); return; }
  if (e.key === 'h') { e.preventDefault(); openHist(); return; }
  if (e.key === 'd') { e.preventDefault(); $('#openDict').click(); return; }
  if (e.key === 'a') { e.preventDefault(); openAx(); return; }
  if (e.key === 'ArrowDown' || e.key === 'j') { e.preventDefault(); step(1); }
  if (e.key === 'ArrowUp' || e.key === 'k') { e.preventDefault(); step(-1); }
});

/* ================= guarded atmosphere editing =================
   Three locks stand between a stray click and a CSV write:
     1. the panel is read-only until you explicitly unlock it (with a confirm)
     2. removing a tag needs two clicks - the first only arms it
     3. a tag outside vocabulary.json needs a second confirm to be accepted
   The server enforces the same vocabulary rule and refuses to empty a row. */
let serverEditable = false, unlocked = false, armed = null, armTimer = null;
let vocab = [], undoSnap = null;

function status(msg, cls) {
  const el = $('#saveState');
  el.textContent = msg || '';
  el.className = cls || '';
}

function paintLock() {
  const btn = $('#lockBtn');
  if (!serverEditable) {
    $('#lockIcon').textContent = '🔒';
    $('#lockText').textContent = 'Read-only';
    btn.classList.remove('open');
    btn.title = 'Start animations-hub/server.py to enable tag editing';
    document.body.classList.remove('editing');
    if (!$('#saveState').textContent) status('static server — tags not editable');
    return;
  }
  $('#lockIcon').textContent = unlocked ? '🔓' : '🔒';
  $('#lockText').textContent = unlocked ? 'Editing' : 'Locked';
  btn.classList.toggle('open', unlocked);
  btn.title = unlocked ? 'Lock editing again' : 'Unlock to add or remove atmosphere tags';
  document.body.classList.toggle('editing', unlocked);
  $('#warnline').textContent = unlocked
    ? 'Writes go straight to interact-examples-tags.csv. Off-vocabulary tags need confirming; removing needs two clicks.'
    : '';
  $('#undoBtn').style.display = (unlocked && undoSnap) ? 'inline' : 'none';
}

function disarm() {
  armed = null;
  if (armTimer) { clearTimeout(armTimer); armTimer = null; }
}

async function postTags(p, tags, extra) {
  try {
    const r = await fetch('/api/tags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(Object.assign({ row: p.row, atmosphere: tags }, extra || {}))
    });
    const d = await r.json();
    if (!d.ok) { status(d.error || 'save failed', 'err'); return false; }
    p.atmosphere = d.atmosphere;
    if (Array.isArray(d.original)) p.original = d.original;   // baseline the server just captured
    status('Saved to CSV · ' + d.atmosphere.length + ' tags', 'ok');
    return true;
  } catch (e) {
    status('server unreachable — not saved', 'err');
    return false;
  }
}

async function armRemove(p, tag) {
  if (!unlocked) { status('unlock first', 'err'); return; }
  if (armed !== tag) {                     // first click only arms it
    disarm(); armed = tag;
    status('click × again to remove “' + tag + '”');
    armTimer = setTimeout(() => { disarm(); status(''); renderTags(p); }, 4000);
    renderTags(p);
    return;
  }
  disarm();
  const next = p.atmosphere.filter(t => t !== tag);
  if (!next.length) {
    status('a preset must keep at least one tag', 'err');
    renderTags(p); return;
  }
  undoSnap = { row: p.row, tags: p.atmosphere.slice() };
  if (await postTags(p, next, { allowNew: true })) renderList();
  renderTags(p);
}

async function addTag(p) {
  if (!unlocked) { status('unlock first', 'err'); return; }
  const input = $('#newTag');
  const t = input.value.trim().replace(/\s+/g, ' ').toLowerCase();
  if (!t) return;
  if (p.atmosphere.some(x => norm(x) === t)) { status('already tagged', 'err'); return; }
  if (vocab.length && !vocab.includes(t)) {
    if (!confirm('“' + t + '” is not in vocabulary.json.\n\nOff-vocabulary terms make filtering less reliable. Add it anyway?')) {
      status('not added'); return;
    }
  }
  undoSnap = { row: p.row, tags: p.atmosphere.slice() };
  if (await postTags(p, p.atmosphere.concat([t]), { allowNew: true })) {
    input.value = '';
    renderList();
  }
  renderTags(p);
}

$('#lockBtn').onclick = () => {
  if (!serverEditable) {
    alert('This page is served statically, so tags cannot be edited.\n\nRun:  python3 animations-hub/server.py\nthen reload this page.');
    return;
  }
  if (!unlocked) {
    if (!confirm('Unlock tag editing?\n\nAdding or removing a tag writes immediately to interact-examples-tags.csv.')) return;
    unlocked = true; status('editing unlocked');
  } else {
    unlocked = false; disarm(); status('');
  }
  paintLock();
  if (current >= 0) renderTags(PRESETS[current]);
};

$('#addBtn').onclick = () => { if (current >= 0) addTag(PRESETS[current]); };
$('#newTag').onkeydown = e => {
  if (e.key === 'Enter') { e.preventDefault(); if (current >= 0) addTag(PRESETS[current]); }
};
$('#undoBtn').onclick = async () => {
  if (!undoSnap) return;
  const p = PRESETS.find(x => x.row === undoSnap.row);
  if (!p) return;
  const tags = undoSnap.tags.slice();
  undoSnap = null;
  if (await postTags(p, tags, { allowNew: true })) renderList();
  if (current >= 0) renderTags(PRESETS[current]);
  paintLock();
};

/* Ask the server for live data. If it answers, editing is possible and the tag
   values shown come from the CSV rather than the copy baked in at build time. */
(async function connect() {
  try {
    const r = await fetch('/api/presets', { cache: 'no-store' });
    if (!r.ok) throw new Error('no api');
    const d = await r.json();
    if (!d.ok || !Array.isArray(d.presets) || d.presets.length !== PRESETS.length) throw new Error('shape');
    vocab = d.vocabulary || [];
    if (d.axes) AXES = d.axes;
    d.presets.forEach((fresh, i) => Object.assign(PRESETS[i], fresh));
    serverEditable = true;
    const dl = $('#vocabList');
    dl.innerHTML = '';
    vocab.forEach(t => { const o = document.createElement('option'); o.value = t; dl.appendChild(o); });
    status('');
    renderList();
    if (current >= 0) renderTags(PRESETS[current]);
  } catch (e) {
    serverEditable = false;
  }
  paintLock();
})();

paintDone();
renderList();
</script>
"""


def main():
    if not os.path.exists(CSVP):
        sys.exit('missing ' + CSVP)
    presets = load()
    vocab = []
    vp = os.path.join(HERE, 'vocabulary.json')
    if os.path.exists(vp):
        with open(vp, encoding='utf-8') as fh:
            vocab = sorted({t.strip().lower() for t in json.load(fh).get('atmosphere', []) if t.strip()})
    html = (HTML
            .replace('__DATA__', json.dumps(presets, ensure_ascii=False, separators=(',', ':')))
            .replace('__VOCAB__', json.dumps(vocab, ensure_ascii=False, separators=(',', ':'))))
    with open(OUT, 'w', encoding='utf-8') as fh:
        fh.write(html)
    manual = sum(1 for p in presets if p['source'] == 'manual')
    nofile = sum(1 for p in presets if not p['path'])
    print('wrote %s' % os.path.relpath(OUT, REPO))
    print('  presets: %d  (manual %d / claude %d)' % (len(presets), manual, len(presets) - manual))
    print('  atmosphere vocabulary inlined: %d terms' % len(vocab))
    print('  without a previewable file: %d' % nofile)
    print('  size: %.1f KB' % (os.path.getsize(OUT) / 1024))


if __name__ == '__main__':
    main()
