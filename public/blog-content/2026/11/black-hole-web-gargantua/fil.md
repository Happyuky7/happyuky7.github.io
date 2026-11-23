Nagsimula ito dahil sa pagkabagot, tapos medyo lumaki. Gusto kong makita si **Gargantua**, ang black hole sa *Interstellar*, na gumagalaw mismo sa browser. Hindi isang larawan na may singsing na ipininta sa ibabaw, kundi isang talagang kinukuwenta gamit ang physics ng umiikot na black hole.

Ang kinalabasan ay ang **Black Hole Web**. Puwede mo itong subukan sa [gargantua.happyuky7.com](https://gargantua.happyuky7.com), at nasa [GitHub](https://github.com/Happyuky7/Black-Hole-Web-Interstellar-Style) ang code (MIT).

> **Paalala:** kinukuwenta ng website ang bawat pixel nang real time, kaya puwedeng bumagal o uminit ang device mo. Inirerekomendang tingnan ito sa PC o laptop na may graphics card. Sa phone, puwede itong mag-lag; kung ganoon, gawing *Fast* ang quality.

Hindi ito tutorial sa programming. Mas parang mga natutunan ko habang ginagawa ito, ipinaliwanag nang pinakasimple hangga't kaya: ano ang black hole, bakit ganoon ang itsura ni Gargantua, at paano ito iginuguhit ng website.

![Si Gargantua sa Cinema mode, gamit ang camera ng pelikula](/blog-content/2026/11/black-hole-web-gargantua/cinema.webp)

## Ano ang black hole?

Isa itong rehiyon na sobrang dami ng masang nakasiksik kaya bumabaluktot ang spacetime hanggang sa wala nang makakalabas, kahit liwanag. Ang hangganan ng rehiyong iyon ay tinatawag na **event horizon**: ang anumang tumawid dito ay hindi na makakabalik.

May dalawang klasikong modelo:

- **Schwarzschild** (1916): black hole na hindi umiikot. Ito ang pinakasimpleng kaso.
- **Kerr** (1963): black hole na **umiikot**. Ito ang mahalaga sa totoong buhay, dahil halos lahat sa uniberso ay umiikot, at ganito rin si Gargantua.

Maraming nababago ang pag-ikot. Hinihila ng black hole ang spacetime sa paligid nito, kaya ang liwanag na dumaraan sa isang gilid ay hindi sumusunod sa parehong daan ng liwanag sa kabila. Kaya hindi perpektong bilog ang anino ni Gargantua: medyo pipi ito sa isang gilid.

## Bakit ganoon ang itsura ni Gargantua?

May **accretion disk** sa paligid ng black hole: gas na umiikot nang napakabilis at umiinit nang husto kaya kumikinang. Patag ang disk na ito, parang mga singsing ng Saturn. Kaya bakit sa pelikula, may isang arko sa itaas at isa pa sa ibaba?

Iyan ang **gravitational lensing**. Ang liwanag na galing sa bahagi ng disk na nasa *likod* ng black hole ay hindi dumiretso: binabaluktot ito ng gravity pataas at pababa, hanggang makarating sa atin. Ang mukhang "halo" sa ibabaw ng anino ay talagang likod ng disk.

Kung titingnan nang mabuti, may napakanipis ding **photon ring** na nakadikit sa anino. Iyon ay liwanag na umikot nang kalahating ikot o higit pa sa black hole bago nakatakas.

Wala sa mga ito ang ipininta sa website. Lahat ay galing sa mga equation.

## Ang sinadyang binago ng pelikula

Ginawa ang mga effect ng *Interstellar* sa tulong ng physicist na si **Kip Thorne**, at kalaunan ay naglathala ang team ng scientific paper tungkol sa kung paano nila ito kinuwenta ([James et al., 2015](https://arxiv.org/abs/1502.03808)). Pero may isang malaking pagbibigay sila.

Sa totoong black hole, ang gilid ng disk na papunta **sa atin** ay mas maliwanag at mas asul, at ang palayo ay mas madilim at mas pula. Iyan ang relativistic na **Doppler effect**. Tinanggal ito sa pelikula, dahil malilito ang manonood sa disk na hindi pantay at kakaiba ang kulay.

Kaya may dalawang paraan ng pagtingin ang website:

- **Artistic modes**, na ginagaya ang itsura ng pelikula: gintong disk, walang Doppler asymmetry, film grain, at 2.39:1 na frame.
- **Scientific mode**, na pinapatay lahat ng iyon at ipinapakita ang talagang makukunan ng totoong camera.

## Ang limang mode

May limang preset ang website. Pare-pareho ang daan ng liwanag na ginagamit nila; ang nag-iiba ay ang ikot, ang camera, at kung gaano kahawig sa pelikula.

**Interstellar.** Ang itsura ng pelikula: ikot na 0.6, gintong disk na walang Doppler, film grain, at 2.39:1 na frame.

![Interstellar mode](/blog-content/2026/11/black-hole-web-gargantua/interstellar.webp)

**Cinema.** Ang eksaktong camera ng pelikula, malayo sa black hole, may itim na langit at malalayong bituin. Ito ang larawan sa simula ng post.

**Scientific.** Buong physics: blackbody disk, eksaktong Doppler, at gravitational redshift. Mas maliwanag ang gilid na papalapit.

![Scientific mode](/blog-content/2026/11/black-hole-web-gargantua/scientific.webp)

**Clean Kerr.** Ikot na 0.94 na may totoong Doppler, pero may disk na istilong pelikula. Kaya mas maliwanag ang isang gilid kaysa sa kabila.

![Clean Kerr mode](/blog-content/2026/11/black-hole-web-gargantua/clean-kerr.webp)

**Edge-on.** Halos pinakamataas na ikot (0.998) at ang camera ay halos nasa eroplano ng disk: isang manipis at napakaliwanag na banda at napakalakas na lensing.

![Edge-on mode](/blog-content/2026/11/black-hole-web-gargantua/edge-on.webp)

## Paano ito iginuguhit ng website

Tinatawag itong **backward ray tracing**. Sa bawat pixel sa screen, nagpapadala ang website ng sinag ng liwanag mula sa camera *pabalik*, at sinusundan ito sa baluktot na spacetime. Tatlong bagay ang puwedeng mangyari:

1. **Tumama sa disk**: kukunin ng pixel ang kulay ng gas sa puntong iyon.
2. **Nahulog sa horizon**: mananatiling itim ang pixel. Ganito lumalabas ang anino.
3. **Nakatakas**: ipapakita ng pixel ang bituin na tinuturo ng sinag sa dulo. Ganito nababaluktot ang mga bituin sa background.

Lahat ng ito ay kinukuwenta sa GPU, sa bawat pixel, sa bawat frame. Unti-unting ini-integrate ang daan ng liwanag. Dalawa ang paraan: *leapfrog*, na mas mabilis, para sa artistic modes, at **RK4**, na mga **7 beses na mas tumpak** sa parehong bilang ng hakbang, para sa scientific mode.

## Ang temperatura ng disk

Sa scientific mode, hindi pinipili nang mano-mano ang kulay ng disk. Galing ito sa isang physical model (Novikov–Thorne) na kinukuwenta kung gaano kainit ang gas batay sa **masa** ng black hole at **kung gaano karaming materyal ang nilalamon nito**. Pagkatapos, ginagawang kulay ang init na iyon gamit ang mga kurbang ginagamit ng agham para ilarawan kung paano natin nakikita ang kulay.

May isang detalye na sobrang nakakatuwa:

$$
T \propto \left(\frac{\lambda_{\text{Edd}}}{M}\right)^{1/4}
$$

Bumababa ang temperatura habang tumataas ang masa. Ibig sabihin: **habang lumalaki ang black hole, lumalamig ang disk nito**. Ang black hole na may masang sandaang milyong araw, na lumalamon sa 10 % ng limit nito, ay kumikinang nang puting may halong asul, mga 120 000 K. Kapag binawasan mo kung gaano karami ang nilalamon nito, nagiging ginto ang disk at mas nagiging dramatic ang Doppler na gilid.

## Ang hindi pa nito sinisimulate

Sinisikap ng scientific mode na maging tapat, kaya sinasabi rin nito ang hindi nito ginagawa:

- Ipinapalagay nitong **manipis** ang disk. Ang mga black hole tulad ng M87\*, ang nasa [unang totoong litrato](https://eventhorizontelescope.org/) noong 2019, ay kaunti lang ang nilalamon kaya bumubuo ang gas nila ng makapal at mainit na ulap, na hindi sinisimulate dito.
- Walang **jet** at walang corona.
- Hindi nito kinukuwenta ulit ang liwanag na ibinabalik ng disk sa sarili nito.
- Nakatigil ang camera. Ang barkong nasa orbit, gaya ng Endurance, ay makakakita ng langit na bahagyang nakausog.

## Kung gusto mong matuto pa

Sa loob ng website, may page na **Ang physics** (`/physics`) na nagpapaliwanag ng bawat equation nang hakbang-hakbang, mula sa Kerr metric hanggang sa kulay ng isang pixel. Nakabatay ito sa **27 scientific na source** na may beripikadong DOI. May technical na bersyon din sa repository: [PHYSICS.md](https://github.com/Happyuky7/Black-Hole-Web-Interstellar-Style/blob/master/docs/PHYSICS.md).

Kung gagamitin mo ito sa klase o talk, may cite button ng GitHub ang repository, at may handang citation sa APA at BibTeX ang physics page.

## Subukan mo

Buksan ang [gargantua.happyuky7.com](https://gargantua.happyuky7.com), i-drag ang mouse para umikot, at pindutin ang **V** para malayang lumipad hanggang halos sumayad sa photon sphere. Subukan ang limang preset: *Interstellar*, *Cinema*, *Scientific*, *Clean Kerr*, at *Edge-on*. Kung bumabagal, gawing *Fast* ang quality.

Nagsimula lang ito bilang pampalipas-oras, at naging isa sa mga bagay na pinakamarami akong natutunan ngayong taon. Kung napatitig ka sa black hole nang mas matagal kaysa sa plano, salamat kung bibigyan mo ng ⭐ ang [repository](https://github.com/Happyuky7/Black-Hole-Web-Interstellar-Style).
