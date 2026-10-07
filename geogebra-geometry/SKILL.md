---
name: geogebra-geometry
description: Renders precise geometry figures and function graphs to PNG images using GeoGebra, with grid and axes hidden by default for geometry and a declared viewport for functions. This skill should be used when the user asks to draw, sketch, plot or illustrate a mathematical figure — triangles, circles, tangents, inscribed/circumscribed shapes, parallelograms, angle constructions, loci, conic sections, quadratic or power functions, hyperbolas, polynomial and logarithmic curves — for use in teaching materials, problem sets, proofs, slides or documents. Trigger on requests like "画一个几何图形", "画出这个抛物线", "画双曲线", "帮我画张函数图像", "draw a geometry diagram", "plot y=x^2 and y=1/x", or any request to turn a described mathematical construction into a picture. Also use it when a GeoGebra .ggb/.xml material file must be converted to PNG.
agent_created: true
---

# GeoGebra Geometry Figure Rendering

## Overview

Turn a geometric construction into a clean PNG using the real GeoGebra engine, driven
headlessly through a browser. Output is auto-cropped to the drawing and contains **no
grid and no axes** unless explicitly requested.

This is a rendering pipeline, not a hand-drawn approximation: coordinates are exact,
constructions are computed by GeoGebra, and intersections/foot points are real derived
objects rather than eyeballed placements.

## Requirements

The renderer needs Node.js and Playwright with a Chromium build. Verify before first use:

```bash
node -e "require('playwright'); console.log('playwright ok')"
```

If that fails, install it:

```bash
npm install -g playwright && npx playwright install chromium
```

An internet connection is required on first use: the GeoGebra web app is loaded from
`https://www.geogebra.org/apps/deployggb.js`. Subsequent runs use the browser cache.

## Auxiliary Lines Are Hidden Automatically

Infinite lines and rays are construction scaffolding, never the subject of a finished
figure. Left visible they cross the entire canvas and ruin the framing.

**The renderer hides unstyled infinite lines and rays automatically.** Build the line,
derive what you need from it, and simply do not style it:

```
A=(1,1)
B=(4,1)
l1=Line(A,B)          <- scaffolding, auto-hidden
s1=Segment(A,B)       <- the figure
setColor(s1,"#1c7ed6")
setLineThickness(s1,4)
```

The rule: any object of type `line` or `ray` that never received an explicit style
command is hidden. Objects that *were* styled are kept, so styling is also how you say
"this one should appear".

To keep an unstyled line visible, mark it with `keep`:

```
t1=PerpendicularLine(B,Line(A,D))
keep(t1)
setColor(t1,"#868e96")
setLineThickness(t1,1)
setLineStyle(t1,2)
setLabelVisible(t1,false)
```

`hide(obj)` still works for explicit hiding, and `--no-auto-hide` disables the whole
mechanism. The JSON output lists what was hidden under `autoHidden`.

This is why figures crop tightly: with the scaffolding gone, only the intended subject
remains to define the bounding box.

## Function Graphs

Function plots work, but they need a declared viewport. Curves extend infinitely, so
the auto-crop cannot frame them — it would just measure how far the curve runs.

Always pass `--view xmin,xmax,ymin,ymax` together with `--app graphing --keep-axes`:

```bash
node scripts/render.js --out fig.png --app graphing --keep-axes \
  --view -6,6,-4,8 --width 1200 --height 800 --cmd-file fn.txt
```

```
f(x)=x^2-2*x-3
g(x)=1/x
setColor(f,"#1c7ed6")
setLineThickness(f,3)
setColor(g,"#e8590c")
setLineThickness(g,3)
```

Composition guidelines:

- Set the window to frame the behaviour you care about, not the whole curve. A
  parabola is best shown around its vertex and x-intercepts.
- Match `--width/--height` to the view's aspect ratio so units stay square.
- Keep the grid off for clean textbook figures; add `--keep-grid` when reading off
  intersection coordinates matters.
- Functions are never auto-hidden and never count as scaffolding.

Supported out of the box: polynomials, `sqrt(x)`, `x^(1/3)`, `1/x`, `ln(x)`, `abs(x)^n`,
`a*sin(x)` and the usual function syntax. Sliders (`q(x)=a*sin(x)`) do not resolve
without defining the parameter first, so write the coefficient literally.

## Workflow

### Step 1 — Plan the construction

Decide the objects needed and give every object an explicit label. Because there is no
interactive viewport, **all coordinates must be chosen deliberately**.

Pick a coordinate box roughly `x ∈ [0, 8]`, `y ∈ [0, 6]` for a typical classroom figure.
Larger coordinates are fine — the renderer crops to content, so the framing adapts.
Avoid coordinates beyond roughly ±50; extreme aspect ratios crop poorly.

### Step 2 — Write the commands

Write one GeoGebra command per line. `#` starts a comment.

```
A=(0.5,0.5)
B=(7.0,0.5)
C=(3.0,5.2)
t1=Polygon(A,B,C)
c1=Circle(A,B)
h=PerpendicularLine(C,Line(A,B))
D=Intersect(h,Line(A,B))
M=Midpoint(A,B)
setColor(t1,"#1c7ed6")
setLineThickness(t1,3)
setColor(D,"#c92a2a")
setPointSize(D,10)
```

`h` needs no `hide` — it is an unstyled line, so it is hidden automatically.

See `references/commands.md` for the command catalogue and `references/recipes.md` for
complete worked constructions (incircle, tangent quadrilateral, angle bisector, locus,
conic sections).

### Step 3 — Render

```bash
node scripts/render.js --out fig.png --cmd-file fig.txt
```

Or pass commands inline:

```bash
node scripts/render.js --out fig.png --cmd 'A=(0,0)' --cmd 'B=(5,0)' --cmd 't=Polygon(A,B,C)'
```

If Playwright is installed globally rather than locally, prefix with the global module path:

```bash
NODE_PATH="$(npm root -g)" node scripts/render.js --out fig.png --cmd-file fig.txt
```

Run it with `run_in_background: true` — a cold start takes roughly 1–3 minutes because
the GeoGebra app is downloaded and initialised.

### Step 4 — Check the result

The script prints a JSON status line:

```json
{"ok":true,"out":"...","objects":12,"commands":20,"failed":[],
 "warnings":[],"autoHidden":["l1","l2"],"keepFailed":[],"cropped":true,"size":[437,450]}
```

Check these fields:

- `failed` — commands that reported failure.
- `warnings` — diagnosed problems such as a missing command.
- `autoHidden` — scaffolding that was hidden; confirm nothing important is listed.
- `keepFailed` — `keep()` targets that do not exist (usually a typo in the label).

Read the PNG back with the Read tool to confirm the figure looks right before presenting
it — a command can succeed yet produce a degenerate or off-screen figure. If a figure
looks wrong, re-run with `--verbose` to dump every object's type, visibility and colour.

Then present the PNG with `present_files`.

## Options

| Option | Default | Purpose |
|---|---|---|
| `--out PATH` | required | Output PNG path |
| `--cmd STR` | — | One command; repeatable |
| `--cmd-file PATH` | — | File with one command per line |
| `--script PATH` | — | Load a GeoGebra `.ggb`/XML material instead of commands |
| `--app NAME` | `geometry` | `geometry`, `graphing`, or `classic` |
| `--width N` | 1400 | Canvas width in CSS px |
| `--height N` | 1000 | Canvas height in CSS px |
| `--view RANGE` | — | Viewport as `xmin,xmax,ymin,ymax`; required for function plots |
| `--fit` | — | Fit the view to drawn content instead of using `--view` |
| `--scale N` | 2 | Device pixel ratio (raise to 3 for print) |
| `--pad N` | 48 | Crop padding in device px |
| `--tol N` | 20 | Background tolerance; raise for faint/thin content |
| `--keep-axes` | off | Keep coordinate axes visible |
| `--keep-grid` | off | Keep the grid visible |
| `--no-auto-hide` | off | Do not auto-hide unstyled infinite lines/rays |
| `--no-crop` | off | Emit the full canvas instead of cropping to content |
| `--transparent` | off | Transparent background instead of white |
| `--verbose` / `-v` | off | Print every object's type, visibility and colour |

## Styling Commands

Style commands are applied and then **verified by reading the property back**, because
GeoGebra's own return values are unreliable for styling. Each of these is handled natively:

| Command | Effect |
|---|---|
| `setColor(obj,"#rrggbb")` | Object colour |
| `setLineThickness(obj,n)` | Line width (1–5) |
| `setLineStyle(obj,n)` | 0 solid, 1 dashed, 2 dotted, 3 dash-dot |
| `setPointSize(obj,n)` | Point diameter |
| `setLabelVisible(obj,false)` | Hide/show the text label |
| `setVisible(obj,false)` | Hide/show the object |
| `keep(obj)` | Exempt from auto-hiding and force visible |
| `hide(obj)` / `aux(obj)` | Hide an object explicitly |

Any other command is passed straight to `evalCommand`.

**Styling an object also marks it as "meant to be visible"** — that is how you keep an
otherwise-unstyled infinite line in the figure. Unstyled lines and rays are auto-hidden.

## Critical Constraints

These were established by testing against GeoGebra web app 5.4.920.0. Do not assume
otherwise without re-testing.

- **The view cannot be moved or zoomed programmatically.** `setCoordSystem`, `setCoords`,
  `setCorner` and `setZoom` are all no-ops in this build. Framing is achieved *solely* by
  the pixel-level auto-crop — except when `--view` is given, which works by rebuilding the
  construction XML with an explicit `<coordSystem>`. That rebuild is the only way to get a
  deterministic viewport; do not try to replace it with the view setters.
- In `<coordSystem>`, `xZero`/`yZero` are **pixel offsets of the origin** from the
  top-left of the graphics view, and `scale` is pixels per unit — not logical coordinates.
  The renderer computes these; you never need to.
- **`exists()` returns false for functions** even when they were created fine. The
  renderer checks `getAllObjectNames()` instead, so function plots do not produce false
  failures.
- **`getPNGBase64`, `getScreenshotBase64` and `exportSVG` are broken** in this build
  (they throw or return `undefined`). The renderer screenshots the graphics canvas with
  Playwright instead. Do not "fix" this by switching to those methods.
- **Error dialogs are disabled** via `setErrorDialogsActive(false)` as early as possible.
  A modal error dialog blocks all further rendering. This must not be removed.
- **Strings need double quotes** in GeoGebra commands: `setColor(t1,"#ff0000")`.
- **Always screenshot the inner `canvas`, not the container div.** The container includes
  an empty style panel and a "GeoGebra" watermark; the canvas does not.
- **Some valid commands return `false`.** `Foot(...)` is a known case. Judge success by
  whether the object exists (`objects` count in the JSON output) and by looking at the
  image, not by the return flag alone.
- **First run is slow** (1–3 min) while the app downloads. Later runs are faster.

## Styling Guidance

For textbook-quality figures:

- Use a restrained palette: one strong colour for the main figure, one accent for
  construction lines, black or dark grey for labels.
- Make the main shape thick (`setLineThickness 3`) so it reads at small sizes.
- Colour key points distinctly and bump their size (`setPointSize 9` or `10`).
- Hide labels on helper objects with `setLabelVisible(obj,false)`.
- Use `--scale 3` when the image will be printed or placed in a slide deck.

## Resources

- `scripts/render.js` — the renderer. All options are documented in its header comment.
- `references/commands.md` — GeoGebra command catalogue for geometry, with gotchas.
- `references/recipes.md` — complete worked constructions, ready to adapt.
