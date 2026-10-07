# Worked Geometry Recipes

Complete, tested constructions. Copy, adapt coordinates and labels, restyle. Run each with:

```bash
node scripts/render.js --out fig.png --cmd-file recipe.txt
```

Every recipe hides its construction scaffolding: unstyled infinite lines are hidden
automatically, so no `hide()` calls are needed below unless noted.

---

## 2. Two parallel segments

The canonical scaffolding case: both infinite lines are discarded, leaving only the
segments.

```
A=(1,1)
B=(4,1)
l1=Line(A,B)
s1=Segment(A,B)
C=(1,4)
D=(4,4)
l2=Line(C,D)
s2=Segment(C,D)
setColor(s1,"#1c7ed6")
setLineThickness(s1,4)
setColor(s2,"#e8590c")
setLineThickness(s2,4)
```

`l1` and `l2` receive no styling, so they are auto-hidden and the crop stays tight.

To show a construction line, style it or `keep()` it:

```
n=PerpendicularLine(B,Line(A,D))
keep(n)
setColor(n,"#868e96")
setLineThickness(n,1)
setLineStyle(n,2)
setLabelVisible(n,false)
```

---

## 3. Triangle with altitude, median and circumcircle

```
A=(0.5,0.5)
B=(7.0,0.5)
C=(3.0,5.2)
t1=Polygon(A,B,C)
c1=Circle(A,B)
h=PerpendicularLine(C,Line(A,B))
D=Intersect(h,Line(A,B))
M=Midpoint(A,B)
s1=Segment(D,M)
setColor(t1,"#1c7ed6")
setLineThickness(t1,3)
setColor(c1,"#f08c00")
setLineThickness(c1,2)
setColor(D,"#c92a2a")
setPointSize(D,10)
setColor(M,"#2b8a3e")
setPointSize(M,9)
setColor(s1,"#2b8a3e")
setLineThickness(s1,3)
```

---

## 4. Incircle with incentre

```
A=(0.5,0.5)
B=(7.0,0.5)
C=(2.6,5.0)
t1=Polygon(A,B,C)
c1=Incircle(A,B,C)
b1=AngleBisector(A,B,C)
b2=AngleBisector(B,C,A)
J=Intersect(b1,b2)
setColor(t1,"#1c7ed6")
setLineThickness(t1,3)
setColor(c1,"#e03131")
setLineThickness(c1,2)
setColor(J,"#c92a2a")
setPointSize(J,9)
setLabelVisible(c1,false)
```

There is no `Incenter` command in this GeoGebra build — the incentre is the intersection
of two angle bisectors, as above.

---

## 5. Circumscribed quadrilateral (circle with four tangents)

A circle is given, then a tangent is drawn at each of four points on it.

```
c1=Circle((3.5,3),2)
P1=(5.5,3)
P2=(3.5,5)
P3=(1.5,3)
P4=(3.5,1)
t1=Tangent(P1,c1)
t2=Tangent(P2,c1)
t3=Tangent(P3,c1)
t4=Tangent(P4,c1)
V1=Intersect(t4,t1)
V2=Intersect(t1,t2)
V3=Intersect(t2,t3)
V4=Intersect(t3,t4)
p1=Polygon(V1,V2,V3,V4)
setColor(c1,"#e8590c")
setLineThickness(c1,3)
setColor(p1,"#1c7ed6")
setLineThickness(p1,3)
setColor(P1,"#c92a2a")
setColor(P2,"#c92a2a")
setColor(P3,"#c92a2a")
setColor(P4,"#c92a2a")
setPointSize(P1,6)
setPointSize(P2,6)
setPointSize(P3,6)
setPointSize(P4,6)
setLabelVisible(c1,false)
setLabelVisible(p1,false)
```

`Polygon(...)` takes points, not lines, so the four vertices are computed by
intersecting adjacent tangents.

---

## 6. Angle bisector with marked angles

```
A=(1.0,0.5)
B=(6.0,0.5)
C=(3.2,5.4)
t1=Polygon(A,B,C)
b=AngleBisector(A,B,C)
D=Intersect(b,Line(A,C))
E=Intersect(b,Line(B,C))
s1=Segment(A,E)
s2=Segment(B,D)
setColor(t1,"#495057")
setLineThickness(t1,3)
setColor(s1,"#c92a2a")
setLineThickness(s1,2)
setColor(s2,"#c92a2a")
setLineThickness(s2,2)
setLineStyle(s1,2)
setLineStyle(s2,2)
setColor(D,"#1864ab")
setPointSize(D,8)
setColor(E,"#1864ab")
setPointSize(E,8)
setLabelVisible(b,false)
```

---

## 7. Parallelogram with diagonals

```
A=(0.8,1.0)
B=(6.2,1.0)
D=(2.4,5.2)
p1=Polygon(A,B,B+D-A,D)
O1=Intersect(Line(A,B+D-A),Line(D,B))
setColor(p1,"#1c7ed6")
setLineThickness(p1,3)
setColor(O1,"#c92a2a")
setPointSize(O1,9)
setLabelVisible(p1,false)
```

---

## 8. Thales' theorem — angle in a semicircle

```
A=(0.5,2.6)
B=(8.0,2.6)
P=(4.2,6.0)
c1=Circle(Midpoint(A,B),Distance(A,B)/2)
t1=Polygon(A,B,P)
c2=Circle(P,1.2)
setColor(t1,"#1c7ed6")
setLineThickness(t1,3)
setColor(c1,"#f08c00")
setLineThickness(c1,2)
setColor(c2,"#e03131")
setLineThickness(c2,2)
setLabelVisible(c1,false)
setLabelVisible(c2,false)
```

---

## 9. Cyclic quadrilateral with diagonals

```
A=(0.6,1.4)
B=(5.4,0.6)
C=(7.2,4.4)
D=(2.4,5.2)
p1=Polygon(A,B,C,D)
c1=Circle(A,B,C)
E=Intersect(Line(A,C),Line(B,D))
setColor(p1,"#1c7ed6")
setLineThickness(p1,3)
setColor(c1,"#f08c00")
setLineThickness(c1,2)
setColor(E,"#c92a2a")
setPointSize(E,9)
setLabelVisible(c1,false)
setLabelVisible(p1,false)
```

---

## 10. Ellipse with foci

```
A=(2.0,3.0)
B=(7.0,3.0)
P=(4.5,5.4)
c1=Ellipse(A,B,Distance(A,P))
setColor(c1,"#1c7ed6")
setLineThickness(c1,3)
setColor(A,"#c92a2a")
setPointSize(A,9)
setColor(B,"#c92a2a")
setPointSize(B,9)
setLabelVisible(c1,false)
```

---

## 11. Triangle with inscribed circle and tangent lengths

```
A=(0.5,0.5)
B=(7.5,0.5)
C=(3.4,5.6)
t1=Polygon(A,B,C)
c1=Incircle(A,B,C)
b1=AngleBisector(A,B,C)
b2=AngleBisector(B,C,A)
J=Intersect(b1,b2)
h1=PerpendicularLine(A,Line(B,C))
D1=Intersect(h1,Line(B,C))
setColor(t1,"#1c7ed6")
setLineThickness(t1,3)
setColor(c1,"#e03131")
setLineThickness(c1,2)
setColor(J,"#c92a2a")
setPointSize(J,9)
setColor(D1,"#2b8a3e")
setPointSize(D1,8)
setLabelVisible(c1,false)
```

---

## 12. Grid of points on a circle (angle stepping)

```
c1=Circle((4,3.5),2.6)
P1=(6.6,3.5)
P2=Point(c1,36)
P3=Point(c1,72)
P4=Point(c1,108)
P5=Point(c1,144)
P6=Point(c1,180)
P7=Point(c1,216)
P8=Point(c1,288)
P9=Point(c1,324)
setColor(c1,"#adb5bd")
setLineThickness(c1,2)
setLabelVisible(c1,false)
setColor(P1,"#c92a2a")
setColor(P2,"#1c7ed6")
setColor(P3,"#2b8a3e")
setColor(P4,"#f08c00")
setColor(P5,"#862e9c")
setColor(P6,"#0b7285")
setColor(P7,"#d6336c")
setColor(P8,"#5c940d")
setColor(P9,"#e8590c")
```

---

## 13. Quadratic function with vertex and x-intercepts

Render with:
```bash
node scripts/render.js --out parabola.png --app graphing --keep-axes \
  --view -6,6,-5,7 --width 1100 --height 800 --cmd-file recipe.txt
```

```
f(x)=x^2 - 2x - 3
V=(1,-4)
R1=(-1,0)
R2=(3,0)
setColor(f,"#1c7ed6")
setLineThickness(f,3)
setColor(V,"#c92a2a")
setPointSize(V,9)
setColor(R1,"#2b8a3e")
setPointSize(R1,8)
setColor(R2,"#2b8a3e")
setPointSize(R2,8)
```

---

## 14. Hyperbola (reciprocal function) and tangent line

Render with:
```bash
node scripts/render.js --out hyperbola.png --app graphing --keep-axes \
  --view -5,5,-5,5 --width 900 --height 900 --cmd-file recipe.txt
```

```
f(x)=1/x
P=(1,1)
t=Tangent(P,f)
keep(t)
setColor(f,"#1c7ed6")
setLineThickness(f,3)
setColor(P,"#c92a2a")
setPointSize(P,8)
setColor(t,"#e8590c")
setLineThickness(t,2)
setLineStyle(t,1)
setLabelVisible(t,false)
```

`t` uses `keep(t)` because tangents to functions are infinite lines and would otherwise
be auto-hidden.

---

## 15. Power functions comparison: x^3, sqrt(x), x^(1/3)

Render with:
```bash
node scripts/render.js --out power.png --app graphing --keep-axes \
  --view -4,4,-2,6 --width 1100 --height 800 --cmd-file recipe.txt
```

```
a(x)=x^3
b(x)=sqrt(x)
c(x)=x^(1/3)
P=(1,1)
setColor(a,"#7048e8")
setLineThickness(a,3)
setColor(b,"#0b7285")
setLineThickness(b,3)
setColor(c,"#e03131")
setLineThickness(c,3)
setColor(P,"#c92a2a")
setPointSize(P,8)
```

---

## Recipe Notes

- Coordinates use a box roughly `x ∈ [0, 8]`, `y ∈ [0, 6]`. Staying in a compact box
  gives the best auto-crop framing.
- Give every intermediate object a label so it can be hidden or restyled later.
- Hide infinite lines (`l`, `h`, `b`, `n`) once derived points are computed.
- `RegularPolygon(A,n)` takes a side and a vertex count, not a radius.
- For a polygon defined by vectors, `B+D-A` computes the fourth vertex of a
  parallelogram — useful and reliable.
- Raise `--scale 3` for print-quality output; the default is 2.
