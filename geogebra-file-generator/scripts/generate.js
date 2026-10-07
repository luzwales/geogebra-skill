#!/usr/bin/env node
/**
 * geogebra-file-generator: Generates native .ggb files from GeoGebra commands.
 *
 * Usage:
 *   node generate.js --out model.ggb --cmd-file cmds.txt
 *   node generate.js --out parabola.ggb --view -6,6,-4,8 --preview parabola.png --cmd "f(x)=x^2-3"
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

function parseArgs(argv) {
  const o = {
    out: null,
    preview: null,
    xmlOut: null,
    cmdFile: null,
    cmds: [],
    app: 'classic', // classic | geometry | graphing
    width: 1200,
    height: 800,
    view: null,
    axes: null,      // boolean or null (auto)
    grid: false,
    algebra: true,
    toolbar: true,
    menubar: true,
    timeout: 30000,
    verbose: false,
    json: false,
  };

  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    const n = argv[i + 1];
    switch (a) {
      case '--out': case '-o': o.out = n; i++; break;
      case '--preview': case '-p': o.preview = n; i++; break;
      case '--xml': o.xmlOut = n; i++; break;
      case '--cmd-file': case '-f': o.cmdFile = n; i++; break;
      case '--cmd': case '-c': o.cmds.push(n); i++; break;
      case '--app': o.app = n; i++; break;
      case '--width': o.width = parseInt(n, 10); i++; break;
      case '--height': o.height = parseInt(n, 10); i++; break;
      case '--view': o.view = n; i++; break;
      case '--axes': o.axes = true; break;
      case '--no-axes': o.axes = false; break;
      case '--grid': o.grid = true; break;
      case '--no-grid': o.grid = false; break;
      case '--algebra': o.algebra = true; break;
      case '--no-algebra': o.algebra = false; break;
      case '--toolbar': o.toolbar = true; break;
      case '--no-toolbar': o.toolbar = false; break;
      case '--menubar': o.menubar = true; break;
      case '--no-menubar': o.menubar = false; break;
      case '--timeout': o.timeout = parseInt(n, 10); i++; break;
      case '--verbose': case '-v': o.verbose = true; break;
      case '--json': o.json = true; break;
      case '-h': case '--help':
        printHelp();
        process.exit(0);
      default:
        if (a.startsWith('--')) {
          console.error('Unknown option: ' + a);
          process.exit(1);
        }
    }
  }
  return o;
}

function printHelp() {
  console.log(`
geogebra-file-generator: Generates native .ggb files from commands.

Options:
  --out, -o PATH         Output .ggb file path (required)
  --preview, -p PATH     Also save a PNG preview screenshot
  --xml PATH             Export raw geogebra.xml file
  --cmd, -c "EXPR"       GeoGebra command (can be specified multiple times)
  --cmd-file, -f PATH    File containing GeoGebra commands, one per line (# for comments)
  --app NAME             App mode: classic (default), geometry, graphing
  --view XMIN,XMAX,YMIN,YMAX Set viewport bounds
  --axes / --no-axes     Show/hide coordinate axes (default: true for classic/graphing)
  --grid / --no-grid     Show/hide coordinate grid (default: false)
  --algebra / --no-algebra Show/hide algebra panel in the saved file (default: true)
  --toolbar / --no-toolbar Show/hide toolbar in the saved file (default: true)
  --menubar / --no-menubar Show/hide menubar in the saved file (default: true)
  --width N              Canvas width (default: 1200)
  --height N             Canvas height (default: 800)
  --json                 Print result as JSON
  --verbose, -v          Show detailed execution log
`);
}

function loadCommands(opts) {
  const cmds = opts.cmds.slice();
  if (opts.cmdFile) {
    const content = fs.readFileSync(path.resolve(opts.cmdFile), 'utf8');
    content.split(/\r?\n/).forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        cmds.push(trimmed);
      }
    });
  }
  return cmds;
}

function buildHtml(opts) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8">
<style>
  html,body{margin:0;padding:0;background:#ffffff;overflow:hidden}
  #ggb-element{width:${opts.width}px;height:${opts.height}px}
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
      appName: ${JSON.stringify(opts.app)},
      width: ${opts.width},
      height: ${opts.height},
      showToolBar: ${opts.toolbar},
      showMenuBar: ${opts.menubar},
      showAlgebraInput: ${opts.algebra},
      showResetIcon: false,
      enableLabelDrags: true,
      enableRightClick: true,
      enableShiftDragZoom: true,
      useBrowserForJS: true,
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

function hexToRgb(h) {
  const s = String(h).replace(/^#/, '');
  if (s.length === 3) {
    return [parseInt(s[0] + s[0], 16), parseInt(s[1] + s[1], 16), parseInt(s[2] + s[2], 16)];
  }
  if (s.length === 6) {
    return [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16)];
  }
  return null;
}

async function main() {
  const opts = parseArgs(process.argv);

  if (!opts.out) {
    console.error('ERROR: --out <file.ggb> is required');
    process.exit(1);
  }

  const commands = loadCommands(opts);
  if (!commands.length) {
    console.error('ERROR: No commands provided. Use --cmd or --cmd-file');
    process.exit(1);
  }

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

  let viewSpec = null;
  if (opts.view) {
    const nums = opts.view.split(/[:,]/).map(s => parseFloat(s.trim()));
    if (nums.length !== 4 || nums.some(n => !isFinite(n))) {
      console.error('ERROR: --view needs four numbers: xmin,xmax,ymin,ymax');
      process.exit(1);
    }
    viewSpec = { xmin: nums[0], xmax: nums[1], ymin: nums[2], ymax: nums[3] };
  }

  const outGgb = path.resolve(opts.out);
  fs.mkdirSync(path.dirname(outGgb), { recursive: true });

  const htmlPath = path.join(os.tmpdir(), 'ggb_gen_' + Date.now() + '.html');
  fs.writeFileSync(htmlPath, buildHtml(opts));

  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: opts.width + 100, height: opts.height + 100 }
  });

  try {
    await page.goto('file:///' + htmlPath.replace(/\\/g, '/'), { waitUntil: 'load' });
    await page.waitForFunction(() => window.appletReady === true, { timeout: opts.timeout });

    const loadErr = await page.evaluate(() => window.loadError);
    if (loadErr) throw new Error('Applet load failed: ' + loadErr);

    // Apply commands and configurations
    const evalResult = await page.evaluate(async (payload) => {
      const a = window.applet;
      const log = [];
      const results = [];
      if (!a) return { fatal: 'applet not initialized' };

      try { a.setErrorDialogsActive(false); } catch (e) {}

      // Axes & grid
      const showAxes = payload.axes !== null ? payload.axes : (payload.app !== 'geometry');
      try { a.setAxesVisible(showAxes, showAxes); } catch (e) {}
      try { a.setGridVisible(!!payload.grid); } catch (e) {}

      // Helper styling functions
      const STYLE = {
        setcolor: (obj, val) => {
          const c = val.replace(/["']/g, '');
          const rgb = payload.hexMap[c.toLowerCase()];
          if (rgb) { a.setColor(obj, rgb[0], rgb[1], rgb[2]); }
          else { a.evalCommand('SetColor(' + obj + ',"' + c + '")'); }
          return true;
        },
        setlinethickness: (obj, val) => { a.setLineThickness(obj, parseFloat(val)); return true; },
        setlinestyle: (obj, val) => { a.setLineStyle(obj, parseInt(val, 10)); return true; },
        setpointsize: (obj, val) => { a.setPointSize(obj, parseFloat(val)); return true; },
        setpointstyle: (obj, val) => { a.setPointStyle(obj, parseInt(val, 10)); return true; },
        setfilling: (obj, val) => { a.setFilling(obj, parseFloat(val)); return true; },
        setlabelvisible: (obj, val) => { a.setLabelVisible(obj, String(val).trim() === 'true'); return true; },
        setvisible: (obj, val) => { a.setVisible(obj, String(val).trim() === 'true'); return true; },
        setcaption: (obj, val) => { a.setCaption(obj, String(val).replace(/["']/g, '')); return true; },
      };

      for (const cmd of payload.commands) {
        const m = /^([A-Za-z_][A-Za-z0-9_]*)\s*\(([\s\S]*)\)\s*$/.exec(cmd.trim());
        let handledStyle = false;
        if (m) {
          const fn = m[1].toLowerCase();
          if (STYLE[fn]) {
            const rawArgs = m[2].split(',').map(s => s.trim());
            if (rawArgs.length >= 2) {
              try {
                STYLE[fn](rawArgs[0], rawArgs[1]);
                results.push({ cmd, ok: true, style: true });
                handledStyle = true;
              } catch (err) {
                results.push({ cmd, ok: false, err: err.message });
                handledStyle = true;
              }
            }
          }
        }

        if (!handledStyle) {
          try {
            const r = a.evalCommand(cmd);
            results.push({ cmd, ok: r !== false });
          } catch (err) {
            results.push({ cmd, ok: false, err: err.message });
          }
        }
      }

      // Apply viewport if specified via XML rebuild
      if (payload.view) {
        try {
          const v = payload.view;
          const W = payload.width;
          const H = payload.height;
          const scale = W / (v.xmax - v.xmin);
          const xZero = -v.xmin * scale;
          const yZero = (v.ymin + H / scale) * scale;

          let xml = a.getXML();
          const repl = '<coordSystem xZero="' + xZero.toFixed(4) +
            '" yZero="' + yZero.toFixed(4) +
            '" scale="' + scale.toFixed(4) +
            '" yscale="' + scale.toFixed(4) + '"/>';
          if (xml.includes('<coordSystem')) {
            xml = xml.replace(/<coordSystem[^>]*\/>/, repl);
          } else {
            xml = xml.replace(/(<euclidianView[^>]*>)/, '$1\n\t' + repl);
          }
          a.setXML(xml);
          log.push('rebuilt XML with custom coordSystem');
        } catch (err) {
          log.push('view rebuild failed: ' + err.message);
        }
      }

      // Retrieve full XML and Base64 of .ggb archive
      const xmlString = a.getXML();
      const ggbBase64 = await new Promise((resolve) => {
        a.getBase64((data) => resolve(data));
      });

      const allObjects = (function() {
        try { return a.getAllObjectNames(); } catch (e) { return []; }
      })();

      return {
        log,
        results,
        allObjects,
        xmlString,
        ggbBase64,
      };
    }, {
      commands,
      view: viewSpec,
      app: opts.app,
      axes: opts.axes,
      grid: opts.grid,
      width: opts.width,
      height: opts.height,
      hexMap: {
        '#1c7ed6': [28, 126, 214],
        '#e8590c': [232, 89, 12],
        '#2b8a3e': [43, 138, 62],
        '#c92a2a': [201, 42, 42],
        '#e03131': [224, 49, 49],
        '#7048e8': [112, 72, 232],
        '#0b7285': [11, 114, 133],
        '#f08c00': [240, 140, 0],
        '#adb5bd': [173, 181, 189],
        '#862e9c': [134, 46, 156],
        '#d6336c': [214, 51, 108],
        '#5c940d': [92, 148, 13],
      }
    });

    if (evalResult.fatal) {
      throw new Error(evalResult.fatal);
    }

    if (!evalResult.ggbBase64) {
      throw new Error('Failed to retrieve GGB base64 data from GeoGebra applet');
    }

    // Write the .ggb file (ZIP binary)
    const ggbBuffer = Buffer.from(evalResult.ggbBase64, 'base64');
    fs.writeFileSync(outGgb, ggbBuffer);

    // Write optional XML file
    if (opts.xmlOut) {
      fs.writeFileSync(path.resolve(opts.xmlOut), evalResult.xmlString, 'utf8');
    }

    // Generate optional preview image
    let previewSaved = false;
    if (opts.preview) {
      await page.waitForTimeout(1000);
      const prevPath = path.resolve(opts.preview);
      fs.mkdirSync(path.dirname(prevPath), { recursive: true });
      const target = await page.evaluate(() => {
        const cs = Array.from(document.querySelectorAll('canvas'));
        const big = cs
          .map(c => ({ c, r: c.getBoundingClientRect(), w: c.width, h: c.height }))
          .filter(o => o.r.width > 200 && o.r.height > 200)
          .sort((a, b) => b.r.width * b.r.height - a.r.width * a.r.height)[0];
        if (!big) return null;
        return { x: big.r.x, y: big.r.y, width: Math.round(big.r.width), height: Math.round(big.r.height) };
      });
      if (target) {
        await page.screenshot({ path: prevPath, clip: target });
      } else {
        await page.screenshot({ path: prevPath });
      }
      previewSaved = true;
    }

    const outputReport = {
      file: outGgb,
      sizeBytes: ggbBuffer.length,
      objectCount: evalResult.allObjects.length,
      objects: evalResult.allObjects,
      commandsExecuted: evalResult.results.length,
      preview: previewSaved ? path.resolve(opts.preview) : null,
      xml: opts.xmlOut ? path.resolve(opts.xmlOut) : null,
    };

    if (opts.json) {
      console.log(JSON.stringify(outputReport, null, 2));
    } else {
      console.log(`Successfully generated GeoGebra file: ${outGgb} (${(ggbBuffer.length / 1024).toFixed(1)} KB)`);
      console.log(`Created ${evalResult.allObjects.length} objects: ${evalResult.allObjects.slice(0, 10).join(', ')}${evalResult.allObjects.length > 10 ? '...' : ''}`);
      if (previewSaved) {
        console.log(`Preview image saved: ${path.resolve(opts.preview)}`);
      }
    }
  } finally {
    await browser.close();
    try { fs.unlinkSync(htmlPath); } catch (e) {}
  }
}

main().catch(err => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
