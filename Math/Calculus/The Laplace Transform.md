# Definition
There are two forms of the Laplace transform, namely **unilateral** (one-sided) and **bilateral** (two-sided). This refers to whether or not we consider the region from $-\infty$ to $0$, as in the bilateral case, or if we stay within the interval of $0$ to $\infty$, as in the unilateral case.

One might ask why we would do such a thing? For the purposes of signal processing, for which the Laplace transform is paramount, signals abide by the laws of causality, meaning that if some signal is caused by an event that occurs at $t=0$, then there can be no signal before $t=0$, since that would imply the signal began *before* the event which caused it. Therefore, we can usually disregard all points of time before the signal begins at $t=0$.


$$
\mathscr{L} \{\>f(x)\>\} = \hat{f}(s) = \int_{0}^{\infty}e^{-sx}\>f(x)\>dx
$$

# Derivation
