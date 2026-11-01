The Laplace Transform is an [[The Integral|integral]] which transforms a function in the [[Time Domain|time domain]] to one in the [[Frequency Domain#s-Domain|s domain]]. This transform is incredibly useful in many fields of mathematics and engineering, especially in computing solutions to differential equations and in signal engineering.
# Definition
There are two forms of the Laplace transform, namely **unilateral** (one-sided) and **bilateral** (two-sided). This refers to whether or not we consider the entire region from $-\infty$ to $\infty$, as in the bilateral case, or if we stay within the interval of $0$ to $\infty$, as in the unilateral case.

Why we would make such a distinction? For the purposes of signal processing, where the Laplace transform is paramount, signals abide by the laws of causality, meaning that if some signal is caused by an event that occurs at $t=0$, then there can be no signal before $t=0$, since that would imply the signal began *before* the event which caused it. Therefore, we can usually disregard all points of time before the signal begins at $t=0$.


$$
\mathscr{L} \{\>f(t)\>\} = \hat{f}(s) = \int_{0}^{\infty}e^{-st}\>f(t)\>dt
$$

# Derivation
The Laplace Transform is in many ways an extension of the [[The Fourier Transform|Fourier transform]]. Many functions cause the Fourier transform integral to diverge, which means we cannot find their representation in the frequency domain. Take, for example,
$$
f(t)=e^{at}\>u(t), \quad a>0
$$
where $u(t)$ is the [[Heaviside Step Function|Heaviside step function]] indicating that the function is zero for all times where $t<0$. The integral of this function will clearly diverge,
$$
\hat{f}(\omega)=\int_0^\infty e^{at}\>e^{-j \omega t}\>dt=\int_0^\infty e^{(a-j\omega)t}\>dt
$$
since $e^{(a-j\omega)t}\to\infty \>\> \text{as} \>\> t\to\infty$. (Note that for $a\leq0$, the integral does actually converge). This term causes the integral to diverge because it goes to infinity.

As a solution to this behavior, [[Oliver Heaviside|Heaviside]] introduced a new term to the Fourier integral, an exponential function raised to the power of a real number $\sigma$. The Fourier transform then became,
$$
\hat{g}(\omega)=\int_{-\infty}^{\infty}g(t)e^{-i\omega t}dt \>\to\> \hat{g}(\omega)=\int_{-\infty}^{\infty}g(t)e^{-i\omega t}e^{-\sigma t}dt
$$
If we then combine the exponential terms, we arrive at a new variable $s$,
$$
e^{-i\omega t}e^{-\sigma t}=e^{-t(\sigma+i\omega)}=e^{-st}
$$
where $s=\sigma+i\omega$. This new exponential term represents an **exponential damper** on any function that naturally goes to infinity. So in our previous example of $f(t)=e^{at}\>u(t),\>a>0$, we would then have the following integral instead,
$$
\hat{f}(\omega)=\int_0^\infty e^{at}\>e^{-st}\>dt=\int_0^\infty e^{(a-s)t}\>dt
$$
Here the operative term is $e^{(a-s)t}$. If this term goes to infinity as $t\to\infty$, then the integral diverges; if it does not, then the integral converges. The behavior of this term is governed by both $a$ and $\sigma$ now, in the following relationship,
$$
e^{(a-s)t}=e^{(a-\sigma-j\omega)t}=e^{((a-\sigma)-j\omega)t}
$$
Now, as before, if $a-\sigma$ is positive, the term will go to infinity as $t\to\infty$ and the integral will diverge; if $a-\sigma$ is negative, the term will go to $0$ as $t\to\infty$ and the integral wil converge. Therefore, we can say that if $\sigma > a$, the integral will converge, and if $\sigma < a$, the integral will diverge. Thus we have Heaviside's reasoning for introducing this new term: it allows us to evaluate integrals which would otherwise diverge. So we have,
$$
\mathcal{F}(s)=\hat{f}(s)=\mathcal{L}(f(t))=\int_0^\infty f(t)\>e^{-st}\>dt
$$

To give a more geometric explanation of this reasoning, we can imagine two functions from our example, one being $e^{at}$ and the other $e^{-st}$.
```plot
f(t)=e^{t}
g(t)=e^{-t}
h(t)=e^t * e^{-t}
x: 0 to 3
```
Here, $a=\sigma$, and one can see that the growing exponential grows at the same rate as the shrinking exponential shrinks. So, if we multiply them together, we get a result $h(t)$ that equals $1$ everywhere. If $a>\sigma$, let's say $a=2\sigma$, then we have,
```plot
f(t)=e^{2t}
g(t)=e^{-t}
h(t)=e^{2t}*e^{-t}
x: 0 to 3
```
We can see that the growing exponential grows much faster than the shrinking exponential shrinks. Therefore if they are multiplied together into $h(t)$, the growing exponential will "pull up" on the shrinking faster than the shrinking can "pull down" on the growing, and so as $t\to\infty$, the function will grow to $\infty$. We can see the green line for $h(t)$ rising slowly to $\infty$. On the other hand, if we have $\sigma>a$, say $\sigma=2a$, then we have the following,
```plot
f(t)=e^{t}
g(t)=e^{-2t}
h(t)=e^{t}*e^{-2t}
x: 0 to 3
```
Here we can see the green line $h(t)$ converging to $0$ along with the blue line for our shrinking exponential. If the shrinking exponential is dominant, it will overpower the growing exponential's rise and force their product down to $0$ as $t\to\infty$.