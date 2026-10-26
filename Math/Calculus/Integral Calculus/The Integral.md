# Definition

For a function $f(x)$ which is defined on the interval $[a,b]$, then the integral of that function is
$$
\\lim_{ n \to \infty } \sum_{i=0}^{\infty} f(x_{i}) \, \Delta x = \int_{a}^{b} f(x) \, dx
$$

## Derivation

The integral originally solved the problem of finding the areas of certain geometric shapes or curves; introductory explanations of the integral still approach by this route.

# The Line Integral
The line integral is an extension of the regular Riemann integral which is applied to a curve in vector space. It can be denoted symbolically with the usual integral symbol, or with the special "path integral" symbol which indicates that the curve is closed:
$$
\int \quad \text{or} \quad \oint
$$
## Scalar Valued Functions
Suppose there is a curve $C$ that exists in $n$-dimensional space $\mathbb{R}^n$, in the presence of a [[Scalar Fields|scalar field]] $f$. Suppose that $C$ is expressed by a [[Parameterization|parameterized function]] $\vec{r}(t)$ which completely describes $C$, so that, if $t$ is defined on the interval $[a, b]$, $\vec{r}(a)$ and $\vec{r}(b)$ represent the endpoints of $C$ (in notation, $\vec{r}(t):[a, b] \to C$ ). If the vector field $f$ exists everywhere in some subset of the $n$-dimensional space, which we'll call $U$, and if the curve $C$ is confined within $U$ (in math notation, $f:U\subseteq \mathbb{R}^n \to \mathbb{R}^n$), which is to say that $C$ is everywhere affected by $f$, then we can define the line integral of $f$ along $C$ to be the dot product of $f$ at some point $t_{0}$ with the tangent line of $\vec{r}(t_{0})$. In notation,
$$
\int_{C} f(\vec{r}(t)) \cdot d\vec{r} = \int_{a}^{b}f(\vec{r}(t)) \>|\vec{r}\>'(t)|\> dt
$$
One should note that the derivative of $\vec{r}(t)$ is equal to its tangent line, that $\vec{r}(t)$ must also be *regular*, i.e. the tangent vector is never zero, and that $C$ must be piecewise [[Smoothness|smooth]].

[Wikipedia](https://en.wikipedia.org/wiki/Line_integral#Derivation_2) provides a useful visualization of this:
![][https://upload.wikimedia.org/wikipedia/commons/4/42/Line_integral_of_scalar_field.gif]
## Vector Valued Functions
Suppose there is a curve $C$ that exists in $n$-dimensional space $\mathbb{R}^n$, in the presence of a [[Vector Fields|vector field]] $\vec{F}$. Suppose that $C$ is expressed by a [[Parameterization|parameterized function]] $\vec{r}(t)$ which completely describes $C$, so that, if $t$ is defined on the interval $[a, b]$, $\vec{r}(a)$ and $\vec{r}(b)$ represent the endpoints of $C$ (in notation, $\vec{r}(t):[a, b] \to C$ ). If the vector field $\vec{F}$ exists everywhere in some subset of the $n$-dimensional space, which we'll call $U$, and if the curve $C$ is confined within $U$ (in math notation, $\vec{F}:U\subseteq \mathbb{R}^n \to \mathbb{R}^n$), which is to say that $C$ is everywhere affected by $\vec{F}$, then we can define the line integral of $\vec{F}$ along $C$ to be the dot product of $\vec{F}$ at some point $t_{0}$ with the tangent line of $\vec{r}(t_{0})$. In notation,
$$
\int_{C} \vec{F}(\vec{r}(t)) \cdot d\vec{r} = \int_{a}^{b}\vec{F}(\vec{r}(t)) \cdot \vec{r}\>'(t) dt
$$
One should note that the derivative of $\vec{r}(t)$ is equal to its tangent line, that $\vec{r}(t)$ must also be *regular*, i.e. the tangent vector is never zero, and that $C$ must be piecewise [[Smoothness|smooth]].

[Wikipedia](https://en.wikipedia.org/wiki/Line_integral#Derivation_2) provides a useful visualization of this:
![][https://upload.wikimedia.org/wikipedia/commons/b/b0/Line_integral_of_vector_field.gif]


# The Surface Integral
The surface integral is an extension of the double integral to integrate over a surface in three-dimensional space. The surface, typically called $S$, must be in the presence of a [[Scalar Fields|scalar field]] or a [[Vector Fields|vector field]]; if a scalar field, then the surface integral calculates the field's weighted values within $S$, if a vector field, then the integral calculates the amount of [[Flux|flux]] passing through $S$, where flux is a sum of the vector field over the area of S.

Suppose there is a surface $S$ which resides in 3D space, $\mathbb{R}^3$.
## Over Scalar Fields
Suppose $S$ resides in the presence of a scalar field $f$. We can label the region of  $\mathbb{R}^3$ which is affected by $f$ as $U$, so $U \subseteq \mathbb{R}^3$ and $f:U\to\mathbb{R}$. Then we can conceptually define a surface integral as the double integral of $f$ over all points of $S$:
$$
\iint_{S} f \>dS
$$
where $dS$ is an infinitesimal area element on $S$. $S$ is usually defined for a 3D space by a [[Parameterization#Surface Parameterization - 2D|parameterized vector-valued function]] $r(s, t) = (x_{1}(s, t),\>x_{2}(s, t),\>x_{3}(s, t))$. In this case, we can rewrite the above abstract integral in terms of this parameterization $\vec{r}(s, t)$,
$$
\iint_{S}f\>d\vec{S} = \iint_{D} f(\vec{r}(s, t))\> ||\frac{\partial\> \vec{r}(s, t)}{\partial s} \times \frac{\partial \>\vec{r}(s, t)}{\partial t}||\> ds\>dt
$$
We can see this formula represents the value of $f$ at some point defined by $\vec{r}(s,t)$, multiplied by the magnitude of the cross product of the derivative of $\vec{r}$ with respect to $s$, and the derivative of $\vec{r}$ with respect to $t$. Geometrically this represents the magnitude of a normal vector at any point on $S$ multiplied by the value of the scalar field at that same point.

Note that if $f \equiv 1$, then the surface integral of $f$ will equal the surface area of $S$.

## Over Vector Fields
Suppose $S$ resides in the presence of a vector field $\vec{F}$ with $n$-dimensions. We can label the region of  $\mathbb{R}^3$ which is affected by $\vec{F}$ as $U$, so $U \subseteq \mathbb{R}^3$ and $\vec{F}:U\to\mathbb{R}^n$. Then we can conceptually define a surface integral as the double integral of $f$ over all points of $S$:
$$
\iint_{S} \vec{F} \cdot \>d\vec{S} = \iint_{S} \vec{F} \cdot \vec{n}\>d\vec{S}
$$
where $dS$ is an infinitesimal area element on $S$, and $\vec{n}$ is a unit normal vector to $S$ for any orientation. $S$ is usually defined for a 3D space by a [[Parameterization#Surface Parameterization - 2D|parameterized vector-valued function]] $r(s, t) = (x_{1}(s, t),\>x_{2}(s, t),\>x_{3}(s, t))$. In this case, we can rewrite the above abstract integral in terms of this parameterization $\vec{r}(s, t)$,
$$
\iint_{S} \vec{F} \cdot \>d\vec{S} = \iint_{D}\vec{F}(\vec{r}(s, t)) \>\cdot\>(  \frac{\partial \>\vec{r}(s, t)}{\partial s} \times \frac{\partial \> \vec{r}(s, t)}{\partial t} ) \>ds \> dt
$$
We can see that we first form a normal vector by crossing the two derivatives of $\vec{r}(s, t)$ with respect to $s$ and to $t$, then dot product this normal vector with the value of the vector field at the same point.

The quantity calculated from this surface integral is referred to as [[Flux|flux]], which quantifies the amount of vector field lines passing through $S$.