# GeoGebra (.ggb) Interactive Recipes

Collection of ready-to-run interactive construction templates for GeoGebra project generation.

---

## 1. Triangle with Circumcircle and Centroid (Dynamic Vertices)

Free points A, B, C can be dragged in GeoGebra; circumcircle and centroid update automatically.

```
A=(1,1)
B=(7,1)
C=(3,5)
t1=Polygon(A,B,C)
c1=Circle(A,B,C)
M_ab=Midpoint(A,B)
M_bc=Midpoint(B,C)
M_ca=Midpoint(C,A)
s1=Segment(C,M_ab)
s2=Segment(A,M_bc)
G=Intersect(s1,s2)

setColor(t1,"#1c7ed6")
setLineThickness(t1,3)
setFilling(t1,0.15)
setColor(c1,"#e8590c")
setLineThickness(c1,2)
setColor(s1,"#862e9c")
setLineStyle(s1,1)
setColor(s2,"#862e9c")
setLineStyle(s2,1)
setColor(G,"#c92a2a")
setPointSize(G,8)
setCaption(G,"Centroid G")
```

---

## 2. Interactive Quadratic Function with Sliders (a, b, c)

Sliders for $a, b, c$. Dragging sliders immediately transforms the parabola.

```
a=Slider(-4, 4, 0.2)
b=Slider(-6, 6, 0.2)
c_val=Slider(-5, 5, 0.2)
SetValue(a, 1)
SetValue(b, -2)
SetValue(c_val, -1)

f(x)=a*x^2 + b*x + c_val
V=(-b/(2*a), f(-b/(2*a)))
axis_line=Line(V, Vector((0,1)))

setColor(f,"#1c7ed6")
setLineThickness(f,3)
setColor(V,"#c92a2a")
setPointSize(V,8)
setColor(axis_line,"#adb5bd")
setLineStyle(axis_line,1)
```

Run with:
```bash
node scripts/generate.js --out quadratic_interactive.ggb --preview preview.png \
  --view -8,8,-6,10 --cmd-file recipe.txt
```

---

## 3. Tangent Line Tracing Derivative on Curve

A movable point $P$ constrained to curve $f(x)=x^3-3x$. Dragging $P$ shifts the tangent and displays the slope.

```
f(x)=x^3 - 3*x
P=Point(f)
SetValue(P, (1, -2))
t=Tangent(P, f)
m=Slope(t)

setColor(f,"#1c7ed6")
setLineThickness(f,3)
setColor(P,"#c92a2a")
setPointSize(P,8)
setColor(t,"#e8590c")
setLineThickness(t,2)
```

Run with:
```bash
node scripts/generate.js --out tangent_tracing.ggb --preview tangent.png \
  --view -4,4,-5,5 --cmd-file recipe.txt
```

---

## 4. Inscribed and Circumscribed Circles of a Triangle

```
A=(0,0)
B=(8,0)
C=(2,5)
t1=Polygon(A,B,C)
c_out=Circle(A,B,C)

bisA=AngleBisector(B,A,C)
bisB=AngleBisector(A,B,C)
I=Intersect(bisA,bisB)
perp=PerpendicularLine(I,Line(A,B))
D=Intersect(perp,Line(A,B))
c_in=Circle(I,D)

setColor(t1,"#1c7ed6")
setLineThickness(t1,3)
setFilling(t1,0.1)
setColor(c_out,"#e8590c")
setLineThickness(c_out,2)
setColor(c_in,"#2b8a3e")
setLineThickness(c_in,2)
setColor(I,"#c92a2a")
setPointSize(I,8)
setVisible(bisA,false)
setVisible(bisB,false)
setVisible(perp,false)
setVisible(D,false)
```

---

## 5. Unit Circle and Trigonometric Line (Sine and Cosine)

Drag angle slider $\theta$ to see $\sin(\theta)$ and $\cos(\theta)$ segments adapt in real time.

```
theta=Slider(0, 360, 1)
SetValue(theta, 45)
O=(0,0)
unit_c=Circle(O, 1)
P=(cos(theta*°), sin(theta*°))
ray_op=Segment(O, P)
proj_x=(cos(theta*°), 0)
seg_cos=Segment(O, proj_x)
seg_sin=Segment(proj_x, P)

setColor(unit_c,"#adb5bd")
setLineThickness(unit_c,2)
setColor(ray_op,"#1c7ed6")
setLineThickness(ray_op,3)
setColor(P,"#c92a2a")
setPointSize(P,7)
setColor(seg_cos,"#2b8a3e")
setLineThickness(seg_cos,3)
setColor(seg_sin,"#e8590c")
setLineThickness(seg_sin,3)
```

Run with:
```bash
node scripts/generate.js --out trig_unit_circle.ggb --preview trig.png \
  --view -2,2,-2,2 --cmd-file recipe.txt
```
