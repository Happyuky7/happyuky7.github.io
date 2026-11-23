Esto empezó por aburrimiento y se me fue un poco de las manos. Quería ver a **Gargantua**, el agujero negro de *Interstellar*, moviéndose en el navegador. Y no quería una imagen con un anillo pintado encima, sino algo calculado de verdad con la física de un agujero negro que gira.

El resultado es **Black Hole Web**. Puedes probarlo en [gargantua.happyuky7.com](https://gargantua.happyuky7.com) y el código está en [GitHub](https://github.com/Happyuky7/Black-Hole-Web-Interstellar-Style) (MIT).

> **Aviso:** la web calcula cada píxel en tiempo real, así que puede hacer que tu dispositivo vaya lento o se caliente. Se recomienda verla en un PC o una laptop con tarjeta gráfica. En móviles puede ir a tirones; si pasa, baja la calidad a *Fast*.

Este post no es un tutorial de programación. Es más bien lo que fui aprendiendo por el camino, explicado de la forma más simple que pude: qué es un agujero negro, por qué Gargantua se ve así y cómo hace la web para dibujarlo.

![Gargantua en el modo Cinema, con la cámara de la película](/blog-content/2026/11/black-hole-web-gargantua/cinema.webp)

## ¿Qué es un agujero negro?

Es una región donde hay tanta masa concentrada que el espacio-tiempo se curva hasta el punto de que nada puede salir, ni siquiera la luz. El borde de esa región se llama **horizonte de sucesos**: lo que lo cruza ya no vuelve.

Hay dos modelos clásicos:

- **Schwarzschild** (1916): un agujero negro que no gira. Es el caso más simple.
- **Kerr** (1963): un agujero negro que **gira**. Es el que importa en la vida real, porque casi todo en el universo gira, y también es el de Gargantua.

Que gire cambia mucho las cosas. El agujero negro arrastra el espacio-tiempo a su alrededor, y la luz que pasa por un lado no sigue el mismo camino que la que pasa por el otro. Por eso la sombra de Gargantua no es un círculo perfecto: está un poco aplastada de un lado.

## ¿Por qué Gargantua se ve así?

Alrededor del agujero negro hay un **disco de acreción**: gas que gira muy rápido y se calienta tanto que brilla. Ese disco es plano, como los anillos de Saturno. Entonces, ¿por qué en la película parece que hay un arco por encima y otro por debajo?

Es la **lente gravitacional**. La luz que sale de la parte del disco que está *detrás* del agujero negro no viaja en línea recta: la gravedad la curva por encima y por debajo, y llega hasta nosotros. Lo que vemos como un "halo" encima de la sombra es, en realidad, la parte trasera del disco.

Si te fijas bien, también hay un **anillo de fotones** muy fino pegado a la sombra. Es luz que dio media vuelta o más alrededor del agujero negro antes de escapar.

Nada de eso está pintado en la web. Sale solo de las ecuaciones.

## Lo que la película cambió a propósito

Los efectos de *Interstellar* se hicieron con el asesoramiento del físico **Kip Thorne**, y el equipo publicó después un artículo científico sobre cómo los calcularon ([James et al., 2015](https://arxiv.org/abs/1502.03808)). Pero hicieron una concesión importante.

En un agujero negro real, el lado del disco que viene **hacia nosotros** se ve mucho más brillante y más azul, y el que se aleja, más tenue y más rojo. Es el **efecto Doppler** relativista. En la película lo quitaron, porque un disco asimétrico y con colores raros habría confundido al público.

Por eso la web tiene dos formas de verlo:

- **Modos artísticos**, que recrean el estilo de la película: disco dorado, sin asimetría Doppler, grano de película y formato 2.39:1.
- **Modo científico**, que lo apaga todo y muestra lo que grabaría una cámara de verdad.

## Los cinco modos

La web trae cinco presets. Todos usan los mismos caminos de luz; lo que cambia es el giro, la cámara y cuánto se parece a la película.

**Interstellar.** El estilo de la película: giro 0,6, disco dorado sin Doppler, grano de película y formato 2.39:1.

![Modo Interstellar](/blog-content/2026/11/black-hole-web-gargantua/interstellar.webp)

**Cinema.** La cámara exacta de la película, muy lejos del agujero negro, con cielo negro y estrellas lejanas. Es la imagen del principio del post.

**Scientific.** Toda la física: disco de cuerpo negro, Doppler exacto y corrimiento al rojo gravitacional. El lado que se acerca brilla mucho más.

![Modo Scientific](/blog-content/2026/11/black-hole-web-gargantua/scientific.webp)

**Clean Kerr.** Giro de 0,94 con el Doppler real, pero con el disco de estilo película. Por eso un lado brilla más que el otro.

![Modo Clean Kerr](/blog-content/2026/11/black-hole-web-gargantua/clean-kerr.webp)

**Edge-on.** Giro casi máximo (0,998) y la cámara casi en el plano del disco: una banda fina muy brillante y una lente gravitacional muy fuerte.

![Modo Edge-on](/blog-content/2026/11/black-hole-web-gargantua/edge-on.webp)

## Cómo lo dibuja la web

La idea se llama **ray tracing hacia atrás**. Por cada píxel de la pantalla, la web lanza un rayo de luz desde la cámara *hacia atrás* y lo sigue por el espacio-tiempo curvado. Pueden pasar tres cosas:

1. **Choca con el disco**: el píxel toma el color del gas en ese punto.
2. **Cae en el horizonte**: el píxel queda negro. Así aparece la sombra.
3. **Escapa**: el píxel muestra la estrella del cielo hacia la que apunta al final. Así se deforma el fondo de estrellas.

Todo eso se calcula en la GPU, para cada píxel, en cada fotograma. El camino de la luz se va integrando paso a paso. Hay dos métodos: *leapfrog*, más rápido, para los modos artísticos, y **RK4**, que con el mismo número de pasos es unas **7 veces más preciso**, para el modo científico.

## La temperatura del disco

En el modo científico, el color del disco no se elige a mano. Sale de un modelo físico (Novikov–Thorne) que calcula qué tan caliente está el gas según la **masa** del agujero negro y **cuánto material está tragando**. Después ese calor se convierte en color con las curvas que usa la ciencia para describir cómo vemos los colores.

Hay un detalle que me pareció muy curioso:

$$
T \propto \left(\frac{\lambda_{\text{Edd}}}{M}\right)^{1/4}
$$

La temperatura baja cuando la masa sube. Es decir: **cuanto más grande es el agujero negro, más frío es su disco**. Un agujero negro de cien millones de soles que traga al 10 % de su límite brilla blanco azulado, a unos 120 000 K. Si bajas cuánto traga, el disco se vuelve dorado y el lado Doppler se vuelve mucho más dramático.

## Lo que todavía no simula

El modo científico intenta ser honesto, así que también dice lo que no hace:

- Supone un disco **delgado**. Agujeros negros como M87\*, el de la [primera foto real](https://eventhorizontelescope.org/) de 2019, tragan tan poco que su gas forma una nube gruesa y caliente que esto no simula.
- No tiene **chorro** ni corona.
- No recalcula la luz que el disco se devuelve a sí mismo.
- La cámara está quieta. Una nave en órbita, como la Endurance, vería el cielo un poco desplazado.

## Si quieres aprender más

Dentro de la web hay una página llamada **La física** (`/physics`) que explica cada ecuación paso a paso, desde la métrica de Kerr hasta el color de un píxel. Está respaldada por **27 fuentes científicas** con sus DOI comprobados. También hay una versión técnica en el repositorio: [PHYSICS.md](https://github.com/Happyuky7/Black-Hole-Web-Interstellar-Style/blob/master/docs/PHYSICS.md).

Si lo usas en una clase o una charla, el repositorio tiene el botón de citar de GitHub y la página de física trae la cita lista en APA y BibTeX.

## Pruébalo

Abre [gargantua.happyuky7.com](https://gargantua.happyuky7.com), arrastra el ratón para orbitar y pulsa **V** para volar libremente hasta casi rozar la esfera de fotones. Prueba los cinco presets: *Interstellar*, *Cinema*, *Scientific*, *Clean Kerr* y *Edge-on*. Si va lento, baja la calidad a *Fast*.

Empezó como algo para pasar el rato y terminó siendo una de las cosas con las que más aprendí este año. Si te quedas mirando un agujero negro más tiempo del que pensabas, una ⭐ en el [repositorio](https://github.com/Happyuky7/Black-Hole-Web-Interstellar-Style) se agradece.
