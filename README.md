# GeoGebra Skills for AI Agents

Collection of production-grade GeoGebra skills designed for AI coding assistants and autonomous agents (such as WorkBuddy, Claude Code, Cursor, and Windsurf).

## Skills in this Repository

| Skill | Output Format | Purpose & Description |
|---|---|---|
| **[`geogebra-geometry`](./geogebra-geometry)** | High-resolution **PNG** | Renders precise geometry diagrams and mathematical function plots with zero-margin auto-crop, axes/grid control, and automatic construction line hiding. |
| **[`geogebra-file-generator`](./geogebra-file-generator)** | Native **.ggb** project files | Generates native GeoGebra (.ggb) binary project files containing full algebraic definitions, interactive sliders (`Slider`), and movable vertices for teaching and classroom demonstrations. |

---

## 1. geogebra-geometry (Static Image Renderer)

- **Engine**: Headless Chromium via Playwright + official GeoGebra Web Core.
- **Auto-Cropping**: Tight bounding box bounding on drawn objects; scaffold lines (infinite lines/rays) automatically hidden unless explicitly styled or kept via `keep(obj)`.
- **Functions & Curves**: Supports polynomial, hyperbola, power, trigonometric, logarithmic functions with declared viewport (`--view xmin,xmax,ymin,ymax`) and optional coordinate axes (`--keep-axes`).

### Example
```bash
node geogebra-geometry/scripts/render.js \
  --out triangle.png \
  --cmd-file geogebra-geometry/assets/example-triangle.txt
```

---

## 2. geogebra-file-generator (Interactive .ggb Generator)

- **Engine**: Generates official ZIP-based `.ggb` binary archives compatible with GeoGebra Classic 5, Classic 6, GeoGebra Web, and mobile apps.
- **Dynamic Interactivity**: Fully supports draggable free points, dynamic sliders (`m = Slider(-5, 5, 0.1)`), and real-time geometry dependency recalculation.
- **Dual Deliverables**: Can output both the editable `.ggb` file and a high-resolution `--preview` PNG image.

### Example
```bash
node geogebra-file-generator/scripts/generate.js \
  --out parabola.ggb \
  --preview parabola.png \
  --view -8,8,-6,10 \
  --cmd-file geogebra-file-generator/assets/example-slider-parabola.txt
```

---

## Prerequisites

- Node.js >= 18
- Global Playwright installation: `npm install -g playwright`

## License

MIT License
