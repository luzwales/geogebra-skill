# GeoGebra Command Reference for Geometry Figures

Command syntax for `scripts/render.js`. One command per line; `#` begins a comment.

## Syntax Rules

- **Strings require double quotes**: `setColor(t1,"#1c7ed6")`. Single quotes fail.
- Colours are hex strings: `"#1c7ed6"`.
- Every object you want to keep needs a label (`t1=`, `c1=`, `D=`).
- Coordinates are absolute: `A=(2,3)`. Do not reference the origin as `O`.
- Label naming: uppercase for points (`A`, `B`, `M`), lowercase+number for shapes
  (`t1` triangle, `c1` circle, `s1` segment, `l1` line, `p1` polygon).

## Points and Lines

```
A=(0,0)                        free point
B=(5,0)                        free point
P=Point(A)                     point on object A
P=(3,2)                        point at coordinates
M=Midpoint(A,B)                midpoint
C=Circumcenter(A,B,C)          circumcenter
I=Incenter(A,B,C)              incentre
O=Centroid(A,B,C)              centroid
F=Point(A,0.5)                 point at 50% along segment AB
l=Line(A,B)                    infinite line through A and B
s=Segment(A,B)                 finite segment
r=Ray(A,B)                     ray from A through B
P=Intersect(l1,l2)             intersection of two lines
P=Intersect(c,l)               intersection of circle and line
P=Intersect(c1,c2,1)           first intersection of two circles
h=PerpendicularLine(A,l)       line through A perpendicular to l
h=PerpendicularBisector(A,B)   perpendicular bisector of AB
P=Projection(A,l)              foot of perpendicular from A to l
b=AngleBisector(A,B,C)         angle bisector at B
```

`Foot(point, line)` is unreliable in this build — it can report failure. Build the
foot as an intersection instead:

```
h=PerpendicularLine(C,Line(A,B))
D=Intersect(h,Line(A,B))
hide(h)
```

## Angles

```
a=Angle(A,B,C)                 angle ABC in degrees
a=Angle(Polygon(A,B,C))        all angles of a polygon
P=Point(c,60)                  point on circle c at 60 degrees
a=Angle(l1,l2)                 angle between two lines
```

## Circles

```
c=Circle(A,B)                  centre A, through B
c=Circle(A,r)                  centre A, radius r
c=CircleWithCenter(A,B)        same as Circle(A,B)
c=Incircle(A,B,C)              incircle of triangle ABC
c=Circumcircle(A,B,C)          circumcircle of triangle ABC
c=Circle(A,B,C)                circle through three points
```

**There is no `Incenter` command in this build** — every spelling (`Incenter`,
`InCenter`, `InCentre`) fails silently. Build the incentre from two angle bisectors:

```
b1=AngleBisector(A,B,C)
b2=AngleBisector(B,C,A)
J=Intersect(b1,b2)
```

Note the argument order: the middle point is the vertex of the angle.

## Polygons

```
t=Polygon(A,B,C)               triangle
p=Polygon(A,B,C,D)             quadrilateral
p=RegularPolygon(A,n)          regular n-gon with side AB
t=Triangle(A,B,C)              explicit triangle object
s=Polygon(A,B,C,D,E,4)         polygon with 4 extra points
```

## Conics

```
e=Ellipse(A,f1,f2)            ellipse from foci and a point
e=Ellipse(A,B,r)               ellipse with axes A,B and radius r
p=Parabola(A,l)                parabola with focus A and directrix l
h=Hyperbola(A,B,r)             hyperbola with foci A,B and radius r
```

## Transformations

```
B'=Rotate(A,45,l)              rotate A 45 degrees about line l
B'=Reflect(A,l)                reflect A over line l
B'=Dilate(A,2,O)               dilate A by 2 about O
A'=Translate(A,v)              translate A by vector v
```

## Intersections and Loci

```
P=Intersect(c,f)              circle and function
l=Locus(P,t)                   locus of a moving point
```

A locus usually needs a slider to animate. For a static figure, sample the curve
instead — see `recipes.md`.

## Functions and Curves

Functions always require `--app graphing --keep-axes --view xmin,xmax,ymin,ymax` because
they extend infinitely and cannot be framed by auto-cropping alone.

```
f(x)=x^2                       polynomial (parabola)
g(x)=x^2 - 2x - 3              quadratic with real roots
p(x)=x^3 - 3x                  cubic polynomial
h(x)=1/x                       hyperbola (reciprocal)
k(x)=sqrt(x)                   square root
r(x)=x^(1/3)                   cube root
l(x)=ln(x)                     natural logarithm
e(x)=exp(x)                    exponential
s(x)=sin(x)                    trigonometric
F(x)=abs(x)                    absolute value
c(x)=1/(1+x^2)                 rational function
f(x)=If(x>0, x^2, -x)          piecewise function
```

Points and derived objects on a curve:

```
P=Point(f,2)                   point on f at x=2
T=Tangent(P,f)                 tangent line to f at P
N=Normal(P,f)                  normal line to f at P
R=Root(f)                      roots of polynomial f
E=Extremum(f)                  local extrema
I=InflectionPoint(f)           inflection points
A=Intersect(f,g,1)             first intersection of f and g
A=Intersect(f,Line((0,0),(1,1)))
```

Note: GeoGebra's `Root()`, `Extremum()`, and `InflectionPoint()` work primarily on
polynomials. For other functions, find points by sampling or intersection with lines.

## Utility

```
a=Distance(A,B)                distance
a=Angle(A,B,C)                 angle in degrees
l=Length(s)                    length of a segment
f=Function(x^2)                a function
D=Point(f,3)                   point on the graph at x=3
```

## Styling Commands

Handled natively by the renderer and verified after application.

```
setColor(obj,"#1c7ed6")        object colour (hex)
setLineThickness(obj,n)        line width, 1-5
setLineStyle(obj,n)            0 solid, 1 dashed, 2 dotted, 3 dash-dot
setPointSize(obj,n)            point diameter, typically 5-12
setPointStyle(obj,n)           0 dot, 1 cross, 2 circle, 3 plus, 4 filled square
setLabelVisible(obj,false)     hide the text label
setVisible(obj,false)          hide the object
keep(obj)                      exempt from auto-hiding, force visible
hide(obj)                      hide the object
aux(obj)                       mark as auxiliary and hide
setAuxiliary(obj,true)         mark as construction object
setFilling(obj,0.15)           interior opacity 0-1 (also takes a colour string)
setCaption(obj,"text")         change a label's text
setLayer(obj,n)                drawing layer
```

Filling uses a slightly different signature than the others; `setFilling(obj,0.15)`
sets opacity, `setFilling(obj,"#dbeafe")` sets a tint. If `setFilling` reports failure
the figure still renders — only the interior shading is missing.

## Reserved and Missing Commands

Some commands do not exist in GeoGebra web app 5.4.920.0 and fail silently — the command
reports failure and no object is created.

**Missing:** `Incenter` (and `InCenter`, `InCentre`) — build the incentre from two angle
bisectors instead:

```
b1=AngleBisector(A,B,C)
b2=AngleBisector(B,C,A)
J=Intersect(b1,b2)
```

`Polygon(...)` accepts **points**, not lines. To outline a quadrilateral formed by four
tangent lines, intersect adjacent lines and polygon the results:

```
V1=Intersect(t4,t1)
V2=Intersect(t1,t2)
V3=Intersect(t2,t3)
V4=Intersect(t3,t4)
p1=Polygon(V1,V2,V3,V4)
```

`Foot(point, line)` can report failure. Build the foot as an intersection:

```
h=PerpendicularLine(A,l)
F=Intersect(h,l)
hide(h)
```

Always check the `objects` count in the JSON output when a command reports failure, and
read the PNG to confirm the figure is complete.

## Auxiliary Lines Are Hidden Automatically

Any object of type `line` or `ray` that never received an explicit style command is
hidden automatically before rendering. Build scaffolding freely and just do not style it:

```
A=(1,1)
B=(4,1)
l1=Line(A,B)              scaffolding -> auto-hidden
s1=Segment(A,B)           the figure
setColor(s1,"#1c7ed6")    styling marks s1 as meant to be visible
setLineThickness(s1,4)
```

The JSON output reports what was hidden in `autoHidden`.

**To keep an unstyled line visible**, use `keep(obj)` — or simply style it, since styling
already implies visibility:

```
t1=PerpendicularLine(B,l1)
keep(t1)
setColor(t1,"#868e96")
setLineThickness(t1,1)
setLineStyle(t1,2)
setLabelVisible(t1,false)
```

`keep(obj)` may appear before the object it names; it is resolved after all commands run.
A `keep` on a non-existent label is reported in `keepFailed`.

`hide(obj)` and `aux(obj)` hide explicitly. `--no-auto-hide` turns the mechanism off.

## Hiding Construction Scaffolding

When auto-hide is disabled, or for objects that are finite but unwanted:

```
h=PerpendicularLine(C,Line(A,B))
D=Intersect(h,Line(A,B))
hide(h)
```

To show a helper line lightly instead of hiding it:

```
setColor(h,"#adb5bd")
setLineThickness(h,1)
setLineStyle(h,2)
setLabelVisible(h,false)
```

## Gotchas

- The view cannot be panned or zoomed; framing comes only from auto-cropping. Choose
  coordinates in a compact box so the figure composes well.
- Keep coordinates positive and within roughly ±50. Large ranges produce extreme
  aspect ratios that crop badly.
- A degenerate construction (zero-length segment, coincident points) yields no visible
  object. Always check the `objects` count in the JSON output.
- Some valid commands report `ok: false` despite succeeding. Judge by the rendered
  image and the object count, not the flag alone.
