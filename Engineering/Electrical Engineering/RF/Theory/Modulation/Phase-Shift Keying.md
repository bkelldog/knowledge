Phase-shift keying is a digital modulation technique that alters the phase of the carrier wave to encode binary information.

See [[Frequency-Shift Keying]].
# Types of Phase-Shift Keying
## BPSK
Binary phase-shift keying uses two phases separated by 180° to encode binary data. A 0-bit will appear as $A\>cos(\omega t+\phi_{1})$, and a 1-bit as $A\>cos(\omega t+\phi_{2})$, where $|\phi_{1}-\phi_{2}|=180°$.

## QPSK
Quadrature phase-shift keying uses four phases, $\phi_{1}$, $\phi_{2}$, $\phi_{3}$, $\phi_{4}$, to encode digital information two bits at a time (using *dibits*). Each of these four phases is separated from its neighbor by 90°, and by 180° from its opposite.

For example, a 00-bit might be represented with a phase of $\phi_{1}=0°$; a 01-bit might have a phase of $\phi_{2}=90°=-270°$; a 10-bit may have $\phi_{3}=180°=-180°$; and finally a 11-bit may be represented as $\phi_{4}=270°=-90°$.

The reader should recognize that, during real transmissions, the phase of the wave may shift between transmitter and receiver based on the distance between them, and any multipathing that occurs, or attenuation, etc. Generally it is not necessary for the receiver to have a reference signal against which to compare the received phase: the receiver can determine phase shift *differentially* by measuring the *change in phase* between dibits. The problem then becomes mapping received phase shifts to the dibits they are intended to represent by the transmitter.

## QAM
This topic merits a dedicated page. See [[Quadrature-Amplitude Modulation]].