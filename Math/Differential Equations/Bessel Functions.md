# Definition
A Bessel function is one which is a solution to the following differential equation:
$$
x^2y''+xy'+(x^2-p^2)y=0 \tag{1}
$$
where $p$ is any constant and $y=y(x)$. The *order* of the Bessel function is defined by this constant $p$, which can be integer, half-integer, complex, etc., but which is most often a non-negative real number.

# Solutions

## Derivation of a Generic Solution

We can take equation (1) and divide it by $x^2$ to get, for $x>0$, 
$$
y''+\frac{1}{x}y'+(1-\frac{p^2}{x^2})y=0 \tag{2}
$$
This is the standard form of a second-order differential eq., in the form $y''+P(x)y'+Q(x)y=0$. We can see clearly that at $x=0$ this equation produces an undefined value, so at that point the function is not [[Analyticity|analytic]] and this represents a regular singularity. For that reason, according to the [[Frobenius Method]], we can assume a solution in the following form:
$$
y=x^{\alpha}(a_{0}+a_{1}x+a_{2}x^2+\dots+a_{n}x^n+\dots) = \sum_{n=0}^{\infty}a_{n}x^{\alpha+n}
$$
We can then differentiate to acquire $y'$ and $y''$, and substitute into the Bessel function (1):
$$
y'=\sum_{n=0}^{\infty}a_{n}(\alpha+n)x^{\alpha+n-1} \\[1.5em]
y''=\sum_{n=0}^{\infty}a_{n}(\alpha+n)(\alpha+n-1)x^{\alpha+n-2} \\[1.5em]
\implies \sum_{n=0}^{\infty}a_{n}(\alpha+n)(\alpha+n-1)x^{\alpha+n} + \sum_{n=0}^{\infty}a_{n}(\alpha+n)x^{\alpha+n} \\[0.2em] + \sum_{n=0}^{\infty}(x^2-p^2)a_{n}x^{\alpha+n} = 0 \tag{3}
$$
Now we will rearrange the third summation in this way:
$$
\sum_{n=0}^{\infty}(x^2-p^2)a_{n}x^{\alpha+n} \to \sum_{n=0}^{\infty}a_{n}x^{\alpha+n+2} - \sum_{n=0}^{\infty}a_{n}p^2x^{\alpha+n}
$$
And we can distribute terms in the first two summations in Eq. (3):
$$
\sum_{n=0}^{\infty}a_{n}(\alpha+n)(\alpha+n-1)x^{\alpha+n} \to \sum_{n=0}^{\infty}a_{n}(\alpha^2+n^2+2\alpha n-\alpha-n)x^{\alpha+n} \\[1.5em]
\sum_{n=0}^{\infty}a_{n}(\alpha+n)x^{\alpha+n} \to \sum_{n=0}^{\infty}a_{n}(\alpha+n)x^{\alpha+n}
$$
Then,
$$
(\alpha^2+n^2+2\alpha n-\alpha-n) + (\alpha+n) = \alpha^2+2\alpha n+n^2 = (\alpha+n)^2
$$
and we can rewrite (3) as,
$$
\sum_{n=0}^{\infty}[(\alpha+n)^2-p^2]a_{n}x^{\alpha+n} + \sum_{n=0}^{\infty}a_{n}x^{\alpha+n+2} = 0 \tag{4}
$$
Now we have the solution to the Bessel function expressed as two infinite sums. We should now attempt to combine those two sums into a single sum, through a change of index on the second sum, changing $x^{\alpha+n+2} \to x^{\alpha+n}$, $a_{n} \to a_{n-2}$, and changing the summation index from $n=0 \to n=2$. Writing this out, we have,
$$
\sum_{n=0}^{\infty}[(\alpha+n)^2-p^2]a_{n}x^{\alpha+n} + \sum_{n=2}^{\infty}a_{n-2}x^{\alpha+n} = 0 \tag{5}
$$
Now if we write out the first two terms of the first sum, where $n=0$ and $n=1$, then we can combine the two summations together:
$$
(\alpha^2-p^2)a_{0}x^{\alpha} + [(\alpha+1)^2-p^2]a_{1}x^{\alpha+1} \\[0.2em] + \sum_{n=2}^{\infty}([(\alpha+n)^2-p^2]a_{n} + a_{n-2})x^{\alpha+n} = 0 \tag{6}
$$
Now, since a true solution to Eq. (1) must be equal to zero in all terms, the coefficients of the terms we have written out must also be equal to zero. Thus we have,
$$
(\alpha^2-p^2)a_{0} = 0 \\[1.5em]
[(\alpha-1)^2-p^2]a_{1} = 0 \\[1.5em]
[(\alpha+n)^2-p^2]a_{n}+a_{n-2} = 0,\>\>n=2,3,4,\dots
$$
We assume that $a_{0}\ne0$ to avoid triviality, giving,
$$
\alpha^2-p^2=0 \implies \alpha=\pm\>p
$$
We will first assume that $\alpha=+\>p$ and substitute this into the previous equations, and we will consider $\alpha=-\>p$ later. So,
$$
(2p+1)a_{1} = 0 \\[1.5em]
(2pn+n^2)a_{n}+a_{n+2} = 0,\>\> n\geq2
$$
Now, this variable $p$ can be anything, but I will place the following restriction onto $p$ for the following reasons:
1. We assume that $p$ is real, $p \in \mathbb{R}$.
	1. If $p$ were complex, say $p=i\lambda,\> \lambda \in \mathbb{R},\> \lambda \ne 0$, then $\alpha=\pm i\lambda$ and $y \sim x^{\pm i\lambda}=e^{i\lambda \ln(x)}$. As $x\to0$, $\ln(x) \to -\infty$ and this function devolves into infinitely more frequent oscillations, there is no limit at the origin (our regular singularity).
2. We assume that $p$ is an integer, $p \in \mathbb{Z}$.
3. We assume that $p$ is positive, $p > 0$.
On top of this it so happens that most of the physical problems for which Bessel functions are useful already include a positive integer $p$.

So, since $p \ge 0$, then 