The Fourier Series is a means to represent any periodic function as an infinite (or finite!) sum of sine and cosine functions. It was developed by [[Joseph Fourier]] in the early 19th century in his seminal work on heat transfer. 
# Definition
For a function $f(x)$ that is **periodic** and integrable over one period of length $T$, the Fourier series expansion is,
$$
f(x)=\frac{a_{0}}{2}+\sum_{n=1}^{\infty}(a_{n}\cos(\frac{2\pi nx}{T})+b_{n}\sin(\frac{2\pi nx}{T}))
$$
where,
$$
a_{0}=\frac{1}{T}\int_{0}^{T}f(x)\>dx
$$
and,
$$
a_{n}=\frac{2}{T}\int_{0}^{T}f(x)\>\cos(\frac{2\pi nx}{T})\>dx,
$$
$$
b_{n}=\frac{2}{T}\int_{0}^Tf(x)\>\sin(\frac{2\pi nx}{T})\>dx
$$
Alternately, to decompose an aperiodic function in this way, the [[The Fourier Transform|Fourier transform]] must be used. It should also be noted that the bounds of integration, here $0$ to $T$, can be any bounds so long as it is the length of a period, e.g. from $-\frac{T}{2}$ to $\frac{T}{2}$, or from $4T$ to $5T$, etc.
# Derivation
The trigonometric functions sine and cosine are orthogonal to each other, and since they are orthogonal, they can be used as basis functions to define a new function space. We can then transform any periodic function within a normal space of $n$-dimensions, $\mathbb{R}^n$, into that new function space using a change of basis vectors.

Intuitively, we will transform a function of normal variables, e.g. $x$ and $y$, into a new space where the basis vectors are $sin$ and $cos$.

## Orthogonality
See [[Orthogonality]].
##### Theorem:
If there are two integers, $j$ and $k$, and for the natural period of $-\pi$ to $\pi$, then,
$$
\int_{-\pi}^{\pi}\cos(jx)\cos(kx)dx=\int_{-\pi}^{\pi}\sin(jx)\sin(kx)dx = \begin{cases}
\pi & \text{if}\>j=k \\
0 & \text{otherwise}
\end{cases}
$$
and
$$
\int_{-\pi}^{\pi}\sin(jx)\cos(kx)dx=0
$$
##### Proof:
For some integer $n$, $n \in \mathbb{Z}$, observe that,
$$
\int_{-\pi}^{\pi}\sin(nx)dx=0 \quad \text{and} \quad \int_{-\pi}^{\pi}\cos(nx)dx=\begin{cases}
2\pi & \text{if}\>n=0 \\
0 & \text{otherwise}
\end{cases}
$$
If $j$ and $k$ are likewise integers, $j, k \in \mathbb{N}$, we can use the [[Trig Identities#Product-to-Sum Formulae|product-to-sum identities]] to see that,
$$
\int_{-\pi}^{\pi}\cos(jx)\cos(kx)dx=\int_{-\pi}^{\pi}\frac{\cos([j-k]\>x)\>+\>\cos([j+k]\>x)}{2}dx=\begin{cases}
\pi & \text{if}\>j=k \\
0 & \text{otherwise}
\end{cases}
$$
and
$$
\int_{-\pi}^{\pi}\sin(jx)\sin(kx)dx=\int_{-\pi}^{\pi}\frac{\cos([j-k]\>x)\>-\>\cos([j+k]\>x)}{2}dx=\begin{cases}
\pi & \text{if}\>j=k \\
0 & \text{otherwise}
\end{cases}
$$
and
$$
\int_{-\pi}^{\pi}\sin(jx)\cos(kx)dx=\int_{-\pi}^{\pi}\frac{\sin([j-k]\>x)\>-\>\sin([j+k]\>x)}{2}dx=0
$$
---
Because of this conclusion, we can see that for two integers $j$ and $k$, $\sin(jx)$ and $\cos(kx)$ are orthogonal, since their [[Inner Product|inner product]] is equal to zero everywhere.

# References
1. [The Fourier Series from Cornell](https://e.math.cornell.edu/people/belk/measuretheory/Fourier%20Series.pdf)
2. [An Introduction to Fourier Series and Transforms by Justin Tarquino, U of Chicago](https://math.uchicago.edu/~may/REU2023/REUPapers/Tarquino.pdf)
3. [Fourier Series Derivation from University of Michigan](https://eecs.umich.edu/courses/eecs206/archive/winter02/FSeries.Spr99.pdf)