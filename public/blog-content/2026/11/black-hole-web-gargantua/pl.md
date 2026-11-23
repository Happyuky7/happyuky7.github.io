Wszystko zaczęło się z nudów, a potem trochę wymknęło się spod kontroli. Chodziło o to, żeby zobaczyć **Gargantuę**, czarną dziurę z *Interstellar*, w ruchu w przeglądarce. Nie obrazek z namalowanym pierścieniem, tylko coś naprawdę policzonego z fizyki obracającej się czarnej dziury.

Efekt to **Black Hole Web**. Możesz go wypróbować na [gargantua.happyuky7.com](https://gargantua.happyuky7.com), a kod jest na [GitHubie](https://github.com/Happyuky7/Black-Hole-Web-Interstellar-Style) (MIT).

> **Uwaga:** strona liczy każdy piksel w czasie rzeczywistym, więc urządzenie może zwolnić albo się nagrzać. Zalecane jest oglądanie na komputerze lub laptopie z kartą graficzną. Na telefonie może się zacinać; wtedy ustaw jakość na *Fast*.

Ten post nie jest poradnikiem programowania. To raczej to, czego można się nauczyć po drodze, wyjaśnione najprościej, jak się da: czym jest czarna dziura, dlaczego Gargantua tak wygląda i jak strona ją rysuje.

![Gargantua w trybie Cinema, z kamerą z filmu](/blog-content/2026/11/black-hole-web-gargantua/cinema.webp)

## Czym jest czarna dziura?

To obszar, w którym jest tak dużo masy w jednym miejscu, że czasoprzestrzeń zakrzywia się do tego stopnia, że nic nie może się wydostać, nawet światło. Granica tego obszaru to **horyzont zdarzeń**: co go przekroczy, już nie wraca.

Są dwa klasyczne modele:

- **Schwarzschild** (1916): czarna dziura, która się nie obraca. Najprostszy przypadek.
- **Kerr** (1963): czarna dziura, która się **obraca**. To ten model liczy się w rzeczywistości, bo prawie wszystko we wszechświecie się obraca. Gargantua też jest właśnie taka.

Obrót zmienia bardzo dużo. Czarna dziura ciągnie za sobą czasoprzestrzeń, a światło przechodzące z jednej strony nie leci tą samą drogą co światło z drugiej. Dlatego cień Gargantui nie jest idealnym kołem: z jednej strony jest lekko spłaszczony.

## Dlaczego Gargantua tak wygląda?

Wokół czarnej dziury jest **dysk akrecyjny**: gaz, który krąży tak szybko i nagrzewa się tak mocno, że świeci. Ten dysk jest płaski, jak pierścienie Saturna. To dlaczego w filmie widać jeden łuk nad nią, a drugi pod nią?

To **soczewkowanie grawitacyjne**. Światło z tej części dysku, która jest *za* czarną dziurą, nie leci w linii prostej: grawitacja zagina je nad nią i pod nią, i w ten sposób dociera do nas. To, co wygląda jak „aureola" nad cieniem, to w rzeczywistości tylna część dysku.

Po dokładnym przyjrzeniu się widać też bardzo cienki **pierścień fotonowy** tuż przy cieniu. To światło, które okrążyło czarną dziurę o pół obrotu lub więcej, zanim uciekło.

Nic z tego nie jest na stronie namalowane. Wszystko wynika z równań.

## Co film zmienił celowo

Efekty w *Interstellar* powstały przy konsultacji fizyka **Kipa Thorne'a**, a zespół opublikował potem artykuł naukowy o tym, jak je obliczano ([James et al., 2015](https://arxiv.org/abs/1502.03808)). Ale poszli na jedno ważne ustępstwo.

W prawdziwej czarnej dziurze strona dysku, która porusza się **w naszą stronę**, jest dużo jaśniejsza i bardziej niebieska, a ta, która się oddala, ciemniejsza i bardziej czerwona. To relatywistyczny **efekt Dopplera**. W filmie go usunięto, bo asymetryczny dysk w dziwnych kolorach zmyliłby widzów.

Dlatego strona ma dwa sposoby oglądania:

- **Tryby artystyczne**, które odtwarzają styl filmu: złoty dysk, bez asymetrii Dopplera, ziarno filmowe i format 2.39:1.
- **Tryb naukowy**, który to wszystko wyłącza i pokazuje to, co nagrałaby prawdziwa kamera.

## Pięć trybów

Strona ma pięć presetów. Wszystkie używają tych samych dróg światła; zmienia się obrót, kamera i to, jak bardzo przypomina to film.

**Interstellar.** Styl filmu: obrót 0,6, złoty dysk bez Dopplera, ziarno filmowe i format 2.39:1.

![Tryb Interstellar](/blog-content/2026/11/black-hole-web-gargantua/interstellar.webp)

**Cinema.** Dokładna kamera z filmu, daleko od czarnej dziury, z czarnym niebem i odległymi gwiazdami. To obraz z początku posta.

**Scientific.** Pełna fizyka: dysk ciała doskonale czarnego, dokładny efekt Dopplera i grawitacyjne przesunięcie ku czerwieni. Strona, która się zbliża, świeci dużo mocniej.

![Tryb Scientific](/blog-content/2026/11/black-hole-web-gargantua/scientific.webp)

**Clean Kerr.** Obrót 0,94 z prawdziwym efektem Dopplera, ale z dyskiem w stylu filmu. Dlatego jedna strona świeci mocniej niż druga.

![Tryb Clean Kerr](/blog-content/2026/11/black-hole-web-gargantua/clean-kerr.webp)

**Edge-on.** Prawie maksymalny obrót (0,998) i kamera prawie w płaszczyźnie dysku: cienki, bardzo jasny pas i bardzo silne soczewkowanie.

![Tryb Edge-on](/blog-content/2026/11/black-hole-web-gargantua/edge-on.webp)

## Jak strona ją rysuje

Ta metoda to **wsteczny ray tracing**. Dla każdego piksela na ekranie strona wysyła promień światła z kamery *wstecz* i śledzi go przez zakrzywioną czasoprzestrzeń. Mogą się zdarzyć trzy rzeczy:

1. **Trafia w dysk**: piksel dostaje kolor gazu w tym miejscu.
2. **Wpada za horyzont**: piksel zostaje czarny. Tak powstaje cień.
3. **Ucieka**: piksel pokazuje gwiazdę, w którą promień celuje na końcu. Tak zniekształca się tło z gwiazdami.

Wszystko to jest liczone na GPU, dla każdego piksela, w każdej klatce. Droga światła jest całkowana krok po kroku. Są dwie metody: *leapfrog*, szybsza, dla trybów artystycznych, oraz **RK4**, która przy tej samej liczbie kroków jest około **7 razy dokładniejsza**, dla trybu naukowego.

## Temperatura dysku

W trybie naukowym kolor dysku nie jest wybierany ręcznie. Wynika z modelu fizycznego (Novikov–Thorne), który liczy, jak gorący jest gaz, na podstawie **masy** czarnej dziury i tego, **ile materii pochłania**. Potem to ciepło zamienia się w kolor za pomocą krzywych, którymi nauka opisuje, jak widzimy barwy.

Jeden szczegół jest naprawdę ciekawy:

$$
T \propto \left(\frac{\lambda_{\text{Edd}}}{M}\right)^{1/4}
$$

Temperatura spada, gdy masa rośnie. Innymi słowy: **im większa czarna dziura, tym chłodniejszy jej dysk**. Czarna dziura o masie stu milionów Słońc, pochłaniająca materię na poziomie 10 % swojego limitu, świeci niebieskawobiało, w około 120 000 K. Jeśli zmniejszysz to, ile pochłania, dysk robi się złoty, a strona Dopplera staje się dużo bardziej dramatyczna.

## Czego jeszcze nie symuluje

Tryb naukowy stara się być uczciwy, więc mówi też, czego nie robi:

- Zakłada **cienki** dysk. Czarne dziury takie jak M87\*, ta z [pierwszego prawdziwego zdjęcia](https://eventhorizontelescope.org/) z 2019 roku, pochłaniają tak mało, że ich gaz tworzy grubą, gorącą chmurę, której ten projekt nie symuluje.
- Nie ma **dżetu** ani korony.
- Nie przelicza ponownie światła, które dysk odbija sam na siebie.
- Kamera stoi w miejscu. Statek na orbicie, jak Endurance, widziałby niebo lekko przesunięte.

## Jeśli chcesz dowiedzieć się więcej

Na stronie jest podstrona **Fizyka** (`/physics`), która wyjaśnia każde równanie krok po kroku, od metryki Kerra aż do koloru piksela. Opiera się na **27 źródłach naukowych** ze sprawdzonymi DOI. W repozytorium jest też wersja techniczna: [PHYSICS.md](https://github.com/Happyuky7/Black-Hole-Web-Interstellar-Style/blob/master/docs/PHYSICS.md).

Jeśli używasz tego na zajęciach lub w prezentacji, repozytorium ma przycisk cytowania GitHuba, a strona z fizyką zawiera gotowy cytat w formacie APA i BibTeX.

## Wypróbuj

Otwórz [gargantua.happyuky7.com](https://gargantua.happyuky7.com), przeciągnij myszą, żeby krążyć wokół, i naciśnij **V**, żeby swobodnie lecieć prawie do samej sfery fotonowej. Wypróbuj pięć presetów: *Interstellar*, *Cinema*, *Scientific*, *Clean Kerr* i *Edge-on*. Jeśli się zacina, ustaw jakość na *Fast*.

Miało być sposobem na zabicie czasu, a stało się jedną z rzeczy, które w tym roku nauczyły mnie najwięcej. Jeśli wpatrujesz się w czarną dziurę dłużej, niż planowano, ⭐ w [repozytorium](https://github.com/Happyuky7/Black-Hole-Web-Interstellar-Style) będzie bardzo miła.
