A convolution is a type of [[The Integral|integral]] which is useful for passing a signal through a [[Transfer Functions|transfer function]]. In essence, it decomposes a continuous function into an infinite sum of [[Dirac Delta Function|Dirac delta functions]], then multiplies each by the transfer function, and recombines those infinite delta functions through the infinite sum of the integral to get an output signal on the other side.

# Definition
For two functions $f(t)$ and $g(t)$, their convolution is given as,
$$
f(t)*g(t)=\int_{-\infty}^{\infty}f(\tau)\>g(t-\tau)\>d\tau=\int_{-\infty}^{\infty}f(t-\tau)\>g(\tau)\>d\tau \tag{1}
$$
where the convolution function is denoted by the star operator $*$;  on paper one would draw a star between $f$ and $g$. 

It is also true that **convolution in the time domain is multiplication in the**[[Frequency Domain]].
$$
h(t)=f(t)*g(t) \Longleftrightarrow H(\omega)=F(\omega) \cdot G(\omega) \tag{2}
$$
# Derivation
## Convolution Equation
Suppose we have a physical system whose input is $x(t)$ and whose output is $y(t)$, and that this system is [[linear time-invariant]]. Suppose that this system is also described by a known [[impulse response]] $h(t)$. This means that if the input signal is a [[Dirac Delta Function]], then the output will be the impulse response:
$$
x(t)=\delta(t) \>\to\>y(t)=h(t)
$$
Now, we must recognize that all functions can be expressed as an infinite series of dirac delta functions scaled by the value of the function at the point where the delta function equals one. Recall that the delta function is equal to one at only a single point, which we can call $\tau$, and that if we multiply the delta function by some other function $f(t)$, then the product will be zero everywhere except at $t=\tau$, at which point it will be equal to $f(\tau)$. In this way the delta function "filters" $f(t)$ down to a single point at $(\tau, f(\tau))$. We could create piecewise functions using some number of delta functions, where the product is equal to the original function at only a handful of points. For example, the following function, 
$$
f(t)=t^2\>(\delta(t+2)\>+\>\delta(t-1))
$$
is equal to zero everywhere except at $t=-2$ and $t=1$, where it is equal to $4$ and $1$ respectively. The reader should be able to see that the regular function $f(t)=t^2$ is being filtered down to two single points by the First function. Generally, one can "pick out" a single point of any function by multiplying it by a delta function translated to that single point. 

We can then imagine that an infinite series of delta functions would give us an infinite series of points that lie on $f(t)$,
$$
f(t)=e^t
$$
$$
f(t) \approx e^t(...\>+\delta(t+2\tau)+\delta(t+\tau)+\delta(t)+\delta(t-\tau)+\delta(t-2\tau)\>...)=\sum_{\tau=-n}^n e^\tau \delta(t-\tau)=f(\tau)
$$
for some large $n$. Note that I translate $e^t$ into $e^\tau$ to make the sum easy, this is just a variable swap. This gives us a collection of $2n$ points existing at each integer value of $\tau$ between $-n$ and $n$. To better approximate $f(t)$, we must have infinitely many points ($n\to\infty$) spaced intiniftely close together ($\Delta\tau\to0$),
$$
f(t)=\lim_{n\to\infty}\sum_{\tau=-n}^n e^\tau\delta(t-\tau)\>\Delta\tau
$$
where $\Delta\tau=\frac{b-a}{n} \>\text{as}\> b \to-\infty, a\to\infty$ for some interval $[a, b]$, as in the Riemann integral. And it should be clear that we have recreated the integral,
$$
f(t)= \int_{-\infty}^{\infty}f(\tau)\>\delta(t-\tau)\>d\tau
$$
Therefore, any function $f(t)$ can be represented as an infinite series of delta functions in place of a continuous function. Don't forget that $\tau$ as a variable is just some particular value on the $t$ domain, some point in time; it is also a useful dummy variable so that the integral resolves to a function of $t$.

This is significant because the transfer function is defined by its impulse response: if we can express an arbitrary input function as a series of impulses, and we know how the system will respond to a single impulse, then we can pass the series of impulses through the system and superimpose the individual outputs onto each other to form a general output function.

If the system input signal $x(t)$ is composed of an infinite number of delta functions, each equal to $x(\tau)\>\delta(t-\tau)$ at some point $t=\tau$, then the response to each individual delta function is
$$
y(t-\tau)=x(\tau)\>h(t-\tau)
$$
If we take the integral for all possible values of $\tau$, we have,
$$
y(t)=\int_{-\infty}^\infty x(\tau)\>h(t-\tau)\>d\tau=x(t)*h(t)
$$
This is convolution.

It should be noted again that $t$ is a constant value here and $\tau$ is the variable. For that reason, the function $h(-\tau+t)$ is not the same as $h(t)$. To bridge the gap between them, we must first rename variables,
$$
h(t)\to h(\tau)
$$
then we must make $\tau$ negative, which has the geometrical effect of revolving the function about the y-axis, to get $h(-\tau)$. Then we can translate this function along the $\tau$-axis by a constant $t$,
$$
h(-\tau+t)=h(t-\tau)
$$
This is the form required by the convolution equation. Many students are taught to "take the transfer function, reverse it along the x-axis, and 'slide' it across the input function", without understanding why we do this. Here the math speaks for itself.

## Convolution in the Frequency Domain
Convolution in the time domain is multiplication in the frequency domain. To show this, we must take the [[The Fourier Transform|Fourier transform]] of the convolution equation (1). So if,
$$
h(t)=f(t)*g(t)
$$
then in the frequency domain we have,
$$
H(\omega)=\int_{-\infty}^{\infty}\lbrack \int_{-\infty}^{\infty}f(\tau)\>g(t-\tau)\>d\tau \rbrack\>e^{-i\omega t}dt
$$
We now have a double integral over both $t$ and $\tau$. We can switch the order of integration to focus on $t$ first:
$$
H(\omega)=\int_{-\infty}^{\infty}\int_{-\infty}^{\infty}f(\tau)\>g(t-\tau)\>e^{-i\omega t}dt\>d\tau
$$
We can remove $f(\tau)$ to the outer integral since it doesn't depend on $t$:
$$
H(\omega)=\int_{-\infty}^{\infty}f(\tau)\int_{-\infty}^{\infty}g(t-\tau)\>e^{-i\omega t}dt\>d\tau
$$
Now we can focus on the inner integral, and solve by $u$-substitution,
$$
\int_{-\infty}^{\infty}g(t-\tau)\>e^{-i\omega t}dt \quad\quad u=t-\tau \Rightarrow t=u+\tau \>\>\> \text{and} \>\>\> dt=du
$$
$$
\int_{-\infty}^{\infty}g(u)\>e^{-i\omega (u+\tau)}du=\int_{-\infty}^{\infty}g(u)\>e^{-i\omega u}e^{-i\omega\tau}du
$$
We can pull out $e^{-i\omega\tau}$ term since it doesn't depend on $u$:
$$
e^{-i\omega\tau}\int_{-\infty}^{\infty}g(u)\>e^{-i\omega u}du
$$
This integral is just the Fourier transform of $g(u)$, which is $G(\omega)$. Then, if we return to the larger integral we can draw this $G(\omega)$ out of the expression entirely, since it no longer depends on $\tau$.
$$
H(\omega)=\int_{-\infty}^{\infty}f(\tau)\>e^{-i\omega\tau}\>G(\omega)\>d\tau=G(\omega)\int_{-\infty}^{\infty}f(\tau)\>e^{-i\omega\tau}\>d\tau
$$
This remaining integral is just the Fouriet transform of $f(\tau)$, which is $F(\omega)$. So finally we have,
$$
H(\omega)=F(\omega)\>\cdot\>G(\omega)
$$
which is equation (2).
# Uses

### System Transfer Functions
A system's output to an arbitrary input can usually be found by a convolution, as long as the system is linear time-invariant. For example, if we have a square input function $x(t)=u(t)$ (which is the [[Heaviside Step Function|Heaviside step function]]), and a system with a transfer function $h(t)=e^-t\>u(t)$, and we want to find the system output $y(t)$.
$$
y(t)=x(t)*h(t)=\int_{-\infty}^{\infty}u(t)\>e^{-(t-\tau)}u(t-\tau)\>d\tau
$$
The $u(\tau)$ and $u(t-\tau)$ terms ensure that the integrand is equal to zero before $\tau=0$ and also after $\tau=t$, so we can change the bounds of integration:
$$
y(t)=\int_{0}^{t}e^{\tau-t}\>d\tau
$$
Then we can solve:
$$
y(t)=\int_{0}^{t}e^{\tau-t}\>d\tau=\int_{0}^{t}e^{\tau}e^{-t}\>d\tau=e^{-t}\int_{0}^{t}e^{\tau}\>d\tau=e^{-t}\lbrack e^{\tau}\rbrack_{0}^{t}
$$
$$
y(t)=e^{-t}(e^t-e^0)=e^{-t}e^{t}-e^{-t}
$$
$$
y(t)=1-e^{-t}
$$
Thus we've used convolution to decompose $u(t)$ into an infinite number of Dirac delta functions, then pass each one through the impusle response function $h(t)$, and finally superimpose all outputs onto each other to form an output function.