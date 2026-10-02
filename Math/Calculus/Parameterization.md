# Curve Parameterization - 1D
## Definition
A parameterized curve or path is a vector valued function of one variable, $\vec{r}(t) = (x_{1}(t),\>x_{2}(t),\>x_{3}(t),\>\dots,\>x_{n}(t))$, on $\mathbb{R}^n$ for which each $x_{i}(t)$ is a continuous function on a closed interval $[a, b]$, where $t$ is a parameter on $[a, b]$ which represents the distance of the point at $\vec{r}(t)$ along the length of the curve.

For the purpose of [[The Integral#The Line Integral|line integrals]], it is also required that $\vec{r}(t)$ be piecewise [[Smoothness|smooth]] on $[a, b]$, so that we can be certain that the tangent exists at all points and an integral can be evaluated at all points on the interval.
### Speed
The function $\vec{r}(t)$ maps the points on $[a, b]$ to the points along the curve in $\mathbb{R}^n$. Since the curve being parameterized can be of arbitrary shape and length, and $[a, b]$ can be of arbitrary length independent of the curve, we often have a mismatch of the number of points on $[a, b]$ being mapped to the curve. For any unit change in $t$ along $[a, b]$, we can measure how much arc length is covered (or created) along the curve. A unit change in $t$ that corresponds to a long arc length is said to have "high speed"; a unit change in $t$ that corresponds to a short arc length is said to be "low speed". The speed, then, can be expressed as a ratio of the arc length created to the (arbitrary) unit step of $t$, $speed=\frac{\Delta\>arc\>length}{\Delta t}$, and because of this ratio, I prefer to call this quantity the "density" of the curve.

Speed is defined formulaically as $||\vec{r}\>'(t)||$, where $\vec{r}\>'(t)$ is the curve's *velocity*, and therefore the curve's *acceleration* is defined as $\vec{r}\>''(t)$. Note that speed is a scalar.

### Arc Length
The length, $L$, of a [[Smoothness|smooth]] parameterized curve in $\mathbb{R}^n$ can be calculated as the infinite sum of infinitely small subsections of the curve $\vec{r}(t)$. Suppose we break $[a, b]$ into small subintervals $a = t_{0} < t_{1} < t_{2} \dots < t_{n} = b$, where $t_{0}$ and $t_{n}$ represent $a$ and $b$. Then, the chord from $\vec{r}(t_{i-1})$ to $\vec{r}(t_{i})$ has a length of $||\vec{r}(t_{i}) - \vec{r}(t_{i-1})||$, and we can approximate this chord by taking the tangent vector to $C$ at some arbitrary point between $t_{i-1}$ and $t_{i}$, which we can call $t_{i}^{*}$, and multiplying it by the length of the subinterval, which we can call $\Delta t_{i} = t_{i} - t_{i-1}$. So,
$$
||\vec{r}(t_{i}) - \vec{r}(t_{i-1})|| \approx ||\vec{r}\>'(t_{i}^{*})|| \Delta t_{i}
$$
and at infinity, which we encounter in the integral, this approximation becomes more and more exact. If we now take the sum of all these segments, we arrive at the approximate arc length:
$$
L \approx \sum_{i = 0}^n ||\vec{r}\>'(t_{i})|| \Delta t_{i}
$$
and by taking the limit of this sum as it goes to infinity, we arrive at the integral expression for the arc length:
$$
L = \lim_{ n \to \infty } \sum_{i = 0}^n ||\vec{r}\>'(t_{i})|| \Delta t_{i} = \int_{a}^{b} ||\vec{r}\>'(t)||\>dt
$$

This integral computes the **full** arc length. To compute only a partial arc length instead, we can define a partial interval of $[a, b]$ to evaluate along (and this new partial length is often denoted $s(t)$):
$$
s(t) = \int_{a}^{t} ||\vec{r}\>'(u)||\>du
$$
Note that for $s(t)$ to be a function of $t$ we must redefine the old variable $t$ as $u$, just for the sake of integration. Also note that the relationship between $s$ and $t$ is one of distance and speed, and that if we differentiate both sides of the above equation, we find an equation for speed reminiscent of physics,
$$
ds = |\vec{r}\>'(t)|dt \to |\vec{r}\>'(t)| = \frac{ds}{dt}
$$

## Derivation
If we desire to represent a complicated curve in space, it often becomes difficult to express the curve in the usual coordinate system. As a simple example, a unit circle in 2D space is represented by the equation $x^2+y^2=1$, where the circle is the collection of all points that satisfy that equation. We can rewrite this equation as a function $y= f(x) = \sqrt{ 1-x^2 }$ as well. On top of that, we can also express the unit circle as a function like $\vec{r}(t)=(x(t),\>y(t))=(\cos(t),\>\sin(t))$, where $t$ is some parameter that exists on some interval, in this case $t \in [0, 2\pi]$. All values of $t$ on that interval are mapped by $\vec{r}(t)$ onto 2D space, and $\vec{r}(t)$ simply redefines the point $(x, y)$ in terms of two function $x(t)$ and $y(t)$ instead. The unit circle now is defined as all points $(x, y)$ for which $x=\cos(t)$ and $y=\sin(t)$ for $t \in [0, 2\pi]$.

Note that $\vec{r}(t)$ is a vector function, and must be a vector. Recall that all points in space $(x, y)$ are essentially defined as vectors which begin at $(0, 0)$ and terminate at $(x, y)$; it is necessary here to anchor our parameterized curves to the origin in this way within the x-y or x-y-z or x-y-z-...-$n$ coordinate system, since otherwise they would have no single consistent point of reference in space and parameterization itself would become meaningless.

Continuing, we can arbitrarily parameterize any 2D function $f(x)$ with the parameterization $\vec{r}(t) = (t,\>f(t))$, which is identical to the conception of a function as a set of points $(x, y)$ where $x = x$, $y = f(x)$.

We can easily represent more complex curves. For example, a circular helix in 3D space cannot be represented as a function; this is because, as a 2D function maps $x \to f(x) = y$ and a 3D function maps $(x,y) \to f(x,y) = z$, a helix repeats itself along the z-axis so any $f(x_{0}, y_{0})$ must map to infinitely many $z_{0}$'s, which is impossible. If we instead parameterize this curve, we can successfully perform functions on a helix.
$$
\vec{r}(t) = (\cos (t),\>\sin (t),\>t)
$$
One can see there is a circular component, the cosine and sine, and a linear component, the $t$, which allows us to show the helix as a circle that moves forward in space as $t$ increases.

It should also be noted that the common understanding of parameterization is through an analogy of "drawing" or "dragging", where people imagine a singular point tracing a line through space over time (thus the variable $t$ as *time*). So as $t$ increases over the interval $[a, b]$, the function "draws" out the curve in space. This analogy appears in most explanations, yet is not essential to understanding parameterization and I find it useless. It is sufficient to know that for any $t \in [a, b]$, all points between $a$ and $b$ are passed through the functions mapped simultaneously to the curve $r(t)$. There is parameterization "speed", which is a representation of how "fast" a constant-speed sweep of $t$ over $[a, b]$ moves the output point on $\vec{r}(t)$; I prefer to call this quality "density", because if we stop the drawing or moving-point analogy, then this quantity really represents how many points of the interval $[a, b]$ exist within a unit segment of the parameterized curve. Cut the curve into equal segments of arc length $s$, and see how much of $[a, b]$ is represented in each segment, which is kind of just in inverted way of measuring this "speed" quantity, but I like it better since it doesn't require a motion analogy.

# Surface Parameterization - 2D
## Definition
A parameterized surface is a vector valued function of two variables,
$$
\vec{r}(s, t) =
\begin{pmatrix}
x_{1}(s, t) \\
x_{2}(s, t) \\
\dots \\
x_{n}(s, t)
\end{pmatrix}
$$
existing in $n$-dimensional space, $\mathbb{R}^n$, for which each $x_{n}(s, t)$ is a continuous function on some domain $D$ on the s-t plane. $\vec{r}(s, t)$ maps the values of $D$ to a surface $S$ which exists in $\mathbb{R}^n$.