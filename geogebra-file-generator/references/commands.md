# GeoGebra Command Reference for .ggb Generation

GeoGebra commands are evaluated sequentially by `evalCommand()`.

---

## 1. Points and Coordinates

```
A = (1, 2)                     // 2D Cartesian point
B = (3; 45°)                   // 2D Polar coordinates (r; θ)
M = Midpoint(A, B)             // Midpoint of segment AB
P = Point(c1)                  // Point on circle c1 (draggable along path)
P = Point(f, 2)                // Point on function f at x=2
P = Intersect(obj1, obj2)      // Intersection point
P = Intersect(obj1, obj2, 1)   // 1st intersection of multi-intersection objects
O = Center(c1)                 // Center of circle or conic
```

---

## 2. Lines, Segments, and Rays

```
l = Line(A, B)                 // Infinite line through A and B
s = Segment(A, B)              // Line segment between A and B
r = Ray(A, B)                  // Ray starting from A through B
p = PerpendicularLine(P, l)    // Line through P perpendicular to l
h = Parallel(P, l)             // Line through P parallel to l
b = LineBisector(A, B)         // Perpendicular bisector of segment AB
bis = AngleBisector(A, B, C)   // Angle bisector of ∠ABC (B is vertex)
t = Tangent(P, c1)             // Tangent line to circle/conic/function
```

---

## 3. Circles and Arcs

```
c1 = Circle(O, r)              // Circle with center O and numeric radius r
c1 = Circle(O, A)              // Circle with center O passing through point A
c1 = Circle(A, B, C)           // Circle through 3 points (circumcircle)
c1 = Circle(A, Segment(C, D))  // Circle with center A and radius |CD|
arc = CircularArc(O, A, B)     // Circular arc with center O from A to B
sec = CircularSector(O, A, B)  // Circular sector
```

---

## 4. Polygons

```
t1 = Polygon(A, B, C)          // Triangle (auto-creates side segments a, b, c)
q1 = Polygon(A, B, C, D)       // Quadrilateral
reg = RegularPolygon(A, B, 5)  // Regular 5-gon on side AB
```

*Note: Polygons automatically create sides labeled with lower-case letters. Avoid reusing those letters for other objects.*

---

## 5. Sliders and Dynamic Parameters

```
m = Slider(-5, 5, 0.1)         // Slider with min=-5, max=5, step=0.1
SetValue(m, 1.5)               // Set current value of slider m
k = Slider(0, 10, 1)           // Integer slider
SetAnimationStep(m, 0.1)       // Animation increment
StartAnimation(m)              // Start automatic animation
```

---

## 6. Functions and Curves

```
f(x) = x^2 - 4                 // Quadratic function
g(x) = 1/x                     // Hyperbola / reciprocal
h(x) = sqrt(x)                 // Square root
p(x) = x^3 - 3*x               // Cubic
l(x) = ln(x)                   // Natural log
e(x) = exp(x)                  // Exponential
s(x) = sin(x)                  // Sine
f(x) = If(x > 0, x^2, -x)      // Piecewise function
f(x) = Function(x^2, -2, 2)    // Function restricted to interval [-2, 2]
```

Calculus & Curve Analysis:
```
T = Tangent(P, f)              // Tangent to function f at P
N = Normal(P, f)               // Normal line to f at P
R = Root(f)                    // Real roots of polynomial f
E = Extremum(f)                // Local extrema
I = InflectionPoint(f)         // Inflection points
d(x) = Derivative(f)           // First derivative
F(x) = Integral(f)             // Indefinite integral
area = Integral(f, 0, 2)       // Definite integral (shaded area)
```

---

## 7. Conics

```
e1 = Ellipse(F1, F2, A)        // Ellipse with foci F1, F2 passing through A
e1 = Ellipse(F1, F2, 5)        // Ellipse with major axis length 2a = 5
p1 = Parabola(F, l)            // Parabola with focus F and directrix l
h1 = Hyperbola(F1, F2, A)      // Hyperbola with foci F1, F2 through A
```

---

## 8. Styling and Display Commands

Applied either as GeoGebra native commands or helper calls:

```
setColor(obj, "#1c7ed6")       // Set color using hex or name
setLineThickness(obj, 3)       // Line thickness (1-13)
setLineStyle(obj, 1)           // 0=solid, 1=dashed, 2=dotted, 3=dash-dot
setPointSize(obj, 6)           // Point size (1-9)
setPointStyle(obj, 0)          // 0=dot, 1=cross, 2=circle, 3=plus
setFilling(obj, 0.25)          // Opacity / fill ratio (0.0 to 1.0)
setLabelVisible(obj, false)    // Show/hide object label
setVisible(obj, false)         // Show/hide object
setCaption(obj, "My Point")    // Custom caption
```
