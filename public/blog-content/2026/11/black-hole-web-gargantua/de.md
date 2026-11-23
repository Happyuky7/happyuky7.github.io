Angefangen hat das aus Langeweile, und dann ist es ein bisschen ausgeufert. Ich wollte **Gargantua**, das Schwarze Loch aus *Interstellar*, im Browser in Bewegung sehen. Kein Bild mit einem aufgemalten Ring, sondern etwas, das wirklich mit der Physik eines rotierenden Schwarzen Lochs berechnet wird.

Das Ergebnis heißt **Black Hole Web**. Ausprobieren kannst du es auf [gargantua.happyuky7.com](https://gargantua.happyuky7.com), der Code liegt auf [GitHub](https://github.com/Happyuky7/Black-Hole-Web-Interstellar-Style) (MIT).

> **Hinweis:** Die Website berechnet jeden Pixel in Echtzeit, dadurch kann dein Gerät ruckeln oder warm werden. Am besten schaust du es dir auf einem PC oder Laptop mit Grafikkarte an. Auf dem Handy kann es stocken; dann stell die Qualität auf *Fast*.

Dieser Post ist kein Programmier-Tutorial. Eher das, was ich unterwegs gelernt habe, so einfach erklärt wie möglich: was ein Schwarzes Loch ist, warum Gargantua so aussieht und wie die Website es zeichnet.

![Gargantua im Cinema-Modus, mit der Kamera aus dem Film](/blog-content/2026/11/black-hole-web-gargantua/cinema.webp)

## Was ist ein Schwarzes Loch?

Eine Region, in der so viel Masse auf engem Raum steckt, dass die Raumzeit sich so stark krümmt, dass nichts mehr herauskommt, nicht einmal Licht. Der Rand dieser Region heißt **Ereignishorizont**: Was ihn überquert, kommt nicht zurück.

Es gibt zwei klassische Modelle:

- **Schwarzschild** (1916): ein Schwarzes Loch, das sich nicht dreht. Der einfachste Fall.
- **Kerr** (1963): ein Schwarzes Loch, das sich **dreht**. Das ist das, was in der Realität zählt, weil sich im Universum fast alles dreht, und es ist auch der Fall von Gargantua.

Die Drehung verändert eine Menge. Das Schwarze Loch zieht die Raumzeit mit sich, und Licht, das auf der einen Seite vorbeikommt, nimmt nicht denselben Weg wie Licht auf der anderen Seite. Deshalb ist Gargantuas Schatten kein perfekter Kreis: Er ist auf einer Seite leicht abgeflacht.

## Warum sieht Gargantua so aus?

Um das Schwarze Loch herum liegt eine **Akkretionsscheibe**: Gas, das so schnell kreist und so heiß wird, dass es leuchtet. Diese Scheibe ist flach, wie die Ringe des Saturn. Warum zeigt der Film dann einen Bogen oben und einen unten?

Das ist der **Gravitationslinseneffekt**. Licht aus dem Teil der Scheibe, der *hinter* dem Schwarzen Loch liegt, fliegt nicht geradeaus: Die Gravitation biegt es über die Oberseite und unter der Unterseite herum, und so erreicht es uns. Was wie ein „Heiligenschein" über dem Schatten aussieht, ist in Wirklichkeit die Rückseite der Scheibe.

Wer genau hinschaut, sieht auch einen sehr dünnen **Photonenring** direkt am Schatten. Das ist Licht, das eine halbe Runde oder mehr um das Schwarze Loch gelaufen ist, bevor es entkommen konnte.

Nichts davon ist auf der Website aufgemalt. Alles kommt aus den Gleichungen.

## Was der Film absichtlich verändert hat

Die Effekte in *Interstellar* entstanden mit der Beratung des Physikers **Kip Thorne**, und das Team hat später einen wissenschaftlichen Artikel darüber veröffentlicht, wie sie berechnet wurden ([James et al., 2015](https://arxiv.org/abs/1502.03808)). Aber es gab ein wichtiges Zugeständnis.

Bei einem echten Schwarzen Loch wirkt die Seite der Scheibe, die sich **auf uns zu** bewegt, viel heller und blauer, die Seite, die sich entfernt, schwächer und röter. Das ist der relativistische **Doppler-Effekt**. Im Film wurde er weggelassen, weil eine schiefe Scheibe mit seltsamen Farben das Publikum verwirrt hätte.

Deshalb gibt es auf der Website zwei Arten, es anzusehen:

- **Künstlerische Modi**, die den Look des Films nachbilden: goldene Scheibe, keine Doppler-Asymmetrie, Filmkorn und 2.39:1-Format.
- **Wissenschaftlicher Modus**, der all das abschaltet und zeigt, was eine echte Kamera aufnehmen würde.

## Die fünf Modi

Die Website hat fünf Presets. Alle nutzen dieselben Lichtwege; was sich ändert, sind die Drehung, die Kamera und wie nah es am Film bleibt.

**Interstellar.** Der Look des Films: Drehung 0,6, goldene Scheibe ohne Doppler, Filmkorn und 2.39:1-Format.

![Interstellar-Modus](/blog-content/2026/11/black-hole-web-gargantua/interstellar.webp)

**Cinema.** Die exakte Kamera aus dem Film, weit weg vom Schwarzen Loch, mit schwarzem Himmel und fernen Sternen. Das ist das Bild ganz oben im Post.

**Scientific.** Die volle Physik: Schwarzkörper-Scheibe, exakter Doppler und gravitative Rotverschiebung. Die Seite, die auf uns zukommt, leuchtet viel stärker.

![Scientific-Modus](/blog-content/2026/11/black-hole-web-gargantua/scientific.webp)

**Clean Kerr.** Drehung 0,94 mit echtem Doppler, aber mit der Scheibe im Filmstil. Deshalb leuchtet eine Seite stärker als die andere.

![Clean-Kerr-Modus](/blog-content/2026/11/black-hole-web-gargantua/clean-kerr.webp)

**Edge-on.** Fast maximale Drehung (0,998) und die Kamera fast in der Scheibenebene: ein dünnes, sehr helles Band und ein sehr starker Linseneffekt.

![Edge-on-Modus](/blog-content/2026/11/black-hole-web-gargantua/edge-on.webp)

## Wie die Website es zeichnet

Die Idee heißt **Rückwärts-Raytracing**. Für jeden Pixel auf dem Bildschirm schickt die Website einen Lichtstrahl von der Kamera aus *rückwärts* los und verfolgt ihn durch die gekrümmte Raumzeit. Drei Dinge können passieren:

1. **Er trifft die Scheibe**: Der Pixel bekommt die Farbe des Gases an dieser Stelle.
2. **Er fällt in den Horizont**: Der Pixel bleibt schwarz. So entsteht der Schatten.
3. **Er entkommt**: Der Pixel zeigt den Stern, auf den der Strahl am Ende zeigt. So verzerrt sich der Sternenhimmel.

All das wird auf der GPU berechnet, für jeden Pixel, in jedem Frame. Der Lichtweg wird Schritt für Schritt integriert. Es gibt zwei Verfahren: *Leapfrog*, schneller, für die künstlerischen Modi, und **RK4**, das bei gleicher Schrittzahl etwa **7-mal genauer** ist, für den wissenschaftlichen Modus.

## Die Temperatur der Scheibe

Im wissenschaftlichen Modus wird die Farbe der Scheibe nicht von Hand gewählt. Sie kommt aus einem physikalischen Modell (Novikov–Thorne), das aus der **Masse** des Schwarzen Lochs und **wie viel Materie es verschluckt** berechnet, wie heiß das Gas ist. Diese Wärme wird dann mit den Kurven, mit denen die Wissenschaft unser Farbsehen beschreibt, in Farbe umgerechnet.

Ein Detail fand ich besonders spannend:

$$
T \propto \left(\frac{\lambda_{\text{Edd}}}{M}\right)^{1/4}
$$

Die Temperatur sinkt, wenn die Masse steigt. Anders gesagt: **Je größer das Schwarze Loch, desto kühler seine Scheibe**. Ein Schwarzes Loch mit hundert Millionen Sonnenmassen, das mit 10 % seines Limits Materie verschluckt, leuchtet bläulich-weiß bei etwa 120 000 K. Dreht man herunter, wie viel es verschluckt, wird die Scheibe golden und die Doppler-Seite viel dramatischer.

## Was es noch nicht simuliert

Der wissenschaftliche Modus will ehrlich sein, also sagt er auch, was er nicht kann:

- Er geht von einer **dünnen** Scheibe aus. Schwarze Löcher wie M87\*, das auf dem [ersten echten Foto](https://eventhorizontelescope.org/) von 2019, verschlucken so wenig, dass ihr Gas eine dicke, heiße Wolke bildet, die hier nicht simuliert wird.
- Es gibt keinen **Jet** und keine Korona.
- Licht, das die Scheibe auf sich selbst zurückwirft, wird nicht neu berechnet.
- Die Kamera steht still. Ein Schiff im Orbit, wie die Endurance, würde den Himmel leicht verschoben sehen.

## Wer mehr lernen will

In der Website gibt es eine Seite namens **Die Physik** (`/physics`), die jede Gleichung Schritt für Schritt erklärt, von der Kerr-Metrik bis zur Farbe eines Pixels. Sie stützt sich auf **27 wissenschaftliche Quellen** mit geprüften DOIs. Eine technische Fassung liegt auch im Repository: [PHYSICS.md](https://github.com/Happyuky7/Black-Hole-Web-Interstellar-Style/blob/master/docs/PHYSICS.md).

Wer es im Unterricht oder in einem Vortrag nutzt: Das Repository hat GitHubs Zitier-Button, und die Physikseite liefert ein fertiges Zitat in APA und BibTeX.

## Ausprobieren

Öffne [gargantua.happyuky7.com](https://gargantua.happyuky7.com), zieh mit der Maus, um zu kreisen, und drück **V**, um frei bis fast an die Photonensphäre zu fliegen. Probier die fünf Presets aus: *Interstellar*, *Cinema*, *Scientific*, *Clean Kerr* und *Edge-on*. Wenn es ruckelt, stell die Qualität auf *Fast*.

Es fing als Zeitvertreib an und ist eins der Dinge geworden, bei denen ich dieses Jahr am meisten gelernt habe. Falls du länger auf ein Schwarzes Loch starrst als geplant, freue ich mich über einen ⭐ im [Repository](https://github.com/Happyuky7/Black-Hole-Web-Interstellar-Style).
