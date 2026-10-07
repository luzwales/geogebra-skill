---
name: geogebra-file-generator
description: Generates native GeoGebra project files (.ggb) from geometry and math descriptions or commands. Use this skill when the user asks to create, export, generate or save a GeoGebra file (.ggb), interactive math applet, geometry worksheet, or dynamic demonstration (with movable points, sliders, and functions) for use in teaching, presentations, classroom activities, or GeoGebra desktop/web apps. Trigger on requests like "生成一个geogebra文件", "做成ggb文件", "导出ggb", "做一个可交互的几何模型", "generate a ggb file", "create a GeoGebra construction", or "save as GeoGebra project".
agent_created: true
---

# GeoGebra File Generator (.ggb)

Generates official, standard `.ggb` binary project files (GeoGebra ZIP format containing `geogebra.xml`, defaults, and scripts) that can be directly opened in GeoGebra Classic 5, Classic 6, GeoGebra Web, or mobile apps.

Unlike `geogebra-geometry` (which renders static cropped PNG images), this skill creates **fully interactive, editable models** supporting:
- Draggable free points and construction steps
- Dynamic sliders (`m = Slider(min, max, step)`) that animate shapes and functions
- Dependent objects updating in real time when points or sliders move
- Full GeoGebra toolbar, algebra view, and coordinate system settings

---

## When to Use

| User Request | Skill to Use |
|---|---|
| "画一个几何图形", "画出这个三角形", "出图" | `geogebra-geometry` (outputs static PNG image) |
| "做成 ggb 文件", "生成 GeoGebra 文件", "做一个动态交互课件" | `geogebra-file-generator` (outputs interactive `.ggb` file) |
| "生成 ggb 并给一张预览图" | `geogebra-file-generator` with `--preview` |

---

## Quick Start

### 1. Simple Construction from Commands

```bash
node ~/.workbuddy/skills/geogebra-file-generator/scripts/generate.js \
  --out model.ggb \
  --preview preview.png \
  --cmd "A=(0,0)" \
  --cmd "B=(6,0)" \
  --cmd "C=(2,4)" \
  --cmd "t1=Polygon(A,B,C)" \
  --cmd "c1=Circle(A,B,C)" \
  --cmd "setColor(t1,\"#1c7ed6\")" \
  --cmd "setColor(c1,\"#e8590c\")"
```

### 2. From a Command File

```bash
node ~/.workbuddy/skills/geogebra-file-generator/scripts/generate.js \
  --out model.ggb \
  --preview preview.png \
  --cmd-file cmds.txt
```

### 3. Interactive Model with Sliders

```bash
node ~/.workbuddy/skills/geogebra-file-generator/scripts/generate.js \
  --out parabola.ggb \
  --view -8,8,-5,10 \
  --preview parabola.png \
  --cmd-file slider_parabola.txt
```

In `slider_parabola.txt`:
```
a=Slider(-5, 5, 0.1)
SetValue(a, 1)
f(x)=a*x^2 - 2
V=(0,-2)
setColor(f,"#1c7ed6")
setLineThickness(f,3)
setColor(a,"#e03131")
```

---

## CLI Options

| Flag | Default | Description |
|---|---|---|
| `--out PATH`, `-o` | *(required)* | Target `.ggb` output file path |
| `--preview PATH`, `-p` | `null` | Also capture and save a PNG preview screenshot |
| `--cmd-file PATH`, `-f`| `null` | Path to text file containing commands, one per line |
| `--cmd "EXPR"`, `-c` | `[]` | Single GeoGebra command (can be repeated) |
| `--app NAME` | `classic` | App interface: `classic`, `geometry`, `graphing` |
| `--view XMIN,XMAX,YMIN,YMAX` | `null` | Set custom viewport window |
| `--axes` / `--no-axes` | `true` (auto) | Show or hide coordinate axes in saved file |
| `--grid` / `--no-grid` | `false` | Show or hide grid lines in saved file |
| `--algebra` / `--no-algebra`| `true` | Show or hide Algebra View panel on open |
| `--toolbar` / `--no-toolbar`| `true` | Show or hide tool bar on open |
| `--menubar` / `--no-menubar`| `true` | Show or hide top menu bar on open |
| `--xml PATH` | `null` | Also export raw `geogebra.xml` file |
| `--json` | `false` | Output machine-readable JSON summary |

---

## Workflow for the Agent

1. **Understand requirements**:
   - Determine whether the figure is pure geometry (often without axes/grid) or algebra/functions (with axes/grid and explicit `--view`).
   - Determine whether interactive parameters (sliders) or movable vertices are desired.

2. **Compose the command sequence**:
   - Save commands into a `.txt` file.
   - Use meaningful, collision-safe labels (`t1` instead of `t` for polygons; `c1` instead of `c` for circles, because polygons automatically generate side segments `a`, `b`, `c`).
   - Add styling (`setColor`, `setLineThickness`, `setPointSize`, `setLineStyle`).

3. **Run generator**:
   ```bash
   node ~/.workbuddy/skills/geogebra-file-generator/scripts/generate.js \
     --out output.ggb \
     --preview output.png \
     --cmd-file cmds.txt
   ```

4. **Verify and Deliver**:
   - Check exit code and JSON/text output.
   - Present the deliverables using `present_files` (always include both the `.ggb` file and the preview `.png` so the user can inspect the visual immediately and download the editable project file).

---

## Important Rules & Conventions

1. **Variable collision avoidance**:
   - `Polygon(A, B, C)` creates the polygon **and automatically creates sides named `a`, `b`, `c`**.
   - Therefore, NEVER name a subsequent circle, line, or slider `a`, `b`, or `c`. Use `c1`, `l1`, `m`, etc.
   - Avoid using lowercase `x`, `y`, `z` as object names (reserved for coordinates).
   - Avoid lowercase `t` as polygon names (reserved for parameter variables).

2. **Interactivity Best Practices**:
   - Sliders: `m=Slider(min, max, step)`. Then set default value via `SetValue(m, 1)`.
   - Movable Points: Independent points like `A=(2,3)` are draggable by default when opened in GeoGebra.
   - Constrained Points: Points created with `P=Point(c1)` or `P=Point(f)` can be dragged along the curve.

3. **Styling Commands**:
   - `setColor(obj, "#hex")` or `setColor(obj, "blue")`
   - `setLineThickness(obj, 3)`
   - `setLineStyle(obj, 1)` (0=solid, 1=dashed, 2=dotted)
   - `setPointSize(obj, 6)`
   - `setFilling(obj, 0.2)` (opacity 0 to 1)
   - `setLabelVisible(obj, false)`

For command references, see `references/commands.md`. For worked examples, see `references/recipes.md`.
