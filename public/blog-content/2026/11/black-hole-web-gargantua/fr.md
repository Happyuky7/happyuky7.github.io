Tout a commencé par ennui, et ça a un peu dérapé. J'avais envie de voir **Gargantua**, le trou noir d'*Interstellar*, bouger dans le navigateur. Pas une image avec un anneau peint par-dessus, mais quelque chose de vraiment calculé avec la physique d'un trou noir en rotation.

Le résultat, c'est **Black Hole Web**. Vous pouvez l'essayer sur [gargantua.happyuky7.com](https://gargantua.happyuky7.com), et le code est sur [GitHub](https://github.com/Happyuky7/Black-Hole-Web-Interstellar-Style) (MIT).

> **Attention :** le site calcule chaque pixel en temps réel, il peut donc faire ramer ou chauffer votre appareil. Il est recommandé de le regarder sur un PC ou un portable avec une carte graphique. Sur téléphone, ça peut saccader ; dans ce cas, passez la qualité sur *Fast*.

Ce post n'est pas un tutoriel de programmation. C'est plutôt ce que j'ai appris en chemin, expliqué le plus simplement possible : ce qu'est un trou noir, pourquoi Gargantua a cette apparence et comment le site s'y prend pour le dessiner.

![Gargantua en mode Cinema, avec la caméra du film](/blog-content/2026/11/black-hole-web-gargantua/cinema.webp)

## Qu'est-ce qu'un trou noir ?

C'est une région où tellement de masse est concentrée que l'espace-temps se courbe au point que rien ne peut en sortir, pas même la lumière. Le bord de cette région s'appelle l'**horizon des événements** : ce qui le franchit ne revient pas.

Il existe deux modèles classiques :

- **Schwarzschild** (1916) : un trou noir qui ne tourne pas. C'est le cas le plus simple.
- **Kerr** (1963) : un trou noir qui **tourne**. C'est celui qui compte dans la réalité, parce que presque tout tourne dans l'univers, et c'est aussi le cas de Gargantua.

La rotation change beaucoup de choses. Le trou noir entraîne l'espace-temps avec lui, et la lumière qui passe d'un côté ne suit pas le même chemin que celle qui passe de l'autre. C'est pour ça que l'ombre de Gargantua n'est pas un cercle parfait : elle est un peu aplatie d'un côté.

## Pourquoi Gargantua ressemble à ça ?

Autour du trou noir, il y a un **disque d'accrétion** : du gaz qui tourne si vite et chauffe tellement qu'il brille. Ce disque est plat, comme les anneaux de Saturne. Alors pourquoi le film montre-t-il un arc au-dessus et un autre en dessous ?

C'est la **lentille gravitationnelle**. La lumière qui part de la partie du disque située *derrière* le trou noir ne voyage pas en ligne droite : la gravité la courbe par-dessus et par-dessous, et elle arrive jusqu'à nous. Ce qui ressemble à un « halo » au-dessus de l'ombre, c'est en réalité l'arrière du disque.

En regardant bien, il y a aussi un **anneau de photons** très fin collé à l'ombre. C'est de la lumière qui a fait un demi-tour ou plus autour du trou noir avant de s'échapper.

Rien de tout ça n'est peint sur le site. Tout sort des équations.

## Ce que le film a changé exprès

Les effets d'*Interstellar* ont été réalisés avec les conseils du physicien **Kip Thorne**, et l'équipe a ensuite publié un article scientifique sur la façon dont ils ont été calculés ([James et al., 2015](https://arxiv.org/abs/1502.03808)). Mais ils ont fait une concession importante.

Dans un vrai trou noir, le côté du disque qui vient **vers nous** paraît beaucoup plus brillant et plus bleu, et celui qui s'éloigne, plus faible et plus rouge. C'est l'**effet Doppler** relativiste. Le film l'a supprimé, parce qu'un disque asymétrique aux couleurs étranges aurait dérouté le public.

C'est pour ça que le site propose deux façons de le regarder :

- **Les modes artistiques**, qui recréent le style du film : disque doré, sans asymétrie Doppler, grain de pellicule et format 2.39:1.
- **Le mode scientifique**, qui coupe tout ça et montre ce qu'une vraie caméra enregistrerait.

## Les cinq modes

Le site propose cinq presets. Ils utilisent tous les mêmes trajets de lumière ; ce qui change, c'est la rotation, la caméra et la ressemblance avec le film.

**Interstellar.** Le style du film : rotation 0,6, disque doré sans Doppler, grain de pellicule et format 2.39:1.

![Mode Interstellar](/blog-content/2026/11/black-hole-web-gargantua/interstellar.webp)

**Cinema.** La caméra exacte du film, très loin du trou noir, avec un ciel noir et des étoiles lointaines. C'est l'image du début du post.

**Scientific.** Toute la physique : disque de corps noir, Doppler exact et décalage gravitationnel vers le rouge. Le côté qui s'approche brille beaucoup plus.

![Mode Scientific](/blog-content/2026/11/black-hole-web-gargantua/scientific.webp)

**Clean Kerr.** Rotation de 0,94 avec le vrai Doppler, mais avec le disque façon film. C'est pour ça qu'un côté brille plus que l'autre.

![Mode Clean Kerr](/blog-content/2026/11/black-hole-web-gargantua/clean-kerr.webp)

**Edge-on.** Rotation presque maximale (0,998) et caméra presque dans le plan du disque : une bande fine très brillante et une lentille gravitationnelle très forte.

![Mode Edge-on](/blog-content/2026/11/black-hole-web-gargantua/edge-on.webp)

## Comment le site le dessine

L'idée s'appelle le **ray tracing inversé**. Pour chaque pixel de l'écran, le site lance un rayon de lumière depuis la caméra, *à rebours*, et le suit à travers l'espace-temps courbé. Trois choses peuvent arriver :

1. **Il touche le disque** : le pixel prend la couleur du gaz à cet endroit.
2. **Il tombe dans l'horizon** : le pixel reste noir. C'est comme ça qu'apparaît l'ombre.
3. **Il s'échappe** : le pixel affiche l'étoile vers laquelle il pointe à la fin. C'est comme ça que le fond d'étoiles se déforme.

Tout ça est calculé sur le GPU, pour chaque pixel, à chaque image. Le trajet de la lumière est intégré pas à pas. Il y a deux méthodes : *leapfrog*, plus rapide, pour les modes artistiques, et **RK4**, environ **7 fois plus précis** avec le même nombre de pas, pour le mode scientifique.

## La température du disque

En mode scientifique, la couleur du disque n'est pas choisie à la main. Elle vient d'un modèle physique (Novikov–Thorne) qui calcule la température du gaz à partir de la **masse** du trou noir et de **la quantité de matière qu'il avale**. Cette chaleur est ensuite convertie en couleur avec les courbes que la science utilise pour décrire notre perception des couleurs.

Il y a un détail que j'ai trouvé vraiment curieux :

$$
T \propto \left(\frac{\lambda_{\text{Edd}}}{M}\right)^{1/4}
$$

La température baisse quand la masse augmente. Autrement dit : **plus le trou noir est grand, plus son disque est froid**. Un trou noir de cent millions de soleils, qui avale à 10 % de sa limite, brille d'un blanc bleuté, à environ 120 000 K. Si on réduit ce qu'il avale, le disque devient doré et le côté Doppler devient beaucoup plus spectaculaire.

## Ce qu'il ne simule pas encore

Le mode scientifique se veut honnête, alors il dit aussi ce qu'il ne fait pas :

- Il suppose un disque **mince**. Des trous noirs comme M87\*, celui de la [première vraie photo](https://eventhorizontelescope.org/) en 2019, avalent si peu que leur gaz forme un nuage épais et chaud que ce projet ne simule pas.
- Il n'y a ni **jet** ni couronne.
- Il ne recalcule pas la lumière que le disque se renvoie à lui-même.
- La caméra est immobile. Un vaisseau en orbite, comme l'Endurance, verrait le ciel légèrement décalé.

## Pour aller plus loin

Dans le site, il y a une page appelée **La physique** (`/physics`) qui explique chaque équation pas à pas, de la métrique de Kerr jusqu'à la couleur d'un pixel. Elle s'appuie sur **27 sources scientifiques** dont les DOI ont été vérifiés. Il existe aussi une version technique dans le dépôt : [PHYSICS.md](https://github.com/Happyuky7/Black-Hole-Web-Interstellar-Style/blob/master/docs/PHYSICS.md).

Si vous l'utilisez en cours ou dans une présentation, le dépôt a le bouton de citation de GitHub, et la page de physique fournit la citation prête en APA et BibTeX.

## Essayez-le

Ouvrez [gargantua.happyuky7.com](https://gargantua.happyuky7.com), faites glisser la souris pour orbiter et appuyez sur **V** pour voler librement jusqu'à frôler la sphère de photons. Essayez les cinq presets : *Interstellar*, *Cinema*, *Scientific*, *Clean Kerr* et *Edge-on*. Si ça rame, passez la qualité sur *Fast*.

C'était censé être un passe-temps, et c'est devenu l'une des choses qui m'ont le plus appris cette année. Si vous finissez par regarder un trou noir plus longtemps que prévu, une ⭐ sur le [dépôt](https://github.com/Happyuky7/Black-Hole-Web-Interstellar-Style) fait toujours plaisir.
