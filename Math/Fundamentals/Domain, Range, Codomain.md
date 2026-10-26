The twin terms 'domain' and 'range' refer to the set of inputs and set of outputs which are valid for a given function.
# Domain
The term 'domain' in mathematics refers to the set of numbers for which a function gives a valid output. For example, the natural logarithm function $f(x)=\ln(x)$ has a domain of $x\geq0$, since any inputs less than zero do not correspond to any output. For some functions, like $f(x)=\sqrt{x}$, the domain can be restricted on the real number plane $\mathbb{R}$ but exist fully on the complex number plane $\mathbb{C}$. 

# Range
The term 'range' in mathematics referes to the set of numbers which a function outputs for a given domain. For example, the function $f(x)=x^2$ has a domain of $(-\infty, \infty)$, but has a range of $f(x)\geq 0$, so as $x$ sweeps over the entire domain, the only outputs that we see are between $0$ and $+\infty$.

# Codomain
The term 'codomain' presents a supplemental concept to those of domain and range: specifically, asserting the codomain of a function tells the reader what kind of range he can expect, but not what the range actually is. We can take the function $f(x)=x^2$ as an example. For this function, if the domain is all real numbers $\mathbb{R}$, then we can say the codomain is also all real numbers $\mathbb{R}$ without knowing what *subset* of $\mathbb{R}$ is actually produced by $f(x)$, and we can write the function notationally as one that maps real numbers to other real numbers, $f(x): \mathbb{R} \to \mathbb{R}$

Declring the codomain of a function becomes useful for function whose range is not immediately obvious. As an example, consider $f(x)=x\>e^x$. This function's range is not apparent and requires some work to discern, yet we know that whatever the range might be, it will be a subset of the real numbers, so we can describe this function as $f(x): \mathbb{R} \to \mathbb{R}$. Or suppose we had some function that we didn't even have an equation for, like,
$$
f(x)=\begin{cases} x, \>\>\text{if x is prime} \\ \text{undefined, otherwise}\end{cases}
$$
We don't know all the prime numbers, but we can be sure that all prime numbers are positive integers, so we can say the codomain is the set of all integers, so that we get $f(x): \mathbb{P} \to \mathbb{N}$.