# Definition
The four Maxwell equations can be written in [[The Differential|differential]] or [[The Integral|integral]] form:
$$
\begin{aligned}
\vec{\nabla}\cdot \vec{E} &= \frac{\rho}{\varepsilon_0} &&\text{(Gauss's Law)}\\[6pt]
\vec{\nabla}\cdot \vec{B} &= 0 &&\text{(Gauss's Law for Magnetism)}\\[6pt]
\vec{\nabla}\times \vec{E} &= -\frac{\partial \vec{B}}{\partial t} &&\text{(Faraday's Law)}\\[6pt]
\vec{\nabla}\times \vec{B} &= \mu_0\vec{J} + \mu_0\varepsilon_0\frac{\partial \vec{E}}{\partial t} &&\text{(Ampère–Maxwell Law)}
\end{aligned}
$$
$$
\begin{aligned}
\oint_{\partial V}\mathbf{E}\cdot d\mathbf{A} &= \frac{1}{\varepsilon_0}\int_V \rho\,dV &&\text{(Gauss's Law)} \\[6pt]
\oint_{\partial V}\mathbf{B}\cdot d\mathbf{A} &= 0 &&\text{(Gauss's Law for Magnetism)}\\[6pt]
\oint_{\partial S}\mathbf{E}\cdot d\boldsymbol{\ell} &= -\frac{d}{dt}\iint_S \mathbf{B}\cdot d\mathbf{A} &&\text{(Faraday's Law)} \\[6pt]
\oint_{\partial S}\mathbf{B}\cdot d\boldsymbol{\ell} &= \mu_0\iint_S \mathbf{J}\cdot d\mathbf{A} + \mu_0\varepsilon_0\frac{d}{dt}\iint_S \mathbf{E}\cdot d\mathbf{A} &&\text{(Ampère–Maxwell Law)}
\end{aligned}
$$

# Derivation
## Gauss's Law

## Gauss's Law for Magnetism


## Faraday's Law
### The Flux Rule
$$
\Phi_{B}=\iint_{S} \vec{B} \>\cdot\>d\vec{A}
$$

### Lenz's Law
Electromagnetic induction is the process where a changing magnetic field induces an electric current in a conductor. [[Michael Faraday]] recorded experimentally that a voltage $V$ was induced within a conductive coil with $n$ turns when the magnetic field passing through that coil was altered, and that the induced voltage was proportional to the change in the magnetic field. We can write this simple relationship as,
$$
V=n \frac{d\varphi}{dt}
$$
where $\varphi$ is the magnetic [[Flux|flux]] passing through the coil, and $t$ is of course time.

Magnetic flux is a measurement of the magnitude of the magnetic field which passes through a surface in space

## Ampère-Maxwell Law




$$
\begin{aligned}
\nabla\cdot\mathbf{D} &= \rho_{\mathrm{free}} \\[6pt]
\nabla\cdot\mathbf{B} &= 0 \\[6pt]
\nabla\times\mathbf{E} &= -\frac{\partial \mathbf{B}}{\partial t} \\[6pt]
\nabla\times\mathbf{H} &= \mathbf{J}_{\mathrm{free}} + \frac{\partial \mathbf{D}}{\partial t}
\end{aligned}
$$

$$
\nabla\cdot\mathbf{J} + \frac{\partial \rho}{\partial t} = 0
$$

# References
1. [The Maxwell Equations - Part of the Feynman Lectures](https://www.feynmanlectures.caltech.edu/II_18.html)
2. [The Maxwell Equations - U.S. Particle Accelerator School](https://uspas.fnal.gov/materials/18ODU/2L%20Maxwell's_Equations.pdf)