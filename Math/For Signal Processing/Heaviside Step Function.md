# Origin
Named for [[Oliver Heaviside]].

# Definition

$$
\ H(x) = H_{u} (x) := \begin{cases}
0, \quad x<0 \\
1, \quad x\geq 0
\end{cases}
$$
```plot
u(x) [white]
```
The function is often written as $H_u(x)$ to denote both the names 'Heaviside Step Function' and 'Unit Step Function' at once.  $H(0) = 1$ if one is concerned with right-continuity. Alternately, and to be useful for Fourier analysis, it can instead be defined as

$$
\ H(x) := \begin{cases}
0, \quad x<0 \\
\frac{1}{2},\quad x = 0\\
1, \quad x > 0
\end{cases}
$$

It is also acceptable to simply leave $H(0)$ undefined:
$$
\ H(x) := \begin{cases}
0, \quad x<0 \\
1, \quad x > 0
\end{cases}
$$
### The Discrete Form

This function can also be represented as a discrete series instead of a continuous function,

$$
H[n] = \begin{cases}
0, \quad n < 0 \\
1, \quad n > 0
\end{cases}
$$
with the same caveats for defining $H[0]$ as 0, $1/2$, or 1 as in the continuous case.
# Properties

### The Dirac Delta Function

The Heaviside Step Function is the integral of the [[Dirac Delta Function]], and the Delta Function is the derivative of the Step Function:

$$
H(x) = \int_{-\infty}^{x} \delta(s) ds \quad\quad\quad \frac{d}{dx} H(x) = \delta (x)
$$

### In the Frequency Domain

The [[The Fourier Transform|Fourier transform]] of the step function is [difficult](https://www.cs.uaf.edu/~bueler/M611heaviside.pdf). However, the [[The Laplace Transform|Laplace transform]] of the function is much simpler, easier, and more directly relevant to signals engineering. The Laplace transform of $H(t)$ is given as,
$$
\mathcal{L}\{H(t)\}=\int^\infty_0e^{-st}dt=\frac{1}{s}
$$
with one caveat: this integral only converges for $\sigma>0$.

# Further Reading

1. [The Fourier Transform of the Heaviside Function: A Tragedy](https://www.cs.uaf.edu/~bueler/M611heaviside.pdf)
2. [The Fourier Transform of the Heaviside Step Function](https://jk-jeon.github.io/posts/2024/08/the-fourier-transform-of-the-heaviside-step-function/) by Junekey Jeon
3. [Laplace Tranforms of Functions](https://lpsa.swarthmore.edu/LaplaceXform/FwdLaplace/LaplaceFuncs.html) by Erik Cheever

