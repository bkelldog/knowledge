The Fourier transform is an [[The Integral|integral]] performed on an **aperiodic** and integrable function which outputs a new function whose domain is the set of all frequencies of sinusoids. This stands in contrast to the [[The Fourier Series|Fourier series]], which deals with **periodic** functions.

This transform is fundamental in the study of signals, audio, and in electrical engineering. Typically the function being transformed is a function of *time*.
# Definition
The Fourier transform of a function $g(t)$, resulting in a new function $\hat{g}(\omega)$, is given as,
$$
\hat{g}(f)=\int_{-\infty}^{\infty}g(t)\>e^{-2\pi itf}\>dt
$$
where $f$ represents the frequency of the $e^{-2 \pi itf}$ term, which, by [[Euler's Formula]], is equivalent to a sinusoid. Some people (like me) prefer to rewrite this equation with $\omega=2\pi f$, to arrive at, 
$$
\hat{g}(\omega)=\int_{-\infty}^{\infty}g(t)e^{-i\omega t}dt
$$

# Derivation


# References

1. [The History of the Fourier Transform](https://www.embs.org/pulse/articles/highlights-in-the-history-of-the-fourier-transform/) by Max Valentinuzzi, 2016

