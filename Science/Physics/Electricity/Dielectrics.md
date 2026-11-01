A dielectric is any material which does not easily permit the movement of charge. They are also called *insulators* in different contexts.

# The Dielectric Constant
A dielectric is determined by its dielectric constant $k$, which is denoted as either the English letter 'k' or the Greek letter kappe 'κ'.
$$
\kappa=\frac{\epsilon}{\epsilon_0}
$$
where $\epsilon$ is the electrical [[Manuscript/Knowledge/Science/Physics/Electricity/Permittivity|permittivity]] of the substance, and $\epsilon_0$ is the electrical permittivity of empty space. This constant informs us as to the magnitude of the dielectric's insulating power: a high $\kappa$ indicates a good insulator, while a low $\kappa$ indicates a poor insulator (note that $\kappa=1$ is the constant's lowest possible value). Although I use the term 'conductor', the dielectric constant is, strictly speaking, only a measure of how well the dielectric allows the electric field to pervade it, not how well charge moves through it.

The dielectric constant is often derived by testing the material between the plates of a [[The Capacitor|capacitor]]. The plates are charged, and the capacitance of the empty capacitor, $C_0$, is taken; then the dielectric is inserted, and the new capacitance, $C_d$, is measured.

![Capacitance without dielectric vs. with dielectric](https://www.allaboutcircuits.com/uploads/articles/Arar-4-dielectric-impacti-on-capacitor.png)

The constant is then calculated to be the capacitance using the dielectric divided by the vacuum capacitance:
$$
\kappa = \frac{C_d}{C_0} = \frac{V_0}{V_d}
$$

# Polarization
Since charges within a dielectric material are **not free to move**, the atoms within the dielectric can become [[Manuscript/Knowledge/Science/Physics/Atomic/Polarization|polarized]] if exposed to an electric field.

The atoms of the dielectric can naturally be [[Dipoles|dipoles]], like $H_2O$, or they can be non-dipole, like a pure element such as hydrogen $H$. Yet, for non-dipole materials, an external electric field will induce the atoms to become temporary dipoles, with the nuclei being pulled in the direction of the field line, and the electrons being pulled against it (see section 3 in the figure below). The atoms within dipole materials are already polarized, yet are in disarray (as in section 2 below): an external electric field will exert a torque on dipole atoms and molecules which will align those atoms with the electric field (as in section 3).

![](https://electrical-information.com/wp-content/uploads/2022/07/Principle-of-Dielectric-Polarization-768x575.png)

When the dipoles within a dielectric are arrayed along the lines of the external field, each dipole will create an internal electric field in the opposite direction to the external, going from its positive side to its negative side. All these atomic or molecular electric fields will, in aggregate, oppose the external electric field applied across the dielectric, thus **increasing the capacitance** between teh two plates.

Recall that capacitance is defined as
$$
C=\frac{Q}{V}
$$
where $Q$ is the quantity of charge stored in coulombs, $V$ is the voltage across the capacitor in volts, and so capacitance is a measure of the quantity of charge stored per unit volt. A dielectric increases capacitance by decreasing the voltage needed to store the same amount of charge. Since,
$$
V=E \cdot d
$$
where $E$ is the electric field and $d$ is the distance between plates. When a dielectric is inserted between the plates, the opposing electric field caused by the dielectric reduces the strength of the electric field caused by the charges on the two plates. Therefore, $E$ is reduced, and so $V$ is reduced also, leading us to see that $C$ is increased.
