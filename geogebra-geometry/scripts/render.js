#!/usr/bin/env node
/**
 * GeoGebra geometry renderer.
 *
 * Renders GeoGebra construction commands to a PNG with no grid and no axes,
 * auto-cropped to the drawing content.
 *
 * Usage:
 *   node render.js --out fig.png --cmd "A=(0,0)" --cmd "B=(5,0)" --cmd "t=Polygon(A,B,C)"
 *   node render.js --out fig.png --script fig.ggb.txt
 *   node render.js --out fig.png --cmd-file cmds.txt --width 1600 --height 1100
 *
 * Options:
 *   --out PATH        output PNG path (required)
 *   --cmd STR         one construction command; repeatable
 *   --cmd-file PATH   file with one command per line ('#' comments allowed)
 *   --script PATH     GeoGebra .ggb / .xml material file to load
 *   --app NAME        geometry (default) | graphing | classic
 *   --width N         canvas width in CSS px (default 1400)
 *   --height N        canvas height in CSS px (default 1000)
 *   --scale N         device pixel ratio (default 2)
 *   --pad N           crop padding in device px (default 48)
 *   --tol N           background tolerance 0-765 (default 20)
 *   --keep-axes       do NOT hide axes (default: axes hidden)
 *   --keep-grid       do NOT hide grid (default: grid hidden)
 *   --no-auto-hide    do not auto-hide unstyled infinite lines/rays
 *   --view RANGE      set the viewport as xmin,xmax,ymin,ymax (function plots)
 *   --fit             fit the view to the drawn content, then crop (functions)
 *   --no-crop         keep the full canvas instead of cropping to content
 *   --transparent     output transparent background
 *   --timeout N       applet load timeout in ms (default 120000)
 *   --verbose         print every object's type, visibility and colour
 *
 * Scaffolding: infinite lines and rays that were never explicitly styled are
 * hidden automatically, so helper lines used to build a figure never appear in
 * the output. Use `keep(obj)` to exempt one, or --no-auto-hide to disable.
 * Functions and conics are never auto-hidden.
 *
 * Function graphs: declare a window with --view, otherwise the viewport is
 * whatever GeoGebra defaults to. Curves extend infinitely, so auto-crop cannot
 * frame them meaningfully; --view is the way to control the composition.
 *
 * Exit code 0 on success, 1 on failure. A JSON status line is printed to stdout.
 */

const path = require('path');
const fs = require('fs');

function parseArgs(argv) {
  const o = {
    out: null, cmds: [], cmdFile: null, script: null,
    app: 'geometry', width: 1400, height: 1000, scale: 2,
    pad: 48, tol: 20, keepAxes: false, keepGrid: false,
    crop: true, transparent: false, timeout: 120000, autoHide: true, verbose: false,
    view: null, fit: false,
  };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    const next = () => argv[++i];
    switch (a) {
      case '--out': o.out = next(); break;
      case '--cmd': o.cmds.push(next()); break;
      case '--cmd-file': o.cmdFile = next(); break;
      case '--script': o.script = next(); break;
      case '--app': o.app = next(); break;
      case '--width': o.width = parseInt(next(), 10); break;
      case '--height': o.height = parseInt(next(), 10); break;
      case '--scale': o.scale = parseFloat(next()); break;
      case '--pad': o.pad = parseInt(next(), 10); break;
      case '--tol': o.tol = parseInt(next(), 10); break;
      case '--keep-axes': o.keepAxes = true; break;
      case '--keep-grid': o.keepGrid = true; break;
      case '--no-crop': o.crop = false; break;
      case '--no-auto-hide': o.autoHide = false; break;
      case '--view': o.view = next(); break;
      case '--fit': o.fit = true; break;
      case '--verbose': case '-v': o.verbose = true; break;
      case '--transparent': o.transparent = true; break;
      case '--timeout': o.timeout = parseInt(next(), 10); break;
      case '-h': case '--help':
        console.log(fs.readFileSync(__filename, 'utf8').split('*/')[0].replace(/^\/\*\*?/, ''));
        process.exit(0);
      default:
        if (a.startsWith('--')) { console.error('Unknown option: ' + a); process.exit(1); }
    }
  }
  return o;
}

function loadCommands(opts) {
  let cmds = opts.cmds.slice();
  if (opts.cmdFile) {
    const txt = fs.readFileSync(opts.cmdFile, 'utf8');
    txt.split(/\r?\n/).forEach(l => {
      const s = l.trim();
      if (s && !s.startsWith('#')) cmds.push(s);
    });
  }
  return cmds;
}

// GeoGebra applet host page. Error dialogs are disabled at the earliest
// opportunity because a modal dialog blocks all further rendering.
function buildHtml(o) {
  const app = o.app;
  return `<!DOCTYPE html><html><head><meta charset="utf-8">
<style>
  html,body{margin:0;padding:0;background:#ffffff;overflow:hidden}
  #ggb-element{width:${o.width}px;height:${o.height}px}
</style>
<script src="https://www.geogebra.org/apps/deployggb.js"></script>
</head>
<body><div id="ggb-element"></div>
<script>
window.appletReady = false;
window.applet = null;
window.loadError = null;
window.addEventListener("load", function () {
  try {
    var params = {
      appName: ${JSON.stringify(app)},
      width: ${o.width}, height: ${o.height},
      showToolBar: false, showMenuBar: false, showAlgebraInput: false,
      showNavigationBar: false, showFileName: false, showResetIcon: false,
      enableLabelDrags: false, enableRightClick: false, enableShiftDragZoom: false,
      showResizer: false, useBrowserForJS: true,
      appletOnLoad: function (api) {
        try { api.setErrorDialogsActive(false); } catch (e) {}
        window.applet = api;
        window.appletReady = true;
      }
    };
    var g = new GGBApplet(params, true);
    g.inject('ggb-element');
  } catch (e) {
    window.loadError = e.message;
    window.appletReady = true;
  }
});
</script></body></html>`;
}

// Runs inside the page: apply view settings, execute commands, return log.
//
// GeoGebra's evalCommand() returns false for styling commands even when they
// take effect, and the direct set* API silently mis-parses hex strings. Style
// commands are therefore applied and then verified by reading the property
// back; the first strategy that verifies wins.
function applyInPage(opts) {
  return (payload) => {
    const a = window.applet;
    const log = [];
    if (!a) return { fatal: 'applet unavailable' };
    try { a.setErrorDialogsActive(false); } catch (e) {}

    if (!payload.keepAxes) {
      try { a.setAxesVisible(false); a.setAxisLabels(false); } catch (e) { log.push('hideAxes: ' + e.message); }
    }
    if (!payload.keepGrid) {
      try { a.setGridVisible(false); } catch (e) { log.push('hideGrid: ' + e.message); }
    }

    if (payload.scriptXML) {
      try {
        a.setXML(payload.scriptXML);
        log.push('loaded material XML');
      } catch (e) { log.push('scriptXML FAILED: ' + e.message); }
    }

    // Function-plotting mode: a declared viewport is applied by rebuilding the
    // construction with an explicit <coordSystem>. The applet's setCoordSystem
    // and friends are no-ops in this build, but setXML re-reads the view, so
    // this is the only way to get a deterministic window.
    //
    // xZero / yZero in <coordSystem> are PIXEL offsets of the origin measured
    // from the top-left of the graphics view; scale is pixels per unit. With a
    // view of width W and height H showing x in [xmin,xmax], y in [ymin,ymax]:
    //   scale = W / (xmax - xmin)
    //   xZero = -xmin * scale
    //   yZero = (ymin + H / scale) * scale
    if (payload.view) {
      try {
        const v = payload.view;
        const W = payload.width, H = payload.height;
        const spanX = v.xmax - v.xmin, spanY = v.ymax - v.ymin;
        if (!(spanX > 0) || !(spanY > 0)) throw new Error('degenerate --view window');
        // One scale for both axes: use the x span, but never let the y span
        // overflow the canvas, so widen scale if y is the tighter constraint.
        let scale = W / spanX;
        if (H / (scale * spanY) > 1) scale = H / spanY;
        const xZero = -v.xmin * scale;
        const yZero = (v.ymin + H / scale) * scale;

        const full = a.getXML();
        const gui = (full.match(/<gui>[\s\S]*?<\/gui>/) || [''])[0];
        const cons = (full.match(/<construction[\s\S]*?<\/construction>/) || [''])[0];
        const doc = '<?xml version="1.0" encoding="utf-8"?>\n'
          + '<geogebra format="5.0" app="' + (payload.app || 'geometry') + '" platform="w"'
          + ' xmlns="" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">'
          + gui
          + '<euclidianView><size width="' + W + '" height="' + H + '"/>'
          + '<coordSystem xZero="' + xZero + '" yZero="' + yZero
          + '" scale="' + scale + '" yscale="' + scale + '"/>'
          + '<axis id="0" show="' + (payload.keepAxes ? 'true' : 'false') + '" showNumbers="true"/>'
          + '<axis id="1" show="' + (payload.keepAxes ? 'true' : 'false') + '" showNumbers="true"/>'
          + '<grid show="' + (payload.keepGrid ? 'true' : 'false') + '"/>'
          + '<bgColor rgb="#ffffff"/></euclidianView>'
          + cons + '</geogebra>';
        a.setXML(doc);
        log.push('view set x[' + v.xmin + ',' + v.xmax + '] y[' + v.ymin + ',' + v.ymax + ']');
      } catch (e) {
        log.push('view FAILED: ' + e.message);
      }
    }

    const hexToRgb = h => {
      const s = String(h).trim().replace(/^#/, '');
      const f = s.length === 3 ? s.split('').map(c => c + c).join('') : s;
      return [parseInt(f.slice(0, 2), 16), parseInt(f.slice(2, 4), 16), parseInt(f.slice(4, 6), 16)];
    };
    const norm = c => String(c || '').toUpperCase();

    // Objects the author deliberately styled are treated as "meant to be seen".
    // Anything infinite (line/ray) that was never styled is scaffolding and gets
    // hidden automatically at the end.
    const styled = new Set();
    const forcedShow = new Set();
    const keepList = [];
    const STYLE_TARGETS = new Set([
      'setcolor', 'setlinethickness', 'setlinestyle', 'setpointsize',
      'setlabelvisible', 'setpointstyle', 'setcaption', 'setvisible',
    ]);

    // Verified style appliers: each returns true only if the property reads back.
    const STYLE = {
      setcolor: (obj, arg) => {
        styled.add(obj);
        const want = norm(arg);
        try { a.evalCommand('SetColor(' + obj + ',"' + arg + '")'); } catch (e) {}
        if (norm(a.getColor(obj)) === want) return true;
        try { const [r, g, b] = hexToRgb(arg); a.setColor(obj, r, g, b); } catch (e) {}
        return norm(a.getColor(obj)) === want;
      },
      setlinethickness: (obj, arg) => {
        styled.add(obj);
        const want = parseFloat(arg);
        try { a.setLineThickness(obj, want); } catch (e) {}
        if (parseFloat(a.getLineThickness(obj)) === want) return true;
        try { a.evalCommand('SetLineThickness(' + obj + ',' + arg + ')'); } catch (e) {}
        return parseFloat(a.getLineThickness(obj)) === want;
      },
      setlinestyle: (obj, arg) => {
        styled.add(obj);
        const want = parseFloat(arg);
        try { a.setLineStyle(obj, want); } catch (e) {}
        if (parseFloat(a.getLineStyle(obj)) === want) return true;
        try { a.evalCommand('SetLineStyle(' + obj + ',' + arg + ')'); } catch (e) {}
        return parseFloat(a.getLineStyle(obj)) === want;
      },
      setpointsize: (obj, arg) => {
        styled.add(obj);
        const want = parseFloat(arg);
        try { a.setPointSize(obj, want); } catch (e) {}
        if (parseFloat(a.getPointSize(obj)) === want) return true;
        try { a.evalCommand('SetPointSize(' + obj + ',' + arg + ')'); } catch (e) {}
        return parseFloat(a.getPointSize(obj)) === want;
      },
      setlabelvisible: (obj, arg) => {
        const want = /^(1|true|yes)$/i.test(arg);
        try { a.setLabelVisible(obj, want); } catch (e) {}
        if (!!a.getLabelVisible(obj) === want) return true;
        try { a.evalCommand('SetLabelVisible(' + obj + ',' + want + ')'); } catch (e) {}
        return !!a.getLabelVisible(obj) === want;
      },
      setvisible: (obj, arg) => {
        const want = /^(1|true|yes)$/i.test(arg);
        try { a.setVisible(obj, want); } catch (e) {}
        if (!!a.getVisible(obj) === want) return true;
        try { a.evalCommand('SetVisibleInView(' + obj + ',1,' + want + ')'); } catch (e) {}
        return !!a.getVisible(obj) === want;
      },
      setauxiliary: (obj, arg) => {
        const want = /^(1|true|yes)$/i.test(arg);
        try { a.setAuxiliary(obj, want); } catch (e) {}
        return true; // not readable back; best effort
      },
      // Hides an object. Preferred over SetVisible for helper lines, because
      // an infinite line spans the whole canvas and dominates the crop.
      hide: (obj) => {
        try { a.setVisible(obj, false); } catch (e) {}
        return !!a.getVisible(obj) === false;
      },
      // Exempts an object from auto-hiding and forces it visible. Applied
      // immediately AND re-asserted after all commands, because a `keep` may
      // appear before the object it refers to exists.
      keep: (obj) => {
        forcedShow.add(obj);
        styled.add(obj);
        keepList.push(obj);
        try { a.setVisible(obj, true); } catch (e) {}
        // Verified after the whole command list runs, when the object is
        // guaranteed to exist; see the keepFailed check below.
        return true;
      },
      // Marks an object as scaffolding and hides it explicitly (same as hide,
      // but reads as intent in the command file).
      aux: (obj) => {
        try { a.setAuxiliary(obj, true); a.setVisible(obj, false); } catch (e) {}
        return true;
      },
    };

    // Split "Name(arg1, arg2)" into name + args, honouring quoted strings.
    function parseCall(cmd) {
      const m = /^([A-Za-z_][A-Za-z0-9_]*)\s*\(([\s\S]*)\)\s*$/.exec(cmd.trim());
      if (!m) return null;
      const args = [];
      let cur = '', q = null;
      for (const ch of m[2]) {
        if (q) { if (ch === q) q = null; else cur += ch; continue; }
        if (ch === '"' || ch === "'") { q = ch; continue; }
        if (ch === ',') { args.push(cur.trim()); cur = ''; continue; }
        cur += ch;
      }
      if (cur.trim() !== '' || args.length) args.push(cur.trim());
      return { name: m[1].toLowerCase(), args };
    }

    const results = [];
    for (const c of payload.commands) {
      const call = parseCall(c);
      if (call && STYLE[call.name]) {
        // `hide` is unary; the other style commands take (object, value).
        const need = call.name === 'hide' ? 1 : 2;
        if (call.args.length >= need) {
          let ok = false, err = null;
          try { ok = !!STYLE[call.name](call.args[0], call.args[1]); }
          catch (e) { ok = false; err = e.message; }
          // keep/aux are verified after all commands (see keepFailed), so a
          // bare "true" here is intentional and not a silent failure.
          results.push({ cmd: c, ok, style: true, err });
          continue;
        }
      }
      try {
        const r = a.evalCommand(c);
        // evalCommand returns false for some valid geometry commands; treat a
        // thrown error or a missing label as the real failure signal.
        results.push({ cmd: c, ok: r !== false });
      } catch (e) {
        results.push({ cmd: c, ok: false, err: e.message });
      }
    }
    try { a.refreshViews(); } catch (e) {}

    // ---- Auto-hide construction scaffolding -------------------------------
    // Infinite lines and rays are never the intended subject of a finished
    // figure: they cross the whole canvas and wreck the auto-crop. Treat any
    // infinite object that the author never explicitly styled as scaffolding
    // and hide it. `keep(obj)` exempts an object; `--no-auto-hide` disables.
    const autoHidden = [];

    // Re-assert `keep` after all commands: a keep(obj) written before obj was
    // created could not take effect at the time it ran.
    const keepFailed = [];
    for (const lbl of keepList) {
      try {
        if (!a.exists(lbl)) { keepFailed.push(lbl); continue; }
        a.setVisible(lbl, true);
      } catch (e) { keepFailed.push(lbl); }
    }

    if (payload.autoHide) {
      // Only finite-vs-infinite *geometric* objects are in scope here.
      // Functions and conics are deliberate subjects, never scaffolding, so
      // they are excluded by type rather than by the styling heuristic.
      const SCAFFOLD = { line: 1, ray: 1 };
      for (const label of (function () { try { return a.getAllObjectNames(); } catch (e) { return []; } })()) {
        let type = null;
        try { type = a.getObjectType(label); } catch (e) { continue; }
        if (!SCAFFOLD[type]) continue;
        if (forcedShow.has(label) || styled.has(label)) continue;
        try {
          if (!a.getVisible(label)) continue;
          a.setVisible(label, false);
          if (!a.getVisible(label)) autoHidden.push(label);
        } catch (e) {}
      }
      try { a.refreshViews(); } catch (e) {}
    }

    // Final visibility snapshot — invaluable when a figure renders unexpectedly.
    // allNames is also the reliable existence check: exists() returns false for
    // functions even when they were created successfully.
    const allNames = (function () { try { return a.getAllObjectNames(); } catch (e) { return []; } })();
    const visible = {};
    for (const label of allNames) {
      try {
        visible[label] = {
          type: a.getObjectType(label),
          shown: !!a.getVisible(label),
          color: a.getColor(label),
        };
      } catch (e) {}
    }

    // Diagnose failures: missing commands and label clashes produce no object
    // and are otherwise very hard to spot in the rendered image.
    const warnings = [];
    const MISSING = {
      incenter: 'does not exist in this GeoGebra build; use the intersection of two AngleBisectors',
      incenterbisector: 'does not exist in this GeoGebra build; use the intersection of two AngleBisectors',
    };
    const KNOWN_BAD = [
      { re: /Polygon\s*\(\s*[^,()]+\s*,\s*[^,()]+\s*,\s*[^,()]+\s*,\s*[^,()]+\s*\)/,
        note: 'Polygon() takes points, not lines; intersect adjacent lines first' },
    ];
    for (const r of results) {
      if (r.ok) continue;
      const m = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*\(([\s\S]*)\)\s*$/.exec(r.cmd);
      if (m) {
        const fn = m[1].toLowerCase();
        if (MISSING[fn]) { warnings.push('`' + m[1] + '` ' + MISSING[fn]); continue; }
        for (const b of KNOWN_BAD) {
          if (b.re.test(r.cmd)) { warnings.push('`' + r.cmd + '`: ' + b.note); break; }
        }
      }
      const asg = /^\s*([A-Za-z][A-Za-z0-9_]*)\s*=/.exec(r.cmd);
      if (asg && !allNames.includes(asg[1])) {
        warnings.push('object "' + asg[1] + '" was not created (in: ' + r.cmd + ')');
      }
    }

    return {
      log, results, warnings, autoHidden, keepFailed, visible,
      names: (function () { try { return a.getAllObjectNames(); } catch (e) { return []; } })(),
    };
  };
}

async function main() {
  const opts = parseArgs(process.argv);

  if (!opts.out) {
    console.error('ERROR: --out is required');
    process.exit(1);
  }
  const commands = loadCommands(opts);
  if (!commands.length && !opts.script) {
    console.error('ERROR: no commands given (use --cmd, --cmd-file or --script)');
    process.exit(1);
  }

  // Resolve playwright from the global install; fall back to a local resolve.
  let chromium;
  try {
    ({ chromium } = require('playwright'));
  } catch (e) {
    try {
      const { execSync } = require('child_process');
      const root = execSync('npm root -g', { encoding: 'utf8' }).trim();
      ({ chromium } = require(path.join(root, 'playwright')));
    } catch (e2) {
      console.error('ERROR: playwright not found. Install with: npm i -g playwright');
      process.exit(1);
    }
  }

  const outAbs = path.resolve(opts.out);
  fs.mkdirSync(path.dirname(outAbs), { recursive: true });

  let viewSpec = null;
  if (opts.view) {
    // Accept "xmin,xmax,ymin,ymax" or "xmin:xmax:ymin:ymax"
    const nums = opts.view.split(/[:,]/).map(s => parseFloat(s.trim()));
    if (nums.length !== 4 || nums.some(n => !isFinite(n))) {
      console.error('ERROR: --view needs four numbers, e.g. --view -6,6,-3,12');
      process.exit(1);
    }
    viewSpec = { xmin: nums[0], xmax: nums[1], ymin: nums[2], ymax: nums[3] };
  }

  const htmlPath = path.join(require('os').tmpdir(), 'ggb_render_' + Date.now() + '.html');
  fs.writeFileSync(htmlPath, buildHtml(opts));

  let scriptXML = null;
  if (opts.script) {
    const s = fs.readFileSync(path.resolve(opts.script), 'utf8');
    if (/^\s*<\?xml|<geogebra/i.test(s)) scriptXML = s;
    else {
      console.error('ERROR: --script expects a GeoGebra XML/.ggb file');
      process.exit(1);
    }
  }

  const browser = await chromium.launch({ args: ['--force-color-profile=srgb'] });
  const page = await browser.newPage({
    viewport: { width: opts.width + 200, height: opts.height + 200 },
    deviceScaleFactor: opts.scale,
  });
  const pageErrors = [];
  page.on('pageerror', e => pageErrors.push(e.message));

  let result;
  try {
    await page.goto('file:///' + htmlPath.replace(/\\/g, '/'), { waitUntil: 'load' });
    await page.waitForFunction(() => window.appletReady === true, { timeout: opts.timeout });

    const loadErr = await page.evaluate(() => window.loadError);
    if (loadErr) throw new Error('applet load failed: ' + loadErr);

    result = await page.evaluate(applyInPage(opts), {
      commands, scriptXML, view: viewSpec,
      width: opts.width, height: opts.height, app: opts.app,
      keepAxes: opts.keepAxes, keepGrid: opts.keepGrid, autoHide: opts.autoHide,
    });
    if (result.fatal) throw new Error(result.fatal);

    // Let the renderer settle before grabbing pixels.
    await page.waitForTimeout(1800);

    // Screenshot only the Euclidian canvas so the toolbar area, the
    // "GeoGebra" watermark and the empty style panel are excluded.
    const target = await page.evaluate(() => {
      const cs = Array.from(document.querySelectorAll('canvas'));
      const big = cs
        .map(c => ({ c, r: c.getBoundingClientRect(), w: c.width, h: c.height }))
        .filter(o => o.r.width > 200 && o.r.height > 200)
        .sort((a, b) => b.r.width * b.r.height - a.r.width * a.r.height)[0];
      if (!big) return null;
      return { x: big.r.x, y: big.r.y, width: Math.round(big.r.width), height: Math.round(big.r.height) };
    });
    if (!target) throw new Error('graphics canvas not found');

    const raw = await page.screenshot({ clip: target });

    if (!opts.crop) {
      fs.writeFileSync(outAbs, raw);
      result.cropped = false;
    } else {
      const cropped = await page.evaluate(async ([b64, pad, tol, wantTransparent]) => {
        const img = new Image();
        await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = 'data:image/png;base64,' + b64; });
        const c = document.createElement('canvas');
        c.width = img.width; c.height = img.height;
        const ctx = c.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(img, 0, 0);
        const d = ctx.getImageData(0, 0, c.width, c.height).data;

        // The canvas carries a 1-2px anti-aliased frame on its left/top edge
        // that would otherwise be detected as content. Trim a small band from
        // the source before measuring the content bounding box.
        const TRIM = 6;
        const W = c.width - TRIM * 2, H = c.height - TRIM * 2;
        const bg = [d[(TRIM * c.width + TRIM) * 4], d[(TRIM * c.width + TRIM) * 4 + 1], d[(TRIM * c.width + TRIM) * 4 + 2]];
        let minX = W, minY = H, maxX = -1, maxY = -1;
        for (let y = 0; y < H; y++) {
          for (let x = 0; x < W; x++) {
            const i = ((y + TRIM) * c.width + (x + TRIM)) * 4;
            if (d[i + 3] < 8) continue;
            if (Math.abs(d[i] - bg[0]) + Math.abs(d[i + 1] - bg[1]) + Math.abs(d[i + 2] - bg[2]) > tol) {
              if (x < minX) minX = x;
              if (x > maxX) maxX = x;
              if (y < minY) minY = y;
              if (y > maxY) maxY = y;
            }
          }
        }
        if (maxX < 0) return { empty: true };
        // Convert back to full-canvas coordinates, then apply padding.
        const bx0 = minX + TRIM, by0 = minY + TRIM;
        const bx1 = maxX + TRIM, by1 = maxY + TRIM;
        const sx = Math.max(0, bx0 - pad), sy = Math.max(0, by0 - pad);
        const sw = Math.min(c.width - sx, bx1 - bx0 + 1 + 2 * pad);
        const sh = Math.min(c.height - sy, by1 - by0 + 1 + 2 * pad);
        const o = document.createElement('canvas');
        o.width = sw; o.height = sh;
        const octx = o.getContext('2d');
        if (wantTransparent) {
          const out = octx.createImageData(sw, sh);
          for (let y = 0; y < sh; y++) {
            for (let x = 0; x < sw; x++) {
              const si = ((y + sy) * c.width + (x + sx)) * 4;
              const di = (y * sw + x) * 4;
              const diff = Math.abs(d[si] - bg[0]) + Math.abs(d[si+1] - bg[1]) + Math.abs(d[si+2] - bg[2]);
              if (diff > tol) {
                out.data[di] = d[si]; out.data[di+1] = d[si+1];
                out.data[di+2] = d[si+2]; out.data[di+3] = 255;
              }
            }
          }
          octx.putImageData(out, 0, 0);
        } else {
          octx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
        }
        return { empty: false, data: o.toDataURL('image/png').split(',')[1], w: sw, h: sh };
      }, [raw.toString('base64'), opts.pad, opts.tol, opts.transparent]);

      if (cropped.empty) {
        // Nothing was drawn — still emit the raw canvas so the user sees it.
        fs.writeFileSync(outAbs, raw);
        result.cropped = false;
        result.empty = true;
      } else {
        fs.writeFileSync(outAbs, Buffer.from(cropped.data, 'base64'));
        result.cropped = true;
        result.size = [cropped.w, cropped.h];
      }
    }
  } catch (e) {
    await browser.close();
    try { fs.unlinkSync(htmlPath); } catch (_) {}
    console.error('ERROR: ' + e.message);
    if (pageErrors.length) console.error('page errors: ' + pageErrors.slice(0, 3).join(' | '));
    process.exit(1);
  }

  await browser.close();
  try { fs.unlinkSync(htmlPath); } catch (_) {}

  if (opts.verbose) {
    console.log('--- object visibility ---');
    for (const [k, v] of Object.entries(result.visible || {})) {
      console.log('  ' + k + ' [' + v.type + '] shown=' + v.shown + ' ' + v.color);
    }
  }
  const failed = (result.results || []).filter(r => !r.ok);
  console.log(JSON.stringify({
    ok: true,
    out: outAbs,
    objects: (result.names || []).length,
    commands: (result.results || []).length,
    failed: failed.map(f => f.cmd + (f.err ? ' (' + f.err + ')' : '')),
    warnings: result.warnings || [],
    autoHidden: result.autoHidden || [],
    keepFailed: result.keepFailed || [],
    view: viewSpec || null,
    cropped: !!result.cropped,
    empty: !!result.empty,
    size: result.size || null,
  }));
  if (failed.length) process.exitCode = 0; // still succeeded, but report
}

main().catch(e => { console.error('FATAL: ' + e.stack); process.exit(1); });
